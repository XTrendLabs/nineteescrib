import { createDb } from "@propertyos/db";
import { user } from "@propertyos/db/schema/auth";
import {
  expense,
  expenseCounter,
  expensePayment,
  expenseReceipt,
} from "@propertyos/db/schema/expense";
import { organization } from "@propertyos/db/schema/organization";
import { vendor } from "@propertyos/db/schema/vendor";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

const db = createDb();

/** What the client calls an HQ-shared expense, where the column is NULL. */
export const HQ_SHARED_ID = "hq-shared";

type ExpenseStatus = "paid" | "partial" | "unpaid";

function deriveStatus(totalPaise: number, paidPaise: number): ExpenseStatus {
  if (paidPaise <= 0) return "unpaid";
  if (paidPaise >= totalPaise) return "paid";
  return "partial";
}

/**
 * The expense row plus the names the UI shows in place of raw ids.
 *
 * Vendor and property names are joined rather than stored: they are display
 * labels that must follow a rename. `vendorName` falls back to the row's own
 * `vendorGstin`-era history only in that a deleted vendor leaves NULL, which
 * the client renders as an em dash.
 */
const expenseColumns = {
  id: expense.id,
  hqOrganizationId: expense.hqOrganizationId,
  organizationId: expense.organizationId,
  ref: expense.ref,
  title: expense.title,
  category: expense.category,
  vendorId: expense.vendorId,
  vendorName: vendor.name,
  propertyName: organization.name,
  totalAmountPaise: expense.totalAmountPaise,
  expenseDate: expense.expenseDate,
  dueDate: expense.dueDate,
  isOwnerDeductible: expense.isOwnerDeductible,
  taxAmountPaise: expense.taxAmountPaise,
  gstRateBps: expense.gstRateBps,
  gstMode: expense.gstMode,
  vendorGstin: expense.vendorGstin,
  itcClaimable: expense.itcClaimable,
  notes: expense.notes,
  createdByUserId: expense.createdByUserId,
  createdByName: user.name,
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt,
};

/**
 * The day an expense is filed under, for ordering.
 *
 * Falls back to `createdAt` so a row with no `expenseDate` -- only possible
 * for data written before the column existed -- still sorts sensibly instead
 * of collapsing to the bottom as a NULL.
 */
const expenseOrderDate = sql`coalesce(${expense.expenseDate}, ${expense.createdAt}::date)`;

function selectExpenses() {
  return db
    .select(expenseColumns)
    .from(expense)
    .leftJoin(vendor, eq(vendor.id, expense.vendorId))
    .leftJoin(organization, eq(organization.id, expense.organizationId))
    .leftJoin(user, eq(user.id, expense.createdByUserId));
}

type ExpenseRow = Awaited<ReturnType<typeof selectExpenses>>[number];

/** One payment as the client consumes it, with the recorder resolved to a name. */
const paymentColumns = {
  id: expensePayment.id,
  expenseId: expensePayment.expenseId,
  amountPaise: expensePayment.amountPaise,
  method: expensePayment.method,
  paidAt: expensePayment.paidAt,
  referenceId: expensePayment.referenceId,
  notes: expensePayment.notes,
  recordedByName: user.name,
  createdAt: expensePayment.createdAt,
};

function selectPayments() {
  return db
    .select(paymentColumns)
    .from(expensePayment)
    .leftJoin(user, eq(user.id, expensePayment.recordedByUserId));
}

/**
 * Folds each expense's payments in, and derives the amount paid and status
 * from them.
 *
 * The ledger is the source of truth for what has been paid, so this is one
 * extra query for the whole page rather than a stored total that can drift out
 * of step with the installments behind it.
 */
async function attachPayments(rows: ExpenseRow[]) {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);

  // Independent reads against a database ~300ms away, so they overlap rather
  // than run back to back.
  const [payments, receipts] = await Promise.all([
    selectPayments()
      .where(inArray(expensePayment.expenseId, ids))
      .orderBy(expensePayment.paidAt, expensePayment.createdAt),
    db
      .select()
      .from(expenseReceipt)
      .where(inArray(expenseReceipt.expenseId, ids))
      .orderBy(expenseReceipt.createdAt),
  ]);

  return rows.map((row) => {
    const mine = payments.filter((p) => p.expenseId === row.id);
    const amountPaidPaise = mine.reduce((sum, p) => sum + p.amountPaise, 0);

    return {
      ...row,
      // The client models "no property" as a sentinel rather than null, so the
      // two agree on one representation of an HQ-shared cost.
      propertyId: row.organizationId ?? HQ_SHARED_ID,
      propertyName: row.propertyName ?? "HQ / Shared",
      amountPaidPaise,
      status: deriveStatus(row.totalAmountPaise, amountPaidPaise),
      payments: mine,
      receipts: receipts.filter((r) => r.expenseId === row.id),
    };
  });
}

export const expenseRepo = {
  async listByHqOrganization(hqOrganizationId: string) {
    const rows = await selectExpenses()
      .where(eq(expense.hqOrganizationId, hqOrganizationId))
      .orderBy(desc(expenseOrderDate), desc(expense.createdAt));
    return attachPayments(rows);
  },

  /**
   * The expenses charged to one property, plus that HQ's shared costs.
   *
   * Someone scoped to a single property still needs to see the shared spend
   * their property carries a portion of, so both are returned together.
   */
  async listByProperty(organizationId: string, hqOrganizationId: string) {
    const rows = await selectExpenses()
      .where(
        and(
          eq(expense.hqOrganizationId, hqOrganizationId),
          sql`(${expense.organizationId} = ${organizationId} or ${expense.organizationId} is null)`,
        ),
      )
      .orderBy(desc(expenseOrderDate), desc(expense.createdAt));
    return attachPayments(rows);
  },

  async findById(id: string) {
    const rows = await selectExpenses().where(eq(expense.id, id)).limit(1);
    if (rows.length === 0) return undefined;
    const [withPayments] = await attachPayments(rows);
    return withPayments;
  },

  /** The HQ owning an expense, for the scope check -- see `vendor.repo`. */
  async findHqOrganizationId(id: string) {
    const [row] = await db
      .select({ hqOrganizationId: expense.hqOrganizationId })
      .from(expense)
      .where(eq(expense.id, id))
      .limit(1);
    return row?.hqOrganizationId;
  },

  /** The expense a payment belongs to, so a payment id can be scope-checked. */
  async findExpenseIdByPayment(paymentId: string) {
    const [row] = await db
      .select({ expenseId: expensePayment.expenseId })
      .from(expensePayment)
      .where(eq(expensePayment.id, paymentId))
      .limit(1);
    return row?.expenseId;
  },

  /**
   * The next reference for an HQ, as one atomic step.
   *
   * The upsert increments and returns in a single statement, so two concurrent
   * creates are serialized by the row lock rather than both reading the same
   * value -- which is exactly the race a `max(ref) + 1` over `expense` would
   * lose. The unique index on (hq, ref) is the backstop.
   */
  async nextRef(hqOrganizationId: string) {
    const [row] = await db
      .insert(expenseCounter)
      .values({ hqOrganizationId, lastRef: 1 })
      .onConflictDoUpdate({
        target: expenseCounter.hqOrganizationId,
        set: { lastRef: sql`${expenseCounter.lastRef} + 1` },
      })
      .returning({ lastRef: expenseCounter.lastRef });

    // The upsert always writes a row, so this is defensive rather than
    // expected -- but a missing counter must not mint "EXP-undefined".
    if (!row) {
      throw new Error("Could not allocate an expense reference");
    }

    return `EXP-${row.lastRef}`;
  },

  async create(
    input: Omit<typeof expense.$inferInsert, "id" | "ref"> & {
      initialPayment?: Omit<
        typeof expensePayment.$inferInsert,
        "id" | "expenseId"
      >;
    },
  ) {
    const { initialPayment, ...expenseInput } = input;
    const id = crypto.randomUUID();
    const ref = await expenseRepo.nextRef(input.hqOrganizationId);

    await db.insert(expense).values({ ...expenseInput, id, ref });

    if (initialPayment) {
      await db
        .insert(expensePayment)
        .values({ ...initialPayment, id: crypto.randomUUID(), expenseId: id });
    }

    return expenseRepo.findById(id);
  },

  async update(id: string, input: Partial<typeof expense.$inferInsert>) {
    const rows = await db
      .update(expense)
      .set(input)
      .where(eq(expense.id, id))
      .returning({ id: expense.id });

    if (rows.length === 0) return undefined;
    return expenseRepo.findById(id);
  },

  async remove(id: string) {
    // `expensePayment` cascades on delete, so the ledger goes with it.
    const rows = await db
      .delete(expense)
      .where(eq(expense.id, id))
      .returning({ id: expense.id });
    return rows[0];
  },

  /** What has been paid so far, to check a new installment against the total. */
  async totals(id: string) {
    const [row] = await db
      .select({
        totalAmountPaise: expense.totalAmountPaise,
        paidPaise: sql<number>`coalesce(sum(${expensePayment.amountPaise}), 0)::int`,
      })
      .from(expense)
      .leftJoin(expensePayment, eq(expensePayment.expenseId, expense.id))
      .where(eq(expense.id, id))
      .groupBy(expense.id, expense.totalAmountPaise)
      .limit(1);
    return row;
  },

  async addPayment(
    expenseId: string,
    input: Omit<typeof expensePayment.$inferInsert, "id" | "expenseId">,
  ) {
    await db
      .insert(expensePayment)
      .values({ ...input, id: crypto.randomUUID(), expenseId });
    return expenseRepo.findById(expenseId);
  },

  async addReceipt(input: Omit<typeof expenseReceipt.$inferInsert, "id">) {
    const [row] = await db
      .insert(expenseReceipt)
      .values({ ...input, id: crypto.randomUUID() })
      .returning();
    return row;
  },

  async findReceiptById(receiptId: string) {
    const [row] = await db
      .select()
      .from(expenseReceipt)
      .where(eq(expenseReceipt.id, receiptId))
      .limit(1);
    return row;
  },

  /** Receipt URLs for an expense, so stored files can be cleaned up on delete. */
  listReceiptUrls(expenseId: string) {
    return db
      .select({ url: expenseReceipt.url })
      .from(expenseReceipt)
      .where(eq(expenseReceipt.expenseId, expenseId))
      .then((rows) => rows.map((r) => r.url));
  },

  async removeReceipt(receiptId: string) {
    const rows = await db
      .delete(expenseReceipt)
      .where(eq(expenseReceipt.id, receiptId))
      .returning();
    return rows[0];
  },

  async removePayment(paymentId: string) {
    const rows = await db
      .delete(expensePayment)
      .where(eq(expensePayment.id, paymentId))
      .returning({ expenseId: expensePayment.expenseId });
    return rows[0];
  },
};
