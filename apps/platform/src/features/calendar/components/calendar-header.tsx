import { Button } from "@propertyos/ui/components/button";
import { PlusIcon } from "lucide-react";
import type { BookingProperty as MockProperty } from "@/features/bookings/lib/property";
import { MonthNavigator } from "./month-navigator";
import { PropertyFilter } from "./property-filter";
import type { RangeMode } from "./range-mode-toggle";
import { RangeModeToggle } from "./range-mode-toggle";

export function CalendarHeader({
  month,
  onMonthChange,
  rangeMode,
  onRangeModeChange,
  properties,
  propertyFilter,
  onPropertyFilterChange,
  propertyLocked,
  onAddBlock,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  rangeMode: RangeMode;
  onRangeModeChange: (value: RangeMode) => void;
  properties: MockProperty[];
  propertyFilter: string;
  onPropertyFilterChange: (value: string) => void;
  propertyLocked?: boolean;
  onAddBlock: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-display-md">Booking Calendar</h1>
        <p className="text-muted-foreground text-sm">
          Multi-property master calendar across your portfolio
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
        <MonthNavigator month={month} onChange={onMonthChange} />
        <PropertyFilter
          properties={properties}
          value={propertyFilter}
          onChange={onPropertyFilterChange}
          locked={propertyLocked}
        />
        <Button onClick={onAddBlock}>
          <PlusIcon />
          Add Block
        </Button>
        <RangeModeToggle value={rangeMode} onChange={onRangeModeChange} />
      </div>
    </div>
  );
}
