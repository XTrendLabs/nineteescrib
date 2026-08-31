import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, startOfMonth, startOfWeek } from "date-fns";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { useCreateBooking } from "@/features/bookings/api/use-create-booking";
import { useUpdateBooking } from "@/features/bookings/api/use-update-booking";
import type { NewBookingInput } from "@/features/bookings/components/create-booking-dialog";
import { CreateBookingDialog } from "@/features/bookings/components/create-booking-dialog";
import type { Booking as ApiBooking } from "@/features/bookings/lib/booking";
import { parseDay } from "@/features/bookings/lib/format";
import { resolveBookingProperties } from "@/features/bookings/lib/property";
import {
  invalidateCalendar,
  useCalendarBookings,
  useInventory,
  useNextBookingDate,
} from "@/features/calendar/api/use-calendar";
import { CalendarHeader } from "@/features/calendar/components/calendar-header";
import { Legend } from "@/features/calendar/components/legend";
import type { QuickCreateSelection } from "@/features/calendar/components/quick-create-dialog";
import { QuickCreateDialog } from "@/features/calendar/components/quick-create-dialog";
import type { RangeMode } from "@/features/calendar/components/range-mode-toggle";
import { TimelineGrid } from "@/features/calendar/components/timeline-grid";
import type { CalendarView } from "@/features/calendar/components/view-toggle";
import {
  buildInventory,
  type CalendarBooking,
  toCalendarBooking,
} from "@/features/calendar/lib/calendar";
import { useProperties } from "@/features/properties/api/use-properties";
import { getApiErrorMessage } from "@/shared/lib/api-error";

export const Route = createFileRoute("/(protected)/calendar")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeScopeId } = useActiveHq();
  const { data: propertiesResponse } = useProperties(activeScopeId);

  const [month, setMonth] = useState(new Date());
  const [view, setView] = useState<CalendarView>("detailed");
  const [rangeMode, setRangeMode] = useState<RangeMode>("month");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [quickSelection, setQuickSelection] =
    useState<QuickCreateSelection | null>(null);
  // Choosing "new booking" hands off to the full create dialog, which already
  // does guest lookup, availability and pricing properly.
  const [bookingOpen, setBookingOpen] = useState(false);

  const feedback = useFeedback();
  const updateBooking = useUpdateBooking();
  const createBooking = useCreateBooking();

  /**
   * Jump to the month holding the next stay, once, on first load.
   *
   * Only when today's month is empty -- someone who opened the calendar to
   * check this week should not be thrown forward to next quarter.
   */
  const { data: nextDate } = useNextBookingDate(activeScopeId, propertyFilter);
  const [jumped, setJumped] = useState(false);

  const allProperties = useMemo(
    () => resolveBookingProperties(propertiesResponse?.data),
    [propertiesResponse?.data],
  );

  const days = useMemo(() => {
    if (rangeMode === "day") {
      return [month];
    }
    if (rangeMode === "week") {
      const start = startOfWeek(month);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const start = startOfMonth(month);
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => addDays(start, i));
  }, [month, rangeMode]);

  const { data: inventoryResponse } = useInventory(
    activeScopeId,
    propertyFilter,
  );

  const inventory = useMemo(
    () => buildInventory(inventoryResponse?.data ?? []),
    [inventoryResponse?.data],
  );

  const allUnits = useMemo(
    () => inventory.flatMap((p) => p.roomTypes.flatMap((rt) => rt.units)),
    [inventory],
  );

  // The window the grid is showing, so only the bookings on screen are fetched.
  const window = useMemo(() => {
    const first = days[0] ?? month;
    const last = days[days.length - 1] ?? month;
    return {
      from: format(first, "yyyy-MM-dd"),
      // Exclusive, and a stay running past the last visible day still has to
      // be drawn, so the window ends the day after.
      to: format(addDays(last, 1), "yyyy-MM-dd"),
    };
  }, [days, month]);

  const {
    data: bookingsResponse,
    // isLoading: loadingBookings,
    // error: bookingsError,
  } = useCalendarBookings(activeScopeId, window, propertyFilter);

  const bookings = useMemo(
    () =>
      ((bookingsResponse?.data ?? []) as ApiBooking[]).map(toCalendarBooking),
    [bookingsResponse?.data],
  );

  if (!jumped && nextDate?.data?.checkIn) {
    const target = parseDay(nextDate.data.checkIn);
    setJumped(true);
    if (
      target.getFullYear() !== month.getFullYear() ||
      target.getMonth() !== month.getMonth()
    ) {
      setMonth(target);
    }
  }

  function handleCreateBooking(input: NewBookingInput) {
    createBooking.mutate(
      { json: input },
      {
        onSuccess: () => {
          invalidateCalendar();
          setBookingOpen(false);
          feedback.success(
            "Booking created",
            `${input.guest.name} has been booked in.`,
          );
        },
        onError: (error) => {
          feedback.error(
            "Couldn't create booking",
            getApiErrorMessage(error, "Something went wrong. Try again."),
          );
        },
      },
    );
  }

  /** The property a room sits under, which the create endpoint needs. */
  function propertyForUnit(unitId: string | undefined) {
    if (!unitId) return undefined;
    return inventory.find((p) =>
      p.roomTypes.some((rt) => rt.units.some((u) => u.id === unitId)),
    )?.propertyId;
  }

  /**
   * Persists a booking dragged to another room.
   *
   * The grid hands back the whole list with one booking moved, so the changed
   * row is found by comparing against what the server last returned -- the
   * timeline has no notion of which edit it just made.
   */
  function handleBookingsChange(next: CalendarBooking[]) {
    const moved = next.find((b) => {
      const before = bookings.find((x) => x.id === b.id);
      return before && before.unitId !== b.unitId;
    });

    if (!moved) return;

    updateBooking.mutate(
      { param: { id: moved.id }, json: { roomId: moved.unitId } },
      {
        onSuccess: () => {
          invalidateCalendar();
        },
        onError: (error) => {
          feedback.error(
            "Couldn't move booking",
            getApiErrorMessage(error, "Something went wrong. Try again."),
          );
          // The grid moved it optimistically; refetching puts it back.
          invalidateCalendar();
        },
      },
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      /**
       * The protected layout already hands each page a constrained flex column
       * under the 4rem header, so this fills it rather than computing a height
       * of its own -- a `calc` here double-counted the layout's padding and
       * left a gap at the bottom.
       */
      className="flex h-full min-h-0 min-w-0 flex-col gap-4 p-4"
    >
      <CalendarHeader
        month={month}
        onMonthChange={setMonth}
        view={view}
        onViewChange={setView}
        rangeMode={rangeMode}
        onRangeModeChange={setRangeMode}
        properties={allProperties}
        propertyFilter={propertyFilter}
        onPropertyFilterChange={setPropertyFilter}
        onAddBlock={() => {
          const firstUnit = allUnits[0];
          if (!firstUnit) return;

          const checkIn = new Date();
          const checkOut = new Date(
            checkIn.getFullYear(),
            checkIn.getMonth(),
            checkIn.getDate() + 1,
          );
          setQuickSelection({
            unitId: firstUnit.id,
            unitLabel: firstUnit.label,
            roomType: firstUnit.roomType,
            checkIn,
            checkOut,
          });
        }}
      />

      <div className="flex min-h-0 min-w-0 max-w-content flex-1 flex-col border [--content-inset:4rem]">
        <TimelineGrid
          inventory={inventory}
          bookings={bookings}
          onBookingsChange={handleBookingsChange}
          days={days}
          view={view}
          onRequestCreate={setQuickSelection}
        />
        <Legend />
      </div>

      <QuickCreateDialog
        selection={quickSelection}
        propertyId={propertyForUnit(quickSelection?.unitId)}
        onOpenChange={(open) => !open && setQuickSelection(null)}
        onCreated={() => invalidateCalendar()}
        onRequestBooking={() => setBookingOpen(true)}
      />

      <CreateBookingDialog
        open={bookingOpen}
        properties={allProperties}
        onOpenChange={setBookingOpen}
        onCreate={handleCreateBooking}
        isSaving={createBooking.isPending}
      />
    </motion.div>
  );
}
