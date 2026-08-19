/**
 * Mock data layer for the public Guest Booking Engine.
 *
 * The public engine has no authenticated session, so it cannot call
 * useProperties(). It resolves properties from the same deterministic
 * fallback list used by the Properties feature and reuses
 * buildPropertyDetail() to generate matching room types, rates, gallery,
 * amenities, and policies — keeping /book pages in sync with what a host
 * would configure in /properties.
 */

import {
  buildPropertyDetail,
  type PropertyDetail,
  type RoomType,
  resolveProperties,
} from "@/features/properties/lib/mock-data";

export function findPropertyBySlugPath(
  slugPath: string,
): PropertyDetail | undefined {
  const properties = resolveProperties(undefined);
  return properties
    .map((p) => buildPropertyDetail(p))
    .find((detail) => detail.bookingLink.slug === slugPath);
}

export function findPropertyBySlug(
  tenantSlug: string,
  propertySlug: string,
): PropertyDetail | undefined {
  return findPropertyBySlugPath(`${tenantSlug}/${propertySlug}`);
}

export type Coupon = {
  code: string;
  label: string;
  discountPercent: number;
};

export const COUPON_CATALOG: Coupon[] = [
  { code: "DIRECT10", label: "10% off direct booking", discountPercent: 10 },
  { code: "WELCOME15", label: "15% off first stay", discountPercent: 15 },
];

export function resolveCoupon(code: string): Coupon | null {
  const normalized = code.trim().toUpperCase();
  return COUPON_CATALOG.find((c) => c.code === normalized) ?? null;
}

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

/** Deterministically blocked/sold-out nights for a room type, for the date picker. */
export function buildBlockedNights(
  roomType: RoomType,
  monthsAhead = 3,
): Set<string> {
  const rand = seededRandom(`blocked-${roomType.id}`);
  const blocked = new Set<string>();
  const today = new Date();
  const totalDays = monthsAhead * 30;
  for (let i = 0; i < totalDays; i++) {
    if (rand() < 0.18) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      blocked.add(d.toISOString().slice(0, 10));
    }
  }
  return blocked;
}

export type NightlyRate = {
  date: string;
  ratePaise: number;
  isWeekend: boolean;
};

export function buildNightlyRates(
  roomType: RoomType,
  checkIn: Date,
  checkOut: Date,
): NightlyRate[] {
  const rates: NightlyRate[] = [];
  const cursor = new Date(checkIn);
  while (cursor < checkOut) {
    const day = cursor.getDay();
    const isWeekend = day === 0 || day === 5 || day === 6;
    rates.push({
      date: cursor.toISOString().slice(0, 10),
      ratePaise: isWeekend ? roomType.weekendRatePaise : roomType.baseRatePaise,
      isWeekend,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return rates;
}

export type PricingBreakdown = {
  nights: number;
  roomRatePaise: number;
  extraGuestPaise: number;
  couponDiscountPaise: number;
  subtotalPaise: number;
  taxPaise: number;
  securityDepositPaise: number;
  totalPaise: number;
};

export function calculatePricing({
  roomType,
  property,
  checkIn,
  checkOut,
  guests,
  coupon,
}: {
  roomType: RoomType;
  property: PropertyDetail;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  coupon: Coupon | null;
}): PricingBreakdown {
  const nightlyRates = buildNightlyRates(roomType, checkIn, checkOut);
  const nights = nightlyRates.length;
  const roomRatePaise = nightlyRates.reduce((sum, n) => sum + n.ratePaise, 0);
  const extraGuests = Math.max(0, guests - roomType.maxGuests);
  const extraGuestPaise = extraGuests * roomType.extraGuestPaise * nights;
  const grossPaise = roomRatePaise + extraGuestPaise;
  const couponDiscountPaise = coupon
    ? Math.round((grossPaise * coupon.discountPercent) / 100)
    : 0;
  const subtotalPaise = grossPaise - couponDiscountPaise;
  const taxPaise =
    property.billing.taxType === "exclusive"
      ? Math.round((subtotalPaise * property.billing.taxRateBps) / 10_000)
      : 0;
  const securityDepositPaise = property.policies.securityDepositPaise;
  const totalPaise = subtotalPaise + taxPaise + securityDepositPaise;

  return {
    nights,
    roomRatePaise,
    extraGuestPaise,
    couponDiscountPaise,
    subtotalPaise,
    taxPaise,
    securityDepositPaise,
    totalPaise,
  };
}

export const HOLD_DURATION_SECONDS = 10 * 60;

export const ARRIVAL_TIME_OPTIONS = [
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
  "After 6:00 PM",
];

export type QuoteOffer = {
  token: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  discountPercent: number;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  propertySlugPath: string;
  roomTypeId: string;
};

export function resolveQuoteOffer(token: string): QuoteOffer | undefined {
  if (token !== "sec_abc123xyz") return undefined;
  const properties = resolveProperties(undefined).map((p) =>
    buildPropertyDetail(p),
  );
  const property = properties[0];
  const roomType = property?.roomTypes[0];
  if (!property || !roomType) return undefined;

  const today = new Date();
  const checkIn = new Date(today);
  checkIn.setDate(checkIn.getDate() + 14);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3);

  return {
    token,
    guestName: "Arjun Sen",
    guestPhone: "+91 98765 43210",
    guestEmail: "arjun@email.com",
    discountPercent: 20,
    checkIn,
    checkOut,
    guests: 2,
    propertySlugPath: property.bookingLink.slug,
    roomTypeId: roomType.id,
  };
}

export function generateReservationReference(): string {
  return `POS-${10_000 + Math.floor(Math.random() * 9000)}`;
}
