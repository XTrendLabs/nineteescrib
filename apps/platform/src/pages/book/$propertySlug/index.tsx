import { Button } from "@propertyos/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { z } from "zod";

import {
  usePublicAvailability,
  usePublicOccupancy,
  usePublicProperty,
} from "@/features/booking-engine/api/use-public-booking";
import { BookingEngineDisabled } from "@/features/booking-engine/components/disabled-notice";
import { isBookingEngineEnabled } from "@/features/booking-engine/lib/feature-flag";
import { formatInr } from "@/features/booking-engine/lib/format";
import { StayRangeCalendar } from "@/features/bookings/components/stay-range-calendar";
import { roomTypeLabel } from "@/features/calendar/lib/calendar";

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const searchSchema = z.object({
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.number().optional(),
});

export const Route = createFileRoute("/book/$propertySlug/")({
  // Off by default: the engine is still being finished, and a guest
  // reaching a half-built booking page would be worse than a notice.
  component: isBookingEngineEnabled ? RouteComponent : BookingEngineDisabled,
  validateSearch: searchSchema,
});

function toDay(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function RouteComponent() {
  const { propertySlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const { data: propertyResponse, isLoading: loadingProperty } =
    usePublicProperty(propertySlug);

  /**
   * Nothing is pre-selected.
   *
   * A guessed range -- "a week out, for three nights" -- is as likely to land
   * inside an existing booking as not, and the page then opens showing no
   * rooms, which reads as "this property is full" rather than "pick again".
   * The calendar is on screen with the taken nights already shaded, so the
   * guest picks from what is actually free.
   */
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
    search.checkIn && search.checkOut
      ? {
          from: new Date(`${search.checkIn}T00:00:00`),
          to: new Date(`${search.checkOut}T00:00:00`),
        }
      : undefined,
  );
  const [guests, setGuests] = useState(search.guests ?? 2);

  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const checkIn = dateRange?.from ? toDay(dateRange.from) : "";
  const checkOut = dateRange?.to ? toDay(dateRange.to) : "";

  const occupancyWindow = useMemo(
    () => ({
      from: format(startOfMonth(month), "yyyy-MM-dd"),
      to: format(endOfMonth(addMonths(month, 1)), "yyyy-MM-dd"),
    }),
    [month],
  );

  const { data: occupancy } = usePublicOccupancy({
    slug: propertySlug,
    ...occupancyWindow,
  });

  const { data: availability, isLoading: loadingRooms } = usePublicAvailability(
    { slug: propertySlug, checkIn, checkOut, guests },
  );

  const property = propertyResponse?.data;
  const rooms = availability?.data?.rooms ?? [];
  const nights =
    dateRange?.from && dateRange.to
      ? Math.round(
          (dateRange.to.getTime() - dateRange.from.getTime()) / 86_400_000,
        )
      : 0;

  if (loadingProperty) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm">This property listing could not be found.</p>
      </div>
    );
  }

  function handleSelectRoom(roomId: string) {
    if (!checkIn || !checkOut) return;
    navigate({
      to: "/book/$propertySlug/checkout",
      params: { propertySlug },
      search: { roomId, checkIn, checkOut, guests },
    });
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b px-4 py-4 sm:px-8">
        <p className="font-medium text-sm">{property.name}</p>
        <p className="text-muted-foreground text-xs">Direct booking</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="flex flex-col gap-4 px-4 py-6 sm:px-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-medium text-sm">
            Check Availability
            {nights > 0 && (
              <span className="ml-1 font-normal text-muted-foreground">
                ({nights} night{nights === 1 ? "" : "s"})
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Guests</span>
            <Select
              value={String(guests)}
              onValueChange={(value) => setGuests(Number(value))}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Guests">
                  {(value: unknown) =>
                    `${value} Guest${value === "1" ? "" : "s"}`
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {GUEST_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} Guest{n === 1 ? "" : "s"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-foreground/80 text-xs">
              Your stay
            </span>
            {/* The same control the front desk uses, so a fully-booked night
                reads the same red to a guest as it does to staff. */}
            <StayRangeCalendar
              value={dateRange}
              onChange={setDateRange}
              nights={occupancy?.data?.nights ?? []}
              totalRooms={occupancy?.data?.totalRooms ?? 1}
              month={month}
              onMonthChange={setMonth}
              inline
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-medium text-muted-foreground text-xs">
              Available Rooms
            </p>

            {!checkIn || !checkOut ? (
              <p className="border border-dashed px-3 py-6 text-center text-muted-foreground text-xs">
                Pick your dates to see what is free.
              </p>
            ) : loadingRooms ? (
              <p className="border border-dashed px-3 py-6 text-center text-muted-foreground text-xs">
                Checking availability…
              </p>
            ) : rooms.length === 0 ? (
              <p className="border border-dashed px-3 py-6 text-center text-muted-foreground text-xs">
                Nothing free for these dates. Nights shaded red on the calendar
                are already taken — pick a range that avoids them.
              </p>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between gap-3 border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{room.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {roomTypeLabel(room.roomType)} · sleeps {room.maxGuests}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatInr(room.totalPaise)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {room.nights} night{room.nights === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleSelectRoom(room.id)}>
                      Select
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
