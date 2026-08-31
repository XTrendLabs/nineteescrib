import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@propertyos/ui/components/sheet";
import { useBookingAudit } from "../api/use-booking-audit";
import type { Booking } from "../lib/booking";
import { formatInr, formatStayRange, formatTimestamp } from "../lib/format";
import { SourceBadge } from "./source-badge";
import { StatusPill } from "./status-pill";

export function AuditDrawer({
  booking,
  onOpenChange,
}: {
  booking: Booking | null;
  onOpenChange: (open: boolean) => void;
}) {
  // Fetched per booking rather than joined onto the list -- only the open
  // drawer's trail is ever read.
  const { data, isLoading } = useBookingAudit(booking?.id);
  const events = data?.data ?? [];

  return (
    <Sheet open={booking !== null} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-lg">
            {booking?.ref}
          </SheetTitle>
          <SheetDescription>Booking audit history</SheetDescription>
        </SheetHeader>

        {booking && (
          <div className="flex flex-col gap-4 px-4">
            <div className="flex items-center justify-between border bg-muted/30 p-3">
              <div>
                <p className="font-medium text-sm">
                  {booking.guestName ?? "Room block"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {booking.guestPhone ?? ""}
                </p>
              </div>
              <StatusPill status={booking.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Property</p>
                <p className="mt-0.5 font-medium">{booking.propertyName}</p>
                <p className="text-muted-foreground">{booking.roomName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Stay</p>
                <p className="mt-0.5 font-medium">
                  {formatStayRange(booking.checkIn, booking.checkOut)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Source</p>
                <div className="mt-1">
                  <SourceBadge source={booking.source} />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Price</p>
                <p className="mt-0.5 font-medium tabular-nums">
                  {formatInr(booking.amountPaidPaise)} paid /{" "}
                  {formatInr(booking.balanceDuePaise)} due
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="mb-3 font-medium text-sm">Timeline</p>
              <div className="flex flex-col gap-4">
                {isLoading && (
                  <p className="text-muted-foreground text-xs">
                    Loading timeline...
                  </p>
                )}
                {!isLoading && events.length === 0 && (
                  <p className="text-muted-foreground text-xs">
                    Nothing recorded yet.
                  </p>
                )}
                {events.map((event, i) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="mt-1 size-1.5 rounded-full bg-primary" />
                      {i < events.length - 1 && (
                        <div className="mt-1 w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className="text-[11px] text-muted-foreground">
                        {formatTimestamp(event.createdAt)}
                        {event.actorName ? ` · ${event.actorName}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
