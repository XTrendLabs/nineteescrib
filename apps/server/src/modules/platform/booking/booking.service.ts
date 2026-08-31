import { AppError } from "../../../core";
import { bookingRepo } from "./booking.repo";
import type {
  CancelBookingInput,
  ChangeStatusInput,
  CreateBookingInput,
  CreateGuestInput,
  ExtendBookingInput,
  GuestNoteInput,
  GuestTagInput,
  RecordPaymentInput,
  UpdateBookingInput,
  UpdateGuestInput,
} from "./booking.schema";
import { guestRepo } from "./guest.repo";

/**
 * The status changes a booking is allowed to make.
 *
 * Encoded as a map rather than checked ad hoc at each call site so the whole
 * lifecycle is readable in one place. A stay moves forward only: re-opening a
 * checked-out booking would let its dates be edited after the room has been
 * turned over and re-let, so a correction is a new booking rather than a
 * reversal. Cancelling is exempt -- it has its own entry point and can happen
 * from any state that is not already terminal.
 */
const ALLOWED_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ["confirmed", "checked_in"],
  confirmed: ["checked_in"],
  checked_in: ["checked_out"],
  checked_out: [],
  cancelled: [],
};

/** Statuses from which a booking can still be cancelled. */
const CANCELLABLE = new Set(["pending", "confirmed", "checked_in"]);

const STATUS_LABELS: Record<string, string> = {
  pending: "pending",
  confirmed: "confirmed",
  checked_in: "checked in",
  checked_out: "checked out",
  cancelled: "cancelled",
};

/** Optional emails arrive as "" from untouched inputs; store NULL. */
function normalizeEmail(value: string | null | undefined) {
  return value ? value : null;
}

/**
 * Refuses a stay that would double-book a room.
 *
 * Checked in the service rather than left to a database constraint because
 * Postgres cannot express "no overlapping ranges" without an exclusion
 * constraint over a range type, which the plain `date` columns here are not.
 * The window between this check and the insert is the known gap; the same
 * check on read (`occupiesInventory`) means a slipped-through double booking
 * shows up rather than silently consuming inventory.
 */
async function assertRoomIsFree(input: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  excludeBookingId?: string;
}) {
  const [first] = await bookingRepo.findConflicts(input);
  if (!first) return;

  throw AppError.conflict(
    first.kind === "block"
      ? `That room is blocked from ${first.checkIn} to ${first.checkOut}`
      : `That room is already booked (${first.ref}) from ${first.checkIn} to ${first.checkOut}`,
  );
}

export const bookingService = {
  listByHqOrganization(
    hqOrganizationId: string,
    filters?: { propertyId?: string },
  ) {
    return bookingRepo.listByHqOrganization(hqOrganizationId, filters);
  },

  listByDateRange(
    hqOrganizationId: string,
    from: string,
    to: string,
    filters?: { propertyId?: string },
  ) {
    return bookingRepo.listByDateRange(hqOrganizationId, from, to, filters);
  },

  findById(id: string) {
    return bookingRepo.findById(id);
  },

  findHqOrganizationId(id: string) {
    return bookingRepo.findHqOrganizationId(id);
  },

  findBookingIdByPayment(paymentId: string) {
    return bookingRepo.findBookingIdByPayment(paymentId);
  },

  listAvailableRooms(input: {
    propertyId: string;
    checkIn: string;
    checkOut: string;
    excludeBookingId?: string;
  }) {
    return bookingRepo.listAvailableRooms(input);
  },

  listNightlyOccupancy(input: {
    propertyId: string;
    from: string;
    to: string;
  }) {
    return bookingRepo.listNightlyOccupancy(input);
  },

  /** The nights one room is taken, for the arrival calendar. */
  async listRoomOccupancy(
    bookingId: string,
    input: { from: string; to: string },
  ) {
    const existing = await bookingRepo.findById(bookingId);
    if (!existing) {
      throw AppError.notFound("Booking not found");
    }

    return bookingRepo.listRoomOccupancy({
      roomId: existing.roomId,
      from: input.from,
      to: input.to,
      excludeBookingId: bookingId,
    });
  },

  listRoomsWithConflicts(input: {
    propertyId: string;
    checkIn: string;
    checkOut: string;
    excludeBookingId?: string;
  }) {
    return bookingRepo.listRoomsWithConflicts(input);
  },

  listAudit(bookingId: string) {
    return bookingRepo.listAudit(bookingId);
  },

  /**
   * Creates a stay, a hold or a block.
   *
   * A reservation needs a guest; a block must not have one -- it occupies the
   * room on behalf of nobody. The guest is resolved by phone within the HQ, so
   * a returning visitor lands on their existing profile rather than a second
   * one.
   */
  async create(
    hqOrganizationId: string,
    createdByUserId: string,
    input: CreateBookingInput,
  ) {
    const kind = input.kind ?? "reservation";

    if (kind === "block") {
      if (!input.blockReason) {
        throw AppError.validation("A block needs a reason");
      }
    } else if (!input.guest) {
      throw AppError.validation("Guest name and phone are required");
    }

    await assertRoomIsFree({
      roomId: input.roomId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
    });

    const guestRow = input.guest
      ? await guestRepo.findOrCreate({
          hqOrganizationId,
          name: input.guest.name,
          phone: input.guest.phone,
          email: normalizeEmail(input.guest.email),
        })
      : undefined;

    const created = await bookingRepo.create({
      hqOrganizationId,
      organizationId: input.propertyId,
      roomId: input.roomId,
      kind,
      blockReason: kind === "block" ? (input.blockReason ?? null) : null,
      guestId: guestRow?.id ?? null,
      // A block is not a reservation in any state, so it sits at "confirmed"
      // rather than waiting on a check-in that will never happen.
      status: kind === "block" ? "confirmed" : "pending",
      source: input.source ?? "manual",
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guestCount: input.guestCount ?? 1,
      totalAmountPaise: input.totalAmountPaise ?? 0,
      holdExpiresAt:
        kind === "hold" && input.holdMinutes
          ? new Date(Date.now() + input.holdMinutes * 60_000)
          : null,
      notes: input.notes,
      createdByUserId,
      initialPayment: input.initialPayment
        ? {
            ...input.initialPayment,
            recordedByUserId: createdByUserId,
          }
        : undefined,
    });

    if (!created) {
      throw new Error("Booking was created but could not be read back");
    }

    await bookingRepo.addAudit({
      bookingId: created.id,
      action: "created",
      description:
        kind === "block"
          ? `Room blocked for ${input.blockReason?.replace("_", " ")}.`
          : `Booking created for ${guestRow?.name} via ${input.source ?? "manual"} entry.`,
      actorUserId: createdByUserId,
    });

    if (input.initialPayment) {
      await bookingRepo.addAudit({
        bookingId: created.id,
        action: "payment_recorded",
        description: `Payment of ${formatPaise(input.initialPayment.amountPaise)} recorded at booking.`,
        actorUserId: createdByUserId,
      });
    }

    return bookingRepo.findById(created.id);
  },

  /**
   * Edits a booking's details.
   *
   * Any change to the room or the dates re-runs the conflict check against the
   * *resulting* stay, ignoring the booking itself -- otherwise moving a stay
   * by a day would always collide with where it currently sits.
   */
  async update(id: string, actorUserId: string, input: UpdateBookingInput) {
    const existing = await bookingRepo.findById(id);
    if (!existing) {
      throw AppError.notFound("Booking not found");
    }

    if (existing.status === "cancelled") {
      throw AppError.validation("A cancelled booking cannot be edited");
    }

    const roomId = input.roomId ?? existing.roomId;
    const checkIn = input.checkIn ?? existing.checkIn;
    const checkOut = input.checkOut ?? existing.checkOut;

    if (checkOut <= checkIn) {
      throw AppError.validation("Check-out must be after check-in");
    }

    const movesInventory =
      roomId !== existing.roomId ||
      checkIn !== existing.checkIn ||
      checkOut !== existing.checkOut;

    if (movesInventory) {
      await assertRoomIsFree({
        roomId,
        checkIn,
        checkOut,
        excludeBookingId: id,
      });
    }

    const guestRow = input.guest
      ? await guestRepo.findOrCreate({
          hqOrganizationId: existing.hqOrganizationId,
          name: input.guest.name,
          phone: input.guest.phone,
          email: normalizeEmail(input.guest.email),
        })
      : undefined;

    const updated = await bookingRepo.update(id, {
      roomId,
      checkIn,
      checkOut,
      guestId: guestRow?.id ?? existing.guestId,
      guestCount: input.guestCount ?? existing.guestCount,
      totalAmountPaise: input.totalAmountPaise ?? existing.totalAmountPaise,
      source: input.source ?? existing.source,
      blockReason: input.blockReason ?? existing.blockReason,
      notes: input.notes ?? existing.notes,
    });

    if (movesInventory) {
      await bookingRepo.addAudit({
        bookingId: id,
        action: "rescheduled",
        description: `Stay moved to ${checkIn} - ${checkOut}.`,
        actorUserId,
      });
    } else {
      await bookingRepo.addAudit({
        bookingId: id,
        action: "updated",
        description: "Booking details updated.",
        actorUserId,
      });
    }

    return updated;
  },

  /**
   * Moves a booking along its lifecycle.
   *
   * The transition map is what makes an out-of-order request an error rather
   * than a silent no-op: checking a guest out of a stay they never checked
   * into would otherwise leave the audit trail describing something that did
   * not happen.
   */
  async changeStatus(
    id: string,
    actorUserId: string,
    input: ChangeStatusInput,
  ) {
    const existing = await bookingRepo.findById(id);
    if (!existing) {
      throw AppError.notFound("Booking not found");
    }

    if (existing.kind === "block") {
      throw AppError.validation("A block has no check-in or check-out");
    }

    const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(input.status)) {
      throw AppError.validation(
        `A ${STATUS_LABELS[existing.status]} booking cannot be marked ${STATUS_LABELS[input.status]}`,
      );
    }

    const effectiveDate = input.effectiveDate ?? today();

    // Checking in or out records *when*, which is what availability reads --
    // an early departure frees the nights the guest gave up, while the booked
    // dates stay as they were for billing.
    const actualDates: {
      actualCheckIn?: string;
      actualCheckOut?: string;
    } = {};

    if (input.status === "checked_in") {
      // Arriving before the booked date claims nights the room was not held
      // for, and someone else may hold them. Checked against the same rule as
      // a new booking, so an early arrival cannot quietly double-book a room
      // the way simply writing the date would.
      if (effectiveDate < existing.checkIn) {
        await assertRoomIsFree({
          roomId: existing.roomId,
          checkIn: effectiveDate,
          checkOut: existing.checkIn,
          excludeBookingId: id,
        });
      }

      actualDates.actualCheckIn = effectiveDate;
    }

    if (input.status === "checked_out") {
      actualDates.actualCheckOut = effectiveDate;
      // A guest can be checked out without ever having been marked in -- a
      // late correction, say. Their arrival is then taken as booked.
      if (!existing.actualCheckIn) {
        actualDates.actualCheckIn = existing.checkIn;
      }

      if (effectiveDate <= (actualDates.actualCheckIn ?? existing.checkIn)) {
        throw AppError.validation(
          "A guest cannot check out before they checked in",
        );
      }
    }

    const updated = await bookingRepo.update(id, {
      status: input.status,
      // Confirming a hold is what makes it permanent, so the timer stops
      // applying -- leaving it set would expire a confirmed booking.
      holdExpiresAt: null,
      ...actualDates,
      ...(input.status === "confirmed" && existing.kind === "hold"
        ? { kind: "reservation" as const }
        : {}),
    });

    const variance =
      input.status === "checked_in"
        ? describeVariance(effectiveDate, existing.checkIn, "arrival")
        : input.status === "checked_out"
          ? describeVariance(effectiveDate, existing.checkOut, "departure")
          : "";

    await bookingRepo.addAudit({
      bookingId: id,
      action: input.status,
      description: `Status changed to ${STATUS_LABELS[input.status]}${variance}.`,
      actorUserId,
    });

    return updated;
  },

  /**
   * The rooms available for the nights a stay would be extended into.
   *
   * Only the extra nights are checked, not the whole stay: the guest is
   * already in their room for the nights they have, so re-testing those would
   * report the booking as conflicting with itself.
   */
  async listExtensionOptions(id: string, checkOut: string) {
    const existing = await bookingRepo.findById(id);
    if (!existing) {
      throw AppError.notFound("Booking not found");
    }

    if (checkOut <= existing.checkOut) {
      throw AppError.validation(
        "An extension has to end after the current check-out",
      );
    }

    const rooms = await bookingRepo.listRoomsWithConflicts({
      propertyId: existing.organizationId,
      checkIn: existing.checkOut,
      checkOut,
      excludeBookingId: id,
    });

    const currentRoom = rooms.find((r) => r.id === existing.roomId);

    return {
      from: existing.checkOut,
      to: checkOut,
      /** Whether the guest can simply stay put. */
      canKeepRoom: (currentRoom?.conflicts.length ?? 0) === 0,
      currentRoomId: existing.roomId,
      rooms,
    };
  },

  /**
   * Extends a stay to a later check-out.
   *
   * Where the room is free the booking itself is stretched, which keeps one
   * stay as one row. Where it is not, the extension becomes its own booking in
   * another room, linked back by `extendsBookingId` -- the two halves occupy
   * different rooms over different dates, which is precisely what two rows
   * describe. Squeezing that into one would lose which room the guest is in on
   * any given night.
   */
  async extend(id: string, actorUserId: string, input: ExtendBookingInput) {
    const existing = await bookingRepo.findById(id);
    if (!existing) {
      throw AppError.notFound("Booking not found");
    }

    if (existing.kind === "block") {
      throw AppError.validation("A block is not a stay and cannot be extended");
    }

    if (existing.status === "cancelled" || existing.status === "checked_out") {
      throw AppError.validation(
        `A ${STATUS_LABELS[existing.status]} booking cannot be extended`,
      );
    }

    if (input.checkOut <= existing.checkOut) {
      throw AppError.validation(
        "An extension has to end after the current check-out",
      );
    }

    const movingTo = input.roomId && input.roomId !== existing.roomId;

    // Same room: stretch the stay, provided nobody else holds those nights.
    if (!movingTo) {
      await assertRoomIsFree({
        roomId: existing.roomId,
        checkIn: existing.checkOut,
        checkOut: input.checkOut,
        excludeBookingId: id,
      });

      const updated = await bookingRepo.update(id, {
        checkOut: input.checkOut,
        totalAmountPaise: input.totalAmountPaise ?? existing.totalAmountPaise,
      });

      await bookingRepo.addAudit({
        bookingId: id,
        action: "extended",
        description: `Stay extended to ${input.checkOut}.`,
        actorUserId,
      });

      return updated;
    }

    // Different room: the extension is its own booking, linked to this one.
    await assertRoomIsFree({
      roomId: input.roomId as string,
      checkIn: existing.checkOut,
      checkOut: input.checkOut,
    });

    const created = await bookingRepo.create({
      hqOrganizationId: existing.hqOrganizationId,
      organizationId: existing.organizationId,
      roomId: input.roomId as string,
      kind: "reservation",
      guestId: existing.guestId,
      status: existing.status === "checked_in" ? "checked_in" : "confirmed",
      source: existing.source,
      checkIn: existing.checkOut,
      checkOut: input.checkOut,
      guestCount: existing.guestCount,
      totalAmountPaise: input.totalAmountPaise ?? 0,
      extendsBookingId: id,
      createdByUserId: actorUserId,
    });

    if (!created) {
      throw new Error("The extension was created but could not be read back");
    }

    await Promise.all([
      bookingRepo.addAudit({
        bookingId: id,
        action: "extended",
        description: `Stay extended to ${input.checkOut} in another room (${created.ref}).`,
        actorUserId,
      }),
      bookingRepo.addAudit({
        bookingId: created.id,
        action: "created",
        description: `Room change continuing ${existing.ref}.`,
        actorUserId,
      }),
    ]);

    return created;
  },

  /**
   * Cancels a booking, freeing the room.
   *
   * The row is kept rather than deleted: cancellations are what the summary
   * band's cancellation rate is computed from, and a guest's history should
   * show that a stay was called off rather than quietly lose it.
   */
  async cancel(id: string, actorUserId: string, input: CancelBookingInput) {
    const existing = await bookingRepo.findById(id);
    if (!existing) {
      throw AppError.notFound("Booking not found");
    }

    if (!CANCELLABLE.has(existing.status)) {
      throw AppError.validation(
        `A ${STATUS_LABELS[existing.status]} booking cannot be cancelled`,
      );
    }

    const updated = await bookingRepo.update(id, {
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: input.reason ?? null,
    });

    await bookingRepo.addAudit({
      bookingId: id,
      action: "cancelled",
      description: input.reason
        ? `Booking cancelled: ${input.reason}`
        : "Booking cancelled.",
      actorUserId,
    });

    return updated;
  },

  /**
   * Records money taken against a booking.
   *
   * Overpayment is refused rather than accepted and reconciled later: the
   * balance shown on the settle sheet is derived from these rows, and a
   * payment beyond the total would render as a negative amount due.
   */
  async recordPayment(
    id: string,
    recordedByUserId: string,
    input: RecordPaymentInput,
  ) {
    const existing = await bookingRepo.findById(id);
    if (!existing) {
      throw AppError.notFound("Booking not found");
    }

    if (existing.kind === "block") {
      throw AppError.validation("A block cannot take a payment");
    }

    const totals = await bookingRepo.totals(id);
    const alreadyPaid = Number(totals?.paidPaise ?? 0);
    const balance = existing.totalAmountPaise - alreadyPaid;

    if (input.amountPaise > balance) {
      throw AppError.validation(
        `That is more than the ${formatPaise(balance)} still due`,
      );
    }

    await bookingRepo.addPayment({
      bookingId: id,
      amountPaise: input.amountPaise,
      method: input.method ?? "upi",
      paidAt: input.paidAt,
      referenceId: input.referenceId,
      notes: input.notes,
      recordedByUserId,
    });

    await bookingRepo.addAudit({
      bookingId: id,
      action: "payment_recorded",
      description: `Payment of ${formatPaise(input.amountPaise)} recorded via ${input.method ?? "upi"}.`,
      actorUserId: recordedByUserId,
    });

    return bookingRepo.findById(id);
  },

  async removePayment(
    paymentId: string,
    bookingId: string,
    actorUserId: string,
  ) {
    const removed = await bookingRepo.removePayment(paymentId);
    if (!removed) return undefined;

    await bookingRepo.addAudit({
      bookingId,
      action: "payment_removed",
      description: "A recorded payment was removed.",
      actorUserId,
    });

    return bookingRepo.findById(bookingId);
  },

  /**
   * Deletes a booking outright.
   *
   * Only ever for blocks: a reservation is cancelled, never erased, so its
   * history survives. Removing a block leaves nothing worth keeping.
   */
  async remove(id: string) {
    const existing = await bookingRepo.findById(id);
    if (!existing) return undefined;

    if (existing.kind !== "block") {
      throw AppError.validation(
        "Bookings are cancelled rather than deleted, so their history is kept",
      );
    }

    return bookingRepo.remove(id);
  },

  listGuests(hqOrganizationId: string) {
    return guestRepo.listByHqOrganization(hqOrganizationId);
  },

  async findGuest(id: string) {
    const [profile, stays, notes] = await Promise.all([
      guestRepo.findById(id),
      guestRepo.listStays(id),
      guestRepo.listNotes(id),
    ]);

    if (!profile) return undefined;
    return { ...profile, stays, notes };
  },

  /**
   * Finds a guest by phone, for the booking form's live lookup.
   *
   * Returns undefined rather than erroring when nobody matches: "no such
   * guest yet" is the normal case for a first-time visitor, not a failure.
   * The full profile comes back so the form can show that this is a repeat
   * guest and how many times they have stayed.
   */
  /**
   * Guests matching a partial phone number, for the booking form's live search.
   *
   * Returns an empty list rather than erroring when nobody matches: a
   * first-time visitor is the normal case, not a failure.
   */
  searchGuestsByPhone(hqOrganizationId: string, phone: string) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 0) return [];
    return guestRepo.searchByPhone(hqOrganizationId, digits);
  },

  listGuestTagsInUse(hqOrganizationId: string) {
    return guestRepo.listTagsInUse(hqOrganizationId);
  },

  async addGuestTag(id: string, actorUserId: string, input: GuestTagInput) {
    await guestRepo.addTag(id, input.tag, actorUserId);
    return bookingService.findGuest(id);
  },

  async removeGuestTag(id: string, tag: string) {
    await guestRepo.removeTag(id, tag);
    return bookingService.findGuest(id);
  },

  async addGuestNote(id: string, authorUserId: string, input: GuestNoteInput) {
    await guestRepo.addNote(id, input.text, authorUserId);
    return bookingService.findGuest(id);
  },

  findGuestIdByNote(noteId: string) {
    return guestRepo.findGuestIdByNote(noteId);
  },

  async removeGuestNote(noteId: string, guestId: string) {
    await guestRepo.removeNote(noteId);
    return bookingService.findGuest(guestId);
  },

  findGuestHqOrganizationId(id: string) {
    return guestRepo.findHqOrganizationId(id);
  },

  /**
   * Adds a guest to the directory.
   *
   * A phone already on file is refused rather than merged: within an HQ the
   * phone *is* the guest's identity, so a second profile for it cannot exist,
   * and silently editing the first one is not what the form asked for.
   */
  async createGuest(
    hqOrganizationId: string,
    authorUserId: string,
    input: CreateGuestInput,
  ) {
    const created = await guestRepo.create({
      hqOrganizationId,
      name: input.name,
      phone: input.phone,
      email: normalizeEmail(input.email),
    });

    if (!created) {
      const existing = await guestRepo.findByPhone(
        hqOrganizationId,
        input.phone,
      );
      throw AppError.conflict(
        existing
          ? `${existing.name} is already saved with that phone number`
          : "A guest with that phone number already exists",
      );
    }

    // A note typed on the form is the first entry in the guest's timeline,
    // not a separate field -- there is only one place notes live.
    if (input.note?.trim()) {
      await guestRepo.addNote(created.id, input.note.trim(), authorUserId);
    }

    return bookingService.findGuest(created.id);
  },

  updateGuest(id: string, input: UpdateGuestInput) {
    return guestRepo.update(id, {
      name: input.name,
      phone: input.phone,
      email: normalizeEmail(input.email),
    });
  },
};

/** Today as a calendar day, in the server's local zone. */
function today() {
  return new Date().toLocaleDateString("en-CA");
}

/**
 * How an actual date compares with what was booked, for the audit line.
 *
 * Worth recording in words: "checked out" and "checked out three nights early"
 * are different events to whoever reads the trail later.
 */
function describeVariance(actual: string, booked: string, noun: string) {
  if (actual === booked) return "";
  const days = Math.round(
    (new Date(`${actual}T00:00:00`).getTime() -
      new Date(`${booked}T00:00:00`).getTime()) /
      86_400_000,
  );
  const magnitude = Math.abs(days);
  const nights = magnitude === 1 ? "1 day" : `${magnitude} days`;
  return days < 0 ? ` (${nights} early ${noun})` : ` (${nights} late ${noun})`;
}

/** Paise to rupees for audit lines and error messages, e.g. "₹1,250". */
function formatPaise(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}
