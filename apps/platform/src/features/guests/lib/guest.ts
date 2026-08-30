/**
 * The guest shapes the API returns.
 *
 * Stats and tags are derived server-side from the bookings behind each guest,
 * so nothing here is a stored duplicate of the booking ledger. Calendar days
 * arrive as "YYYY-MM-DD" strings; timestamps as ISO instants.
 */

/** "repeat" is derived from the stay count; the other two are applied by hand. */
export type GuestTag = "vip" | "repeat" | "needs_care";

/** The tags a member can actually set -- see `guestTagValues` on the server. */
export const ASSIGNABLE_TAGS: Exclude<GuestTag, "repeat">[] = [
  "vip",
  "needs_care",
];

export type StayRecord = {
  id: string;
  ref: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalAmountPaise: number;
};

export type GuestNote = {
  id: string;
  text: string;
  authorUserId: string | null;
  authorName: string | null;
  createdAt: string;
};

export type Guest = {
  id: string;
  hqOrganizationId: string;
  name: string;
  phone: string;
  email: string | null;
  tags: string[];
  totalStays: number;
  totalSpentPaise: number;
  /** A calendar day, or null for a guest who has not stayed yet. */
  lastStayDate: string | null;
  createdAt: string;
  updatedAt: string;
};

/** A guest with the detail only the drawer loads. */
export type GuestProfile = Guest & {
  stays: StayRecord[];
  noteEntries: GuestNote[];
};

export type GuestsSummary = {
  totalGuests: number;
  repeatRatePercent: number;
  portfolioLtvPaise: number;
  vipCount: number;
};

/**
 * The four figures on the summary band.
 *
 * Repeat rate counts guests with more than one stay, matching how the "repeat"
 * tag itself is derived -- the two can never disagree.
 */
export function buildGuestsSummary(guests: Guest[]): GuestsSummary {
  const totalGuests = guests.length;
  const repeatGuests = guests.filter((g) => g.totalStays > 1).length;
  const portfolioLtvPaise = guests.reduce(
    (sum, g) => sum + g.totalSpentPaise,
    0,
  );
  const vipCount = guests.filter((g) => g.tags.includes("vip")).length;

  return {
    totalGuests,
    repeatRatePercent: totalGuests > 0 ? (repeatGuests / totalGuests) * 100 : 0,
    portfolioLtvPaise,
    vipCount,
  };
}

/**
 * A WhatsApp deep link carrying a personalised offer.
 *
 * Built client-side rather than stored: the message is composed fresh each
 * time the dialog is opened, and nothing about it needs to outlive the send.
 */
export function buildOfferLink(guest: Guest, price: string, dates: string) {
  const message = `Hi ${guest.name}, here's a special direct-booking offer for you: ${dates}${
    price ? ` at ₹${price}` : ""
  }. Reply to confirm!`;
  const phoneDigits = guest.phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}
