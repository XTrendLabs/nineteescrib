import { Button } from "@propertyos/ui/components/button";
import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@propertyos/ui/components/sheet";
import { useState } from "react";

import {
  type Booking,
  type BookingPaymentMethod,
  toPaise,
} from "../lib/booking";
import { formatInr } from "../lib/format";

/**
 * The methods a front-desk member can record by hand. "online" is deliberately
 * absent: a gateway payment is captured by the checkout flow, not typed in
 * here.
 */
const METHOD_LABELS: Partial<Record<BookingPaymentMethod, string>> = {
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  card: "Card Swipe",
  cash: "Cash",
};

/** Today as "YYYY-MM-DD", the calendar day the API expects. */
function today() {
  return new Date().toLocaleDateString("en-CA");
}

export function SettlePaymentSheet({
  booking,
  onOpenChange,
  onSettled,
  isSaving,
}: {
  booking: Booking | null;
  onOpenChange: (open: boolean) => void;
  onSettled: (input: {
    bookingId: string;
    amountPaise: number;
    method: BookingPaymentMethod;
    paidAt: string;
  }) => void;
  isSaving?: boolean;
}) {
  const dueAmount = booking?.balanceDuePaise ?? 0;
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<BookingPaymentMethod>("upi");
  const [paidAt, setPaidAt] = useState(today);

  const amountPaise = toPaise(amount);
  // The server refuses an overpayment, so the sheet does not offer one --
  // the balance shown here is what the ledger will accept.
  const exceedsBalance = amountPaise > dueAmount;

  return (
    <Sheet
      open={booking !== null}
      onOpenChange={(open) => {
        if (!open) {
          setAmount("");
          setMethod("upi");
          setPaidAt(today());
        }
        onOpenChange(open);
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Collect Payment</SheetTitle>
          <SheetDescription>
            {booking && `${booking.ref} · ${booking.guestName ?? ""}`}
          </SheetDescription>
        </SheetHeader>

        {booking && (
          <div className="flex flex-col gap-4 px-4">
            <div className="flex items-center justify-between border bg-muted/30 p-3">
              <span className="text-muted-foreground text-xs">Balance due</span>
              <span className="font-medium text-sm tabular-nums">
                {formatInr(dueAmount)}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Amount received
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={String(dueAmount / 100)}
              />
              {exceedsBalance && (
                <span className="text-destructive text-xs">
                  That is more than the {formatInr(dueAmount)} still due.
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Payment date
              </span>
              <Input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Payment method
              </span>
              <Select
                value={method}
                onValueChange={(v) => setMethod(v as BookingPaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {(value: unknown) =>
                      METHOD_LABELS[value as BookingPaymentMethod] ?? "UPI"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card Swipe</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <SheetFooter>
          <Button
            disabled={
              !booking ||
              amountPaise <= 0 ||
              exceedsBalance ||
              !paidAt ||
              isSaving
            }
            onClick={() => {
              if (!booking) return;
              onSettled({
                bookingId: booking.id,
                amountPaise,
                method,
                paidAt,
              });
            }}
          >
            {isSaving ? "Recording..." : "Record Payment"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
