import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { ImageIcon, PencilIcon, TrashIcon, UsersIcon } from "lucide-react";
import { getAmenityIcon } from "../lib/amenity-icons";
import { normalizeRoomType, ROOM_TYPE_LABEL, type Room } from "../lib/room";

/**
 * Black-on-white so it stays legible over any cover photo, rather than a
 * themed badge that can disappear against the image.
 */
function StatusTag({ status }: { status: string }) {
  return (
    <span className="absolute top-1.5 right-1.5 z-10 bg-black px-1.5 py-0.5 font-medium text-[9px] text-white uppercase tracking-wider">
      {status === "draft" ? "Draft" : "Published"}
    </span>
  );
}

export function RoomCard({
  room,
  onEdit,
  onDelete,
}: {
  room: Room;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="relative h-full pt-0 pb-4">
      <CardContent className="flex h-full flex-col gap-1.5 p-2.5">
        {/* The banner always renders -- a room without a photo falls back to a
            placeholder -- so every card keeps the same height and the status
            tag always sits in the same place. */}
        <div className="relative -mx-2.5 -mt-2.5 mb-0.5 h-20 overflow-hidden bg-muted">
          {room.images.length > 0 ? (
            <img
              src={room.images[0]?.url}
              alt={room.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <ImageIcon className="size-4" />
              <span className="text-[9px]">No image</span>
            </div>
          )}
          <StatusTag status={room.status} />
        </div>

        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-xs">{room.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {ROOM_TYPE_LABEL[normalizeRoomType(room.roomType)]}
              {room.roomNumber ? ` · No. ${room.roomNumber}` : ""}
              {room.floor ? ` · ${room.floor}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              size="icon-sm"
              variant="outline"
              className="size-6"
              onClick={onEdit}
            >
              <PencilIcon className="size-3" />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              className="size-6"
              onClick={onDelete}
            >
              <TrashIcon className="size-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <span>
            <span className="text-muted-foreground">Weekday: </span>₹
            {room.weekdayPrice}
          </span>
          <span>
            <span className="text-muted-foreground">Weekend: </span>₹
            {room.weekendPrice}
          </span>
          <span className="flex items-center gap-1">
            <UsersIcon className="size-3 text-muted-foreground" />
            {room.maxGuests}
          </span>
        </div>

        {room.amenities.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1">
            {room.amenities.map((a) => {
              const Icon = getAmenityIcon(a.icon);
              return (
                <span
                  key={a.id}
                  className="flex items-center gap-0.5 border px-1 py-px text-[9px] text-muted-foreground"
                >
                  <Icon className="size-2.5" />
                  {a.name}
                </span>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
