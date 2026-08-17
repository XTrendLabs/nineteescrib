import { Button } from "@propertyos/ui/components/button";
import { Calendar } from "@propertyos/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@propertyos/ui/components/popover";
import { addMonths, format, isSameMonth, subMonths } from "date-fns";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export function MonthNavigator({
  month,
  onChange,
}: {
  month: Date;
  onChange: (month: Date) => void;
}) {
  const isCurrentMonth = isSameMonth(month, new Date());

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={isCurrentMonth}
        onClick={() => onChange(new Date())}
      >
        Today
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Previous month"
        onClick={() => onChange(subMonths(month, 1))}
      >
        <ChevronLeftIcon />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Next month"
        onClick={() => onChange(addMonths(month, 1))}
      >
        <ChevronRightIcon />
      </Button>
      <Popover>
        <PopoverTrigger
          render={<Button variant="outline" className="gap-2 font-normal" />}
        >
          <CalendarIcon className="size-4" />
          {format(month, "MMMM yyyy")}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={month}
            defaultMonth={month}
            onSelect={(date) => date && onChange(date)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
