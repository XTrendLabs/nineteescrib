/**
 * Structured mock data for the Properties management page.
 *
 * Most of the detail (room types, units, seasonal pricing, amenities,
 * gallery, policies, booking links, taxes) has no backing schema yet, so it
 * is generated deterministically (seeded-hash, no Math.random) and layered
 * on top of the real property list returned by useProperties(), following
 * the same pattern as bookings/lib/mock-data.ts and guests/lib/mock-data.ts.
 */

import { addDays } from "date-fns";

export type PropertyType =
  | "hotel"
  | "villa"
  | "apartment"
  | "homestay"
  | "hostel";

export type PropertyStatus = "active" | "inactive" | "maintenance";

export type MockProperty = {
  id: string;
  name: string;
  propertyType: string;
  city: string;
  status: string;
};

const FALLBACK_PROPERTIES: MockProperty[] = [
  {
    id: "fallback-1",
    name: "Sunrise Villa - Goa",
    propertyType: "villa",
    city: "Anjuna, Goa",
    status: "active",
  },
  {
    id: "fallback-2",
    name: "Hilltop Retreat - Coorg",
    propertyType: "hotel",
    city: "Madikeri, Coorg",
    status: "active",
  },
  {
    id: "fallback-3",
    name: "City Nest - Bengaluru",
    propertyType: "apartment",
    city: "Bengaluru",
    status: "inactive",
  },
];

export function resolveProperties(
  properties: MockProperty[] | undefined,
): MockProperty[] {
  if (properties && properties.length > 0) {
    return properties;
  }
  return FALLBACK_PROPERTIES;
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

function normalizePropertyType(value: string): PropertyType {
  const v = value.toLowerCase();
  if (v === "hotel" || v === "villa" || v === "apartment" || v === "hostel") {
    return v;
  }
  if (v === "homestay") return "homestay";
  return "villa";
}

function normalizeStatus(value: string): PropertyStatus {
  const v = value.toLowerCase();
  if (v === "active" || v === "inactive" || v === "maintenance") return v;
  return "active";
}

export type UnitOccupancy = {
  guestName: string;
  checkIn: Date;
  checkOut: Date;
};

export type Unit = {
  id: string;
  name: string;
  floorGroup: string | null;
  status: "active" | "maintenance" | "inactive";
  occupancy: UnitOccupancy | null;
};

export type RoomType = {
  id: string;
  name: string;
  baseRatePaise: number;
  weekendRatePaise: number;
  maxGuests: number;
  minStayNights: number;
  extraGuestPaise: number;
  quantity: number;
  status: "active" | "inactive";
  units: Unit[];
};

export type RateOverride = {
  id: string;
  label: string;
  emoji: string;
  startDate: Date;
  endDate: Date;
  minStayOverride: number | null;
  prices: {
    roomTypeId: string;
    roomTypeName: string;
    customPricePaise: number;
  }[];
};

export type AmenityCategory =
  | "essentials"
  | "kitchen"
  | "outdoor"
  | "safety"
  | "parking"
  | "views";

export type Amenity = {
  key: string;
  label: string;
  category: AmenityCategory;
  enabled: boolean;
  custom?: boolean;
};

export type GalleryImage = {
  id: string;
  label: string;
  colorIndex: number;
  isCover: boolean;
};

export type RoomTypeGallery = {
  roomTypeId: string;
  roomTypeName: string;
  images: GalleryImage[];
};

export type Policies = {
  checkinTime: string;
  checkoutTime: string;
  cancellationPolicy: "free" | "moderate" | "strict" | "non_refundable";
  cancellationHours: number;
  refundPercentage: number;
  houseRules: string;
  petPolicy: "allowed" | "not_allowed" | "on_request";
  smokingPolicy: "allowed" | "not_allowed" | "designated";
  eventPolicy: "allowed" | "not_allowed" | "on_request";
  idRequired: boolean;
  securityDepositPaise: number;
};

export type BookingLinkConfig = {
  slug: string;
  isLive: boolean;
  accentColor: string;
  welcomeText: string;
};

export type Billing = {
  taxRateBps: number;
  taxType: "exclusive" | "inclusive";
  taxLabel: string;
  gstin: string;
  razorpayConnected: boolean;
  stripeConnected: boolean;
  businessName: string;
  businessAddress: string;
  invoicePrefix: string;
  invoiceAuto: boolean;
};

export type SetupChecklist = {
  detailsAdded: boolean;
  roomTypesConfigured: boolean;
  photosUploaded: boolean;
  paymentGatewayConnected: boolean;
  bookingLinkShared: boolean;
};

export type LiveMetrics = {
  totalUnits: number;
  currentOccupancyPercent: number;
  thisMonthRevenuePaise: number;
  directBookingSharePercent: number;
};

export type PropertyDetail = {
  id: string;
  name: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  city: string;
  addressLine1: string;
  state: string;
  country: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  slug: string;
  description: string;
  roomTypes: RoomType[];
  rateOverrides: RateOverride[];
  amenities: Amenity[];
  propertyGallery: GalleryImage[];
  roomTypeGalleries: RoomTypeGallery[];
  policies: Policies;
  bookingLink: BookingLinkConfig;
  billing: Billing;
  checklist: SetupChecklist;
  metrics: LiveMetrics;
};

const ROOM_TYPE_NAME_POOL = [
  "Standard Room",
  "Deluxe Suite",
  "Garden Villa",
  "Sea View Room",
  "Entire Property",
  "Dormitory Bed",
  "Premium Cottage",
];

const FLOOR_GROUPS = [
  "Ground Floor",
  "First Floor",
  "Second Floor",
  "Pool Wing",
];

const GUEST_NAMES = [
  "John D.",
  "Sarah K.",
  "Aarav Mehta",
  "Priya Nair",
  "Rohan Kapoor",
  "Meera Iyer",
];

const OVERRIDE_LABELS: { label: string; emoji: string }[] = [
  { label: "Christmas Peak", emoji: "🎄" },
  { label: "Monsoon Low", emoji: "🌧️" },
  { label: "Summer Peak", emoji: "☀️" },
  { label: "New Year Special", emoji: "🎆" },
];

const AMENITY_CATALOG: {
  key: string;
  label: string;
  category: AmenityCategory;
}[] = [
  { key: "wifi", label: "WiFi", category: "essentials" },
  { key: "ac", label: "Air Conditioning", category: "essentials" },
  { key: "hot_water", label: "Hot Water", category: "essentials" },
  { key: "power_backup", label: "Power Backup", category: "essentials" },
  { key: "elevator", label: "Elevator", category: "essentials" },
  { key: "kitchen", label: "Kitchen Access", category: "kitchen" },
  { key: "fridge", label: "Refrigerator", category: "kitchen" },
  { key: "washing_machine", label: "Washing Machine", category: "kitchen" },
  { key: "dishwasher", label: "Dishwasher", category: "kitchen" },
  { key: "dining_area", label: "Dining Area", category: "kitchen" },
  { key: "pool", label: "Swimming Pool", category: "outdoor" },
  { key: "garden", label: "Garden / Lawn", category: "outdoor" },
  { key: "bbq", label: "BBQ Grill", category: "outdoor" },
  { key: "gym", label: "Gym / Fitness Center", category: "outdoor" },
  { key: "spa", label: "Spa / Sauna", category: "outdoor" },
  { key: "fire_extinguisher", label: "Fire Extinguisher", category: "safety" },
  { key: "first_aid", label: "First Aid Kit", category: "safety" },
  { key: "cctv", label: "CCTV (Common Areas)", category: "safety" },
  { key: "security_guard", label: "Security Guard (24h)", category: "safety" },
  { key: "safe", label: "Safe / Locker", category: "safety" },
  { key: "free_parking", label: "Free Parking", category: "parking" },
  { key: "paid_parking", label: "Paid Parking", category: "parking" },
  { key: "airport_shuttle", label: "Airport Shuttle", category: "parking" },
  { key: "ev_charging", label: "EV Charging", category: "parking" },
  { key: "mountain_view", label: "Mountain View", category: "views" },
  { key: "beach_access", label: "Beach Access", category: "views" },
  { key: "lake_view", label: "Lake View", category: "views" },
  { key: "city_view", label: "City View", category: "views" },
];

const CUSTOM_AMENITY_POOL = [
  "Private Chef Available",
  "Bonfire Setup",
  "Telescope for Stargazing",
  "Bicycle Rentals",
];

function buildRoomTypes(rand: () => number, propertyId: string): RoomType[] {
  const roomTypeCount = 1 + Math.floor(rand() * 3);
  const roomTypes: RoomType[] = [];

  for (let r = 0; r < roomTypeCount; r++) {
    const name =
      ROOM_TYPE_NAME_POOL[Math.floor(rand() * ROOM_TYPE_NAME_POOL.length)];
    const isEntireProperty = roomTypeCount === 1 && rand() < 0.35;
    const quantity = isEntireProperty ? 1 : 1 + Math.floor(rand() * 7);
    const baseRatePaise = Math.round((2500 + rand() * 15_000) * 100);
    const weekendRatePaise = Math.round(baseRatePaise * (1.15 + rand() * 0.25));
    const maxGuests = 2 + Math.floor(rand() * 6);
    const minStayNights = 1 + Math.floor(rand() * 3);
    const extraGuestPaise = Math.round((500 + rand() * 1500) * 100);
    const useFloorGroups = quantity > 3 && rand() < 0.6;

    const units: Unit[] = [];
    if (quantity > 1) {
      for (let u = 0; u < quantity; u++) {
        const floorGroup = useFloorGroups
          ? FLOOR_GROUPS[Math.floor(u / 3) % FLOOR_GROUPS.length]
          : null;
        const statusRoll = rand();
        const status: Unit["status"] =
          statusRoll < 0.08
            ? "maintenance"
            : statusRoll < 0.12
              ? "inactive"
              : "active";
        const isOccupied = status === "active" && rand() < 0.4;
        const occupancy: UnitOccupancy | null = isOccupied
          ? {
              guestName: GUEST_NAMES[Math.floor(rand() * GUEST_NAMES.length)],
              checkIn: addDays(new Date(), Math.floor(rand() * 6) - 2),
              checkOut: addDays(new Date(), 2 + Math.floor(rand() * 5)),
            }
          : null;

        units.push({
          id: `${propertyId}-rt${r}-unit${u}`,
          name: `${100 * (r + 1) + u + 1}`,
          floorGroup,
          status,
          occupancy,
        });
      }
    }

    roomTypes.push({
      id: `${propertyId}-rt${r}`,
      name: `${name}${roomTypeCount > 1 ? ` ${r + 1}` : ""}`,
      baseRatePaise,
      weekendRatePaise,
      maxGuests,
      minStayNights,
      extraGuestPaise,
      quantity,
      status: rand() < 0.9 ? "active" : "inactive",
      units,
    });
  }

  return roomTypes;
}

function buildRateOverrides(
  rand: () => number,
  propertyId: string,
  roomTypes: RoomType[],
): RateOverride[] {
  const count = 1 + Math.floor(rand() * 2);
  const overrides: RateOverride[] = [];
  let cursor = addDays(new Date(), 30 + Math.floor(rand() * 60));

  for (let i = 0; i < count; i++) {
    const meta = OVERRIDE_LABELS[Math.floor(rand() * OVERRIDE_LABELS.length)];
    const durationDays = 7 + Math.floor(rand() * 30);
    const startDate = cursor;
    const endDate = addDays(startDate, durationDays);
    cursor = addDays(endDate, 20 + Math.floor(rand() * 40));

    overrides.push({
      id: `${propertyId}-override${i}`,
      label: meta.label,
      emoji: meta.emoji,
      startDate,
      endDate,
      minStayOverride: rand() < 0.5 ? 2 + Math.floor(rand() * 3) : null,
      prices: roomTypes.map((rt) => ({
        roomTypeId: rt.id,
        roomTypeName: rt.name,
        customPricePaise: Math.round(
          rt.baseRatePaise *
            (0.6 + rand() * (meta.label.includes("Peak") ? 1.0 : 0.3)),
        ),
      })),
    });
  }

  return overrides;
}

function buildAmenities(rand: () => number): Amenity[] {
  const amenities: Amenity[] = AMENITY_CATALOG.map((a) => ({
    ...a,
    enabled: rand() < 0.55,
  }));

  const customCount = Math.floor(rand() * 3);
  for (let i = 0; i < customCount; i++) {
    const label =
      CUSTOM_AMENITY_POOL[Math.floor(rand() * CUSTOM_AMENITY_POOL.length)];
    amenities.push({
      key: `custom:${label.toLowerCase().replace(/\s+/g, "_")}`,
      label,
      category: "essentials",
      enabled: true,
      custom: true,
    });
  }

  return amenities;
}

function buildGallery(
  rand: () => number,
  propertyId: string,
  roomTypes: RoomType[],
): { propertyGallery: GalleryImage[]; roomTypeGalleries: RoomTypeGallery[] } {
  const propertyCount = 3 + Math.floor(rand() * 6);
  const propertyGallery: GalleryImage[] = Array.from(
    { length: propertyCount },
    (_, i) => ({
      id: `${propertyId}-img${i}`,
      label: `Photo ${i + 1}`,
      colorIndex: Math.floor(rand() * 6),
      isCover: i === 0,
    }),
  );

  const roomTypeGalleries: RoomTypeGallery[] = roomTypes.map((rt, rtIndex) => {
    const count = 2 + Math.floor(rand() * 3);
    return {
      roomTypeId: rt.id,
      roomTypeName: rt.name,
      images: Array.from({ length: count }, (_, i) => ({
        id: `${rt.id}-img${i}`,
        label: `${rt.name} ${i + 1}`,
        colorIndex: (rtIndex + i + 2) % 6,
        isCover: false,
      })),
    };
  });

  return { propertyGallery, roomTypeGalleries };
}

function buildPolicies(rand: () => number): Policies {
  const cancellationPolicies: Policies["cancellationPolicy"][] = [
    "free",
    "moderate",
    "strict",
    "non_refundable",
  ];
  const petPolicies: Policies["petPolicy"][] = [
    "allowed",
    "not_allowed",
    "on_request",
  ];
  const smokingPolicies: Policies["smokingPolicy"][] = [
    "allowed",
    "not_allowed",
    "designated",
  ];
  const eventPolicies: Policies["eventPolicy"][] = [
    "allowed",
    "not_allowed",
    "on_request",
  ];

  return {
    checkinTime: "14:00",
    checkoutTime: "11:00",
    cancellationPolicy:
      cancellationPolicies[Math.floor(rand() * cancellationPolicies.length)],
    cancellationHours: [24, 48, 72][Math.floor(rand() * 3)],
    refundPercentage: [0, 50, 100][Math.floor(rand() * 3)],
    houseRules:
      "No loud music after 10 PM. Please keep common areas clean. Report any damages to the host immediately.",
    petPolicy: petPolicies[Math.floor(rand() * petPolicies.length)],
    smokingPolicy: smokingPolicies[Math.floor(rand() * smokingPolicies.length)],
    eventPolicy: eventPolicies[Math.floor(rand() * eventPolicies.length)],
    idRequired: rand() < 0.7,
    securityDepositPaise:
      rand() < 0.6 ? Math.round((2000 + rand() * 8000) * 100) : 0,
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildBookingLink(rand: () => number, name: string): BookingLinkConfig {
  return {
    slug: `sunrise-retreats/${slugify(name)}`,
    isLive: rand() < 0.65,
    accentColor: "#111111",
    welcomeText: `Welcome to ${name} — your home away from home.`,
  };
}

function buildBilling(rand: () => number, name: string): Billing {
  return {
    taxRateBps: 1800,
    taxType: rand() < 0.7 ? "exclusive" : "inclusive",
    taxLabel: "GST",
    gstin: rand() < 0.6 ? "22AAAAA0000A1Z5" : "",
    razorpayConnected: rand() < 0.6,
    stripeConnected: rand() < 0.2,
    businessName: `${name.split(" - ")[0]} Hospitality Pvt Ltd`,
    businessAddress: "123 Beach Road, Anjuna, Goa 403509",
    invoicePrefix: name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase(),
    invoiceAuto: rand() < 0.8,
  };
}

function buildChecklist(
  roomTypes: RoomType[],
  propertyGallery: GalleryImage[],
  bookingLink: BookingLinkConfig,
  billing: Billing,
): SetupChecklist {
  return {
    detailsAdded: true,
    roomTypesConfigured: roomTypes.length > 0,
    photosUploaded: propertyGallery.length > 0,
    paymentGatewayConnected:
      billing.razorpayConnected || billing.stripeConnected,
    bookingLinkShared: bookingLink.isLive,
  };
}

function buildMetrics(rand: () => number, roomTypes: RoomType[]): LiveMetrics {
  const totalUnits = roomTypes.reduce((sum, rt) => sum + rt.quantity, 0);
  const occupiedUnits = roomTypes.reduce(
    (sum, rt) => sum + rt.units.filter((u) => u.occupancy !== null).length,
    0,
  );
  const currentOccupancyPercent =
    totalUnits > 0
      ? Math.round((occupiedUnits / Math.max(totalUnits, 1)) * 100) ||
        Math.round(30 + rand() * 50)
      : Math.round(30 + rand() * 50);
  const avgRate =
    roomTypes.reduce((sum, rt) => sum + rt.baseRatePaise, 0) /
    Math.max(roomTypes.length, 1);
  const thisMonthRevenuePaise = Math.round(
    avgRate * totalUnits * (currentOccupancyPercent / 100) * (20 + rand() * 8),
  );
  const directBookingSharePercent = Math.round(35 + rand() * 45);

  return {
    totalUnits,
    currentOccupancyPercent,
    thisMonthRevenuePaise,
    directBookingSharePercent,
  };
}

export function buildPropertyDetail(property: MockProperty): PropertyDetail {
  const rand = seededRandom(`property-detail-${property.id}`);
  const propertyType = normalizePropertyType(property.propertyType);
  const status = normalizeStatus(property.status);

  const roomTypes = buildRoomTypes(rand, property.id);
  const rateOverrides = buildRateOverrides(rand, property.id, roomTypes);
  const amenities = buildAmenities(rand);
  const { propertyGallery, roomTypeGalleries } = buildGallery(
    rand,
    property.id,
    roomTypes,
  );
  const policies = buildPolicies(rand);
  const bookingLink = buildBookingLink(rand, property.name);
  const billing = buildBilling(rand, property.name);
  const checklist = buildChecklist(
    roomTypes,
    propertyGallery,
    bookingLink,
    billing,
  );
  const metrics = buildMetrics(rand, roomTypes);

  return {
    id: property.id,
    name: property.name,
    propertyType,
    status,
    city: property.city,
    addressLine1: "123 Beach Road, Anjuna, Bardez",
    state: property.city.split(",").pop()?.trim() || "Goa",
    country: "India",
    pinCode: "403509",
    latitude: 15.5937,
    longitude: 73.7425,
    slug: bookingLink.slug,
    description: `A well-loved ${propertyType} located in ${property.city}, offering a comfortable stay for guests seeking a home base for exploring the region.`,
    roomTypes,
    rateOverrides,
    amenities,
    propertyGallery,
    roomTypeGalleries,
    policies,
    bookingLink,
    billing,
    checklist,
    metrics,
  };
}

export function buildPropertyDetails(
  properties: MockProperty[],
): PropertyDetail[] {
  return properties.map((p) => buildPropertyDetail(p));
}
