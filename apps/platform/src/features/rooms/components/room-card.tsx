import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { PencilIcon, TrashIcon, UsersIcon } from "lucide-react";

import { getAmenityIcon } from "../lib/amenity-icons";
import { normalizeRoomType, ROOM_TYPE_LABEL, type Room } from "../lib/room";

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
    <Card>
      <CardContent className="flex flex-col gap-1.5 p-2.5">
        {room.images.length > 0 && (
          <div className="-mx-2.5 -mt-2.5 mb-0.5 h-20 overflow-hidden bg-muted">
            <img
              src={room.images[0]?.url}
              alt={room.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-xs">{room.name}</p>
              {room.status === "draft" && (
                <Badge variant="outline">Draft</Badge>
              )}
            </div>
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
          <div className="flex flex-wrap gap-1">
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
