import { Button } from "@propertyos/ui/components/button";
import { Calendar } from "@propertyos/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@propertyos/ui/components/popover";
import { cn } from "@propertyos/ui/lib/utils";
import {
  endOfMonth,
  endOfWeek,
  endOfYesterday,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYesterday,
  subDays,
  subMonths,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

const PRESETS: { label: string; getRange: () => DateRange }[] = [
  {
    label: "Today",
    getRange: () => ({ from: startOfDay(new Date()), to: new Date() }),
  },
  {
    label: "Yesterday",
    getRange: () => ({ from: startOfYesterday(), to: endOfYesterday() }),
  },
  {
    label: "Last 7 days",
    getRange: () => ({ from: subDays(new Date(), 6), to: new Date() }),
  },
  {
    label: "This week",
    getRange: () => ({
      from: startOfWeek(new Date()),
      to: endOfWeek(new Date()),
    }),
  },
  {
    label: "This month",
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Last month",
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    },
  },
];

function isPresetActive(preset: DateRange, value: DateRange | undefined) {
  if (!value?.from || !value.to || !preset.from || !preset.to) {
    return false;
  }
  return isSameDay(preset.from, value.from) && isSameDay(preset.to, value.to);
}

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
}) {
  const label =
    value?.from && value.to
      ? `${format(value.from, "MMM d")} – ${format(value.to, "MMM d, yyyy")}`
      : value?.from
        ? format(value.from, "MMM d, yyyy")
        : "Pick a date range";

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-64 justify-start gap-2 font-normal",
              !value?.from && "text-muted-foreground",
            )}
          />
        }
      >
        <CalendarIcon className="size-4" />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          <div className="flex w-40 flex-col gap-0.5 border-r p-2">
            {PRESETS.map((preset) => {
              const range = preset.getRange();
              return (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "justify-start font-normal",
                    isPresetActive(range, value) &&
                      "bg-accent text-accent-foreground",
                  )}
                  onClick={() => onChange(range)}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>
          <Calendar
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            // react-day-picker reports `undefined` while a range is mid-pick
            // -- the first click of a new range clears the old one before the
            // second click completes it. Passing that straight through wiped
            // the selection and reset the label to its placeholder, so an
            // incomplete range is held rather than published.
            onSelect={(next) => {
              if (next) onChange(next);
            }}
            numberOfMonths={2}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
