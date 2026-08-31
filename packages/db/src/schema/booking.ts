import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { organization } from "./organization";
import { room } from "./room";

/**
 * What a row on the calendar actually is.
 *
 * Blocks and owner stays share this table with real reservations because they
 * do the same thing to inventory: they occupy a room for a date range. Keeping
 * them here means availability is a single overlap query rather than a union
 * over two tables that must both be kept in step.
 */
export const bookingKindValues = ["reservation", "hold", "block"] as const;

/** Only set when `kind` is "block"; null on a reservation or a hold. */
export const blockReasonValues = ["maintenance", "owner_stay"] as const;

export const bookingStatusValues = [
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
] as const;

export const bookingSourceValues = [
  "direct",
  "manual",
  "airbnb",
  "booking_com",
] as const;

export const bookingPaymentMethodValues = [
  "cash",
  "upi",
  "bank_transfer",
  "card",
  "online",
] as const;

/**
 * Money is stored in paise as whole numbers, matching `expense`. Integer paise
 * keeps every addition and comparison exact, where a floating rupee value
 * drifts. `bigint` with `mode: "number"` avoids BigInt serialization while
 * staying safe to ~90 trillion rupees.
 */
const paise = (name: string) => bigint(name, { mode: "number" });

/**
 * Someone who has stayed, or is due to stay, at one of the HQ's properties.
 *
 * Deduped per HQ by phone: the same person booking two properties under one
 * business is one guest with one history, which is what the guests page shows.
 * Phone rather than email because it is the only field the booking form always
 * captures -- a walk-in guest often has no email to give.
 */
export const guest = pgTable(
  "guest",
  {
    id: text("id").primaryKey(),
    hqOrganizationId: text("hq_organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    // Notes live in `guest_note`, one row each: they accumulate over time and
    // each belongs to whoever wrote it. A single column here would have been a
    // second, quieter place for the same thing to live.
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // The dedupe key: find-or-create on booking resolves against this.
    uniqueIndex("guest_hqOrganizationId_phone_uq").on(
      table.hqOrganizationId,
      table.phone,
    ),
    index("guest_hqOrganizationId_idx").on(table.hqOrganizationId),
  ],
);

/**
 * Tags offered by default when a member starts typing.
 *
 * Not a constraint: a tag is free text, so an operator can file guests by
 * whatever vocabulary their business actually uses -- "allergy", "corporate",
 * "blacklist" -- rather than the two we guessed at. These are only the
 * suggestions the UI seeds.
 *
 * "repeat" is deliberately absent: it follows from the stay count and is
 * derived on read, so it can never disagree with the bookings behind it, and
 * storing it would let the two contradict each other.
 */
export const suggestedGuestTags = ["vip", "needs_care"] as const;

/** A stored tag is reserved from colliding with the derived one. */
export const DERIVED_GUEST_TAGS = ["repeat"] as const;

export const guestTag = pgTable(
  "guest_tag",
  {
    guestId: text("guest_id")
      .notNull()
      .references(() => guest.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
    taggedByUserId: text("tagged_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // One row per tag per guest: tagging someone VIP twice is the same fact.
    primaryKey({ columns: [table.guestId, table.tag] }),
    index("guest_tag_guestId_idx").on(table.guestId),
  ],
);

/**
 * A note staff keep against a guest -- preferences, warnings, context.
 *
 * Its own table rather than a column on `guest`: notes accumulate over time,
 * each belongs to whoever wrote it, and the drawer shows them as a dated list.
 */
export const guestNote = pgTable(
  "guest_note",
  {
    id: text("id").primaryKey(),
    guestId: text("guest_id")
      .notNull()
      .references(() => guest.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    authorUserId: text("author_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("guest_note_guestId_createdAt_idx").on(
      table.guestId,
      table.createdAt,
    ),
  ],
);

/**
 * A stay: one room held for one date range.
 *
 * The amount paid is deliberately NOT stored here. It is the sum of the rows in
 * `bookingPayment`, and payment status derives from that sum against
 * `totalAmountPaise` -- the same rule `expense` follows, for the same reason: a
 * cached total is one failed write away from disagreeing with the ledger.
 */
export const booking = pgTable(
  "booking",
  {
    id: text("id").primaryKey(),
    // Bookings hang off the HQ so the whole portfolio can be listed without
    // walking every property; `roomId` is what pins a booking to one of them.
    hqOrganizationId: text("hq_organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    /** The property (an organization of kind "property") being stayed at. */
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    // Restricted, not cascaded: a room with stay history must not be
    // deletable out from under its bookings.
    roomId: text("room_id")
      .notNull()
      .references(() => room.id, { onDelete: "restrict" }),
    /** Human-readable reference (POS-1, POS-2), sequential per HQ. */
    ref: text("ref").notNull(),
    kind: text("kind").default("reservation").notNull(),
    /** Set only when `kind` is "block". */
    blockReason: text("block_reason"),
    // Null for a block, which occupies a room on nobody's behalf.
    guestId: text("guest_id").references(() => guest.id, {
      onDelete: "restrict",
    }),
    status: text("status").default("pending").notNull(),
    source: text("source").default("manual").notNull(),
    // Check-in and check-out are calendar days, not instants. Stored as `date`
    // so a stay does not shift by a day for anyone east of UTC; the property's
    // own check-in time lives on `property_details`.
    checkIn: date("check_in").notNull(),
    checkOut: date("check_out").notNull(),
    /**
     * When the guest actually arrived and left, as against what they booked.
     *
     * Kept apart from `checkIn`/`checkOut` because the two answer different
     * questions. The booked dates are what was agreed and what the guest is
     * billed for; the actual dates are what happened, and are what decides
     * whether a room is free tonight. Overwriting the booked dates on an early
     * departure would free the room correctly but lose the fact that three
     * paid-for nights went unused -- which is exactly what a revenue report
     * needs to see.
     *
     * Null until the guest checks in or out. A stay that ran exactly as booked
     * still fills these in, so "actual" never has to fall back to a guess.
     */
    actualCheckIn: date("actual_check_in"),
    actualCheckOut: date("actual_check_out"),
    guestCount: integer("guest_count").default(1).notNull(),
    totalAmountPaise: paise("total_amount_paise").default(0).notNull(),
    /**
     * When a "hold" stops holding inventory.
     *
     * Expiry is evaluated lazily at read time rather than by a sweeper job: an
     * availability query already filters on status and dates, so excluding
     * elapsed holds there costs nothing and cannot fall behind the way a cron
     * that missed a run would.
     */
    holdExpiresAt: timestamp("hold_expires_at"),
    notes: text("notes"),
    /**
     * The booking this one continues, when a stay was extended into a
     * different room.
     *
     * A room move cannot be one row: the two halves occupy different rooms
     * over different dates, which is exactly what a booking row represents.
     * Linking them keeps the stay readable as one visit -- the guest's history
     * and the front desk both need to see it that way.
     */
    extendsBookingId: text("extends_booking_id").references(
      (): AnyPgColumn => booking.id,
      { onDelete: "set null" },
    ),
    cancelledAt: timestamp("cancelled_at"),
    cancellationReason: text("cancellation_reason"),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Each HQ gets its own POS-n sequence, so two businesses never share a
    // reference and a double submit cannot mint the same one twice.
    uniqueIndex("booking_hqOrganizationId_ref_uq").on(
      table.hqOrganizationId,
      table.ref,
    ),
    // Serves the default listing: one HQ's bookings, newest arrivals first.
    index("booking_hqOrganizationId_checkIn_idx").on(
      table.hqOrganizationId,
      table.checkIn,
    ),
    // Serves the availability check and the calendar's per-room timeline.
    index("booking_roomId_checkIn_checkOut_idx").on(
      table.roomId,
      table.checkIn,
      table.checkOut,
    ),
    index("booking_organizationId_idx").on(table.organizationId),
    index("booking_guestId_idx").on(table.guestId),
    index("booking_extendsBookingId_idx").on(table.extendsBookingId),
  ],
);

/**
 * Counts the refs handed out per HQ.
 *
 * Cannot be `max(ref) + 1` over `booking`: two concurrent inserts would read
 * the same max and mint the same ref, and deleting the newest booking would
 * make the next one reuse a reference a guest has already been emailed. A
 * dedicated counter, incremented atomically, only ever moves forward.
 */
export const bookingCounter = pgTable("booking_counter", {
  hqOrganizationId: text("hq_organization_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  lastRef: integer("last_ref").default(0).notNull(),
});

/**
 * One payment taken against a booking.
 *
 * Stays are routinely settled in parts -- a deposit to confirm, the balance at
 * check-out -- so each payment is its own row with its own method and date.
 * Summing them gives the amount paid; the settle-payment sheet writes here.
 */
export const bookingPayment = pgTable(
  "booking_payment",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "cascade" }),
    amountPaise: paise("amount_paise").notNull(),
    method: text("method").default("upi").notNull(),
    // A calendar day, not an instant -- see `checkIn` above.
    paidAt: date("paid_at").notNull(),
    /** Transaction id from the bank, UPI app or gateway. */
    referenceId: text("reference_id"),
    notes: text("notes"),
    recordedByUserId: text("recorded_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("booking_payment_bookingId_idx").on(table.bookingId)],
);

/**
 * What happened to a booking, in order.
 *
 * Written by the service on every state change and read straight back by the
 * audit drawer. Stored as rows rather than reconstructed from the booking's
 * current state so the trail records what actually occurred -- including the
 * steps a later status would otherwise erase.
 */
export const bookingAudit = pgTable(
  "booking_audit",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "cascade" }),
    /** Machine-readable event, e.g. "created", "confirmed", "payment_recorded". */
    action: text("action").notNull(),
    /** Human-readable line shown in the drawer. */
    description: text("description").notNull(),
    // Null when the actor was the public booking engine or a channel webhook
    // rather than a signed-in member.
    actorUserId: text("actor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("booking_audit_bookingId_createdAt_idx").on(
      table.bookingId,
      table.createdAt,
    ),
  ],
);

export const guestRelations = relations(guest, ({ one, many }) => ({
  hqOrganization: one(organization, {
    fields: [guest.hqOrganizationId],
    references: [organization.id],
  }),
  bookings: many(booking),
  tags: many(guestTag),
  notes: many(guestNote),
}));

export const guestTagRelations = relations(guestTag, ({ one }) => ({
  guest: one(guest, {
    fields: [guestTag.guestId],
    references: [guest.id],
  }),
}));

export const guestNoteRelations = relations(guestNote, ({ one }) => ({
  guest: one(guest, {
    fields: [guestNote.guestId],
    references: [guest.id],
  }),
}));

export const bookingRelations = relations(booking, ({ one, many }) => ({
  hqOrganization: one(organization, {
    fields: [booking.hqOrganizationId],
    references: [organization.id],
  }),
  property: one(organization, {
    fields: [booking.organizationId],
    references: [organization.id],
  }),
  room: one(room, {
    fields: [booking.roomId],
    references: [room.id],
  }),
  guest: one(guest, {
    fields: [booking.guestId],
    references: [guest.id],
  }),
  payments: many(bookingPayment),
  auditEvents: many(bookingAudit),
}));

export const bookingPaymentRelations = relations(bookingPayment, ({ one }) => ({
  booking: one(booking, {
    fields: [bookingPayment.bookingId],
    references: [booking.id],
  }),
}));

export const bookingAuditRelations = relations(bookingAudit, ({ one }) => ({
  booking: one(booking, {
    fields: [bookingAudit.bookingId],
    references: [booking.id],
  }),
}));
