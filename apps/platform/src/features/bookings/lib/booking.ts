/**
 * The booking shapes the API returns, and the derivations the page builds on
 * top of them.
 *
 * Dates arrive as "YYYY-MM-DD" strings rather than as `Date`s: the columns
 * behind them are calendar days, and parsing them into instants would shift a
 * stay by a day for anyone east of UTC. They are only turned into `Date`s at
 * the point of formatting -- see `lib/format`.
 */

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled";

export type BookingSource = "direct" | "manual" | "airbnb" | "booking_com";

export type BookingKind = "reservation" | "hold" | "block";

export type BlockReason = "maintenance" | "owner_stay";

export type PaymentStatus = "unpaid" | "partial" | "paid";

export type BookingPaymentMethod =
  | "cash"
  | "upi"
  | "bank_transfer"
  | "card"
  | "online";

export type BookingPaymentEntry = {
  id: string;
  bookingId: string;
  amountPaise: number;
  method: string;
  /** A calendar day (YYYY-MM-DD), not an instant -- see the schema. */
  paidAt: string;
  referenceId: string | null;
  notes: string | null;
  recordedByUserId: string | null;
  createdAt: string;
};

export type Booking = {
  id: string;
  hqOrganizationId: string;
  organizationId: string;
  propertyName: string;
  roomId: string;
  roomName: string;
  roomType: string;
  ref: string;
  kind: BookingKind;
  blockReason: BlockReason | null;
  guestId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  status: BookingStatus;
  source: BookingSource;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  totalAmountPaise: number;
  holdExpiresAt: string | null;
  notes: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdByUserId: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  /** Summed from the payment ledger by the server, never stored. */
  amountPaidPaise: number;
  balanceDuePaise: number;
  paymentStatus: PaymentStatus;
  payments: BookingPaymentEntry[];
};

export type BookingAuditEvent = {
  id: string;
  action: string;
  description: string;
  actorUserId: string | null;
  actorName: string | null;
  createdAt: string;
};

/** A room the availability endpoint says is free for the chosen dates. */
export type AvailableRoom = {
  id: string;
  name: string;
  roomNumber: string | null;
  floor: string | null;
  roomType: string;
  status: string;
  weekdayPrice: number;
  weekendPrice: number;
  maxGuests: number;
};

export type BookingsSummary = {
  activeStays: number;
  unpaidCount: number;
  pendingHolds: number;
  cancellationRate: number;
};

/**
 * The four figures on the summary band.
 *
 * Computed over every booking the caller can see, not the filtered page: the
 * band reports the state of the business, so narrowing the table to one
 * property should not change what "active stays" means.
 */
export function buildBookingsSummary(bookings: Booking[]): BookingsSummary {
  const stays = bookings.filter((b) => b.kind !== "block");

  const activeStays = stays.filter((b) => b.status === "checked_in").length;
  const unpaidCount = stays.filter(
    (b) => b.status !== "cancelled" && b.balanceDuePaise > 0,
  ).length;
  const pendingHolds = stays.filter(
    (b) => b.status === "pending" || b.kind === "hold",
  ).length;
  const cancelled = stays.filter((b) => b.status === "cancelled").length;
  const cancellationRate =
    stays.length > 0 ? (cancelled / stays.length) * 100 : 0;

  return { activeStays, unpaidCount, pendingHolds, cancellationRate };
}

/** Rupees as typed into a form, to the integer paise the API expects. */
export function toPaise(rupees: string): number {
  const parsed = Number.parseFloat(rupees);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}
