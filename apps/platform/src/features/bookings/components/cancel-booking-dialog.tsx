import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Textarea } from "@propertyos/ui/components/textarea";
import { format } from "date-fns";
import { useState } from "react";

import type { Booking } from "../lib/booking";
import { formatInr, parseDay } from "../lib/format";

/** Reasons worth having as one click, with room to write anything else. */
const SUGGESTIONS = [
  "Guest cancelled",
  "No show",
  "Overbooking",
  "Payment failed",
];

/**
 * Confirms a cancellation and takes down why.
 *
 * Cancelling frees the room and cannot be undone from the table, so it asks
 * first. The reason is stored on the booking: a cancellation rate is only
 * useful if you can see what is behind it, and "no show" and "we overbooked"
 * are the same number but very different problems.
 */
export function CancelBookingDialog({
  booking,
  onOpenChange,
  onConfirm,
  isSaving,
}: {
  booking: Booking | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isSaving?: boolean;
}) {
  // A different booking remounts this, so the empty initial value is correct
  // each time it opens -- no reset effect needed.
  const [reason, setReason] = useState("");

  if (!booking) return null;

  const isBlock = booking.kind === "block";
  const paid = booking.amountPaidPaise > 0;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isBlock ? "Remove Block" : "Cancel Booking"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-4 pb-4">
          <div className="border bg-muted/30 px-2.5 py-2 text-xs">
            <p className="font-medium">
              {booking.ref} · {booking.guestName ?? "Blocked"}
            </p>
            <p className="text-foreground/70">
              {booking.roomName} · {format(parseDay(booking.checkIn), "MMM d")}{" "}
              – {format(parseDay(booking.checkOut), "MMM d, yyyy")}
            </p>
          </div>

          <p className="text-foreground/80 text-xs">
            {isBlock
              ? "These dates go back on sale straight away."
              : "The room is released and goes back on sale for these dates."}
          </p>

          {/* Money already taken does not come back on its own -- whoever
              cancels needs to know a refund is still outstanding. */}
          {paid && (
            <p className="border border-warning/40 bg-warning/10 px-2.5 py-2 text-[11px] text-foreground">
              {formatInr(booking.amountPaidPaise)} has already been paid on this
              booking. Cancelling does not refund it.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-foreground/80 text-xs">
              Reason{" "}
              <span className="font-normal text-foreground/60">(optional)</span>
            </span>

            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setReason(option)}
                  className="border px-2 py-1 text-[11px] transition-colors hover:bg-muted/40"
                >
                  {option}
                </button>
              ))}
            </div>

            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this being cancelled?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            disabled={isSaving}
            onClick={() => onConfirm(reason.trim())}
          >
            {isSaving
              ? "Cancelling..."
              : isBlock
                ? "Remove Block"
                : "Cancel Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
