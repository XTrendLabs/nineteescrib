import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { cn } from "@propertyos/ui/lib/utils";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { CheckIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { getApiErrorMessage } from "@/shared/lib/api-error";
import {
  useExtendBooking,
  useExtensionOptions,
} from "../api/use-extend-booking";
import { useOccupancy } from "../api/use-occupancy";
import { type Booking, priceStay } from "../lib/booking";
import { formatBookedRange, formatInr, parseDay } from "../lib/format";
import { StayRangeCalendar } from "./stay-range-calendar";

export function ExtendStayDialog({
  booking,
  onOpenChange,
  onExtended,
}: {
  booking: Booking | null;
  onOpenChange: (open: boolean) => void;
  onExtended: () => void;
}) {
  const feedback = useFeedback();
  const extend = useExtendBooking();

  const [checkOut, setCheckOut] = useState("");
  const [roomId, setRoomId] = useState("");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  // Reset whenever a different booking is opened, so the form never carries
  // the previous stay's dates or room choice.
  useEffect(() => {
    setCheckOut("");
    setRoomId("");
    // Opens on the month the stay currently ends in, which is where the extra
    // nights will be.
    setMonth(
      booking
        ? startOfMonth(parseDay(booking.checkOut))
        : startOfMonth(new Date()),
    );
  }, [booking?.id, booking?.checkOut, booking]);

  const occupancyWindow = useMemo(
    () => ({
      from: format(startOfMonth(month), "yyyy-MM-dd"),
      to: format(endOfMonth(addMonths(month, 1)), "yyyy-MM-dd"),
    }),
    [month],
  );

  const { data: occupancy } = useOccupancy({
    propertyId: booking?.organizationId,
    from: occupancyWindow.from,
    to: occupancyWindow.to,
  });

  // The stay's existing nights, shown as the fixed half of the range so it is
  // clear what is being extended.
  const range: DateRange | undefined = booking
    ? {
        from: parseDay(booking.checkIn),
        to: checkOut ? parseDay(checkOut) : parseDay(booking.checkOut),
      }
    : undefined;

  const { data, isLoading } = useExtensionOptions(booking?.id, checkOut);
  const options = data?.data;
  const rooms = options?.rooms ?? [];

  const currentRoom = rooms.find((r) => r.id === booking?.roomId);
  const canKeepRoom = options?.canKeepRoom ?? false;

  // Keeping the room needs no choice; moving does, so nothing is assumed.
  const effectiveRoomId = canKeepRoom ? (booking?.roomId ?? "") : roomId;
  const chosenRoom = rooms.find((r) => r.id === effectiveRoomId);

  // The extra nights are priced from whichever room the guest will be in.
  const pricing =
    booking && chosenRoom && checkOut > booking.checkOut
      ? priceStay({
          checkIn: booking.checkOut,
          checkOut,
          weekdayPrice: chosenRoom.weekdayPrice,
          weekendPrice: chosenRoom.weekendPrice,
          discountValue: "",
          discountKind: "amount",
          gstRateBps: 0,
          gstInclusive: false,
        })
      : null;

  const canSave =
    booking &&
    checkOut > booking.checkOut &&
    Boolean(effectiveRoomId) &&
    !extend.isPending;

  function handleSave() {
    if (!booking || !canSave) return;

    extend.mutate(
      {
        param: { id: booking.id },
        json: {
          checkOut,
          // Only sent when the guest is moving; omitted means "keep the room".
          ...(canKeepRoom ? {} : { roomId }),
          totalAmountPaise: canKeepRoom
            ? booking.totalAmountPaise + (pricing?.totalPaise ?? 0)
            : (pricing?.totalPaise ?? 0),
        },
      },
      {
        onSuccess: () => {
          onExtended();
          feedback.success(
            "Stay extended",
            canKeepRoom
              ? `${booking.ref} now runs to ${checkOut}.`
              : `${booking.ref} continues in another room to ${checkOut}.`,
          );
          onOpenChange(false);
        },
        onError: (error) => {
          feedback.error(
            "Couldn't extend stay",
            getApiErrorMessage(error, "Something went wrong. Try again."),
          );
        },
      },
    );
  }

  return (
    <Dialog open={booking !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Extend Stay</DialogTitle>
        </DialogHeader>

        {booking && (
          <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto px-4 pb-4">
            <div className="border bg-muted/30 px-2.5 py-2 text-xs">
              <p className="font-medium">
                {booking.guestName} · {booking.roomName}
              </p>
              <p className="text-foreground/70">
                Currently {format(parseDay(booking.checkIn), "MMM d")} –{" "}
                {format(parseDay(booking.checkOut), "MMM d")}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-medium text-foreground/80 text-xs">
                New check-out *
              </span>
              <StayRangeCalendar
                value={range}
                onChange={(next) => {
                  // Only the end moves: the stay's check-in is already fixed,
                  // so a pick that lands before the current check-out is not
                  // an extension and is ignored.
                  const picked = next?.to ?? next?.from;
                  if (!picked) return;
                  const day = format(picked, "yyyy-MM-dd");
                  if (day <= booking.checkOut) return;
                  setCheckOut(day);
                  setRoomId("");
                }}
                nights={occupancy?.data?.nights ?? []}
                totalRooms={occupancy?.data?.totalRooms ?? 0}
                month={month}
                onMonthChange={setMonth}
                minDate={parseDay(booking.checkOut)}
                placeholder="Pick a new check-out date"
              />
            </div>

            {checkOut > booking.checkOut && (
              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-foreground/80 text-xs">
                  Room for the extra nights
                </span>

                {isLoading ? (
                  <p className="border border-dashed px-3 py-4 text-center text-foreground/70 text-xs">
                    Checking availability...
                  </p>
                ) : canKeepRoom ? (
                  <div className="flex items-center gap-2 border border-success/40 bg-success/10 px-2.5 py-2 text-xs">
                    <CheckIcon className="size-3.5 shrink-0 text-success" />
                    <span>
                      {booking.roomName} is free — the guest stays put.
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] text-destructive">
                      {booking.roomName} is taken
                      {currentRoom && currentRoom.conflicts.length > 0
                        ? ` (${currentRoom.conflicts
                            .map((c) =>
                              formatBookedRange(c.checkIn, c.checkOut),
                            )
                            .join(", ")})`
                        : ""}
                      . Pick another room for the extra nights.
                    </p>

                    {rooms.filter(
                      (r) =>
                        r.conflicts.length === 0 && r.id !== booking.roomId,
                    ).length === 0 ? (
                      <p className="border border-dashed px-3 py-4 text-center text-foreground/70 text-xs">
                        No rooms are free for those nights.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {rooms
                          .filter(
                            (r) =>
                              r.conflicts.length === 0 &&
                              r.id !== booking.roomId,
                          )
                          .map((room) => (
                            <button
                              key={room.id}
                              type="button"
                              onClick={() => setRoomId(room.id)}
                              className={cn(
                                "flex items-center justify-between gap-3 border px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted/40",
                                roomId === room.id &&
                                  "border-primary bg-primary/5",
                              )}
                            >
                              <div>
                                <p className="font-medium">{room.name}</p>
                                <p className="text-[11px] text-foreground/70">
                                  {room.roomType.replace("_", " ")} · ₹
                                  {room.weekdayPrice}
                                </p>
                              </div>
                              {roomId === room.id && (
                                <CheckIcon className="size-3.5 shrink-0 text-primary" />
                              )}
                            </button>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {pricing && (
              <div className="flex items-baseline justify-between border bg-muted/30 px-2.5 py-2 text-xs">
                <span className="text-foreground/70">
                  {pricing.nights} extra{" "}
                  {pricing.nights === 1 ? "night" : "nights"}
                </span>
                <span className="font-medium tabular-nums">
                  {formatInr(pricing.totalPaise)}
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={extend.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={!canSave} onClick={handleSave}>
            {extend.isPending ? "Extending..." : "Extend Stay"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
