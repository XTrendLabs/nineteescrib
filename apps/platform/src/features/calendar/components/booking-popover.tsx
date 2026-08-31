import { Avatar, AvatarFallback } from "@propertyos/ui/components/avatar";
import { Button } from "@propertyos/ui/components/button";
import { cn } from "@propertyos/ui/lib/utils";
import { format } from "date-fns";
import { HomeIcon, ZapIcon } from "lucide-react";
import type { CalendarBooking as Booking } from "../lib/calendar";
import { nightsBetween } from "../lib/calendar";
import { formatInrFromPaise, getInitials } from "../lib/format";

const SOURCE_LABEL: Record<Booking["source"], string> = {
  direct: "Direct",
  manual: "Manual",
  airbnb: "Airbnb",
  booking_com: "Booking.com",
};

/** Channels get a mark; a booking taken by hand or on the site does not. */
const SOURCE_ICON: Record<Booking["source"], typeof HomeIcon | null> = {
  direct: null,
  manual: null,
  airbnb: HomeIcon,
  booking_com: ZapIcon,
};

const PAYMENT_LABEL: Record<Booking["paymentStatus"], string> = {
  paid: "Paid",
  partial: "Partial",
  unpaid: "Unpaid",
};

/** What the quick view can ask the page to do. */
export type BookingQuickAction =
  | "check_in"
  | "check_out"
  | "settle"
  | "edit"
  | "cancel";

/**
 * Which actions a stay is actually open to.
 *
 * Driven off the status rather than shown unconditionally: offering "Check In"
 * on a guest who left a week ago invites a click that can only fail, since the
 * server refuses the transition anyway. Settling is offered only while money
 * is outstanding, for the same reason -- there is nothing to settle at zero.
 */
function availableActions(booking: Booking): BookingQuickAction[] {
  if (booking.kind !== "reservation") {
    return ["cancel"];
  }

  const actions: BookingQuickAction[] = [];

  if (booking.status === "pending" || booking.status === "confirmed") {
    actions.push("check_in");
  }

  if (booking.status === "checked_in") {
    actions.push("check_out");
  }

  // A cancelled or departed stay can still owe money, and that balance is
  // real -- a no-show who never paid is still a debt worth chasing.
  if (booking.paymentStatus !== "paid") {
    actions.push("settle");
  }

  // Editing dates or the room only means anything while the stay is live.
  if (booking.status !== "checked_out" && booking.status !== "cancelled") {
    actions.push("edit", "cancel");
  }

  return actions;
}

/** Short enough that three or four sit on one row without wrapping. */
const ACTION_LABEL: Record<BookingQuickAction, string> = {
  check_in: "Check In",
  check_out: "Check Out",
  settle: "Settle",
  edit: "Edit",
  cancel: "Cancel",
};

const STATUS_LABEL: Record<Booking["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  checked_out: "Checked out",
  cancelled: "Cancelled",
};

export function BookingQuickView({
  booking,
  unitLabel,
  onAction,
}: {
  booking: Booking;
  unitLabel: string;
  /**
   * Raised for the page to handle: the dialogs these open need the full API
   * booking and the mutations, both of which live up there. Keeping them out
   * of the grid avoids a second copy of each dialog inside the timeline.
   */
  onAction?: (action: BookingQuickAction, booking: Booking) => void;
}) {
  const SourceIcon = SOURCE_ICON[booking.source];
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const actions = availableActions(booking);

  return (
    <div className="flex w-full min-w-80 max-w-full flex-col gap-3 overflow-y-auto p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{getInitials(booking.guestName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{booking.guestName}</p>
            <p className="text-[11px] text-muted-foreground">
              {booking.bookingRef} · {STATUS_LABEL[booking.status]}
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 border px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase tracking-wide">
          {SourceIcon && <SourceIcon className="size-3" />}
          {SOURCE_LABEL[booking.source]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 border-y py-2 text-xs">
        <div className="col-span-2">
          <p className="text-muted-foreground">Stay</p>
          <p className="font-medium">
            {format(booking.checkIn, "MMM d")} –{" "}
            {format(booking.checkOut, "MMM d")} · {nights}{" "}
            {nights === 1 ? "night" : "nights"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Guests</p>
          <p className="font-medium">{booking.guests}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Unit</p>
          <p className="font-medium">{unitLabel}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div>
          <p className="text-muted-foreground">Price</p>
          <p className="font-medium">
            {formatInrFromPaise(booking.tariffPaise)}
          </p>
        </div>
        <span className={cnStatus(booking.paymentStatus)}>
          {PAYMENT_LABEL[booking.paymentStatus]}
        </span>
      </div>

      {actions.length > 0 && (
        // One row: these are peers, and stacking them made a short popover
        // twice as tall for no gain in clarity. Cancel is last and quiet, so
        // the destructive one is not the easiest thing to hit.
        <div className="flex flex-wrap gap-1.5">
          {actions.map((action) => (
            <Button
              key={action}
              size="sm"
              variant={
                action === "check_in" || action === "check_out"
                  ? "default"
                  : action === "cancel"
                    ? "ghost"
                    : "outline"
              }
              className={cn(
                "flex-1 whitespace-nowrap",
                action === "cancel" && "text-destructive",
              )}
              onClick={() => onAction?.(action, booking)}
            >
              {ACTION_LABEL[action]}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function cnStatus(status: Booking["paymentStatus"]) {
  const base = "px-1.5 py-0.5 text-[10px] uppercase tracking-wide";
  if (status === "paid") {
    return `${base} border border-success/30 bg-success/10 text-success`;
  }
  if (status === "partial") {
    return `${base} border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400`;
  }
  return `${base} border border-destructive/30 bg-destructive/10 text-destructive`;
}
