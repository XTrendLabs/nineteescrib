import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { Checkbox } from "@propertyos/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Input } from "@propertyos/ui/components/input";
import { Label } from "@propertyos/ui/components/label";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";

import type { GalleryImage, RoomType } from "../lib/mock-data";
import { GalleryBlock } from "./gallery-block";

export type RoomFormValue = {
  name: string;
  roomNumber: string;
  floor: string;
  weekdayRate: string;
  weekendRate: string;
  maxGuests: string;
  amenityKeys: Set<string>;
  photos: GalleryImage[];
};

const ROOM_AMENITY_OPTIONS = [
  { key: "wifi", label: "WiFi" },
  { key: "ac", label: "AC" },
  { key: "tv", label: "TV" },
  { key: "balcony", label: "Balcony" },
  { key: "attached_bath", label: "Attached Bath" },
  { key: "minibar", label: "Minibar" },
];

function emptyForm(): RoomFormValue {
  return {
    name: "",
    roomNumber: "",
    floor: "",
    weekdayRate: "",
    weekendRate: "",
    maxGuests: "2",
    amenityKeys: new Set(),
    photos: [],
  };
}

function roomTypeToForm(roomType: RoomType): RoomFormValue {
  const firstUnit = roomType.units[0];
  return {
    name: roomType.name,
    roomNumber: firstUnit?.name ?? "",
    floor: firstUnit?.floorGroup ?? "",
    weekdayRate: String(roomType.baseRatePaise / 100),
    weekendRate: String(roomType.weekendRatePaise / 100),
    maxGuests: String(roomType.maxGuests),
    amenityKeys: new Set(),
    photos: [],
  };
}

export function RoomFormDialog({
  open,
  onOpenChange,
  editingRoomType,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRoomType: RoomType | null;
  onSave: (value: RoomFormValue) => void;
}) {
  const [form, setForm] = useState<RoomFormValue>(emptyForm());

  useEffect(() => {
    if (open) {
      setForm(editingRoomType ? roomTypeToForm(editingRoomType) : emptyForm());
    }
  }, [open, editingRoomType]);

  function update<K extends keyof RoomFormValue>(
    key: K,
    value: RoomFormValue[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAmenity(key: string) {
    setForm((prev) => {
      const next = new Set(prev.amenityKeys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, amenityKeys: next };
    });
  }

  function addPhoto() {
    setForm((prev) => ({
      ...prev,
      photos: [
        ...prev.photos,
        {
          id: `photo-${Date.now()}-${prev.photos.length}`,
          label: `Photo ${prev.photos.length + 1}`,
          colorIndex: prev.photos.length % 6,
          isCover: prev.photos.length === 0,
        },
      ],
    }));
  }

  function removePhoto(id: string) {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== id),
    }));
  }

  const canSave =
    form.name.trim().length > 0 &&
    form.weekdayRate.trim().length > 0 &&
    form.maxGuests.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingRoomType ? "Edit Room" : "Add Room"}
          </DialogTitle>
          <DialogDescription>
            Configure this room's details, pricing, amenities, and photos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto px-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Room Name / Type</Label>
              <Input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Deluxe Suite"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Room Number</Label>
              <Input
                value={form.roomNumber}
                onChange={(e) => update("roomNumber", e.target.value)}
                placeholder="e.g. 101"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Floor</Label>
              <Input
                value={form.floor}
                onChange={(e) => update("floor", e.target.value)}
                placeholder="e.g. Ground Floor"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Max Guests</Label>
              <Input
                type="number"
                min={1}
                value={form.maxGuests}
                onChange={(e) => update("maxGuests", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Weekday Price (₹/night)</Label>
              <Input
                type="number"
                value={form.weekdayRate}
                onChange={(e) => update("weekdayRate", e.target.value)}
                placeholder="e.g. 3500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Weekend Price (₹/night)</Label>
              <Input
                type="number"
                value={form.weekendRate}
                onChange={(e) => update("weekendRate", e.target.value)}
                placeholder="e.g. 4200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-3">
              {ROOM_AMENITY_OPTIONS.map((amenity) => (
                <button
                  key={amenity.key}
                  type="button"
                  onClick={() => toggleAmenity(amenity.key)}
                  className="flex items-center gap-1.5 text-left text-xs"
                >
                  <Checkbox
                    checked={form.amenityKeys.has(amenity.key)}
                    tabIndex={-1}
                  />
                  {amenity.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Photos</Label>
            <div className="flex flex-wrap gap-2">
              {form.photos.map((photo) => (
                <div key={photo.id} className="relative h-16 w-16">
                  <GalleryBlock
                    colorIndex={photo.colorIndex}
                    className="h-16 w-16"
                  />
                  {photo.isCover && (
                    <Badge className="absolute top-0.5 left-0.5 h-4 px-1 text-[9px]">
                      Cover
                    </Badge>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center bg-background text-[10px]"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addPhoto}
                className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 border border-dashed text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                <PlusIcon className="size-3.5" />
                <span className="text-[9px]">Add</span>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button disabled={!canSave} onClick={() => onSave(form)}>
            {editingRoomType ? "Save Changes" : "Add Room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
