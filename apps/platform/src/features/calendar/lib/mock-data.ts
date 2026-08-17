/**
 * Structured mock data for the Multi-Property Master Calendar.
 *
 * No bookings/availability-rules tables exist in the schema yet (per
 * docs/calendar_design.md — this page is a pure UI shell), so the unit
 * inventory and reservation timeline are generated here. Property identity
 * (id/name) is threaded through from real data wherever it's available —
 * callers pass the live property list in and this module falls back to
 * realistic placeholder properties + room types only when the org has none
 * yet, so a fresh account still renders a populated calendar.
 *
 * Determinism follows hq-dashboard/lib/mock-data.ts's seeded-hash approach —
 * no Math.random anywhere, so re-renders (and the drag/drop interactions
 * that mutate local state) never cause bookings to jump around.
 */

import { addDays, differenceInCalendarDays, format } from "date-fns";

export type MockProperty = {
  id: string;
  name: string;
};

const FALLBACK_PROPERTIES: MockProperty[] = [
  { id: "fallback-1", name: "Sunrise Villa - Goa" },
  { id: "fallback-2", name: "Deluxe Suite - Coorg" },
];

/** Deterministic pseudo-random in [0, 1) seeded by a string, so mock data is stable across renders. */
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

export function resolveCalendarProperties(
  properties: MockProperty[] | undefined,
): MockProperty[] {
  if (properties && properties.length > 0) {
    return properties.slice(0, 4);
  }
  return FALLBACK_PROPERTIES;
}

const ROOM_TYPE_POOL = ["Standard Room", "Deluxe Suite", "Garden Villa"];

export type Unit = {
  id: string;
  label: string;
  roomType: string;
};

export type RoomTypeGroup = {
  roomType: string;
  units: Unit[];
};

export type PropertyInventory = {
  propertyId: string;
  propertyName: string;
  roomTypes: RoomTypeGroup[];
};

/** Builds a small deterministic inventory tree (Property > Room Type > Units) per property. */
export function buildInventory(
  properties: MockProperty[],
): PropertyInventory[] {
  return properties.map((property) => {
    const rand = seededRandom(`inventory-${property.id}`);
    const roomTypeCount = 1 + Math.floor(rand() * 2); // 1-2 room types per property
    const roomTypes: RoomTypeGroup[] = Array.from(
      { length: roomTypeCount },
      (_, rtIdx) => {
        const roomType = ROOM_TYPE_POOL[rtIdx % ROOM_TYPE_POOL.length];
        const unitCount = 2 + Math.floor(rand() * 2); // 2-3 units per room type
        const baseNumber = 101 + rtIdx * 100;
        const units: Unit[] = Array.from({ length: unitCount }, (_, uIdx) => ({
          id: `${property.id}-rt${rtIdx}-u${uIdx}`,
          label: `Unit ${baseNumber + uIdx}`,
          roomType,
        }));
        return { roomType, units };
      },
    );
    return {
      propertyId: property.id,
      propertyName: property.name,
      roomTypes,
    };
  });
}

export type BookingSource = "direct" | "airbnb" | "booking_com";
export type PaymentStatus = "paid" | "partial" | "unpaid";
export type BookingKind = "reservation" | "checkout_hold" | "blocked";
export type BlockReason = "maintenance" | "owner_stay";

export type Booking = {
  id: string;
  unitId: string;
  kind: BookingKind;
  guestName: string;
  bookingRef: string;
  source: BookingSource;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  tariffPaise: number;
  paymentStatus: PaymentStatus;
  checkedIn: boolean;
  blockReason?: BlockReason;
  holdMinutesRemaining?: number;
};

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
];

const SOURCES: BookingSource[] = ["direct", "airbnb", "booking_com"];
const PAYMENT_STATUSES: PaymentStatus[] = ["paid", "partial", "unpaid"];

/** Generates a deterministic set of bookings across a unit's timeline, anchored on the visible month. */
export function buildBookingsForUnits(
  units: Unit[],
  monthAnchor: Date,
): Booking[] {
  const bookings: Booking[] = [];
  const monthStart = new Date(
    monthAnchor.getFullYear(),
    monthAnchor.getMonth(),
    1,
  );

  for (const [uIdx, unit] of units.entries()) {
    const rand = seededRandom(
      `bookings-${unit.id}-${format(monthStart, "yyyy-MM")}`,
    );
    const bookingCount = 2 + Math.floor(rand() * 3); // 2-4 bookings per unit per month
    let cursor = 1 + Math.floor(rand() * 4);

    for (let b = 0; b < bookingCount; b++) {
      const nights = 1 + Math.floor(rand() * 5);
      const checkIn = addDays(monthStart, cursor);
      const checkOut = addDays(checkIn, nights);
      const roll = rand();

      let kind: BookingKind = "reservation";
      let blockReason: BlockReason | undefined;
      let holdMinutesRemaining: number | undefined;

      if (roll < 0.12) {
        kind = "blocked";
        blockReason = rand() > 0.5 ? "maintenance" : "owner_stay";
      } else if (roll < 0.2) {
        kind = "checkout_hold";
        holdMinutesRemaining = 3 + Math.floor(rand() * 10);
      }

      const source = SOURCES[Math.floor(rand() * SOURCES.length)];
      const guestName = GUEST_NAMES[(uIdx * 3 + b) % GUEST_NAMES.length];
      const refNumber = 10_000 + Math.floor(rand() * 89_999);

      bookings.push({
        id: `${unit.id}-b${b}`,
        unitId: unit.id,
        kind,
        guestName,
        bookingRef: `POS-${refNumber}`,
        source,
        checkIn,
        checkOut,
        guests: 1 + Math.floor(rand() * 4),
        tariffPaise: Math.round((3500 + rand() * 6500) * nights * 100),
        paymentStatus:
          PAYMENT_STATUSES[Math.floor(rand() * PAYMENT_STATUSES.length)],
        checkedIn: rand() > 0.5,
        blockReason,
        holdMinutesRemaining,
      });

      cursor += nights + 1 + Math.floor(rand() * 3);
      if (cursor > 27) {
        break;
      }
    }
  }

  return bookings;
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  return differenceInCalendarDays(checkOut, checkIn);
}

export function hasConflict(
  bookings: Booking[],
  unitId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string,
): boolean {
  return bookings.some((b) => {
    if (b.unitId !== unitId || b.id === excludeBookingId) {
      return false;
    }
    return b.checkIn < checkOut && b.checkOut > checkIn;
  });
}
