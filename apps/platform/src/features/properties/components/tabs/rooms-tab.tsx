import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { format } from "date-fns";
import { PencilIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { formatInr } from "../../lib/format";
import type { PropertyDetail, RoomType } from "../../lib/mock-data";
import { GalleryBlock } from "../gallery-block";
import { RoomFormDialog, type RoomFormValue } from "../room-form-dialog";

function RoomCard({
  roomType,
  onEdit,
}: {
  roomType: RoomType;
  onEdit: () => void;
}) {
  const cover = roomType.units[0];
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row">
        <GalleryBlock
          colorIndex={roomType.id.length}
          className="h-28 w-full shrink-0 sm:w-36"
        />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{roomType.name}</p>
              {cover?.name && <Badge variant="outline">#{cover.name}</Badge>}
              {cover?.floorGroup && (
                <Badge variant="outline">{cover.floorGroup}</Badge>
              )}
              <Badge
                variant={roomType.status === "active" ? "success" : "muted"}
              >
                {roomType.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <PencilIcon />
              Edit
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Weekday: {formatInr(roomType.baseRatePaise)} · Weekend:{" "}
            {formatInr(roomType.weekendRatePaise)} · Max Guests:{" "}
            {roomType.maxGuests} · Qty: {roomType.quantity}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SeasonalOverrides({ property }: { property: PropertyDetail }) {
  if (property.rateOverrides.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium text-sm">Seasonal Overrides</p>
      <div className="flex flex-col gap-3">
        {property.rateOverrides.map((override) => (
          <Card key={override.id}>
            <CardContent className="flex flex-wrap items-start justify-between gap-3 pt-4">
              <div>
                <p className="font-medium text-sm">
                  {override.emoji} {override.label}
                </p>
                <p className="text-muted-foreground text-xs">
                  {format(override.startDate, "MMM d")} –{" "}
                  {format(override.endDate, "MMM d")}
                  {override.minStayOverride
                    ? ` · Min Stay: ${override.minStayOverride} nights`
                    : ""}
                </p>
                <div className="mt-2 flex flex-col gap-0.5 text-xs">
                  {override.prices.map((p) => (
                    <p key={p.roomTypeId}>
                      {p.roomTypeName}: {formatInr(p.customPricePaise)}/night
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function RoomsTab({ property }: { property: PropertyDetail }) {
  const feedback = useFeedback();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);

  function openAdd() {
    setEditingRoomType(null);
    setDialogOpen(true);
  }

  function openEdit(roomType: RoomType) {
    setEditingRoomType(roomType);
    setDialogOpen(true);
  }

  function handleSave(value: RoomFormValue) {
    setDialogOpen(false);
    feedback.success(
      editingRoomType ? "Room updated" : "Room added",
      `${value.name || "Room"} has been saved for ${property.name}.`,
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">Rooms</p>
        <Button size="sm" onClick={openAdd}>
          <PlusIcon />
          Add Room
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {property.roomTypes.map((roomType) => (
          <RoomCard
            key={roomType.id}
            roomType={roomType}
            onEdit={() => openEdit(roomType)}
          />
        ))}
      </div>

      <SeasonalOverrides property={property} />

      <RoomFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingRoomType={editingRoomType}
        onSave={handleSave}
      />
    </div>
  );
}
