import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { useEffect, useState } from "react";
import type { Expense } from "../lib/expense";
import { formatInrFromPaise } from "../lib/format";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod,
} from "../lib/mock-data";

export function RecordPaymentDialog({
  expense,
  isPending = false,
  onOpenChange,
  onSave,
}: {
  expense: Expense | null;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    expense: Expense,
    payment: {
      amountPaise: number;
      method: PaymentMethod;
      paidAt: string;
      referenceId?: string;
      notes?: string;
    },
  ) => void;
}) {
  const remainingPaise = expense
    ? expense.totalAmountPaise - expense.amountPaidPaise
    : 0;

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [referenceId, setReferenceId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (expense) {
      setAmount((remainingPaise / 100).toString());
      setMethod("upi");
      setDate(new Date().toISOString().slice(0, 10));
      setReferenceId("");
      setNotes("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expense?.id, remainingPaise, expense]);

  const amountPaise = Math.round((Number(amount) || 0) * 100);
  const newRemainingPaise = Math.max(0, remainingPaise - amountPaise);
  // The server refuses an overpayment outright, so the dialog stops it here
  // rather than letting someone submit an amount that cannot succeed.
  const canSave =
    expense !== null &&
    amountPaise > 0 &&
    amountPaise <= remainingPaise &&
    !isPending;

  return (
    <Dialog open={expense !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Record Payment{expense ? ` — ${expense.ref}` : ""}
          </DialogTitle>
        </DialogHeader>

        {expense && (
          <div className="flex flex-col gap-5 px-4 pb-4">
            <p className="text-muted-foreground text-xs">
              {expense.title} · {expense.vendorName ?? "—"}
            </p>

            <div className="grid grid-cols-3 gap-3 border bg-muted/30 p-3 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">
                  {formatInrFromPaise(expense.totalAmountPaise)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Previously Paid</span>
                <span className="font-medium">
                  {formatInrFromPaise(expense.amountPaidPaise)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-medium">
                  {formatInrFromPaise(remainingPaise)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">
                  Payment Amount *
                </span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 2500"
                />
                <span className="text-[11px] text-muted-foreground">
                  {amountPaise > remainingPaise
                    ? `Cannot exceed the ${formatInrFromPaise(remainingPaise)} remaining`
                    : newRemainingPaise > 0
                      ? `Leaves ${formatInrFromPaise(newRemainingPaise)} remaining balance`
                      : "Fully settles this expense"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs">
                    Payment Method *
                  </span>
                  <Select
                    value={method}
                    onValueChange={(v) => setMethod(v as PaymentMethod)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Method">
                        {PAYMENT_METHOD_LABELS[method]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {PAYMENT_METHOD_LABELS[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs">
                    Payment Date *
                  </span>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">
                  Reference / Txn ID
                </span>
                <Input
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="e.g. UPI/9876543210"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">
                  Notes / Remarks
                </span>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid 2nd installment"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => {
              if (!expense) {
                return;
              }
              // The toast and the close belong to the caller: only it knows
              // whether the payment actually landed.
              onSave(expense, {
                amountPaise,
                method,
                paidAt: date,
                referenceId: referenceId.trim() || undefined,
                notes: notes.trim() || undefined,
              });
            }}
          >
            {isPending ? "Saving..." : "Save Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
