import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { useRoomOccupancy } from "../api/use-room-occupancy";
import type { Booking } from "../lib/booking";
import { parseDay } from "../lib/format";
import { StayRangeCalendar } from "./stay-range-calendar";

/** Today as "YYYY-MM-DD" -- a calendar day, never an instant. */
function today() {
  return new Date().toLocaleDateString("en-CA");
}

/**
 * Confirms the day a guest actually arrived or left.
 *
 * Defaults to today, which is the usual case. Setting it earlier or later is
 * what makes an early departure free the room for the nights given up, and an
 * early arrival hold it from when the guest turned up.
 */
export function StayDateDialog({
  booking,
  mode,
  onOpenChange,
  onConfirm,
  isSaving,
}: {
  booking: Booking | null;
  mode: "checked_in" | "checked_out";
  onOpenChange: (open: boolean) => void;
  onConfirm: (effectiveDate: string) => void;
  isSaving?: boolean;
}) {
  // The page mounts this only while a booking is being checked in or out, and
  // a different booking remounts it, so the initial value is always current --
  // no reset effect is needed.
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(() =>
    startOfMonth(parseDay(booking?.checkIn ?? today())),
  );

  const window = useMemo(
    () => ({
      from: format(startOfMonth(month), "yyyy-MM-dd"),
      to: format(endOfMonth(addMonths(month, 1)), "yyyy-MM-dd"),
    }),
    [month],
  );

  // This booking's own room, excluding itself -- so the nights shown as taken
  // are the ones somebody *else* holds.
  const { data: occupancy } = useRoomOccupancy(booking?.id, window);

  if (!booking) return null;

  const isCheckIn = mode === "checked_in";
  const booked = isCheckIn ? booking.checkIn : booking.checkOut;
  const drift = date
    ? differenceInCalendarDays(parseDay(date), parseDay(booked))
    : 0;

  // Checking out on or before the arrival is not a stay.
  const floor = booking.actualCheckIn ?? booking.checkIn;
  const invalid = !isCheckIn && Boolean(date) && date <= floor;

  // A single day, shown as a range so the calendar highlights it.
  const selection: DateRange | undefined = date
    ? { from: parseDay(date), to: parseDay(date) }
    : undefined;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isCheckIn ? "Check In" : "Check Out"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-4 pb-4">
          <div className="border bg-muted/30 px-2.5 py-2 text-xs">
            <p className="font-medium">
              {booking.guestName} · {booking.roomName}
            </p>
            <p className="text-foreground/70">
              Booked {isCheckIn ? "arrival" : "departure"}:{" "}
              {format(parseDay(booked), "MMM d, yyyy")}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-foreground/80 text-xs">
              Actual {isCheckIn ? "arrival" : "departure"} date
            </span>
            {/* Red nights are held by another stay in this same room, so an
                early arrival cannot be picked into someone else's booking. */}
            <StayRangeCalendar
              value={selection}
              onChange={(next) => {
                const picked = next?.to ?? next?.from;
                if (picked) setDate(format(picked, "yyyy-MM-dd"));
              }}
              nights={occupancy?.data?.nights ?? []}
              totalRooms={occupancy?.data?.totalRooms ?? 1}
              month={month}
              onMonthChange={setMonth}
              minDate={isCheckIn ? undefined : parseDay(floor)}
              placeholder={`Pick the ${isCheckIn ? "arrival" : "departure"} date`}
            />
          </div>

          {invalid && (
            <p className="text-destructive text-xs">
              Departure must be after the guest arrived.
            </p>
          )}

          {!invalid && drift !== 0 && (
            <p className="text-[11px] text-warning">
              {Math.abs(drift)} {Math.abs(drift) === 1 ? "day" : "days"}{" "}
              {drift < 0 ? "early" : "late"}.
              {!isCheckIn &&
                drift < 0 &&
                " The room will be free to re-let from this date."}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={!date || invalid || isSaving}
            onClick={() => onConfirm(date)}
          >
            {isSaving
              ? "Saving..."
              : isCheckIn
                ? "Confirm Check In"
                : "Confirm Check Out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
