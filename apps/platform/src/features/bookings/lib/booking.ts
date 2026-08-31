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
  /**
   * When the guest actually arrived and left, where known.
   *
   * Availability follows these; the booked dates above stay as agreed, so an
   * early departure frees the room without hiding the unused nights.
   */
  actualCheckIn: string | null;
  actualCheckOut: string | null;
  /** The instant the desk marked them in or out -- a time, not a day. */
  checkedInAt: string | null;
  checkedOutAt: string | null;
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

/**
 * What a room costs for a stay, night by night.
 *
 * Room prices are stored in whole rupees (see the room dialog), while bookings
 * store paise, so the conversion happens here at the boundary rather than
 * being repeated at each call site.
 *
 * Friday and Saturday nights bill at the weekend rate: those are the nights a
 * guest sleeps over into the weekend. Sunday night is a weekday rate, since
 * the guest leaves on Monday.
 */
export function quoteStay(input: {
  checkIn: string;
  checkOut: string;
  weekdayPrice: number;
  weekendPrice: number;
}): { nights: number; totalPaise: number; weekendNights: number } {
  const start = new Date(`${input.checkIn}T00:00:00`);
  const end = new Date(`${input.checkOut}T00:00:00`);

  let totalRupees = 0;
  let nights = 0;
  let weekendNights = 0;

  for (
    const cursor = new Date(start);
    cursor < end;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const day = cursor.getDay();
    const isWeekend = day === 5 || day === 6;

    totalRupees += isWeekend ? input.weekendPrice : input.weekdayPrice;
    if (isWeekend) weekendNights++;
    nights++;
  }

  return { nights, totalPaise: totalRupees * 100, weekendNights };
}

export type DiscountKind = "amount" | "percent";

export type StayPricing = {
  /** Room rates for the nights stayed, before any reduction. */
  subtotalPaise: number;
  discountPaise: number;
  /** After discount, before tax. */
  netPaise: number;
  gstPaise: number;
  /** What the guest owes. */
  totalPaise: number;
  nights: number;
  weekendNights: number;
};

/**
 * The full price of a stay: room rates, less a discount, plus optional GST.
 *
 * A discount rather than an override, so the room's own rates stay visible and
 * the reduction is an explicit, auditable line -- an overridden total hides
 * both what the room costs and how much was given away.
 */
export function priceStay(input: {
  checkIn: string;
  checkOut: string;
  weekdayPrice: number;
  weekendPrice: number;
  discountValue: string;
  discountKind: DiscountKind;
  gstRateBps: number;
  gstInclusive: boolean;
}): StayPricing {
  const { nights, totalPaise: subtotalPaise, weekendNights } = quoteStay(input);

  const raw = Number.parseFloat(input.discountValue);
  const entered = Number.isFinite(raw) && raw > 0 ? raw : 0;

  // A percentage is taken off the subtotal; a flat amount is in rupees. Either
  // way the discount can never exceed the subtotal, which would make the stay
  // cost a negative amount.
  const discountPaise = Math.min(
    subtotalPaise,
    input.discountKind === "percent"
      ? Math.round((subtotalPaise * Math.min(entered, 100)) / 100)
      : Math.round(entered * 100),
  );

  const netPaise = subtotalPaise - discountPaise;

  if (input.gstRateBps <= 0) {
    return {
      subtotalPaise,
      discountPaise,
      netPaise,
      gstPaise: 0,
      totalPaise: netPaise,
      nights,
      weekendNights,
    };
  }

  // Inclusive means the room rates already contain the tax, so it is worked
  // back out of the net rather than added on top.
  const gstPaise = input.gstInclusive
    ? netPaise - Math.round((netPaise * 10_000) / (10_000 + input.gstRateBps))
    : Math.round((netPaise * input.gstRateBps) / 10_000);

  return {
    subtotalPaise,
    discountPaise,
    netPaise: input.gstInclusive ? netPaise - gstPaise : netPaise,
    gstPaise,
    totalPaise: input.gstInclusive ? netPaise : netPaise + gstPaise,
    nights,
    weekendNights,
  };
}
