import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { UsersIcon } from "lucide-react";

import { formatInr } from "@/features/booking-engine/lib/format";
import { buildNightlyRates } from "@/features/booking-engine/lib/mock-data";
import { GalleryBlock } from "@/features/properties/components/gallery-block";
import type {
  GalleryImage,
  RoomType,
} from "@/features/properties/lib/mock-data";

export function RoomAvailabilityList({
  roomTypes,
  roomTypeGalleries,
  fallbackCover,
  checkIn,
  checkOut,
  onSelect,
}: {
  roomTypes: RoomType[];
  roomTypeGalleries: { roomTypeId: string; images: GalleryImage[] }[];
  fallbackCover: GalleryImage | undefined;
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  onSelect: (roomTypeId: string) => void;
}) {
  if (!checkIn || !checkOut) {
    return (
      <p className="flex h-60 items-center justify-center border text-center text-muted-foreground text-xs">
        Select check-in and check-out dates to see room availability.
      </p>
    );
  }

  return (
    <div className="flex max-h-60 flex-col gap-2 overflow-y-auto">
      {roomTypes.map((roomType, index) => {
        const gallery = roomTypeGalleries.find(
          (g) => g.roomTypeId === roomType.id,
        );
        const cover = gallery?.images[0] ?? fallbackCover;
        const nightlyRates = buildNightlyRates(roomType, checkIn, checkOut);
        const nights = nightlyRates.length;
        const totalPaise = nightlyRates.reduce(
          (sum, n) => sum + n.ratePaise,
          0,
        );
        const availableUnits =
          roomType.units.length > 0
            ? roomType.units.filter(
                (u) => u.status === "active" && !u.occupancy,
              ).length
            : 1;

        return (
          <div
            key={roomType.id}
            className="flex items-center gap-3 border p-2.5"
          >
            <GalleryBlock
              colorIndex={cover?.colorIndex ?? index}
              className="h-12 w-14 shrink-0"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="truncate font-medium text-xs">{roomType.name}</p>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <UsersIcon className="size-3" />
                Up to {roomType.maxGuests}
                {availableUnits === 0 ? (
                  <Badge
                    variant="destructive"
                    className="ml-1 h-4 px-1 text-[10px]"
                  >
                    Sold Out
                  </Badge>
                ) : availableUnits <= 2 ? (
                  <Badge
                    variant="warning"
                    className="ml-1 h-4 px-1 text-[10px]"
                  >
                    {availableUnits} left
                  </Badge>
                ) : null}
              </p>
              <p className="text-[11px]">
                {nights > 0
                  ? formatInr(totalPaise)
                  : formatInr(roomType.baseRatePaise)}
                <span className="text-muted-foreground">
                  {" "}
                  {nights > 0 ? `/ ${nights}n` : "/ night"}
                </span>
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={availableUnits === 0}
              onClick={() => onSelect(roomType.id)}
            >
              Select
            </Button>
          </div>
        );
      })}
    </div>
  );
}
