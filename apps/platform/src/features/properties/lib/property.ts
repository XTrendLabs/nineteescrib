import type { PropertyStatus, PropertyType } from "./mock-data";

/** Row shape returned by GET /api/platform/properties (list). */
export type PropertyListItem = {
  id: string;
  name: string;
  slug: string;
  propertyType: string;
  city: string;
  status: string;
};

/** Row shape returned by GET /api/platform/properties/:slug (detail). */
export type Property = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  propertyType: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  coverImage: string | null;
  status: string;
  ownerName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  whatsappNumber: string | null;
  operationsOpenTime: string | null;
  operationsCloseTime: string | null;
  invoicePrefix: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  billingAddress: string | null;
  bankAccountHolderName: string | null;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  bankName: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  minStayNights: number | null;
  maxStayNights: number | null;
  createdAt: string;
  updatedAt: string;
};

export function normalizePropertyType(value: string): PropertyType {
  const v = value.toLowerCase();
  if (v === "hotel" || v === "villa" || v === "apartment" || v === "hostel") {
    return v;
  }
  if (v === "homestay") return "homestay";
  return "villa";
}

export function normalizePropertyStatus(value: string): PropertyStatus {
  const v = value.toLowerCase();
  if (v === "active" || v === "inactive" || v === "maintenance") return v;
  return "active";
}

/** Formats a "HH:mm" 24-hour string (e.g. "00:00") as 12-hour with AM/PM. */
export function formatTime12Hour(value: string): string {
  const [hoursStr, minutesStr] = value.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}
