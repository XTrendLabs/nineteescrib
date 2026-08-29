import { createFileRoute } from "@tanstack/react-router";
import { addDays, startOfMonth, startOfWeek } from "date-fns";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { CalendarHeader } from "@/features/calendar/components/calendar-header";
import { Legend } from "@/features/calendar/components/legend";
import type {
  DrawerSelection,
  DrawerTab,
} from "@/features/calendar/components/quick-create-drawer";
import { QuickCreateDrawer } from "@/features/calendar/components/quick-create-drawer";
import type { RangeMode } from "@/features/calendar/components/range-mode-toggle";
import { TimelineGrid } from "@/features/calendar/components/timeline-grid";
import type { CalendarView } from "@/features/calendar/components/view-toggle";
import {
  buildBookingsForUnits,
  buildInventory,
  resolveCalendarProperties,
} from "@/features/calendar/lib/mock-data";
import { useProperties } from "@/features/properties/api/use-properties";

export const Route = createFileRoute("/(protected)/calendar")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeScopeId } = useActiveHq();
  const { data: propertiesResponse } = useProperties(activeScopeId);

  const [month, setMonth] = useState(new Date());
  const [view, setView] = useState<CalendarView>("detailed");
  const [rangeMode, setRangeMode] = useState<RangeMode>("month");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [drawerSelection, setDrawerSelection] =
    useState<DrawerSelection | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("reservation");

  const allProperties = useMemo(
    () => resolveCalendarProperties(propertiesResponse?.data),
    [propertiesResponse?.data],
  );

  const days = useMemo(() => {
    if (rangeMode === "day") {
      return [month];
    }
    if (rangeMode === "week") {
      const start = startOfWeek(month);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const start = startOfMonth(month);
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => addDays(start, i));
  }, [month, rangeMode]);

  const inventory = useMemo(() => {
    const full = buildInventory(allProperties);
    return propertyFilter === "all"
      ? full
      : full.filter((p) => p.propertyId === propertyFilter);
  }, [allProperties, propertyFilter]);

  const allUnits = useMemo(
    () => inventory.flatMap((p) => p.roomTypes.flatMap((rt) => rt.units)),
    [inventory],
  );

  const [bookings, setBookings] = useState(() =>
    buildBookingsForUnits(allUnits, month),
  );

  const unitIdsKey = useMemo(
    () => allUnits.map((u) => u.id).join(","),
    [allUnits],
  );
  const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
  const [seedKey, setSeedKey] = useState(`${unitIdsKey}|${monthKey}`);
  const currentKey = `${unitIdsKey}|${monthKey}`;
  if (currentKey !== seedKey) {
    setSeedKey(currentKey);
    setBookings(buildBookingsForUnits(allUnits, month));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="flex min-w-0 flex-col gap-6 p-4"
    >
      <CalendarHeader
        month={month}
        onMonthChange={setMonth}
        view={view}
        onViewChange={setView}
        rangeMode={rangeMode}
        onRangeModeChange={setRangeMode}
        properties={allProperties}
        propertyFilter={propertyFilter}
        onPropertyFilterChange={setPropertyFilter}
        onAddBlock={() => {
          const firstUnit = allUnits[0];
          if (!firstUnit) {
            return;
          }
          const checkIn = new Date();
          const checkOut = new Date(
            checkIn.getFullYear(),
            checkIn.getMonth(),
            checkIn.getDate() + 1,
          );
          setDrawerTab("block");
          setDrawerSelection({
            unitLabel: firstUnit.label,
            roomType: firstUnit.roomType,
            checkIn,
            checkOut,
          });
        }}
      />

      <div className="flex min-w-0 max-w-content flex-col border [--content-inset:6rem]">
        <TimelineGrid
          inventory={inventory}
          bookings={bookings}
          onBookingsChange={setBookings}
          days={days}
          view={view}
          onRequestCreate={(selection) => {
            setDrawerTab("reservation");
            setDrawerSelection(selection);
          }}
        />
        <Legend />
      </div>

      <QuickCreateDrawer
        selection={drawerSelection}
        initialTab={drawerTab}
        onOpenChange={(open) => {
          if (!open) {
            setDrawerSelection(null);
          }
        }}
      />
    </motion.div>
  );
}
