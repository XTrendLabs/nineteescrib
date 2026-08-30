import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@propertyos/ui/components/sheet";
import { CheckCircle2Icon, FileTextIcon, ImageIcon } from "lucide-react";
import {
  type Expense,
  HQ_SHARED_ID,
  isPdfReceipt,
  normalizeCategory,
  normalizePaymentMethod,
  parseDateOnly,
} from "../lib/expense";
import { formatDate, formatInrFromPaise } from "../lib/format";
import { bpsToPercentLabel } from "../lib/gst";
import { CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from "../lib/mock-data";
import { CategoryBadge } from "./category-badge";
import { StatusPill } from "./status-pill";

export function ExpenseHistoryDrawer({
  expense,
  onOpenChange,
}: {
  expense: Expense | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={expense !== null} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{expense?.ref ?? "Expense History"}</SheetTitle>
        </SheetHeader>

        {expense && (
          <div className="flex flex-col gap-6 px-4 pb-6">
            <div className="flex flex-col gap-3 border-b pb-5">
              <div>
                <p className="font-medium text-sm">{expense.title}</p>
                <p className="text-muted-foreground text-xs">
                  {expense.vendorName ?? "—"} ·{" "}
                  {expense.propertyId === HQ_SHARED_ID
                    ? "HQ / Shared"
                    : expense.propertyName}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={normalizeCategory(expense.category)} />
                <StatusPill expense={expense} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">
                    {formatInrFromPaise(expense.totalAmountPaise)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">
                    {CATEGORY_LABELS[normalizeCategory(expense.category)]}
                  </span>
                </div>
                {expense.taxAmountPaise > 0 && (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted-foreground">
                        Base (excl. GST)
                      </span>
                      <span className="font-medium">
                        {formatInrFromPaise(
                          expense.totalAmountPaise - expense.taxAmountPaise,
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted-foreground">
                        GST
                        {expense.gstRateBps > 0
                          ? ` @ ${bpsToPercentLabel(expense.gstRateBps)}%`
                          : ""}
                      </span>
                      <span className="font-medium">
                        {formatInrFromPaise(expense.taxAmountPaise)}
                      </span>
                    </div>
                  </>
                )}
                {expense.vendorGstin && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">Vendor GSTIN</span>
                    <span className="font-medium">{expense.vendorGstin}</span>
                  </div>
                )}
              </div>
            </div>

            {expense.receipts.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="font-medium text-xs">Receipts</p>
                <ul className="flex flex-col gap-1">
                  {expense.receipts.map((receipt) => (
                    <li key={receipt.id}>
                      <a
                        href={receipt.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 border px-2 py-1.5 text-xs hover:bg-muted/40"
                      >
                        {isPdfReceipt(receipt) ? (
                          <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          {receipt.fileName}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <p className="font-medium text-xs">Payment Installments</p>
              {expense.payments.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  No payments recorded yet.
                </p>
              ) : (
                <div className="flex flex-col gap-4 border-l pl-4">
                  {expense.payments.map((payment) => (
                    <div key={payment.id} className="relative">
                      <span className="absolute top-1 -left-[21px] size-2 rounded-full bg-primary" />
                      <p className="font-medium text-xs">
                        {formatInrFromPaise(payment.amountPaise)} paid via{" "}
                        {
                          PAYMENT_METHOD_LABELS[
                            normalizePaymentMethod(payment.method)
                          ]
                        }
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(parseDateOnly(payment.paidAt))}
                        {payment.referenceId
                          ? ` · Ref: ${payment.referenceId}`
                          : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Recorded by {payment.recordedByName ?? "—"}
                      </p>
                      {payment.notes && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {payment.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 border-t pt-4">
              <p className="font-medium text-xs">Owner Payout Status</p>
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {expense.isOwnerDeductible && (
                  <CheckCircle2Icon className="size-3.5 text-success" />
                )}
                {expense.isOwnerDeductible
                  ? "Owner-deductible, not yet compiled into a statement."
                  : "Not marked as owner-deductible."}
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
