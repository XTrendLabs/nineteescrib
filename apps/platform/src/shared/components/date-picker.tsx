import { Button } from "@propertyos/ui/components/button";
import { Calendar } from "@propertyos/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@propertyos/ui/components/popover";
import { cn } from "@propertyos/ui/lib/utils";
import { format, isValid, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

/**
 * Single-date picker over the shared calendar, for form fields stored as a
 * `yyyy-MM-dd` string. Values stay strings end to end so they can go straight
 * into a date-typed column without timezone drift.
 */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  fromYear,
  toYear,
  disabled,
}: {
  id?: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  fromYear?: number;
  toYear?: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const parsed = value ? parseISO(value) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  const currentYear = new Date().getFullYear();
  const startMonth = new Date(fromYear ?? currentYear - 100, 0);
  const endMonth = new Date(toYear ?? currentYear, 11);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start gap-2 overflow-hidden font-normal",
              !selected && "text-muted-foreground",
            )}
          />
        }
      >
        <CalendarIcon className="size-4 shrink-0" />
        <span className="truncate">
          {selected ? format(selected, "d MMM yyyy") : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent
        // A fixed width gives the calendar something to fill, so the grid is
        // evenly spaced rather than hugging the widest row.
        className="w-[300px] p-0"
        align="start"
      >
        <Calendar
          className="w-full"
          mode="single"
          selected={selected}
          // Without a year dropdown a date of birth means clicking back through
          // hundreds of months.
          captionLayout="dropdown"
          defaultMonth={selected ?? endMonth}
          startMonth={startMonth}
          endMonth={endMonth}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
