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
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { PaperclipIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { formatInrFromPaise } from "../lib/format";
import {
  type Expense,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod,
} from "../lib/mock-data";

export function RecordPaymentDialog({
  expense,
  onOpenChange,
  onSave,
}: {
  expense: Expense | null;
  onOpenChange: (open: boolean) => void;
  onSave: (
    expense: Expense,
    payment: {
      amountPaise: number;
      method: PaymentMethod;
      date: Date;
      referenceId?: string;
      notes?: string;
    },
  ) => void;
}) {
  const feedback = useFeedback();
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
  }, [expense?.id]);

  const amountPaise = Math.round((Number(amount) || 0) * 100);
  const newRemainingPaise = Math.max(0, remainingPaise - amountPaise);
  const canSave = expense !== null && amountPaise > 0;

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
              {expense.title} · {expense.vendorName}
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
                  {newRemainingPaise > 0
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

              <button
                type="button"
                className="flex items-center justify-center gap-2 border border-dashed py-2.5 text-muted-foreground text-xs transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                <PaperclipIcon className="size-3.5" />
                Attach Payment Receipt (Optional)
              </button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => {
              if (!expense) {
                return;
              }
              onSave(expense, {
                amountPaise,
                method,
                date: new Date(date),
                referenceId: referenceId.trim() || undefined,
                notes: notes.trim() || undefined,
              });
              feedback.success(
                "Payment recorded",
                `${formatInrFromPaise(amountPaise)} recorded for ${expense.ref}.`,
              );
              onOpenChange(false);
            }}
          >
            Save Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
