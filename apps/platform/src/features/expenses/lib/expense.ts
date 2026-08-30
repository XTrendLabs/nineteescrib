import type { ExpenseCategory, PaymentMethod } from "./mock-data";

/** HQ / Shared expenses use this sentinel instead of a real property id. */
export const HQ_SHARED_ID = "hq-shared";

export type ExpenseStatus = "paid" | "partial" | "unpaid";

/** One installment, as the API returns it. */
export type PaymentEntry = {
  id: string;
  expenseId: string;
  amountPaise: number;
  method: string;
  /** A calendar day (YYYY-MM-DD), not an instant -- see the schema. */
  paidAt: string;
  referenceId: string | null;
  notes: string | null;
  recordedByName: string | null;
  createdAt: string;
};

/**
 * An expense as the API returns it.
 *
 * `amountPaidPaise` and `status` are derived server-side from the payment
 * ledger rather than stored, so they always agree with `payments`.
 */
export type Expense = {
  id: string;
  hqOrganizationId: string;
  organizationId: string | null;
  /** The property id, or `HQ_SHARED_ID` for a cost belonging to no property. */
  propertyId: string;
  propertyName: string;
  ref: string;
  title: string;
  category: string;
  vendorId: string | null;
  vendorName: string | null;
  totalAmountPaise: number;
  amountPaidPaise: number;
  status: ExpenseStatus;
  dueDate: string | null;
  isOwnerDeductible: boolean;
  taxAmountPaise: number;
  /** GST rate in basis points (1800 = 18%). */
  gstRateBps: number;
  /** Whether `totalAmountPaise` already includes the GST. */
  gstMode: string;
  vendorGstin: string | null;
  itcClaimable: boolean;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  payments: PaymentEntry[];
};

const CATEGORY_VALUES = [
  "maintenance",
  "utilities",
  "supplies",
  "salaries",
  "admin",
  "marketing",
  "capex",
  "other",
] as const;

const PAYMENT_METHOD_VALUES = [
  "cash",
  "upi",
  "bank_transfer",
  "card",
  "online",
] as const;

/** Narrows stored free text to a known category, falling back to "other". */
export function normalizeCategory(value: string): ExpenseCategory {
  return (CATEGORY_VALUES as readonly string[]).includes(value)
    ? (value as ExpenseCategory)
    : "other";
}

export function normalizePaymentMethod(value: string): PaymentMethod {
  return (PAYMENT_METHOD_VALUES as readonly string[]).includes(value)
    ? (value as PaymentMethod)
    : "cash";
}

/**
 * Parses a `date` column (YYYY-MM-DD) as local midnight.
 *
 * `new Date("2026-08-19")` parses as UTC, which renders as the previous day
 * for anyone west of UTC -- so the parts are passed separately.
 */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * Per-vendor aggregates over a set of expenses.
 *
 * These read from whatever expenses the caller can see, so a property-scoped
 * user's vendor totals reflect their own property's spend rather than the
 * whole HQ's -- which is the same rule the list endpoint applies.
 */
export function vendorActiveExpenseCount(
  vendorId: string,
  expenses: Expense[],
): number {
  return expenses.filter((e) => e.vendorId === vendorId && e.status !== "paid")
    .length;
}

export function vendorTotalPaid(vendorId: string, expenses: Expense[]): number {
  return expenses
    .filter((e) => e.vendorId === vendorId)
    .reduce((sum, e) => sum + e.amountPaidPaise, 0);
}

export function vendorTotalPending(
  vendorId: string,
  expenses: Expense[],
): number {
  return expenses
    .filter((e) => e.vendorId === vendorId)
    .reduce((sum, e) => sum + (e.totalAmountPaise - e.amountPaidPaise), 0);
}

/** A vendor's expenses, newest first. */
export function vendorExpenses(
  vendorId: string,
  expenses: Expense[],
): Expense[] {
  return expenses
    .filter((e) => e.vendorId === vendorId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}
