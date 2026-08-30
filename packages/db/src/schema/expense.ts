import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { organization } from "./organization";
import { vendor } from "./vendor";

/** Mirrors `vendorCategoryValues`: a vendor is filed under the spend they account for. */
export const expenseCategoryValues = [
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
 * Whether the amount the user typed already contained GST, or GST is added on
 * top of it. Kept so an edit reopens the form exactly as it was filled in --
 * from the stored base and tax alone the two are indistinguishable.
 */
export const gstModeValues = ["exclusive", "inclusive"] as const;

export const paymentMethodValues = [
  "cash",
  "upi",
  "bank_transfer",
  "card",
  "online",
] as const;

/**
 * Money is stored in paise as whole numbers, never as a float or a decimal
 * rupee value. Amounts are only ever added, subtracted and compared, and
 * integer paise makes every one of those exact -- a rupee value in floating
 * point cannot represent 0.10 exactly, so a ledger built on it drifts.
 *
 * `bigint` with `mode: "number"` keeps this a JS number: at 2^53 paise the safe
 * range is ~90 trillion rupees, far beyond any expense, while avoiding the
 * BigInt serialization that `mode: "bigint"` would force on every response.
 */
const paise = (name: string) => bigint(name, { mode: "number" });

/**
 * A cost the business has incurred.
 *
 * The amount paid is deliberately NOT stored here: it is the sum of the rows in
 * `expensePayment`, and status (paid/partial/unpaid) derives from that sum
 * against `totalAmountPaise`. Keeping a running total in both places is the
 * classic way for a ledger to disagree with itself -- a failed write or a
 * deleted installment leaves the cached total wrong with nothing to detect it.
 */
export const expense = pgTable(
  "expense",
  {
    id: text("id").primaryKey(),
    // Expenses belong to the HQ even when charged to one property, so the
    // whole business's spend can be read without walking every property.
    hqOrganizationId: text("hq_organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    /**
     * The property this expense is charged to. NULL means an HQ-shared cost --
     * head-office internet, company insurance -- that belongs to no single
     * property. The UI models this as its own "HQ / Shared" option.
     */
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    /** Human-readable reference (EXP-1, EXP-2), unique and sequential per HQ. */
    ref: text("ref").notNull(),
    title: text("title").notNull(),
    category: text("category").default("other").notNull(),
    // Kept when the vendor is deleted: an expense is a historical record of
    // money spent, and must not vanish because a supplier was removed from the
    // directory. `vendorName` preserves who it was paid to.
    vendorId: text("vendor_id").references(() => vendor.id, {
      onDelete: "set null",
    }),
    totalAmountPaise: paise("total_amount_paise").notNull(),
    dueDate: date("due_date"),
    /** Whether this cost is deducted from the property owner's payout. */
    isOwnerDeductible: boolean("is_owner_deductible").default(false).notNull(),
    taxAmountPaise: paise("tax_amount_paise").default(0).notNull(),
    /**
     * The GST rate applied, in basis points (1800 = 18%).
     *
     * Integer basis points rather than a decimal percent: 18.5% is exactly
     * 1850 here, where a float would store it as 18.499999999999996 and make
     * the recomputed tax disagree with what was shown at entry.
     */
    gstRateBps: integer("gst_rate_bps").default(0).notNull(),
    /** Whether `totalAmountPaise` was entered with GST already inside it. */
    gstMode: text("gst_mode").default("exclusive").notNull(),
    /**
     * Copied from the vendor at the time of logging rather than joined.
     * A GSTIN on a filed expense is what was true when the money moved; if the
     * vendor later corrects theirs, historical records must not silently change.
     */
    vendorGstin: text("vendor_gstin"),
    itcClaimable: boolean("itc_claimable").default(false).notNull(),
    notes: text("notes"),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Each HQ gets its own EXP-n sequence, so two businesses never share a
    // reference and a double submit cannot mint the same one twice.
    uniqueIndex("expense_hqOrganizationId_ref_uq").on(
      table.hqOrganizationId,
      table.ref,
    ),
    // Serves the default listing: one HQ's expenses, newest first.
    index("expense_hqOrganizationId_createdAt_idx").on(
      table.hqOrganizationId,
      table.createdAt,
    ),
    index("expense_organizationId_idx").on(table.organizationId),
    index("expense_vendorId_idx").on(table.vendorId),
  ],
);

/**
 * Counts the refs handed out per HQ.
 *
 * The sequence cannot be `max(ref) + 1` over `expense`: two concurrent inserts
 * would read the same max and mint the same ref, and deleting the newest
 * expense would make the next one reuse a reference that already appeared on a
 * receipt. A dedicated counter, incremented atomically, gives each HQ a
 * gapless-until-deleted sequence that only ever moves forward.
 */
export const expenseCounter = pgTable("expense_counter", {
  hqOrganizationId: text("hq_organization_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  lastRef: integer("last_ref").default(0).notNull(),
});

/**
 * One installment against an expense.
 *
 * Expenses are frequently settled in parts -- a deposit then a balance -- so
 * each payment is its own row carrying its own method, date and reference.
 * Summing them gives the amount paid; the timeline in the history drawer is
 * these rows in order.
 */
export const expensePayment = pgTable(
  "expense_payment",
  {
    id: text("id").primaryKey(),
    expenseId: text("expense_id")
      .notNull()
      .references(() => expense.id, { onDelete: "cascade" }),
    amountPaise: paise("amount_paise").notNull(),
    method: text("method").default("upi").notNull(),
    // A payment date is a calendar day, not an instant: storing it as a
    // timestamp would shift the day for anyone east of UTC.
    paidAt: date("paid_at").notNull(),
    /** Transaction id from the bank or UPI app, e.g. "UPI/109283". */
    referenceId: text("reference_id"),
    notes: text("notes"),
    recordedByUserId: text("recorded_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("expense_payment_expenseId_idx").on(table.expenseId)],
);

/**
 * A receipt or invoice backing an expense.
 *
 * Its own table rather than a column on `expense`: a single cost often has
 * more than one document -- the vendor's invoice and the payment slip -- and
 * each has to be removable on its own.
 */
export const expenseReceipt = pgTable(
  "expense_receipt",
  {
    id: text("id").primaryKey(),
    expenseId: text("expense_id")
      .notNull()
      .references(() => expense.id, { onDelete: "cascade" }),
    /** Public URL of the stored object. */
    url: text("url").notNull(),
    /** The name as uploaded, so the UI can show something readable. */
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    uploadedByUserId: text("uploaded_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("expense_receipt_expenseId_idx").on(table.expenseId)],
);

export const expenseRelations = relations(expense, ({ one, many }) => ({
  hqOrganization: one(organization, {
    fields: [expense.hqOrganizationId],
    references: [organization.id],
  }),
  property: one(organization, {
    fields: [expense.organizationId],
    references: [organization.id],
  }),
  vendor: one(vendor, {
    fields: [expense.vendorId],
    references: [vendor.id],
  }),
  payments: many(expensePayment),
  receipts: many(expenseReceipt),
}));

export const expenseReceiptRelations = relations(expenseReceipt, ({ one }) => ({
  expense: one(expense, {
    fields: [expenseReceipt.expenseId],
    references: [expense.id],
  }),
}));

export const expensePaymentRelations = relations(expensePayment, ({ one }) => ({
  expense: one(expense, {
    fields: [expensePayment.expenseId],
    references: [expense.id],
  }),
}));
