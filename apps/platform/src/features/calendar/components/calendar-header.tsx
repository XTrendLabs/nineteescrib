import { Button } from "@propertyos/ui/components/button";
import { PlusIcon } from "lucide-react";
import type { MockProperty } from "../lib/mock-data";
import { MonthNavigator } from "./month-navigator";
import { PropertyFilter } from "./property-filter";
import type { RangeMode } from "./range-mode-toggle";
import { RangeModeToggle } from "./range-mode-toggle";
import type { CalendarView } from "./view-toggle";
import { ViewToggle } from "./view-toggle";

export function CalendarHeader({
  month,
  onMonthChange,
  view,
  onViewChange,
  rangeMode,
  onRangeModeChange,
  properties,
  propertyFilter,
  onPropertyFilterChange,
  onAddBlock,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  rangeMode: RangeMode;
  onRangeModeChange: (value: RangeMode) => void;
  properties: MockProperty[];
  propertyFilter: string;
  onPropertyFilterChange: (value: string) => void;
  onAddBlock: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-display-md">HQ Calendar</h1>
        <p className="text-muted-foreground text-sm">
          Multi-property master calendar across your portfolio
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
        <MonthNavigator month={month} onChange={onMonthChange} />
        <ViewToggle value={view} onChange={onViewChange} />
        <PropertyFilter
          properties={properties}
          value={propertyFilter}
          onChange={onPropertyFilterChange}
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
