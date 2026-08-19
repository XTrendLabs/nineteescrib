import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { z } from "zod";

import { AmenitiesGrid } from "@/features/booking-engine/components/amenities-grid";
import { AvailabilityCalendar } from "@/features/booking-engine/components/availability-calendar";
import { BookingHeader } from "@/features/booking-engine/components/booking-header";
import { GalleryHero } from "@/features/booking-engine/components/gallery-hero";
import { RoomAvailabilityList } from "@/features/booking-engine/components/room-availability-list";
import { findPropertyBySlug } from "@/features/booking-engine/lib/mock-data";

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const searchSchema = z.object({
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.number().optional(),
});

export const Route = createFileRoute("/book/$slug/$propertySlug/")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function defaultDateRange(): DateRange {
  const from = new Date();
  from.setDate(from.getDate() + 7);
  const to = new Date(from);
  to.setDate(to.getDate() + 3);
  return { from, to };
}

function RouteComponent() {
  const { slug, propertySlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const property = useMemo(
    () => findPropertyBySlug(slug, propertySlug),
    [slug, propertySlug],
  );

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
    search.checkIn && search.checkOut
      ? { from: new Date(search.checkIn), to: new Date(search.checkOut) }
      : defaultDateRange(),
  );
  const [guests, setGuests] = useState(search.guests ?? 2);

  if (!property) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm">This property listing could not be found.</p>
      </div>
    );
  }

  const enabledAmenities = property.amenities.filter((a) => a.enabled);
  const cover = property.propertyGallery.find((img) => img.isCover);
  const activeRoomTypes = property.roomTypes.filter(
    (rt) => rt.status === "active",
  );
  const nights =
    dateRange?.from && dateRange.to
      ? Math.round(
          (dateRange.to.getTime() - dateRange.from.getTime()) / 86_400_000,
        )
      : 0;

  const handleSelectRoom = (roomTypeId: string) => {
    if (!dateRange?.from || !dateRange.to) return;
    navigate({
      to: "/book/$slug/$propertySlug/checkout",
      params: { slug, propertySlug },
      search: {
        roomTypeId,
        checkIn: dateRange.from.toISOString().slice(0, 10),
        checkOut: dateRange.to.toISOString().slice(0, 10),
        guests,
        promoCode: undefined,
      },
    });
  };

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <BookingHeader property={property} />

      <GalleryHero property={property} />

      <div className="flex items-center justify-between border-b px-4 py-6 sm:px-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-display-sm">
            {property.name} — {property.city}
          </h1>
          <p className="text-muted-foreground text-sm">
            🏠{" "}
            {property.propertyType === "villa"
              ? "Entire Villa"
              : property.propertyType}{" "}
            · {property.roomTypes.length} room type
            {property.roomTypes.length === 1 ? "" : "s"} · Up to{" "}
            {Math.max(...property.roomTypes.map((rt) => rt.maxGuests))} Guests
          </p>
          <p className="text-muted-foreground text-xs">
            📍 {property.addressLine1}, {property.city}, {property.pinCode}
          </p>
          {property.bookingLink.welcomeText && (
            <p className="mt-2 text-muted-foreground text-sm italic">
              "{property.bookingLink.welcomeText}"
            </p>
          )}
        </div>

        {enabledAmenities.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="font-medium text-sm">Amenities</p>
            <AmenitiesGrid amenities={enabledAmenities} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 px-4 py-6 sm:px-8">
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
          <AvailabilityCalendar
            roomTypes={activeRoomTypes}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <div className="flex flex-col gap-2">
            <p className="font-medium text-muted-foreground text-xs">
              Available Rooms
            </p>
            <RoomAvailabilityList
              roomTypes={activeRoomTypes}
              roomTypeGalleries={property.roomTypeGalleries}
              fallbackCover={cover}
              checkIn={dateRange?.from}
              checkOut={dateRange?.to}
              onSelect={handleSelectRoom}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
