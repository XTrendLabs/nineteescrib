/**
 * Adapts the booking API's shapes into what the timeline components draw.
 *
 * The calendar was built against a mock that modelled a room as a "unit" and
 * carried its own booking shape. Rather than rewrite every component, this
 * maps the real data onto those shapes in one place -- the translation is a
 * handful of field renames plus two derivations the API leaves to the client.
 */

import type { Booking as ApiBooking } from "@/features/bookings/lib/booking";
import { parseDay } from "@/features/bookings/lib/format";

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

export type BookingSource = "direct" | "manual" | "airbnb" | "booking_com";
export type PaymentStatus = "paid" | "partial" | "unpaid";
export type BookingKind = "reservation" | "checkout_hold" | "blocked";
export type BlockReason = "maintenance" | "owner_stay";

export type CalendarBooking = {
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
  /** The guest has left; the room is free again from their departure. */
  checkedOut: boolean;
  blockReason?: BlockReason;
  holdMinutesRemaining?: number;
};

/**
 * A room, or a property that has none published -- the endpoint left-joins
 * rooms onto properties, so the room fields are null in the latter case.
 */
type InventoryRow = {
  id: string | null;
  name: string | null;
  roomNumber: string | null;
  roomType: string | null;
  propertyId: string;
  propertyName: string;
};

/** Groups the flat room list into the property > room type > unit tree. */
export function buildInventory(rows: InventoryRow[]): PropertyInventory[] {
  const byProperty = new Map<string, PropertyInventory>();

  for (const row of rows) {
    let property = byProperty.get(row.propertyId);
    if (!property) {
      property = {
        propertyId: row.propertyId,
        propertyName: row.propertyName,
        roomTypes: [],
      };
      byProperty.set(row.propertyId, property);
    }

    // A property with no published rooms still gets its entry above, but
    // contributes no room type or unit.
    if (!row.id || !row.roomType) continue;

    let group = property.roomTypes.find((g) => g.roomType === row.roomType);
    if (!group) {
      group = { roomType: row.roomType, units: [] };
      property.roomTypes.push(group);
    }

    group.units.push({
      id: row.id,
      // The room number is the label front desk actually uses, where it is set.
      label: row.roomNumber
        ? `${row.name} · ${row.roomNumber}`
        : (row.name ?? ""),
      roomType: row.roomType,
    });
  }

  return [...byProperty.values()];
}

/** Minutes left on a hold, or undefined once it has lapsed. */
function holdMinutesRemaining(expiresAt: string | null): number | undefined {
  if (!expiresAt) return undefined;
  const minutes = Math.round(
    (new Date(expiresAt).getTime() - Date.now()) / 60_000,
  );
  return minutes > 0 ? minutes : undefined;
}

/**
 * Maps an API booking onto the timeline's shape.
 *
 * Dates become `Date`s here because the timeline positions blocks by comparing
 * them; they stay "YYYY-MM-DD" everywhere else. The actual dates win where
 * known, so a stay that ended early draws as short as it really was.
 */
export function toCalendarBooking(booking: ApiBooking): CalendarBooking {
  const kind: BookingKind =
    booking.kind === "block"
      ? "blocked"
      : booking.kind === "hold"
        ? "checkout_hold"
        : "reservation";

  return {
    id: booking.id,
    unitId: booking.roomId,
    kind,
    guestName:
      booking.kind === "block"
        ? (booking.blockReason?.replace("_", " ") ?? "Blocked")
        : (booking.guestName ?? "Guest"),
    bookingRef: booking.ref,
    source: booking.source,
    checkIn: parseDay(booking.actualCheckIn ?? booking.checkIn),
    checkOut: parseDay(booking.actualCheckOut ?? booking.checkOut),
    guests: booking.guestCount,
    tariffPaise: booking.totalAmountPaise,
    paymentStatus: booking.paymentStatus,
    checkedIn: booking.status === "checked_in",
    checkedOut: booking.status === "checked_out",
    blockReason: (booking.blockReason as BlockReason | null) ?? undefined,
    holdMinutesRemaining: holdMinutesRemaining(booking.holdExpiresAt),
  };
}

/**
 * The stored room type as a person would write it.
 *
 * The column holds the enum value ("entire_property", "double"), which is fine
 * as a key and wrong as a heading -- the calendar groups rooms under this, so
 * it is read as a label.
 */
export function roomTypeLabel(roomType: string): string {
  const known: Record<string, string> = {
    single: "Single",
    double: "Double",
    twin: "Twin",
    deluxe: "Deluxe",
    suite: "Suite",
    dormitory: "Dormitory",
    entire_property: "Entire Property",
    other: "Other",
  };

  return (
    known[roomType] ??
    roomType
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.max(
    1,
    Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000),
  );
}

/** Whether a stay would clash with one already on this unit. */
export function hasConflict(
  bookings: CalendarBooking[],
  unitId: string,
  checkIn: Date,
  checkOut: Date,
  ignoreBookingId?: string,
): boolean {
  return bookings.some(
    (b) =>
      b.unitId === unitId &&
      b.id !== ignoreBookingId &&
      b.checkIn < checkOut &&
      b.checkOut > checkIn,
  );
}
