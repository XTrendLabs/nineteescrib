import {
  expenseCategoryValues,
  gstModeValues,
  paymentMethodValues,
} from "@propertyos/db/schema/expense";
import z from "zod";

/** See `vendor.schema.ts`: the dialogs submit untouched inputs as "". */
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

/** An ISO calendar day (YYYY-MM-DD), which is what `<input type="date">` emits. */
const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional()
  .refine((value) => value === undefined || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Enter a valid date",
  });

/**
 * A money amount in paise.
 *
 * Integer-only: the client converts rupees to paise before sending, so a
 * fractional value here means a rounding bug upstream rather than a real
 * sub-paise amount, and is worth rejecting rather than silently truncating.
 */
const paise = z
  .number()
  .int("Amount must be a whole number of paise")
  .nonnegative("Amount cannot be negative");

/**
 * An optional foreign key.
 *
 * The selects submit "" when nothing is chosen, so the empty string has to
 * mean "no id" rather than fail a length check -- the service maps both "" and
 * null onto a NULL column.
 */
const optionalId = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .nullish();

const expenseFields = {
  title: z.string().trim().min(1, "Title is required"),
  category: z.enum(expenseCategoryValues),
  /**
   * The property this is charged to. Omitted, null or the client's
   * "hq-shared" sentinel all mean a cost belonging to no single property.
   */
  organizationId: optionalId,
  vendorId: optionalId,
  totalAmountPaise: paise.refine(
    (value) => value > 0,
    "Total amount must be greater than zero",
  ),
  /**
   * The day the cost was incurred. Optional so an older client that does not
   * send one still works -- the service falls back to today rather than
   * writing a row with no date.
   */
  expenseDate: optionalDate,
  dueDate: optionalDate,
  isOwnerDeductible: z.boolean().optional(),
  taxAmountPaise: paise.optional(),
  /**
   * GST rate in basis points (1800 = 18%). Capped at 100% -- a rate beyond
   * that is a typo, not a tax.
   */
  gstRateBps: z
    .number()
    .int("Enter a valid GST rate")
    .min(0, "GST rate cannot be negative")
    .max(10_000, "GST rate cannot exceed 100%")
    .optional(),
  gstMode: z.enum(gstModeValues).optional(),
  vendorGstin: optionalText,
  itcClaimable: z.boolean().optional(),
  notes: optionalText,
};

/** One installment, as the payment dialogs submit it. */
const paymentFields = {
  amountPaise: paise.refine(
    (value) => value > 0,
    "Payment amount must be greater than zero",
  ),
  method: z.enum(paymentMethodValues),
  paidAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  referenceId: optionalText,
  notes: optionalText,
};

/**
 * Creating an expense can carry an opening payment: the log dialog offers
 * "paid" and "partial" alongside "unpaid", and settling in the same step
 * should not cost a second round-trip.
 */
export const createExpenseSchema = z
  .object({
    ...expenseFields,
    initialPayment: z.object(paymentFields).optional(),
  })
  .refine(
    (data) =>
      data.initialPayment === undefined ||
      data.initialPayment.amountPaise <= data.totalAmountPaise,
    {
      path: ["initialPayment", "amountPaise"],
      message: "Payment cannot exceed the total amount",
    },
  );

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

/**
 * Detail edits only. Payments move through their own endpoint -- editing a
 * title must not be able to rewrite the ledger.
 */
export const updateExpenseSchema = z.object(expenseFields);

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const recordPaymentSchema = z.object(paymentFields);

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
