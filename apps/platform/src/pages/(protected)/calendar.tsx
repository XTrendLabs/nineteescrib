import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, startOfMonth, startOfWeek } from "date-fns";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { useCancelBooking } from "@/features/bookings/api/use-cancel-booking";
import { useChangeBookingStatus } from "@/features/bookings/api/use-change-booking-status";
import { useCreateBooking } from "@/features/bookings/api/use-create-booking";
import { useRecordBookingPayment } from "@/features/bookings/api/use-record-booking-payment";
import { useUpdateBooking } from "@/features/bookings/api/use-update-booking";
import { CancelBookingDialog } from "@/features/bookings/components/cancel-booking-dialog";
import type { NewBookingInput } from "@/features/bookings/components/create-booking-dialog";
import { CreateBookingDialog } from "@/features/bookings/components/create-booking-dialog";
import { SettlePaymentSheet } from "@/features/bookings/components/settle-payment-sheet";
import { StayDateDialog } from "@/features/bookings/components/stay-date-dialog";
import type { Booking as ApiBooking } from "@/features/bookings/lib/booking";
import { parseDay } from "@/features/bookings/lib/format";
import { resolveBookingProperties } from "@/features/bookings/lib/property";
import {
  invalidateCalendar,
  useCalendarBookings,
  useInventory,
  useNextBookingDate,
} from "@/features/calendar/api/use-calendar";
import type { BookingQuickAction } from "@/features/calendar/components/booking-popover";
import { CalendarHeader } from "@/features/calendar/components/calendar-header";
import { Legend } from "@/features/calendar/components/legend";
import type { QuickCreateSelection } from "@/features/calendar/components/quick-create-dialog";
import { QuickCreateDialog } from "@/features/calendar/components/quick-create-dialog";
import type { RangeMode } from "@/features/calendar/components/range-mode-toggle";
import { TimelineGrid } from "@/features/calendar/components/timeline-grid";
import {
  buildInventory,
  type CalendarBooking,
  toCalendarBooking,
} from "@/features/calendar/lib/calendar";
import { useProperties } from "@/features/properties/api/use-properties";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { useActiveView } from "@/shared/lib/use-active-view";

export const Route = createFileRoute("/(protected)/calendar")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeScopeId } = useActiveHq();
  const { activeView } = useActiveView();
  const { data: propertiesResponse } = useProperties(activeScopeId);

  const [month, setMonth] = useState(new Date());
  const [rangeMode, setRangeMode] = useState<RangeMode>("month");
  // Empty until the properties load, then settled below -- the calendar
  // always draws exactly one property, so there is no "all" to fall back to.
  const [propertyFilter, setPropertyFilter] = useState("");
  const [quickSelection, setQuickSelection] =
    useState<QuickCreateSelection | null>(null);
  // Choosing "new booking" hands off to the full create dialog, which already
  // does guest lookup, availability and pricing properly.
  const [bookingOpen, setBookingOpen] = useState(false);

  // The quick view raises actions; the dialogs that serve them live here
  // because they need the full API booking and the mutations, not the
  // timeline's flattened shape.
  const [stayDate, setStayDate] = useState<{
    booking: ApiBooking;
    mode: "checked_in" | "checked_out";
  } | null>(null);
  const [settleBooking, setSettleBooking] = useState<ApiBooking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ApiBooking | null>(null);

  const feedback = useFeedback();
  const updateBooking = useUpdateBooking();
  const createBooking = useCreateBooking();
  const changeStatus = useChangeBookingStatus();
  const cancelBooking = useCancelBooking();
  const recordPayment = useRecordBookingPayment();

  const allProperties = useMemo(
    () => resolveBookingProperties(propertiesResponse?.data),
    [propertiesResponse?.data],
  );

  /**
   * The property the calendar is drawing.
   *
   * Inside a property the scope decides it -- there is nothing to choose, and
   * offering the rest of the portfolio would name properties the server will
   * refuse anyway. At HQ it is the member's pick, falling back to the first
   * property so the grid is never empty for want of a selection.
   */
  const isPropertyScope = activeView.type === "property";
  const selectedProperty = isPropertyScope
    ? activeView.propertyId
    : allProperties.some((p) => p.id === propertyFilter)
      ? propertyFilter
      : (allProperties[0]?.id ?? "");

  /**
   * Jump to the month holding the next stay, once, on first load.
   *
   * Only when today's month is empty -- someone who opened the calendar to
   * check this week should not be thrown forward to next quarter.
   */
  const { data: nextDate } = useNextBookingDate(
    activeScopeId,
    selectedProperty,
  );
  const [jumped, setJumped] = useState(false);

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
    selectedProperty,
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
  } = useCalendarBookings(activeScopeId, window, selectedProperty);

  const apiBookings = useMemo(
    () => (bookingsResponse?.data ?? []) as ApiBooking[],
    [bookingsResponse?.data],
  );

  const bookings = useMemo(
    () => apiBookings.map(toCalendarBooking),
    [apiBookings],
  );

  /** The stored booking behind a block on the grid. */
  function apiBookingFor(id: string) {
    return apiBookings.find((b) => b.id === id);
  }

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

  function handleBookingAction(
    action: BookingQuickAction,
    booking: CalendarBooking,
  ) {
    const target = apiBookingFor(booking.id);
    if (!target) return;

    if (action === "check_in" || action === "check_out") {
      setStayDate({
        booking: target,
        mode: action === "check_in" ? "checked_in" : "checked_out",
      });
      return;
    }

    if (action === "settle") {
      setSettleBooking(target);
      return;
    }

    if (action === "cancel") {
      setCancelTarget(target);
      return;
    }

    // Editing a booking's guest, dates and pricing is the bookings table's
    // job -- there is no edit dialog yet, and a weaker second one here would
    // drift from it.
    feedback.success(
      "Edit from the bookings page",
      `Open ${target.ref} under Bookings to change its dates, room or guest.`,
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
        rangeMode={rangeMode}
        onRangeModeChange={setRangeMode}
        properties={allProperties}
        propertyFilter={selectedProperty}
        propertyLocked={isPropertyScope}
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
          onRequestCreate={setQuickSelection}
          onBookingAction={handleBookingAction}
        />
        <Legend />
      </div>

      <QuickCreateDialog
        selection={quickSelection}
        propertyId={propertyForUnit(quickSelection?.unitId)}
        properties={allProperties}
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
      {stayDate && (
        <StayDateDialog
          booking={stayDate.booking}
          mode={stayDate.mode}
          onOpenChange={(open) => !open && setStayDate(null)}
          isSaving={changeStatus.isPending}
          onConfirm={(effectiveDate) => {
            changeStatus.mutate(
              {
                param: { id: stayDate.booking.id },
                json: { status: stayDate.mode, effectiveDate },
              },
              {
                onSuccess: () => {
                  invalidateCalendar();
                  setStayDate(null);
                  feedback.success(
                    "Booking updated",
                    `${stayDate.booking.ref} is now ${
                      stayDate.mode === "checked_in"
                        ? "checked in"
                        : "checked out"
                    }.`,
                  );
                },
                onError: (error) => {
                  feedback.error(
                    "Couldn't update booking",
                    getApiErrorMessage(
                      error,
                      "Something went wrong. Try again.",
                    ),
                  );
                },
              },
            );
          }}
        />
      )}

      <SettlePaymentSheet
        booking={settleBooking}
        onOpenChange={(open) => !open && setSettleBooking(null)}
        isSaving={recordPayment.isPending}
        onSettled={({ bookingId, amountPaise, method, paidAt }) => {
          recordPayment.mutate(
            {
              param: { id: bookingId },
              json: { amountPaise, method, paidAt },
            },
            {
              onSuccess: () => {
                invalidateCalendar();
                setSettleBooking(null);
                feedback.success("Payment recorded", "The balance is updated.");
              },
              onError: (error) => {
                feedback.error(
                  "Couldn't record payment",
                  getApiErrorMessage(error, "Something went wrong. Try again."),
                );
              },
            },
          );
        }}
      />

      <CancelBookingDialog
        booking={cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        isSaving={cancelBooking.isPending}
        onConfirm={(reason) => {
          if (!cancelTarget) return;
          cancelBooking.mutate(
            { param: { id: cancelTarget.id }, json: reason ? { reason } : {} },
            {
              onSuccess: () => {
                invalidateCalendar();
                setCancelTarget(null);
                feedback.success(
                  "Booking cancelled",
                  `${cancelTarget.ref} is cancelled.`,
                );
              },
              onError: (error) => {
                feedback.error(
                  "Couldn't cancel booking",
                  getApiErrorMessage(error, "Something went wrong. Try again."),
                );
              },
            },
          );
        }}
      />
    </motion.div>
  );
}
