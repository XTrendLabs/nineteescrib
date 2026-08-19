import {
  Calendar,
  CalendarDayButton,
} from "@propertyos/ui/components/calendar";
import type { ComponentProps } from "react";
import type { DateRange } from "react-day-picker";

import { buildBlockedNights } from "@/features/booking-engine/lib/mock-data";
import type { RoomType } from "@/features/properties/lib/mock-data";

export function AvailabilityCalendar({
  roomTypes,
  dateRange,
  onDateRangeChange,
}: {
  roomTypes: RoomType[];
  dateRange: DateRange | undefined;
  onDateRangeChange: (value: DateRange | undefined) => void;
}) {
  const blockedDates = new Set<string>();
  for (const roomType of roomTypes) {
    const blocked = buildBlockedNights(roomType);
    for (const date of blocked) blockedDates.add(date);
  }

  const disabledDates = (date: Date) => {
    if (date < new Date(new Date().toDateString())) return true;
    return blockedDates.has(date.toISOString().slice(0, 10));
  };

  const CompactDayButton = (
    props: ComponentProps<typeof CalendarDayButton>,
  ) => (
    <CalendarDayButton
      {...props}
      className="mx-auto aspect-square size-8 min-w-0 flex-none rounded-none font-normal text-xs"
    />
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 border border-foreground/30 bg-background" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 border border-foreground/30 bg-muted" />
          Sold Out / Blocked
        </span>
      </div>
      <div className="border p-4">
        <Calendar
          mode="range"
          numberOfMonths={1}
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={onDateRangeChange}
          disabled={disabledDates}
          classNames={{
            root: "w-full",
            months: "w-full",
            month: "w-full",
            nav: "relative mb-3 flex w-full items-center justify-between px-0",
            month_caption:
              "flex h-8 w-full items-center justify-center px-8 font-medium text-sm",
            month_grid: "w-full table-fixed border-separate border-spacing-y-1",
            weekdays: "table-row",
            weekday:
              "table-cell pb-2 text-center font-normal text-[11px] text-muted-foreground uppercase tracking-wide",
            week: "table-row",
            day: "table-cell p-0.5 text-center align-middle [&_button:disabled]:bg-muted [&_button:disabled]:text-muted-foreground/70 [&_button:disabled]:opacity-100!",
            today: "",
            outside: "text-muted-foreground/40",
          }}
          className="w-full border-0 p-0 [--cell-size:--spacing(9)]"
          components={{ DayButton: CompactDayButton }}
        />
      </div>
    </div>
  );
}
