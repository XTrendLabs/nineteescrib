import { AppError } from "../../../core";
import { bookingRepo } from "./booking.repo";
import type {
  CancelBookingInput,
  ChangeStatusInput,
  CreateBookingInput,
  CreateGuestInput,
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

    const updated = await bookingRepo.update(id, {
      status: input.status,
      // Confirming a hold is what makes it permanent, so the timer stops
      // applying -- leaving it set would expire a confirmed booking.
      holdExpiresAt: null,
      ...(input.status === "confirmed" && existing.kind === "hold"
        ? { kind: "reservation" as const }
        : {}),
    });

    await bookingRepo.addAudit({
      bookingId: id,
      action: input.status,
      description: `Status changed to ${STATUS_LABELS[input.status]}.`,
      actorUserId,
    });

    return updated;
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

/** Paise to rupees for audit lines and error messages, e.g. "₹1,250". */
function formatPaise(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}
