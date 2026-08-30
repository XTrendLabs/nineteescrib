import { cn } from "@propertyos/ui/lib/utils";
import { type Expense, parseDateOnly } from "../lib/expense";
import { formatDueRelative, formatInrFromPaise } from "../lib/format";

const STATUS_STYLES = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400",
  partial:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400",
  unpaid:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400",
} as const;

const STATUS_LABEL = {
  paid: "Paid",
  partial: "Partial",
  unpaid: "Unpaid",
} as const;

export function StatusPill({
  expense,
  className,
}: {
  expense: Expense;
  className?: string;
}) {
  const { status } = expense;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex w-fit shrink-0 items-center whitespace-nowrap border px-2 py-0.5 font-medium text-[11px] leading-normal",
          STATUS_STYLES[status],
        )}
      >
        {STATUS_LABEL[status]}
      </span>
      {status === "partial" && (
        <span className="whitespace-nowrap text-[11px] text-muted-foreground">
          {formatInrFromPaise(expense.amountPaidPaise)} paid /{" "}
          {formatInrFromPaise(expense.totalAmountPaise)}
        </span>
      )}
      {status === "unpaid" && expense.dueDate && (
        <span className="whitespace-nowrap text-[11px] text-muted-foreground">
          {formatDueRelative(parseDateOnly(expense.dueDate))}
        </span>
      )}
    </div>
  );
}
