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
import { useState } from "react";

import type { MockProperty } from "../lib/mock-data";

export function CreateBookingBanner({
  open,
  properties,
  onClose,
  onCreated,
}: {
  open: boolean;
  properties: MockProperty[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [propertyId, setPropertyId] = useState<string>("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [tariff, setTariff] = useState("");
  const [source, setSource] = useState("direct");

  const canSave = propertyId && guestName && checkIn && checkOut;

  function handleSave() {
    if (!canSave) return;
    onCreated();
    setPropertyId("");
    setGuestName("");
    setGuestPhone("");
    setCheckIn("");
    setCheckOut("");
    setTariff("");
    setSource("direct");
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
                  onValueChange={(v) => setPropertyId(v as string)}
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
                  placeholder="Auto"
                />
              </div>

              <div className="flex w-32 flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">
                  Source
                </span>
                <Select
                  value={source}
                  onValueChange={(v) => setSource(v as string)}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {(value: unknown) =>
                        value === "manual"
                          ? "Manual"
                          : value === "agent"
                            ? "Agent"
                            : "Direct"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button size="sm" disabled={!canSave} onClick={handleSave}>
                  Save Booking
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
