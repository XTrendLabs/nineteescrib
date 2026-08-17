/**
 * Structured mock data for the Guest CRM page.
 *
 * No guests table exists in the schema yet, so the row-level data below is
 * generated deterministically (seeded-hash, no Math.random) following the
 * same pattern as bookings/lib/mock-data.ts.
 */

import { subDays } from "date-fns";

export type GuestTag = "vip" | "repeat" | "needs_care";

export type StayRecord = {
  ref: string;
  propertyName: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
  paidPaise: number;
};

export type Note = {
  id: string;
  text: string;
  createdAt: Date;
};

export type Guest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: GuestTag[];
  totalStays: number;
  totalSpentPaise: number;
  lastStayProperty: string;
  lastStayDate: Date;
  stays: StayRecord[];
  notes: Note[];
};

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

const FIRST_NAMES = [
  "Arjun",
  "Priya",
  "Rohan",
  "Meera",
  "Kabir",
  "Ananya",
  "Vikram",
  "Sana",
  "Farhan",
  "Ishita",
  "Neha",
  "Aditya",
  "Diya",
  "Karan",
  "Zoya",
  "Aarav",
];

const LAST_NAMES = [
  "Sen",
  "Nair",
  "Kapoor",
  "Iyer",
  "Singh",
  "Rao",
  "Desai",
  "Sheikh",
  "Ali",
  "Verma",
  "Joshi",
  "Reddy",
  "Malhotra",
  "Bose",
];

const PROPERTY_NAMES = [
  "Sunrise Villa - Goa",
  "Deluxe Suite - Coorg",
  "Backwater Retreat - Alleppey",
  "Mountain View Cottage - Manali",
  "Heritage Haveli - Jaipur",
];

const ROOM_TYPES = [
  "Standard Room",
  "Deluxe Suite",
  "Garden Villa",
  "Sea View Room",
];

const NOTE_SAMPLES = [
  "Prefers ground floor units.",
  "Travels with family. Very polite.",
  "Requested extra towels and pillows.",
  "Arrives late, usually after 10 PM check-in.",
  "Vegetarian meals only.",
  "Celebrated anniversary during last stay — sent a card.",
  "Sensitive to noise, prefers rooms away from the road.",
];

export function buildGuests(count = 56): Guest[] {
  const rand = seededRandom(`guests-${count}`);
  const guests: Guest[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const name = `${firstName} ${lastName}`;
    const totalStays = 1 + Math.floor(rand() * 6);

    const stays: StayRecord[] = [];
    let cursor = subDays(new Date(), Math.floor(rand() * 30));
    for (let s = 0; s < totalStays; s++) {
      const nights = 1 + Math.floor(rand() * 5);
      const checkOut = cursor;
      const checkIn = subDays(checkOut, nights);
      const property =
        PROPERTY_NAMES[Math.floor(rand() * PROPERTY_NAMES.length)];
      const roomType = ROOM_TYPES[Math.floor(rand() * ROOM_TYPES.length)];
      const paidPaise = Math.round((3500 + rand() * 6500) * nights * 100);
      const refNumber = 10_000 + Math.floor(rand() * 89_999);
      stays.push({
        ref: `POS-${refNumber}`,
        propertyName: property,
        roomType,
        checkIn,
        checkOut,
        paidPaise,
      });
      cursor = subDays(checkIn, 15 + Math.floor(rand() * 90));
    }
    stays.sort((a, b) => b.checkOut.getTime() - a.checkOut.getTime());

    const totalSpentPaise = stays.reduce((sum, s) => sum + s.paidPaise, 0);
    const lastStay = stays[0];

    const tags: GuestTag[] = [];
    if (totalStays >= 2) tags.push("repeat");
    if (totalSpentPaise > 5_000_000) tags.push("vip");
    if (rand() < 0.12) tags.push("needs_care");

    const noteCount = Math.floor(rand() * 3);
    const notes: Note[] = [];
    for (let n = 0; n < noteCount; n++) {
      notes.push({
        id: `note-${i}-${n}`,
        text: NOTE_SAMPLES[Math.floor(rand() * NOTE_SAMPLES.length)],
        createdAt: subDays(new Date(), Math.floor(rand() * 60)),
      });
    }

    guests.push({
      id: `guest-${i}`,
      name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone: `+9198${String(10_000_000 + Math.floor(rand() * 89_999_999)).slice(0, 8)}`,
      tags,
      totalStays,
      totalSpentPaise,
      lastStayProperty: lastStay.propertyName,
      lastStayDate: lastStay.checkOut,
      stays,
      notes,
    });
  }

  return guests.sort((a, b) => b.totalSpentPaise - a.totalSpentPaise);
}

export type GuestsSummary = {
  totalGuests: number;
  repeatRatePercent: number;
  portfolioLtvPaise: number;
  vipCount: number;
};

export function buildGuestsSummary(guests: Guest[]): GuestsSummary {
  const totalGuests = guests.length;
  const repeatCount = guests.filter((g) => g.totalStays >= 2).length;
  const repeatRatePercent =
    totalGuests > 0 ? (repeatCount / totalGuests) * 100 : 0;
  const portfolioLtvPaise = guests.reduce(
    (sum, g) => sum + g.totalSpentPaise,
    0,
  );
  const vipCount = guests.filter((g) => g.tags.includes("vip")).length;

  return { totalGuests, repeatRatePercent, portfolioLtvPaise, vipCount };
}

export function buildOfferLink(guest: Guest, price: string, dates: string) {
  const message = `Hi ${guest.name}, here's a special direct-booking offer for you: ${dates}${
    price ? ` at ₹${price}` : ""
  }. Reply to confirm!`;
  const phoneDigits = guest.phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}
