import type { ExpenseCategory } from "./mock-data";

/**
 * A vendor as the API returns it.
 *
 * Optional columns come back as `null` rather than absent, which is what
 * separates this from the mock shape it replaces -- the components render
 * these fields conditionally, so both are falsy and read the same way.
 */
export type Vendor = {
  id: string;
  hqOrganizationId: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  category: string;
  gstin: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Anything a vendor can be filed under, for components that expect a known category. */
export const vendorCategoryValues = [
  "maintenance",
  "utilities",
  "supplies",
  "salaries",
  "admin",
  "marketing",
  "capex",
  "other",
] as const;

/**
 * Category as stored is free text at the type level, so it is narrowed here
 * before being handed to anything keyed by category -- an unrecognized value
 * falls back to "other" rather than rendering an empty badge.
 */
export function normalizeVendorCategory(value: string): ExpenseCategory {
  return (vendorCategoryValues as readonly string[]).includes(value)
    ? (value as ExpenseCategory)
    : "other";
}
