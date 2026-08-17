/**
 * Structured mock data for the Owner HQ Dashboard.
 *
 * No bookings/payments/channel-sync tables exist in the schema yet, so
 * revenue, occupancy, commission, check-ins, and channel-sync activity are
 * generated here. Property identity (id/name) is threaded through from real
 * data wherever it's available — callers pass the live property list in and
 * this module falls back to realistic placeholder properties only when the
 * org has none yet, so a fresh account still renders a populated dashboard.
 */

export type MockProperty = {
  id: string;
  name: string;
};

const FALLBACK_PROPERTIES: MockProperty[] = [
  { id: "fallback-1", name: "Sunrise Villa - Goa" },
  { id: "fallback-2", name: "Deluxe Suite - Coorg" },
  { id: "fallback-3", name: "Lakeview Cottage - Munnar" },
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

export function resolveDashboardProperties(
  properties: MockProperty[] | undefined,
): MockProperty[] {
  if (properties && properties.length > 0) {
    return properties.slice(0, 4);
  }
  return FALLBACK_PROPERTIES;
}

export type TimeScale = "daily" | "weekly" | "monthly";
export type RevenueMetric = "revenue" | "nights";

export type RevenueBucket = {
  label: string;
  /** propertyId -> value (₹ revenue in paise/rupees display units, or nights booked) */
  values: Record<string, number>;
};

export type RevenueSeries = Record<TimeScale, RevenueBucket[]>;

const DAILY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKLY_LABELS = ["Week 1", "Week 2", "Week 3", "Week 4"];
const MONTHLY_LABELS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];

function buildBuckets(
  labels: string[],
  propertyIds: string[],
  seedPrefix: string,
  base: number,
  metric: RevenueMetric,
): RevenueBucket[] {
  return labels.map((label, i) => {
    const values: Record<string, number> = {};
    for (const [pIdx, id] of propertyIds.entries()) {
      const rand = seededRandom(`${seedPrefix}-${id}-${i}-${metric}`);
      const weight = 1 - pIdx * 0.18; // earlier properties trend larger
      const raw = base * weight * (0.6 + rand() * 0.8);
      values[id] =
        metric === "nights" ? Math.round(raw / 900) : Math.round(raw);
    }
    return { label, values };
  });
}

export function buildRevenueSeries(
  properties: MockProperty[],
  metric: RevenueMetric,
): RevenueSeries {
  const ids = properties.map((p) => p.id);
  const base = metric === "revenue" ? 42_000 : 6;
  return {
    daily: buildBuckets(DAILY_LABELS, ids, "daily", base, metric),
    weekly: buildBuckets(WEEKLY_LABELS, ids, "weekly", base * 7, metric),
    monthly: buildBuckets(MONTHLY_LABELS, ids, "monthly", base * 30, metric),
  };
}

export type PropertyShare = {
  propertyId: string;
  name: string;
  revenue: number;
  occupancy: number;
};

export function buildPropertyShares(
  properties: MockProperty[],
): PropertyShare[] {
  return properties.map((p, i) => {
    const rand = seededRandom(`share-${p.id}`);
    const weight = 1 - i * 0.16;
    return {
      propertyId: p.id,
      name: p.name,
      revenue: Math.round(320_000 * weight * (0.7 + rand() * 0.6)),
      occupancy: Math.round((55 + rand() * 35) * weight),
    };
  });
}

export type PortfolioMetrics = {
  totalRevenue: number;
  totalRevenuePrevDelta: number;
  avgOccupancy: number;
  avgOccupancyPrevDelta: number;
  commissionSaved: number;
  commissionSavedPrevDelta: number;
  todayCheckIns: number;
  todayCheckOuts: number;
};

export function buildPortfolioMetrics(
  properties: MockProperty[],
): PortfolioMetrics {
  const shares = buildPropertyShares(properties);
  const totalRevenue = shares.reduce((sum, s) => sum + s.revenue, 0);
  const avgOccupancy =
    shares.reduce((sum, s) => sum + s.occupancy, 0) /
    Math.max(shares.length, 1);
  const directBookingRevenue = Math.round(totalRevenue * 0.42);
  const commissionSaved = Math.round(directBookingRevenue * 0.15);

  return {
    totalRevenue,
    totalRevenuePrevDelta: 8.4,
    avgOccupancy: Math.round(avgOccupancy * 10) / 10,
    avgOccupancyPrevDelta: -2.1,
    commissionSaved,
    commissionSavedPrevDelta: 12.7,
    todayCheckIns: Math.min(12, 3 + properties.length * 3),
    todayCheckOuts: Math.min(8, 2 + properties.length * 2),
  };
}

export type BookingSource = "direct" | "airbnb" | "booking_com";
export type PaymentStatus = "paid" | "partial" | "unpaid";

export type CheckinRow = {
  id: string;
  guestName: string;
  propertyId: string;
  propertyName: string;
  roomType: string;
  time: string;
  source: BookingSource;
  paymentStatus: PaymentStatus;
  isToday: boolean;
};

export type CheckoutRow = {
  id: string;
  guestName: string;
  propertyId: string;
  propertyName: string;
  roomType: string;
  time: string;
  keysReturned: boolean;
  reviewRequested: boolean;
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
];

const ROOM_TYPES = [
  "Deluxe Suite",
  "Garden Villa",
  "Poolside Room",
  "Standard Room",
];

export function buildArrivals(properties: MockProperty[]): CheckinRow[] {
  const rand = seededRandom("arrivals");
  const count = Math.max(4, properties.length * 2);
  return Array.from({ length: count }, (_, i) => {
    const property = properties[i % properties.length];
    const sources: BookingSource[] = ["direct", "airbnb", "booking_com"];
    const statuses: PaymentStatus[] = ["paid", "partial", "unpaid"];
    return {
      id: `arrival-${i}`,
      guestName: GUEST_NAMES[i % GUEST_NAMES.length],
      propertyId: property.id,
      propertyName: property.name,
      roomType: ROOM_TYPES[i % ROOM_TYPES.length],
      time: `${(10 + i) % 24}:${i % 2 === 0 ? "00" : "30"}`,
      source: sources[Math.floor(rand() * sources.length)],
      paymentStatus: statuses[Math.floor(rand() * statuses.length)],
      isToday: i < Math.ceil(count / 2),
    };
  });
}

export function buildDepartures(properties: MockProperty[]): CheckoutRow[] {
  const count = Math.max(3, properties.length + 1);
  return Array.from({ length: count }, (_, i) => {
    const property = properties[(i + 1) % properties.length];
    return {
      id: `departure-${i}`,
      guestName: GUEST_NAMES[(i + 3) % GUEST_NAMES.length],
      propertyId: property.id,
      propertyName: property.name,
      roomType: ROOM_TYPES[(i + 1) % ROOM_TYPES.length],
      time: `${9 + i}:00`,
      keysReturned: i % 3 !== 0,
      reviewRequested: i % 2 === 0,
    };
  });
}

export type CheckoutHold = {
  id: string;
  guestName: string;
  propertyName: string;
  roomType: string;
  minutesRemaining: number;
};

export function buildCheckoutHolds(properties: MockProperty[]): CheckoutHold[] {
  return properties.slice(0, 2).map((p, i) => ({
    id: `hold-${p.id}`,
    guestName: GUEST_NAMES[(i + 5) % GUEST_NAMES.length],
    propertyName: p.name,
    roomType: ROOM_TYPES[(i + 2) % ROOM_TYPES.length],
    minutesRemaining: 8 - i * 3,
  }));
}

export type ChannelHeartbeat = {
  channel: "Airbnb" | "Booking.com";
  lastSyncMinutesAgo: number;
  conflicts: number;
  status: "active" | "delayed";
};

export function buildChannelHeartbeats(): ChannelHeartbeat[] {
  return [
    {
      channel: "Airbnb",
      lastSyncMinutesAgo: 2,
      conflicts: 0,
      status: "active",
    },
    {
      channel: "Booking.com",
      lastSyncMinutesAgo: 4,
      conflicts: 1,
      status: "delayed",
    },
  ];
}

export type ConflictAlert = {
  id: string;
  propertyName: string;
  roomType: string;
  channel: "Airbnb" | "Booking.com";
  description: string;
};

export function buildConflictAlerts(
  properties: MockProperty[],
): ConflictAlert[] {
  const property = properties[0] ?? FALLBACK_PROPERTIES[0];
  return [
    {
      id: "conflict-1",
      propertyName: property.name,
      roomType: "Deluxe Suite",
      channel: "Booking.com",
      description:
        "Overlapping reservation detected for the same date range — resolve before either guest arrives.",
    },
  ];
}
