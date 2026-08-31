import {
  DataTable,
  DataTableContainer,
} from "@propertyos/ui/components/data-table";
import { PaperclipIcon } from "lucide-react";
import {
  type Expense,
  HQ_SHARED_ID,
  normalizeCategory,
  parseDateOnly,
} from "../lib/expense";
import { formatDate, formatInrFromPaise } from "../lib/format";
import { CategoryBadge } from "./category-badge";
import { ExpenseRowActions } from "./expense-row-actions";
import { StatusPill } from "./status-pill";

export function ExpensesTable({
  expenses,
  isLoading = false,
  hasAny = true,
  onRecordPayment,
  onViewHistory,
  onEdit,
  onDelete,
}: {
  expenses: Expense[];
  isLoading?: boolean;
  /** Whether any expense exists at all, before filtering. */
  hasAny?: boolean;
  onRecordPayment: (expense: Expense) => void;
  onViewHistory: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}) {
  // An empty page mid-fetch is not the same as a filter that matched nothing,
  // and neither is an account that has logged no expenses yet.
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 border py-16 text-center">
        {isLoading && !hasAny ? (
          <p className="text-muted-foreground text-sm">Loading expenses...</p>
        ) : hasAny ? (
          <>
            <p className="text-sm">No expenses match your filters</p>
            <p className="text-muted-foreground text-xs">
              Try adjusting search or filter criteria
            </p>
          </>
        ) : (
          <>
            <p className="text-sm">No expenses logged yet</p>
            <p className="text-muted-foreground text-xs">
              Log your first expense to start tracking spend
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <DataTableContainer>
      <DataTable minWidth={880}>
        <thead>
          <tr className="border-b bg-muted/40 text-muted-foreground">
            <th className="whitespace-nowrap px-3 py-2 font-medium">
              Ref / Date
            </th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">
              Title & Vendor
            </th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">
              Property
            </th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">
              Category
            </th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Status</th>
            <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
              Amount
            </th>
            <th className="whitespace-nowrap px-3 py-2 text-center font-medium">
              Receipt
            </th>
            <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr
              key={expense.id}
              className="border-b last:border-b-0 hover:bg-muted/30"
            >
              <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                <div className="flex flex-col">
                  <span className="font-medium">{expense.ref}</span>
                  <span className="text-muted-foreground">
                    {/* The day the cost was incurred. `parseDateOnly` keeps it
                        on that day -- `new Date("2026-08-19")` would parse as
                        UTC midnight and render as the day before for anyone
                        west of UTC. */}
                    {formatDate(
                      expense.expenseDate
                        ? parseDateOnly(expense.expenseDate)
                        : new Date(expense.createdAt),
                    )}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5 align-middle">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => onViewHistory(expense)}
                    className="w-fit text-left font-medium hover:underline"
                  >
                    {expense.title}
                  </button>
                  <span className="text-muted-foreground">
                    {expense.vendorName ?? "—"}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                <span
                  className={
                    expense.propertyId === HQ_SHARED_ID
                      ? "inline-flex w-fit items-center border border-transparent bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                      : "text-foreground"
                  }
                >
                  {expense.propertyName}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                <CategoryBadge category={normalizeCategory(expense.category)} />
              </td>
              <td className="px-3 py-2.5 align-middle">
                <StatusPill expense={expense} />
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right align-middle font-medium">
                {formatInrFromPaise(expense.totalAmountPaise)}
              </td>
              <td className="px-3 py-2.5 align-middle">
                {expense.receipts.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => onViewHistory(expense)}
                    className="mx-auto flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <PaperclipIcon className="size-3.5" />
                    {expense.receipts.length}
                  </button>
                ) : (
                  <span className="block text-center text-muted-foreground">
                    —
                  </span>
                )}
              </td>
              <td className="px-3 py-2.5 text-right align-middle">
                <ExpenseRowActions
                  expense={expense}
                  onRecordPayment={onRecordPayment}
                  onViewHistory={onViewHistory}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </DataTableContainer>
  );
}
