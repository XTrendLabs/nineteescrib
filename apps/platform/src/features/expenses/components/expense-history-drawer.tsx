import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@propertyos/ui/components/sheet";
import { CheckCircle2Icon, PaperclipIcon } from "lucide-react";
import { formatDateTime, formatInrFromPaise } from "../lib/format";
import {
  CATEGORY_LABELS,
  type Expense,
  HQ_SHARED_ID,
  PAYMENT_METHOD_LABELS,
} from "../lib/mock-data";
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
                  {expense.vendorName} ·{" "}
                  {expense.propertyId === HQ_SHARED_ID
                    ? "HQ / Shared"
                    : expense.propertyName}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={expense.category} />
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
                    {CATEGORY_LABELS[expense.category]}
                  </span>
                </div>
                {expense.taxAmountPaise > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">Tax / GST</span>
                    <span className="font-medium">
                      {formatInrFromPaise(expense.taxAmountPaise)}
                    </span>
                  </div>
                )}
                {expense.vendorGstin && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">Vendor GSTIN</span>
                    <span className="font-medium">{expense.vendorGstin}</span>
                  </div>
                )}
              </div>

              {expense.hasReceipt && (
                <div className="flex w-fit items-center gap-1.5 border px-2 py-1 text-[11px] text-muted-foreground">
                  <PaperclipIcon className="size-3" />
                  Receipt attached
                </div>
              )}
            </div>

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
                        {PAYMENT_METHOD_LABELS[payment.method]}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDateTime(payment.date)}
                        {payment.referenceId
                          ? ` · Ref: ${payment.referenceId}`
                          : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Recorded by {payment.recordedBy}
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
              {expense.ownerPayoutStatus === "compiled" ? (
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <CheckCircle2Icon className="size-3.5 text-success" />
                  {expense.ownerPayoutStatementLabel ??
                    "Included in a finalized owner statement"}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  {expense.isOwnerDeductible
                    ? "Owner-deductible, not yet compiled into a statement."
                    : "Not marked as owner-deductible."}
                </p>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
