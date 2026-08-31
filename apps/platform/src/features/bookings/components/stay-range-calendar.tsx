import { Button } from "@propertyos/ui/components/button";
import { Calendar } from "@propertyos/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@propertyos/ui/components/popover";
import { cn } from "@propertyos/ui/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

/** One night's occupancy, as the API reports it. */
export type NightOccupancy = {
  night: string;
  booked: number;
};

/**
 * How heavily a night is shaded.
 *
 * Four bands rather than a continuous gradient: a colour ramp implies more
 * precision than "3 of 5 rooms" carries, and adjacent shades would be
 * indistinguishable. Only "full" is disabled -- a partly-booked night is still
 * bookable, and blocking it would hide rooms that are genuinely free.
 */
function occupancyLevel(booked: number, total: number) {
  if (total === 0 || booked === 0) return "free" as const;
  if (booked >= total) return "full" as const;
  return booked / total >= 0.6 ? ("busy" as const) : ("light" as const);
}

const LEVEL_CLASSES = {
  free: "",
  light: "bg-warning/30 text-foreground",
  busy: "bg-warning/60 text-warning-foreground",
  full: "bg-destructive/70 text-white line-through",
} as const;

function toKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

/** The trigger's label: the chosen range, or a prompt. */
function rangeLabel(value: DateRange | undefined) {
  if (!value?.from) return "Pick your stay dates";
  if (!value.to) return `${format(value.from, "LLL dd, y")} — ...`;
  return `${format(value.from, "LLL dd, y")} - ${format(value.to, "LLL dd, y")}`;
}

export function StayRangeCalendar({
  value,
  onChange,
  nights,
  totalRooms,
  month,
  onMonthChange,
  isLoading,
  disabled,
  minDate,
  placeholder,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  nights: NightOccupancy[];
  totalRooms: number;
  month: Date;
  onMonthChange: (month: Date) => void;
  isLoading?: boolean;
  disabled?: boolean;
  /**
   * Earliest selectable night. Extending a stay starts from the current
   * check-out, so everything before it is out of bounds -- past nights alone
   * are not a tight enough floor there.
   */
  minDate?: Date;
  placeholder?: string;
}) {
  const byNight = new Map(nights.map((n) => [n.night, n.booked]));

  const levelOf = (date: Date) =>
    occupancyLevel(byNight.get(toKey(date)) ?? 0, totalRooms);

  // A night with every room taken cannot be part of a stay, so it is not
  // selectable. Past nights are not bookable either.
  const today = new Date(new Date().toDateString());
  const floor = minDate ?? today;
  const isDisabled = (date: Date) => date < floor || levelOf(date) === "full";

  const modifiers = {
    light: (date: Date) => levelOf(date) === "light",
    busy: (date: Date) => levelOf(date) === "busy",
    full: (date: Date) => levelOf(date) === "full",
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start px-2.5 font-normal",
              !value?.from && "text-muted-foreground",
            )}
          >
            <CalendarIcon data-icon="inline-start" />
            {value?.from
              ? rangeLabel(value)
              : (placeholder ?? rangeLabel(value))}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          numberOfMonths={2}
          month={month}
          onMonthChange={onMonthChange}
          selected={value}
          onSelect={onChange}
          disabled={isDisabled}
          modifiers={modifiers}
          modifiersClassNames={{
            light: LEVEL_CLASSES.light,
            busy: LEVEL_CLASSES.busy,
            full: LEVEL_CLASSES.full,
          }}
          classNames={{
            months: "flex flex-col gap-4 sm:flex-row sm:gap-6",
            month_caption:
              "flex h-8 w-full items-center justify-center font-medium text-foreground text-sm",
            weekday:
              "font-medium text-[11px] text-foreground/70 uppercase tracking-wide",
            outside: "text-foreground/30",
          }}
          className={cn(
            "p-3 [--cell-size:--spacing(8)]",
            isLoading && "opacity-60",
          )}
        />

        <div className="flex flex-wrap items-center gap-3 border-t px-3 py-2 text-[11px] text-foreground/80">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 border" />
            Free
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={cn("inline-block size-2.5 border", "bg-warning/30")}
            />
            Filling up
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={cn("inline-block size-2.5 border", "bg-warning/60")}
            />
            Nearly full
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-block size-2.5 border",
                "bg-destructive/70",
              )}
            />
            Fully booked
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
