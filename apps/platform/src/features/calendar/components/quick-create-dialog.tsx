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
import { format } from "date-fns";
import { BanIcon, CalendarPlusIcon, TagIcon } from "lucide-react";
import { useState } from "react";

import { useCreateBooking } from "@/features/bookings/api/use-create-booking";
import { formatInr } from "@/features/bookings/lib/format";
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
    hint: "Take the room out of service",
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
  onOpenChange,
  onCreated,
  onRequestBooking,
}: {
  selection: QuickCreateSelection | null;
  propertyId: string | undefined;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  /** Hands off to the full booking dialog, which already does this properly. */
  onRequestBooking: (selection: QuickCreateSelection) => void;
}) {
  const feedback = useFeedback();
  const createBooking = useCreateBooking();

  const [choice, setChoice] = useState<Choice | null>(null);
  const [reason, setReason] =
    useState<(typeof BLOCK_REASONS)[number]["value"]>("maintenance");
  const [notes, setNotes] = useState("");
  const [adjustKind, setAdjustKind] = useState<"hike" | "discount">("discount");
  const [adjustValue, setAdjustValue] = useState("");

  function reset() {
    setChoice(null);
    setReason("maintenance");
    setNotes("");
    setAdjustKind("discount");
    setAdjustValue("");
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
    if (!selection || !propertyId) return;

    createBooking.mutate(
      {
        json: {
          propertyId,
          roomId: selection.unitId,
          kind: "block",
          blockReason: reason,
          checkIn: format(selection.checkIn, "yyyy-MM-dd"),
          checkOut: format(selection.checkOut, "yyyy-MM-dd"),
          notes: notes.trim(),
        },
      },
      {
        onSuccess: () => {
          onCreated();
          feedback.success(
            "Dates blocked",
            `${selection.unitLabel} is out of service for these dates.`,
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

  const dateLabel = `${format(selection.checkIn, "MMM d")} – ${format(
    selection.checkOut,
    "MMM d, yyyy",
  )}`;

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

        <div className="flex flex-col gap-3 px-4 pb-4">
          <div className="border bg-muted/30 px-2.5 py-2 text-xs">
            <p className="font-medium">{selection.unitLabel}</p>
            <p className="text-foreground/70">{dateLabel}</p>
          </div>

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
                  Reason
                </span>
                <Select
                  value={reason}
                  onValueChange={(v) =>
                    setReason(v as (typeof BLOCK_REASONS)[number]["value"])
                  }
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
              disabled={!propertyId || createBooking.isPending}
              onClick={handleBlock}
            >
              {createBooking.isPending ? "Blocking..." : "Block Dates"}
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
