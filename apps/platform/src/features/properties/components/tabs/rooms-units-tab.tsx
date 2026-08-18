import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { cn } from "@propertyos/ui/lib/utils";
import { format } from "date-fns";
import { PlusIcon } from "lucide-react";

import { formatInr } from "../../lib/format";
import type { PropertyDetail, RoomType, Unit } from "../../lib/mock-data";

function UnitCard({ unit }: { unit: Unit }) {
  if (unit.status === "maintenance") {
    return (
      <div className="flex flex-col gap-0.5 border border-warning/50 bg-warning/5 p-2.5 text-xs">
        <p className="font-medium">{unit.name}</p>
        <p className="text-warning">🔧 Maintenance</p>
      </div>
    );
  }

  if (unit.status === "inactive") {
    return (
      <div
        className="flex flex-col gap-0.5 border border-border p-2.5 text-muted-foreground text-xs"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, var(--color-muted) 0, var(--color-muted) 4px, transparent 4px, transparent 8px)",
        }}
      >
        <p className="font-medium text-foreground">{unit.name}</p>
        <p>Blocked</p>
      </div>
    );
  }

  if (unit.occupancy) {
    return (
      <div className="flex flex-col gap-0.5 border border-foreground/20 bg-foreground p-2.5 text-background text-xs">
        <p className="font-medium">{unit.name}</p>
        <p>● Occupied</p>
        <p>{unit.occupancy.guestName}</p>
        <p className="opacity-80">
          {format(unit.occupancy.checkIn, "MMM d")}–
          {format(unit.occupancy.checkOut, "d")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 border border-border p-2.5 text-xs">
      <p className="font-medium">{unit.name}</p>
      <p className="text-muted-foreground">○ Vacant</p>
    </div>
  );
}

function RoomTypeCard({ roomType }: { roomType: RoomType }) {
  const groups = new Map<string | null, Unit[]>();
  for (const unit of roomType.units) {
    const key = unit.floorGroup;
    const list = groups.get(key) ?? [];
    list.push(unit);
    groups.set(key, list);
  }
  const hasFloorGroups = [...groups.keys()].some((k) => k !== null);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{roomType.name}</p>
            <Badge variant="outline">Qty: {roomType.quantity}</Badge>
            <Badge variant={roomType.status === "active" ? "success" : "muted"}>
              {roomType.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Edit Room Type
            </Button>
            <Button variant="ghost" size="sm">
              Manage
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground text-xs">
          Base Rate: {formatInr(roomType.baseRatePaise)}/night | Weekend:{" "}
          {formatInr(roomType.weekendRatePaise)} | Max Guests:{" "}
          {roomType.maxGuests} | Min Stay: {roomType.minStayNights} night
          {roomType.minStayNights === 1 ? "" : "s"} | Extra Guest:{" "}
          {formatInr(roomType.extraGuestPaise)}/night
        </p>

        {roomType.quantity === 1 ? (
          <p className="border bg-muted/30 p-2.5 text-muted-foreground text-xs">
            This room type has quantity = 1 (no individual units to display). It
            operates as a single bookable unit.
          </p>
        ) : hasFloorGroups ? (
          <div className="flex flex-col gap-3">
            {[...groups.entries()].map(([group, units]) => (
              <div key={group ?? "ungrouped"} className="border p-3">
                <p className="mb-2 font-medium text-xs">
                  {group ?? "Ungrouped"}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {units.map((unit) => (
                    <UnitCard key={unit.id} unit={unit} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {roomType.units.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RoomsUnitsTab({ property }: { property: PropertyDetail }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">Rooms & Units</p>
        <Button size="sm">
          <PlusIcon />
          Add Room Type
        </Button>
      </div>

      <div className={cn("flex flex-col gap-4")}>
        {property.roomTypes.map((roomType) => (
          <RoomTypeCard key={roomType.id} roomType={roomType} />
        ))}
      </div>
    </div>
  );
}
