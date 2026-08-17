import { Button } from "@propertyos/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@propertyos/ui/components/sheet";
import { cn } from "@propertyos/ui/lib/utils";
import { format } from "date-fns";
import { useState } from "react";

export type DrawerTab = "reservation" | "block" | "override";

export type DrawerSelection = {
  unitLabel: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
};

const TABS: { id: DrawerTab; label: string }[] = [
  { id: "reservation", label: "New Reservation" },
  { id: "block", label: "Block Dates" },
  { id: "override", label: "Price Override" },
];

export function QuickCreateDrawer({
  selection,
  initialTab = "reservation",
  onOpenChange,
}: {
  selection: DrawerSelection | null;
  initialTab?: DrawerTab;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = useState<DrawerTab>(initialTab);

  return (
    <Sheet
      open={selection !== null}
      onOpenChange={(open) => {
        if (open) {
          setTab(initialTab);
        }
        onOpenChange(open);
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Quick create</SheetTitle>
          <SheetDescription>
            {selection
              ? `${selection.roomType} · ${selection.unitLabel} · ${format(
                  selection.checkIn,
                  "MMM d",
                )} – ${format(selection.checkOut, "MMM d")}`
              : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex border-y">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 border-r px-2 py-2 text-center text-xs transition-colors last:border-r-0",
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {selection && tab === "reservation" && (
            <ReservationForm selection={selection} />
          )}
          {selection && tab === "block" && <BlockForm selection={selection} />}
          {selection && tab === "override" && (
            <OverrideForm selection={selection} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  defaultValue,
  placeholder,
}: {
  label: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-8 border bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
      />
    </label>
  );
}

function ReservationForm({ selection }: { selection: DrawerSelection }) {
  return (
    <>
      <Field label="Guest name" placeholder="e.g. Aarav Mehta" />
      <Field label="Room type" defaultValue={selection.roomType} />
      <Field label="Unit" defaultValue={selection.unitLabel} />
      <Field
        label="Check-in"
        defaultValue={format(selection.checkIn, "MMM d, yyyy")}
      />
      <Field
        label="Check-out"
        defaultValue={format(selection.checkOut, "MMM d, yyyy")}
      />
      <Field label="Guests" defaultValue="2" />
      <Button className="mt-2">Create reservation</Button>
    </>
  );
}

function BlockForm({ selection }: { selection: DrawerSelection }) {
  return (
    <>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Reason</span>
        <select className="h-8 border bg-background px-2 text-sm outline-none">
          <option>Maintenance</option>
          <option>Owner Stay</option>
        </select>
      </label>
      <Field label="Unit" defaultValue={selection.unitLabel} />
      <Field
        label="From"
        defaultValue={format(selection.checkIn, "MMM d, yyyy")}
      />
      <Field
        label="To"
        defaultValue={format(selection.checkOut, "MMM d, yyyy")}
      />
      <Field label="Notes" placeholder="Optional notes" />
      <Button className="mt-2">Create block</Button>
    </>
  );
}

function OverrideForm({ selection }: { selection: DrawerSelection }) {
  return (
    <>
      <Field label="Unit" defaultValue={selection.unitLabel} />
      <Field
        label="From"
        defaultValue={format(selection.checkIn, "MMM d, yyyy")}
      />
      <Field
        label="To"
        defaultValue={format(selection.checkOut, "MMM d, yyyy")}
      />
      <Field label="Override tariff (₹ / night)" placeholder="e.g. 5500" />
      <Button className="mt-2">Apply override</Button>
    </>
  );
}
