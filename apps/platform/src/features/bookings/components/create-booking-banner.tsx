import { Button } from "@propertyos/ui/components/button";
import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { useAvailability } from "../api/use-availability";
import { type BookingSource, toPaise } from "../lib/booking";
import type { BookingProperty } from "../lib/property";

export type NewBookingInput = {
  propertyId: string;
  roomId: string;
  guest: { name: string; phone: string };
  checkIn: string;
  checkOut: string;
  totalAmountPaise: number;
  source: BookingSource;
};

const SOURCE_LABELS: Record<BookingSource, string> = {
  direct: "Direct",
  manual: "Manual",
  airbnb: "Airbnb",
  booking_com: "Booking.com",
};

export function CreateBookingBanner({
  open,
  properties,
  onClose,
  onCreate,
  isSaving,
}: {
  open: boolean;
  properties: BookingProperty[];
  onClose: () => void;
  onCreate: (input: NewBookingInput) => void;
  isSaving?: boolean;
}) {
  const [propertyId, setPropertyId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [tariff, setTariff] = useState("");
  const [source, setSource] = useState<BookingSource>("direct");

  // Only rooms actually free for these dates are offered, so a booking cannot
  // be built that the server would have to reject as a double booking.
  const { data: availability, isLoading: loadingRooms } = useAvailability({
    propertyId,
    checkIn,
    checkOut,
  });
  const rooms = availability?.data ?? [];

  // The chosen room may not survive a change of property or dates, so a
  // selection that is no longer offered is dropped rather than submitted.
  useEffect(() => {
    if (roomId && !rooms.some((room) => room.id === roomId)) {
      setRoomId("");
    }
  }, [rooms, roomId]);

  const datesValid = Boolean(checkIn && checkOut && checkOut > checkIn);
  const canSave =
    propertyId && roomId && guestName.trim() && guestPhone.trim() && datesValid;

  function reset() {
    setPropertyId("");
    setRoomId("");
    setGuestName("");
    setGuestPhone("");
    setCheckIn("");
    setCheckOut("");
    setTariff("");
    setSource("direct");
  }

  function handleSave() {
    if (!canSave) return;
    onCreate({
      propertyId,
      roomId,
      guest: { name: guestName.trim(), phone: guestPhone.trim() },
      checkIn,
      checkOut,
      totalAmountPaise: toPaise(tariff),
      source,
    });
    reset();
  }

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="overflow-hidden"
        >
          <div className="border bg-muted/30 p-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex min-w-40 flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">
                  Property
                </span>
                <Select
                  value={propertyId}
                  onValueChange={(v) => {
                    setPropertyId(v as string);
                    setRoomId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property">
                      {(value: unknown) =>
                        properties.find((p) => p.id === value)?.name ??
                        "Select property"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">
                  Check-in
                </span>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-36"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">
                  Check-out
                </span>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-36"
                />
              </div>

              <div className="flex min-w-40 flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">
                  {loadingRooms
                    ? "Checking availability..."
                    : `Room${rooms.length > 0 ? ` (${rooms.length} free)` : ""}`}
                </span>
                <Select
                  value={roomId}
                  onValueChange={(v) => setRoomId(v as string)}
                  disabled={!propertyId || !datesValid || rooms.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room">
                      {(value: unknown) =>
                        rooms.find((r) => r.id === value)?.name ?? "Select room"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex min-w-36 flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">
                  Guest name
                </span>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Full name"
                />
              </div>

              <div className="flex min-w-32 flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">Phone</span>
                <Input
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+91..."
                />
              </div>

              <div className="flex w-28 flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">
                  Tariff (₹)
                </span>
                <Input
                  type="number"
                  value={tariff}
                  onChange={(e) => setTariff(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="flex w-32 flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">
                  Source
                </span>
                <Select
                  value={source}
                  onValueChange={(v) => setSource(v as BookingSource)}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {(value: unknown) =>
                        SOURCE_LABELS[value as BookingSource] ?? "Direct"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="airbnb">Airbnb</SelectItem>
                    <SelectItem value="booking_com">Booking.com</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!canSave || isSaving}
                  onClick={handleSave}
                >
                  {isSaving ? "Saving..." : "Save Booking"}
                </Button>
              </div>
            </div>

            {propertyId &&
              datesValid &&
              !loadingRooms &&
              rooms.length === 0 && (
                <p className="mt-2 text-warning text-xs">
                  No rooms are free for those dates at this property.
                </p>
              )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
