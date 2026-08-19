import { cn } from "@propertyos/ui/lib/utils";
import { formatDueRelative, formatInrFromPaise } from "../lib/format";
import type { Invoice } from "../lib/mock-data";

const STATUS_STYLES = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400",
  partial:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400",
  overdue:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400",
  sent: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-400",
  draft:
    "border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400",
  cancelled:
    "border-neutral-200 bg-neutral-100 text-neutral-500 line-through dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500",
} as const;

const STATUS_LABEL = {
  paid: "Paid",
  partial: "Partial",
  overdue: "Overdue",
  sent: "Sent",
  draft: "Draft",
  cancelled: "Cancelled",
} as const;

export function InvoiceStatusPill({
  invoice,
  className,
}: {
  invoice: Invoice;
  className?: string;
}) {
  const { status } = invoice;

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
      {(status === "partial" || status === "overdue") && (
        <span className="whitespace-nowrap text-[11px] text-muted-foreground">
          {formatInrFromPaise(invoice.amountPaidPaise)} paid /{" "}
          {formatInrFromPaise(invoice.totalPaise - invoice.amountPaidPaise)} due
        </span>
      )}
      {status === "sent" && invoice.dueDate && (
        <span className="whitespace-nowrap text-[11px] text-muted-foreground">
          {formatDueRelative(invoice.dueDate)}
        </span>
      )}
    </div>
  );
}
