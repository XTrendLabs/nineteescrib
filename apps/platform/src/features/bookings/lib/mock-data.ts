/**
 * Structured mock data for the Bookings page.
 *
 * No bookings table exists in the schema yet, so the row-level data below is
 * generated deterministically (seeded-hash, no Math.random) following the
 * same pattern as calendar/lib/mock-data.ts and hq-dashboard/lib/mock-data.ts.
 */

import { addDays } from "date-fns";

export type BookingStatus =
  | "confirmed"
  | "checked_in"
  | "pending"
  | "checked_out"
  | "cancelled";

export type BookingSource = "direct" | "manual" | "airbnb" | "booking_com";

export type Booking = {
  id: string;
  ref: string;
  guestName: string;
  guestPhone: string;
  propertyId: string;
  propertyName: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
  status: BookingStatus;
  source: BookingSource;
  totalPaise: number;
  paidPaise: number;
};

export type MockProperty = { id: string; name: string };

const FALLBACK_PROPERTIES: MockProperty[] = [
  { id: "fallback-1", name: "Sunrise Villa - Goa" },
  { id: "fallback-2", name: "Deluxe Suite - Coorg" },
  { id: "fallback-3", name: "Backwater Retreat - Alleppey" },
];

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  let state = h || 1;
  return () => {
    state = (state * 1_103_515_245 + 12_345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

export function resolveBookingsProperties(
  properties: MockProperty[] | undefined,
): MockProperty[] {
  if (properties && properties.length > 0) {
    return properties.slice(0, 6);
  }
  return FALLBACK_PROPERTIES;
}

const GUEST_NAMES = [
  "Aarav Mehta",
  "Priya Nair",
  "Rohan Kapoor",
  "Meera Iyer",
  "Kabir Singh",
  "Ananya Rao",
  "Vikram Desai",
  "Sana Sheikh",
  "Farhan Ali",
  "Ishita Verma",
  "Neha Joshi",
  "Arjun Reddy",
];

const ROOM_TYPES = [
  "Standard Room",
  "Deluxe Suite",
  "Garden Villa",
  "Sea View Room",
];
const SOURCES: BookingSource[] = ["direct", "manual", "airbnb", "booking_com"];
const STATUSES: BookingStatus[] = [
  "confirmed",
  "checked_in",
  "pending",
  "checked_out",
  "cancelled",
];

export function buildBookings(
  properties: MockProperty[],
  count = 42,
): Booking[] {
  const rand = seededRandom(
    `bookings-${properties.map((p) => p.id).join(",")}`,
  );
  const bookings: Booking[] = [];

  for (let i = 0; i < count; i++) {
    const property = properties[Math.floor(rand() * properties.length)];
    const guestName = GUEST_NAMES[Math.floor(rand() * GUEST_NAMES.length)];
    const roomType = ROOM_TYPES[Math.floor(rand() * ROOM_TYPES.length)];
    const source = SOURCES[Math.floor(rand() * SOURCES.length)];
    const status = STATUSES[Math.floor(rand() * STATUSES.length)];
    const nights = 1 + Math.floor(rand() * 6);
    const dayOffset = Math.floor(rand() * 40) - 15;
    const checkIn = addDays(new Date(), dayOffset);
    const checkOut = addDays(checkIn, nights);
    const totalPaise = Math.round((3500 + rand() * 6500) * nights * 100);
    const paidRatio =
      status === "cancelled"
        ? 0
        : status === "pending"
          ? rand() * 0.3
          : rand() > 0.4
            ? 1
            : rand();
    const paidPaise = Math.round(totalPaise * paidRatio);
    const refNumber = 10_000 + Math.floor(rand() * 89_999);

    bookings.push({
      id: `booking-${i}`,
      ref: `POS-${refNumber}`,
      guestName,
      guestPhone: `+9198${String(10_000_000 + Math.floor(rand() * 89_999_999)).slice(0, 8)}`,
      propertyId: property.id,
      propertyName: property.name,
      roomType,
      checkIn,
      checkOut,
      status,
      source,
      totalPaise,
      paidPaise,
    });
  }

  return bookings.sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime());
}

export type BookingsSummary = {
  activeStays: number;
  unpaidCount: number;
  pendingHolds: number;
  cancellationRate: number;
};

export function buildBookingsSummary(bookings: Booking[]): BookingsSummary {
  const activeStays = bookings.filter((b) => b.status === "checked_in").length;
  const unpaidCount = bookings.filter(
    (b) => b.status !== "cancelled" && b.paidPaise < b.totalPaise,
  ).length;
  const pendingHolds = bookings.filter((b) => b.status === "pending").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;
  const cancellationRate =
    bookings.length > 0 ? (cancelled / bookings.length) * 100 : 0;

  return { activeStays, unpaidCount, pendingHolds, cancellationRate };
}

export type AuditEvent = {
  time: Date;
  label: string;
};

export function buildAuditTrail(booking: Booking): AuditEvent[] {
  const events: AuditEvent[] = [
    {
      time: addDays(booking.checkIn, -3),
      label: "Guest initiated payment hold via booking link.",
    },
    {
      time: addDays(booking.checkIn, -3),
      label:
        "Webhook received: payment captured. Booking status shifted to confirmed.",
    },
    {
      time: addDays(booking.checkIn, -3),
      label: "Notification sent: confirmation email dispatched.",
    },
  ];

  if (booking.status === "checked_in" || booking.status === "checked_out") {
    events.push({
      time: booking.checkIn,
      label: "Check-in updated by front desk. Status shifted to checked in.",
    });
  }
  if (booking.status === "checked_out") {
    events.push({
      time: booking.checkOut,
      label: "Check-out completed. Status shifted to checked out.",
    });
  }
  if (booking.status === "cancelled") {
    events.push({
      time: addDays(booking.checkIn, -1),
      label: "Booking cancelled by host.",
    });
  }

  return events;
}
