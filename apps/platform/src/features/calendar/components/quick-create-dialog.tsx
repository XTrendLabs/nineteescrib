import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { cn } from "@propertyos/ui/lib/utils";
import { addMonths, endOfMonth, format, startOfMonth, subDays } from "date-fns";
import { BanIcon, CalendarPlusIcon, TagIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { useCreateBooking } from "@/features/bookings/api/use-create-booking";
import { useOccupancy } from "@/features/bookings/api/use-occupancy";
import { useRoomAvailability } from "@/features/bookings/api/use-room-availability";
import { StayRangeCalendar } from "@/features/bookings/components/stay-range-calendar";
import { formatBookedRange, formatInr } from "@/features/bookings/lib/format";
import type { BookingProperty } from "@/features/bookings/lib/property";
import { getApiErrorMessage } from "@/shared/lib/api-error";

export type QuickCreateSelection = {
  /** The room the block or booking lands on -- the API works in ids. */
  unitId: string;
  unitLabel: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
};

/** What the dragged dates are going to become. */
type Choice = "booking" | "block" | "price";

const CHOICES: {
  id: Choice;
  label: string;
  hint: string;
  icon: typeof BanIcon;
}[] = [
  {
    id: "booking",
    label: "New booking",
    hint: "Put a guest in this room for these dates",
    icon: CalendarPlusIcon,
  },
  {
    id: "block",
    label: "Block dates",
    hint: "Take a room out of service",
    icon: BanIcon,
  },
  {
    id: "price",
    label: "Price hike or discount",
    hint: "Charge more or less than the usual rate",
    icon: TagIcon,
  },
];

const BLOCK_REASONS = [
  { value: "maintenance", label: "Maintenance" },
  { value: "owner_stay", label: "Owner stay" },
] as const;

type BlockReason = (typeof BLOCK_REASONS)[number]["value"];

function toDay(date: Date) {
  return format(date, "yyyy-MM-dd");
}

/**
 * Turns a dragged date range into a booking, a block or a price change.
 *
 * Asks what the range is for before asking for any detail: the three outcomes
 * share nothing but the dates, so a single form covering all of them would be
 * mostly disabled fields whichever one you wanted.
 */
export function QuickCreateDialog({
  selection,
  propertyId,
  properties,
  onOpenChange,
  onCreated,
  onRequestBooking,
}: {
  selection: QuickCreateSelection | null;
  /** The property the dragged room sits under, where the drag named one. */
  propertyId: string | undefined;
  properties: BookingProperty[];
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  /** Hands off to the full booking dialog, which already does this properly. */
  onRequestBooking: (selection: QuickCreateSelection) => void;
}) {
  const feedback = useFeedback();
  const createBooking = useCreateBooking();

  const [choice, setChoice] = useState<Choice | null>(null);
  const [reason, setReason] = useState<BlockReason>("maintenance");
  const [notes, setNotes] = useState("");
  const [adjustKind, setAdjustKind] = useState<"hike" | "discount">("discount");
  const [adjustValue, setAdjustValue] = useState("");

  // A block is pinned to one room at one property, so both are part of the
  // form -- the drag suggests them, and they stay editable because a block is
  // just as often set up from the wrong row as the right one.
  const [blockPropertyId, setBlockPropertyId] = useState("");
  const [blockRoomId, setBlockRoomId] = useState("");
  const [range, setRange] = useState<DateRange | undefined>();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  /**
   * The room and dates the clash was acknowledged for.
   *
   * Held as the subject rather than a bare flag so that changing either one
   * withdraws the acknowledgement on its own -- a yes to blocking over one
   * guest is not a yes to blocking over a different one.
   */
  const [acknowledged, setAcknowledged] = useState<string | null>(null);

  // The drag seeds the form; a new drag reseeds it.
  useEffect(() => {
    if (!selection) return;
    setBlockPropertyId(propertyId ?? "");
    setBlockRoomId(selection.unitId);
    setRange({ from: selection.checkIn, to: subDays(selection.checkOut, 1) });
    setMonth(startOfMonth(selection.checkIn));
    setAcknowledged(null);
  }, [selection, propertyId]);

  // The calendar picks nights inclusively -- a guest picking the 3rd to the
  // 5th means three nights -- while the API takes an exclusive check-out.
  const checkIn = range?.from ? toDay(range.from) : "";
  const checkOut = range?.to
    ? toDay(
        new Date(
          range.to.getFullYear(),
          range.to.getMonth(),
          range.to.getDate() + 1,
        ),
      )
    : "";

  const occupancyWindow = useMemo(
    () => ({
      from: format(startOfMonth(month), "yyyy-MM-dd"),
      to: format(endOfMonth(addMonths(month, 1)), "yyyy-MM-dd"),
    }),
    [month],
  );

  const { data: occupancy } = useOccupancy({
    propertyId: blockPropertyId || undefined,
    ...occupancyWindow,
  });

  const { data: availability, isLoading: loadingRooms } = useRoomAvailability({
    propertyId: blockPropertyId || undefined,
    checkIn,
    checkOut,
  });

  const rooms = availability?.data ?? [];
  const selectedRoom = rooms.find((r) => r.id === blockRoomId);
  // Dates already spoken for on the room being blocked. Blocking over them is
  // allowed -- a room really can go out of service at short notice -- but not
  // silently, since those guests still hold a reservation.
  const conflicts = selectedRoom?.conflicts ?? [];
  const hasConflict = conflicts.length > 0;
  const conflictKey = `${blockRoomId}|${checkIn}|${checkOut}`;
  const overrideConflict = acknowledged === conflictKey;

  function reset() {
    setChoice(null);
    setReason("maintenance");
    setNotes("");
    setAdjustKind("discount");
    setAdjustValue("");
    setBlockRoomId("");
    setRange(undefined);
    setAcknowledged(null);
  }

  function close() {
    reset();
    onOpenChange(false);
  }

  function pick(next: Choice) {
    // A booking is a real form with guest lookup, availability and pricing --
    // the create dialog already does all of it, so this hands over rather than
    // keeping a second, weaker copy in step with it.
    if (next === "booking" && selection) {
      onRequestBooking(selection);
      close();
      return;
    }
    setChoice(next);
  }

  function handleBlock() {
    if (!blockPropertyId || !blockRoomId || !checkIn || !checkOut) return;

    // Shown once, then confirmed. The server does not refuse an overlapping
    // block, so this is the only place the clash can surface.
    if (hasConflict && !overrideConflict) {
      setAcknowledged(conflictKey);
      return;
    }

    createBooking.mutate(
      {
        json: {
          propertyId: blockPropertyId,
          roomId: blockRoomId,
          kind: "block",
          blockReason: reason,
          checkIn,
          checkOut,
          notes: notes.trim(),
        },
      },
      {
        onSuccess: () => {
          onCreated();
          feedback.success(
            "Dates blocked",
            `${selectedRoom?.name ?? "The room"} is out of service for these dates.`,
          );
          close();
        },
        onError: (error) => {
          feedback.error(
            "Couldn't block dates",
            getApiErrorMessage(error, "Something went wrong. Try again."),
          );
        },
      },
    );
  }

  if (!selection) return null;

  const dateLabel =
    checkIn && checkOut
      ? `${format(range?.from ?? selection.checkIn, "MMM d")} – ${format(
          range?.to ?? selection.checkOut,
          "MMM d, yyyy",
        )}`
      : "No dates picked";

  const canBlock =
    Boolean(blockPropertyId && blockRoomId && checkIn && checkOut) &&
    !createBooking.isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {choice === "block"
              ? "Block Dates"
              : choice === "price"
                ? "Price Hike or Discount"
                : "What are these dates for?"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto px-4 pb-4">
          {choice !== "block" && (
            <div className="border bg-muted/30 px-2.5 py-2 text-xs">
              <p className="font-medium">{selection.unitLabel}</p>
              <p className="text-foreground/70">{dateLabel}</p>
            </div>
          )}

          {choice === null && (
            <div className="flex flex-col gap-1.5">
              {CHOICES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => pick(option.id)}
                  className="flex items-start gap-2.5 border px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted/40"
                >
                  <option.icon className="mt-0.5 size-4 shrink-0 text-foreground/70" />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-[11px] text-foreground/70">
                      {option.hint}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {choice === "block" && (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-foreground/80 text-xs">
                  Property
                </span>
                <Select
                  value={blockPropertyId}
                  onValueChange={(v) => {
                    setBlockPropertyId(v as string);
                    // Rooms belong to one property; keeping the old id would
                    // block a room the chosen property does not own.
                    setBlockRoomId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue>
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

              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-foreground/80 text-xs">
                  Dates
                </span>
                <StayRangeCalendar
                  value={range}
                  onChange={setRange}
                  nights={occupancy?.data?.nights ?? []}
                  totalRooms={occupancy?.data?.totalRooms ?? 1}
                  month={month}
                  onMonthChange={setMonth}
                  disabled={!blockPropertyId}
                  placeholder="Pick the dates to block"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-foreground/80 text-xs">
                  Room
                </span>

                {!blockPropertyId || !checkIn || !checkOut ? (
                  <p className="border border-dashed px-3 py-4 text-center text-foreground/70 text-xs">
                    Pick a property and dates to see rooms.
                  </p>
                ) : loadingRooms ? (
                  <p className="border border-dashed px-3 py-4 text-center text-foreground/70 text-xs">
                    Checking availability...
                  </p>
                ) : rooms.length === 0 ? (
                  <p className="border border-dashed px-3 py-4 text-center text-foreground/70 text-xs">
                    This property has no published rooms.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {rooms.map((room) => {
                      const isBooked = room.conflicts.length > 0;
                      const isSelected = blockRoomId === room.id;

                      return (
                        <button
                          key={room.id}
                          type="button"
                          // Unlike a booking, a booked room stays selectable:
                          // maintenance does not wait for the room to empty.
                          onClick={() => setBlockRoomId(room.id)}
                          className={cn(
                            "flex items-start justify-between gap-3 border px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted/40",
                            isSelected && "border-primary bg-primary/5",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="font-medium">{room.name}</p>
                            <p className="text-[11px] text-foreground/70">
                              {room.roomType.replace("_", " ")}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            {isBooked ? (
                              <>
                                <p className="font-medium text-destructive">
                                  Has bookings
                                </p>
                                <p className="text-[11px] text-foreground/70">
                                  {room.conflicts
                                    .map((c) =>
                                      formatBookedRange(c.checkIn, c.checkOut),
                                    )
                                    .join(", ")}
                                </p>
                              </>
                            ) : (
                              <span className="text-foreground/70">Free</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* The clash, named. A block does not cancel these bookings, so
                  whoever is blocking has to move the guests themselves. */}
              {hasConflict && (
                <div className="border border-destructive/50 bg-destructive/10 px-2.5 py-2 text-xs">
                  <p className="font-medium text-destructive">
                    {conflicts.length}{" "}
                    {conflicts.length === 1 ? "booking" : "bookings"} already on
                    this room
                  </p>
                  <ul className="mt-1 flex flex-col gap-0.5 text-[11px] text-foreground/80">
                    {conflicts.map((c) => (
                      <li key={c.id}>
                        {c.ref} · {c.guestName ?? "Blocked"} ·{" "}
                        {formatBookedRange(c.checkIn, c.checkOut)}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-[11px] text-foreground/80">
                    {overrideConflict
                      ? "Blocking anyway leaves these bookings in place — move or cancel them yourself."
                      : "Blocking these dates will not cancel them."}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-foreground/80 text-xs">
                  Reason
                </span>
                <Select
                  value={reason}
                  onValueChange={(v) => setReason(v as BlockReason)}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {(value: unknown) =>
                        BLOCK_REASONS.find((r) => r.value === value)?.label ??
                        "Maintenance"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {BLOCK_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-foreground/80 text-xs">
                  Notes
                </span>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </>
          )}

          {choice === "price" && (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-foreground/80 text-xs">
                  Change
                </span>
                <div className="flex gap-1.5">
                  {(["discount", "hike"] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setAdjustKind(kind)}
                      className={cn(
                        "flex-1 border px-2 py-1.5 text-xs capitalize transition-colors",
                        adjustKind === kind
                          ? "border-primary bg-primary/5 font-medium"
                          : "hover:bg-muted/40",
                      )}
                    >
                      {kind === "hike" ? "Charge more" : "Charge less"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-foreground/80 text-xs">
                  Amount per night (₹)
                </span>
                <Input
                  type="number"
                  min={0}
                  value={adjustValue}
                  onChange={(e) => setAdjustValue(e.target.value)}
                  placeholder="e.g. 500"
                />
                {adjustValue.trim() !== "" && (
                  <p className="text-[11px] text-foreground/70">
                    {adjustKind === "hike" ? "Adds " : "Takes off "}
                    {formatInr(Math.round(Number(adjustValue) * 100))} a night
                    for these dates.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={createBooking.isPending}
            onClick={() => (choice === null ? close() : setChoice(null))}
          >
            {choice === null ? "Cancel" : "Back"}
          </Button>

          {choice === "block" && (
            <Button
              variant={
                hasConflict && overrideConflict ? "destructive" : "default"
              }
              disabled={!canBlock}
              onClick={handleBlock}
            >
              {createBooking.isPending
                ? "Blocking..."
                : hasConflict
                  ? overrideConflict
                    ? "Block Anyway"
                    : "Block Dates"
                  : "Block Dates"}
            </Button>
          )}

          {choice === "price" && (
            <Button
              disabled={!adjustValue.trim()}
              onClick={() => {
                // Nightly rates live on the room, with no per-date overrides in
                // the schema, so there is nowhere to save this yet.
                feedback.success(
                  "Rate changes are coming soon",
                  "Per-date pricing isn't built yet — this feature is still being made.",
                );
                close();
              }}
            >
              Apply
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
