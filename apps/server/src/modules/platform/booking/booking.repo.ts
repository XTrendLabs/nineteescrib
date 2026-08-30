import { createDb } from "@propertyos/db";
import { user } from "@propertyos/db/schema/auth";
import {
  booking,
  bookingAudit,
  bookingCounter,
  bookingPayment,
  guest,
} from "@propertyos/db/schema/booking";
import { organization } from "@propertyos/db/schema/organization";
import { room } from "@propertyos/db/schema/room";
import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm";

const db = createDb();

export type BookingPaymentStatus = "unpaid" | "partial" | "paid";

function derivePaymentStatus(
  totalPaise: number,
  paidPaise: number,
): BookingPaymentStatus {
  if (paidPaise <= 0) return "unpaid";
  if (paidPaise >= totalPaise) return "paid";
  return "partial";
}

/**
 * The booking row plus the labels the UI shows in place of raw ids.
 *
 * Guest, room and property names are joined rather than copied onto the
 * booking: they are display labels that must follow a rename. This differs
 * deliberately from `expense.vendorGstin`, which is snapshotted because it is
 * a tax fact about a past transaction rather than a label.
 */
const bookingColumns = {
  id: booking.id,
  hqOrganizationId: booking.hqOrganizationId,
  organizationId: booking.organizationId,
  propertyName: organization.name,
  roomId: booking.roomId,
  roomName: room.name,
  roomType: room.roomType,
  ref: booking.ref,
  kind: booking.kind,
  blockReason: booking.blockReason,
  guestId: booking.guestId,
  guestName: guest.name,
  guestPhone: guest.phone,
  guestEmail: guest.email,
  status: booking.status,
  source: booking.source,
  checkIn: booking.checkIn,
  checkOut: booking.checkOut,
  guestCount: booking.guestCount,
  totalAmountPaise: booking.totalAmountPaise,
  holdExpiresAt: booking.holdExpiresAt,
  notes: booking.notes,
  cancelledAt: booking.cancelledAt,
  cancellationReason: booking.cancellationReason,
  createdByUserId: booking.createdByUserId,
  createdByName: user.name,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
};

function selectBookings() {
  return db
    .select(bookingColumns)
    .from(booking)
    .innerJoin(room, eq(booking.roomId, room.id))
    .innerJoin(organization, eq(booking.organizationId, organization.id))
    .leftJoin(guest, eq(booking.guestId, guest.id))
    .leftJoin(user, eq(booking.createdByUserId, user.id));
}

type BookingRow = Awaited<ReturnType<typeof selectBookings>>[number];

/**
 * A booking no longer holds its room once it is cancelled, or -- for a hold --
 * once its timer has elapsed.
 *
 * Hold expiry is evaluated here, at read time, rather than by a sweeper job:
 * every availability query already filters on status, so excluding elapsed
 * holds costs nothing and cannot fall behind the way a cron that missed a run
 * would. An expired hold keeps its row for the audit trail; it simply stops
 * occupying inventory.
 */
function occupiesInventory() {
  return and(
    ne(booking.status, "cancelled"),
    or(
      ne(booking.kind, "hold"),
      sql`${booking.holdExpiresAt} is null or ${booking.holdExpiresAt} > now()`,
    ),
  );
}

/**
 * Two date ranges overlap when each starts before the other ends.
 *
 * Check-out day is exclusive: a guest leaving on the 10th and another arriving
 * on the 10th do not conflict, which is why these are strict `<` and `>`
 * rather than `<=` and `>=`.
 */
function overlaps(checkIn: string, checkOut: string) {
  return and(
    sql`${booking.checkIn} < ${checkOut}`,
    sql`${booking.checkOut} > ${checkIn}`,
  );
}

/**
 * Attaches the payment ledger and the totals derived from it.
 *
 * Amount paid is summed from `booking_payment` on every read rather than kept
 * as a column on `booking`: one extra query per page, against a stored total
 * that drifts the first time a write fails midway.
 */
async function attachPayments(rows: BookingRow[]) {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);

  const payments = await db
    .select()
    .from(bookingPayment)
    .where(inArray(bookingPayment.bookingId, ids))
    .orderBy(asc(bookingPayment.paidAt), asc(bookingPayment.createdAt));

  return rows.map((row) => {
    const mine = payments.filter((p) => p.bookingId === row.id);
    const amountPaidPaise = mine.reduce((sum, p) => sum + p.amountPaise, 0);

    return {
      ...row,
      amountPaidPaise,
      balanceDuePaise: row.totalAmountPaise - amountPaidPaise,
      paymentStatus: derivePaymentStatus(row.totalAmountPaise, amountPaidPaise),
      payments: mine,
    };
  });
}

export const bookingRepo = {
  /**
   * One HQ's bookings, optionally narrowed to a single property.
   *
   * Ordered by arrival date descending: the bookings page opens on what is
   * happening now, not on what was entered most recently.
   */
  async listByHqOrganization(
    hqOrganizationId: string,
    filters?: { propertyId?: string },
  ) {
    const conditions = [eq(booking.hqOrganizationId, hqOrganizationId)];

    if (filters?.propertyId) {
      conditions.push(eq(booking.organizationId, filters.propertyId));
    }

    const rows = await selectBookings()
      .where(and(...conditions))
      .orderBy(desc(booking.checkIn), desc(booking.createdAt));

    return attachPayments(rows);
  },

  /**
   * Bookings touching a date window, for the calendar timeline.
   *
   * Uses the same overlap rule as the availability check, so a booking drawn
   * on the calendar and a booking that blocks a room are always the same set.
   */
  async listByDateRange(
    hqOrganizationId: string,
    from: string,
    to: string,
    filters?: { propertyId?: string },
  ) {
    const conditions = [
      eq(booking.hqOrganizationId, hqOrganizationId),
      overlaps(from, to),
    ];

    if (filters?.propertyId) {
      conditions.push(eq(booking.organizationId, filters.propertyId));
    }

    const rows = await selectBookings()
      .where(and(...conditions))
      .orderBy(asc(booking.checkIn));

    return attachPayments(rows);
  },

  async findById(id: string) {
    const rows = await selectBookings().where(eq(booking.id, id)).limit(1);
    if (rows.length === 0) return undefined;
    const [withPayments] = await attachPayments(rows);
    return withPayments;
  },

  /** The HQ owning a booking, for the scope check -- see `expense.repo`. */
  async findHqOrganizationId(id: string) {
    const [row] = await db
      .select({ hqOrganizationId: booking.hqOrganizationId })
      .from(booking)
      .where(eq(booking.id, id))
      .limit(1);
    return row?.hqOrganizationId;
  },

  /** The booking a payment belongs to, so a payment id can be scope-checked. */
  async findBookingIdByPayment(paymentId: string) {
    const [row] = await db
      .select({ bookingId: bookingPayment.bookingId })
      .from(bookingPayment)
      .where(eq(bookingPayment.id, paymentId))
      .limit(1);
    return row?.bookingId;
  },

  /**
   * The bookings that would clash with a stay in this room over these dates.
   *
   * `excludeBookingId` lets an edit ignore the booking being edited, which
   * would otherwise always conflict with itself.
   */
  async findConflicts(input: {
    roomId: string;
    checkIn: string;
    checkOut: string;
    excludeBookingId?: string;
  }) {
    const conditions = [
      eq(booking.roomId, input.roomId),
      occupiesInventory(),
      overlaps(input.checkIn, input.checkOut),
    ];

    if (input.excludeBookingId) {
      conditions.push(ne(booking.id, input.excludeBookingId));
    }

    return db
      .select({
        id: booking.id,
        ref: booking.ref,
        kind: booking.kind,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
      })
      .from(booking)
      .where(and(...conditions));
  },

  /**
   * The rooms in a property that are free for the whole date range.
   *
   * Expressed as "rooms with no conflicting booking" rather than by counting
   * inventory: one `room` row is one physical unit, so a single overlap is
   * enough to rule it out.
   */
  async listAvailableRooms(input: {
    propertyId: string;
    checkIn: string;
    checkOut: string;
    excludeBookingId?: string;
  }) {
    const conflictConditions = [
      eq(booking.roomId, room.id),
      occupiesInventory(),
      overlaps(input.checkIn, input.checkOut),
    ];

    if (input.excludeBookingId) {
      conflictConditions.push(ne(booking.id, input.excludeBookingId));
    }

    return db
      .select({
        id: room.id,
        name: room.name,
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomType: room.roomType,
        status: room.status,
        weekdayPrice: room.weekdayPrice,
        weekendPrice: room.weekendPrice,
        maxGuests: room.maxGuests,
      })
      .from(room)
      .where(
        and(
          eq(room.organizationId, input.propertyId),
          sql`not exists (${db
            .select({ one: sql`1` })
            .from(booking)
            .where(and(...conflictConditions))})`,
        ),
      )
      .orderBy(asc(room.name));
  },

  /**
   * The next reference for an HQ, as one atomic step.
   *
   * The upsert increments and returns in a single statement, so two concurrent
   * creates are serialized by the row lock rather than both reading the same
   * value -- the race a `max(ref) + 1` would lose. The unique index on
   * (hq, ref) is the backstop.
   */
  async nextRef(hqOrganizationId: string) {
    const [row] = await db
      .insert(bookingCounter)
      .values({ hqOrganizationId, lastRef: 1 })
      .onConflictDoUpdate({
        target: bookingCounter.hqOrganizationId,
        set: { lastRef: sql`${bookingCounter.lastRef} + 1` },
      })
      .returning({ lastRef: bookingCounter.lastRef });

    // The upsert always writes a row, so this is defensive rather than
    // expected -- but a missing counter must not mint "POS-undefined".
    if (!row) {
      throw new Error("Could not allocate a booking reference");
    }

    return `POS-${row.lastRef}`;
  },

  async create(
    input: Omit<typeof booking.$inferInsert, "id" | "ref"> & {
      initialPayment?: Omit<
        typeof bookingPayment.$inferInsert,
        "id" | "bookingId"
      >;
    },
  ) {
    const { initialPayment, ...bookingInput } = input;
    const id = crypto.randomUUID();
    const ref = await bookingRepo.nextRef(input.hqOrganizationId);

    await db.insert(booking).values({ ...bookingInput, id, ref });

    if (initialPayment) {
      await db
        .insert(bookingPayment)
        .values({ ...initialPayment, id: crypto.randomUUID(), bookingId: id });
    }

    return bookingRepo.findById(id);
  },

  async update(id: string, input: Partial<typeof booking.$inferInsert>) {
    const rows = await db
      .update(booking)
      .set(input)
      .where(eq(booking.id, id))
      .returning({ id: booking.id });

    if (rows.length === 0) return undefined;
    return bookingRepo.findById(id);
  },

  async remove(id: string) {
    const [row] = await db
      .delete(booking)
      .where(eq(booking.id, id))
      .returning({ id: booking.id });
    return row;
  },

  async addPayment(input: Omit<typeof bookingPayment.$inferInsert, "id">) {
    const [row] = await db
      .insert(bookingPayment)
      .values({ ...input, id: crypto.randomUUID() })
      .returning();
    return row;
  },

  async removePayment(paymentId: string) {
    const [row] = await db
      .delete(bookingPayment)
      .where(eq(bookingPayment.id, paymentId))
      .returning({ id: bookingPayment.id });
    return row;
  },

  /** The totals a payment is validated against, without the joins. */
  async totals(id: string) {
    const [row] = await db
      .select({
        totalAmountPaise: booking.totalAmountPaise,
        paidPaise: sql<number>`coalesce(sum(${bookingPayment.amountPaise}), 0)`,
      })
      .from(booking)
      .leftJoin(bookingPayment, eq(bookingPayment.bookingId, booking.id))
      .where(eq(booking.id, id))
      .groupBy(booking.id);
    return row;
  },

  async addAudit(input: Omit<typeof bookingAudit.$inferInsert, "id">) {
    const [row] = await db
      .insert(bookingAudit)
      .values({ ...input, id: crypto.randomUUID() })
      .returning();
    return row;
  },

  async listAudit(bookingId: string) {
    return db
      .select({
        id: bookingAudit.id,
        action: bookingAudit.action,
        description: bookingAudit.description,
        actorUserId: bookingAudit.actorUserId,
        actorName: user.name,
        createdAt: bookingAudit.createdAt,
      })
      .from(bookingAudit)
      .leftJoin(user, eq(bookingAudit.actorUserId, user.id))
      .where(eq(bookingAudit.bookingId, bookingId))
      .orderBy(asc(bookingAudit.createdAt));
  },
};
