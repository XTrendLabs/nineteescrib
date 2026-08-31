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
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  ne,
  notInArray,
  or,
  sql,
} from "drizzle-orm";

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
  actualCheckIn: booking.actualCheckIn,
  actualCheckOut: booking.actualCheckOut,
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
 * The statuses that no longer hold a room.
 *
 * A cancelled stay never happened, and a checked-out guest has left -- in both
 * cases the room is free to sell for those dates again. Keeping a checked-out
 * booking in the way would make a room unsellable for every past date it was
 * ever occupied, which grows without bound.
 */
const RELEASED_STATUSES: string[] = ["cancelled", "checked_out"];

/**
 * A booking no longer holds its room once it is cancelled or checked out, or
 * -- for a hold -- once its timer has elapsed.
 *
 * Hold expiry is evaluated here, at read time, rather than by a sweeper job:
 * every availability query already filters on status, so excluding elapsed
 * holds costs nothing and cannot fall behind the way a cron that missed a run
 * would. An expired hold keeps its row for the audit trail; it simply stops
 * occupying inventory.
 */
function occupiesInventory() {
  return and(
    notInArray(booking.status, RELEASED_STATUSES),
    or(
      ne(booking.kind, "hold"),
      sql`${booking.holdExpiresAt} is null or ${booking.holdExpiresAt} > now()`,
    ),
  );
}

/**
 * The nights a booking actually holds its room.
 *
 * A guest who left early releases the nights they gave up, so availability
 * follows the actual dates once they exist and the booked dates until then. An
 * early arrival likewise occupies the room from when they turned up, not from
 * when they were due.
 *
 * The booked dates are never overwritten -- they are what the guest is billed
 * for, and a revenue report needs to see that paid-for nights went unused.
 */
const occupiedFrom = sql`coalesce(${booking.actualCheckIn}, ${booking.checkIn})`;
const occupiedTo = sql`coalesce(${booking.actualCheckOut}, ${booking.checkOut})`;

/**
 * Two date ranges overlap when each starts before the other ends.
 *
 * Check-out day is exclusive: a guest leaving on the 10th and another arriving
 * on the 10th do not conflict, which is why these are strict `<` and `>`
 * rather than `<=` and `>=`.
 */
function overlaps(checkIn: string, checkOut: string) {
  return and(
    sql`${occupiedFrom} < ${checkOut}`,
    sql`${occupiedTo} > ${checkIn}`,
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
          // See `listRoomsWithConflicts`: a draft room is not sellable.
          eq(room.status, "published"),
          sql`not exists (${db
            .select({ one: sql`1` })
            .from(booking)
            .where(and(...conflictConditions))})`,
        ),
      )
      .orderBy(asc(room.name));
  },

  /**
   * How full a property is on each night of a window.
   *
   * One row per night: the number of rooms occupied, against the property's
   * total. Computed in the database with a generated date series rather than
   * by fetching every booking and bucketing them in JS -- a month of stays
   * across a large property is a lot of rows to ship just to count them.
   *
   * A night is the day a guest sleeps there, so a stay contributes to every
   * date from check-in up to but excluding check-out: someone leaving on the
   * 4th does not occupy the room that night.
   */
  async listNightlyOccupancy(input: {
    propertyId: string;
    from: string;
    to: string;
  }) {
    // Counts only published rooms, so "fully booked" means every *sellable*
    // room is taken -- a draft room sitting in the total would make a full
    // night look like it still had space.
    const [totals] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(room)
      .where(
        and(
          eq(room.organizationId, input.propertyId),
          eq(room.status, "published"),
        ),
      );

    const totalRooms = totals?.total ?? 0;

    const rows = await db.execute<{ night: string; booked: number }>(sql`
      select
        to_char(night::date, 'YYYY-MM-DD') as night,
        count(distinct ${booking.roomId})::int as booked
      from generate_series(
        ${input.from}::date,
        ${input.to}::date - interval '1 day',
        interval '1 day'
      ) as night
      left join ${booking}
        on coalesce(${booking.actualCheckIn}, ${booking.checkIn}) <= night::date
       and coalesce(${booking.actualCheckOut}, ${booking.checkOut}) > night::date
       and ${booking.status} not in ('cancelled', 'checked_out')
       and (
         ${booking.kind} <> 'hold'
         or ${booking.holdExpiresAt} is null
         or ${booking.holdExpiresAt} > now()
       )
       and ${booking.organizationId} = ${input.propertyId}
      group by night
      order by night
    `);

    return {
      totalRooms,
      nights: rows.rows.map((r) => ({
        night: r.night,
        booked: Number(r.booked),
      })),
    };
  },

  /**
   * The first upcoming stay for an HQ, so the calendar can open where the
   * bookings are.
   *
   * Landing on today's month is right when a property is busy and unhelpful
   * when it is not -- an empty grid reads as a broken page rather than as a
   * quiet month.
   */
  async findNextBookingDate(hqOrganizationId: string, propertyId?: string) {
    const conditions = [
      eq(booking.hqOrganizationId, hqOrganizationId),
      occupiesInventory(),
    ];

    if (propertyId) {
      conditions.push(eq(booking.organizationId, propertyId));
    }

    const [row] = await db
      .select({ checkIn: booking.checkIn })
      .from(booking)
      .where(and(...conditions))
      .orderBy(asc(booking.checkIn))
      .limit(1);

    return row?.checkIn;
  },

  /**
   * The sellable rooms across an HQ, with the property each belongs to.
   *
   * The calendar draws one row per room grouped under its property, so it
   * needs the inventory itself rather than only the bookings sitting on it --
   * an empty room still has to appear as an empty row.
   */
  async listInventory(hqOrganizationId: string, propertyId?: string) {
    const scope = propertyId
      ? eq(organization.id, propertyId)
      : and(
          eq(organization.kind, "property"),
          or(
            eq(organization.parentOrganizationId, hqOrganizationId),
            eq(organization.id, hqOrganizationId),
          ),
        );

    // Left-joined from the property rather than the room, so a property with
    // nothing published still comes back -- the calendar says "no published
    // rooms" against it, where dropping it entirely reads as a missing
    // property.
    return db
      .select({
        id: room.id,
        name: room.name,
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomType: room.roomType,
        maxGuests: room.maxGuests,
        weekdayPrice: room.weekdayPrice,
        weekendPrice: room.weekendPrice,
        propertyId: organization.id,
        propertyName: organization.name,
      })
      .from(organization)
      .leftJoin(
        room,
        and(
          eq(room.organizationId, organization.id),
          eq(room.status, "published"),
        ),
      )
      .where(scope)
      .orderBy(asc(organization.name), asc(room.roomType), asc(room.name));
  },

  /**
   * The nights one room is occupied over a window.
   *
   * Property-wide occupancy is the wrong question when checking a guest in
   * early: what matters is whether *their* room is free on the day they turned
   * up, not whether the property has space somewhere.
   *
   * `excludeBookingId` leaves out the stay being checked in, which would
   * otherwise report itself as the conflict.
   */
  async listRoomOccupancy(input: {
    roomId: string;
    from: string;
    to: string;
    excludeBookingId?: string;
  }) {
    const exclusion = input.excludeBookingId
      ? sql`and ${booking.id} <> ${input.excludeBookingId}`
      : sql``;

    const rows = await db.execute<{ night: string; booked: number }>(sql`
      select
        to_char(night::date, 'YYYY-MM-DD') as night,
        count(${booking.id})::int as booked
      from generate_series(
        ${input.from}::date,
        ${input.to}::date - interval '1 day',
        interval '1 day'
      ) as night
      left join ${booking}
        on coalesce(${booking.actualCheckIn}, ${booking.checkIn}) <= night::date
       and coalesce(${booking.actualCheckOut}, ${booking.checkOut}) > night::date
       and ${booking.status} not in ('cancelled', 'checked_out')
       and (
         ${booking.kind} <> 'hold'
         or ${booking.holdExpiresAt} is null
         or ${booking.holdExpiresAt} > now()
       )
       and ${booking.roomId} = ${input.roomId}
       ${exclusion}
      group by night
      order by night
    `);

    return {
      // One room, so a night is either taken or it is not.
      totalRooms: 1,
      nights: rows.rows.map((r) => ({
        night: r.night,
        booked: Number(r.booked),
      })),
    };
  },

  /**
   * Every room in a property, each with the stays that clash with these dates.
   *
   * Unlike `listAvailableRooms`, booked rooms are returned rather than filtered
   * out: the create dialog shows the whole inventory and says *why* a room
   * cannot be used, which is more useful than the room silently disappearing.
   * A room with an empty `conflicts` array is free.
   */
  async listRoomsWithConflicts(input: {
    propertyId: string;
    checkIn: string;
    checkOut: string;
    excludeBookingId?: string;
  }) {
    const conflictConditions = [
      occupiesInventory(),
      overlaps(input.checkIn, input.checkOut),
    ];

    if (input.excludeBookingId) {
      conflictConditions.push(ne(booking.id, input.excludeBookingId));
    }

    const [rooms, clashes] = await Promise.all([
      db
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
        // Draft rooms are not ready to be sold -- they are still being set up,
        // so they must not appear as bookable inventory.
        .where(
          and(
            eq(room.organizationId, input.propertyId),
            eq(room.status, "published"),
          ),
        )
        .orderBy(asc(room.name)),
      db
        .select({
          roomId: booking.roomId,
          id: booking.id,
          ref: booking.ref,
          kind: booking.kind,
          blockReason: booking.blockReason,
          guestName: guest.name,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
        })
        .from(booking)
        .innerJoin(room, eq(booking.roomId, room.id))
        .leftJoin(guest, eq(booking.guestId, guest.id))
        .where(
          and(eq(room.organizationId, input.propertyId), ...conflictConditions),
        )
        .orderBy(asc(booking.checkIn)),
    ]);

    return rooms.map((r) => ({
      ...r,
      conflicts: clashes
        .filter((c) => c.roomId === r.id)
        .map(({ roomId: _roomId, ...rest }) => rest),
    }));
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
