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

import { formatInr } from "../lib/format";
import type { Booking } from "../lib/mock-data";

const METHOD_LABELS: Record<string, string> = {
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  card: "Card Swipe",
  cash: "Cash",
};

export function SettlePaymentSheet({
  booking,
  onOpenChange,
  onSettled,
}: {
  booking: Booking | null;
  onOpenChange: (open: boolean) => void;
  onSettled: (bookingId: string, amountPaise: number) => void;
}) {
  const dueAmount = booking ? booking.totalPaise - booking.paidPaise : 0;
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("upi");

  return (
    <Sheet
      open={booking !== null}
      onOpenChange={(open) => {
        if (!open) {
          setAmount("");
          setMethod("upi");
        }
        onOpenChange(open);
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Collect Payment</SheetTitle>
          <SheetDescription>
            {booking && `${booking.ref} · ${booking.guestName}`}
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
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Payment method
              </span>
              <Select
                value={method}
                onValueChange={(v) => setMethod(v as string)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {(value: unknown) =>
                      METHOD_LABELS[value as string] ?? "UPI"
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
            disabled={!booking || !amount}
            onClick={() => {
              if (!booking) return;
              onSettled(booking.id, Math.round(Number(amount) * 100));
              setAmount("");
              setMethod("upi");
            }}
          >
            Record Payment
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
