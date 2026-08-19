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
import { useEffect, useState } from "react";
import { formatInrFromPaise } from "../lib/format";
import {
  type Invoice,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "../lib/mock-data";

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  "razorpay_upi",
  "cash",
  "bank_transfer",
  "card",
];

export function RecordPaymentDialog({
  invoice,
  onOpenChange,
  onSave,
}: {
  invoice: Invoice | null;
  onOpenChange: (open: boolean) => void;
  onSave: (
    invoice: Invoice,
    payment: {
      amountPaise: number;
      method: PaymentMethod;
      transactionId?: string;
    },
  ) => void;
}) {
  const feedback = useFeedback();
  const remainingPaise = invoice
    ? invoice.totalPaise - invoice.amountPaidPaise
    : 0;

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("razorpay_upi");
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    if (invoice) {
      setAmount((remainingPaise / 100).toString());
      setMethod("razorpay_upi");
      setTransactionId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id]);

  const amountPaise = Math.round((Number(amount) || 0) * 100);
  const newRemainingPaise = Math.max(0, remainingPaise - amountPaise);
  const canSave = invoice !== null && amountPaise > 0;

  return (
    <Dialog open={invoice !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Record Payment{invoice ? ` — ${invoice.invoiceNumber}` : ""}
          </DialogTitle>
        </DialogHeader>

        {invoice && (
          <div className="flex flex-col gap-5 px-4 pb-4">
            <p className="text-muted-foreground text-xs">
              {invoice.guestName} · {invoice.propertyName}
            </p>

            <div className="grid grid-cols-3 gap-3 border bg-muted/30 p-3 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">
                  {formatInrFromPaise(invoice.totalPaise)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Previously Paid</span>
                <span className="font-medium">
                  {formatInrFromPaise(invoice.amountPaidPaise)}
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
                  placeholder="e.g. 5000"
                />
                <span className="text-[11px] text-muted-foreground">
                  {newRemainingPaise > 0
                    ? `Leaves ${formatInrFromPaise(newRemainingPaise)} remaining balance`
                    : "Fully settles this invoice"}
                </span>
              </div>

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
                  Transaction ID
                </span>
                <Input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Optional"
                />
              </div>
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
              if (!invoice) {
                return;
              }
              onSave(invoice, {
                amountPaise,
                method,
                transactionId: transactionId.trim() || undefined,
              });
              feedback.success(
                "Payment recorded",
                `${formatInrFromPaise(amountPaise)} recorded for ${invoice.invoiceNumber}.`,
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
