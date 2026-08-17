import { Avatar, AvatarFallback } from "@propertyos/ui/components/avatar";
import { Button } from "@propertyos/ui/components/button";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { format } from "date-fns";
import { HomeIcon, ZapIcon } from "lucide-react";
import { useState } from "react";
import { formatInrFromPaise, getInitials } from "../lib/format";
import type { Booking } from "../lib/mock-data";
import { nightsBetween } from "../lib/mock-data";

const SOURCE_LABEL: Record<Booking["source"], string> = {
  direct: "Direct",
  airbnb: "Airbnb",
  booking_com: "Booking.com",
};

const SOURCE_ICON = {
  direct: null,
  airbnb: HomeIcon,
  booking_com: ZapIcon,
} as const;

const PAYMENT_LABEL: Record<Booking["paymentStatus"], string> = {
  paid: "Paid",
  partial: "Partial",
  unpaid: "Unpaid",
};

export function BookingQuickView({
  booking,
  unitLabel,
  onEdit,
}: {
  booking: Booking;
  unitLabel: string;
  onEdit?: () => void;
}) {
  const feedback = useFeedback();
  const [checkedIn, setCheckedIn] = useState(booking.checkedIn);
  const SourceIcon = SOURCE_ICON[booking.source];
  const nights = nightsBetween(booking.checkIn, booking.checkOut);

  return (
    <div className="flex w-full min-w-80 max-w-80 flex-col gap-3 overflow-y-auto p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{getInitials(booking.guestName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{booking.guestName}</p>
            <p className="text-[11px] text-muted-foreground">
              {booking.bookingRef}
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
          <p className="text-muted-foreground">Tariff</p>
          <p className="font-medium">
            {formatInrFromPaise(booking.tariffPaise)}
          </p>
        </div>
        <span className={cnStatus(booking.paymentStatus)}>
          {PAYMENT_LABEL[booking.paymentStatus]}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => {
              setCheckedIn((prev) => !prev);
              feedback.success(
                checkedIn ? "Guest checked out" : "Guest checked in",
                booking.guestName,
              );
            }}
          >
            {checkedIn ? "Check Out" : "Check In"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() =>
              feedback.success(
                "Payment link sent",
                `A settlement link was sent for ${booking.bookingRef}.`,
              )
            }
          >
            Settle Balance
          </Button>
        </div>
        <Button size="sm" variant="secondary" onClick={onEdit}>
          Edit booking
        </Button>
      </div>
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
