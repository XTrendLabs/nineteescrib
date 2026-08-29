import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { addDays, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";
import { MonthNavigator } from "@/features/calendar/components/month-navigator";
import {
  buildAttendanceForMonth,
  MOCK_PROPERTIES,
  type StaffMember,
} from "../lib/mock-data";
import { AttendanceLegend } from "./attendance-legend";
import { AttendanceMatrix } from "./attendance-matrix";
import { AttendanceSummaryBand } from "./attendance-summary-band";
import { QuickMarkBanner } from "./quick-mark-banner";

export function AttendanceTracker({ staff }: { staff: StaffMember[] }) {
  const [month, setMonth] = useState(new Date());
  const [propertyFilter, setPropertyFilter] = useState("all");

  const filteredStaff = useMemo(
    () =>
      propertyFilter === "all"
        ? staff
        : staff.filter(
            (s) =>
              s.primaryPropertyId === propertyFilter ||
              s.primaryPropertyId === "all",
          ),
    [staff, propertyFilter],
  );

  const [records, setRecords] = useState(() =>
    buildAttendanceForMonth(staff, month),
  );

  const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
  const [seedKey, setSeedKey] = useState(monthKey);
  if (monthKey !== seedKey) {
    setSeedKey(monthKey);
    setRecords(buildAttendanceForMonth(staff, month));
  }

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => addDays(start, i));
  }, [month]);

  const todayKey = new Date().toISOString().slice(0, 10);

  const summary = useMemo(() => {
    const filteredIds = new Set(filteredStaff.map((s) => s.id));
    const todayRecords = records.filter(
      (r) => r.date === todayKey && filteredIds.has(r.staffId),
    );
    const presentToday = todayRecords.filter(
      (r) => r.status === "present",
    ).length;
    const absentToday = todayRecords.filter(
      (r) => r.status === "absent",
    ).length;
    const onLeaveToday = todayRecords.filter(
      (r) => r.status === "on_leave",
    ).length;

    const monthRecordsForFiltered = records.filter((r) =>
      filteredIds.has(r.staffId),
    );
    const presentOrHalf = monthRecordsForFiltered.filter(
      (r) => r.status === "present" || r.status === "half_day",
    ).length;
    const avgAttendance = monthRecordsForFiltered.length
      ? (presentOrHalf / monthRecordsForFiltered.length) * 100
      : 0;

    return { presentToday, absentToday, onLeaveToday, avgAttendance };
  }, [records, filteredStaff, todayKey]);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <MonthNavigator month={month} onChange={setMonth} />
        <Select
          value={propertyFilter}
          onValueChange={(v) => setPropertyFilter(v as string)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter Property">
              {propertyFilter === "all"
                ? "All Properties"
                : (MOCK_PROPERTIES.find((p) => p.id === propertyFilter)?.name ??
                  "All Properties")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {MOCK_PROPERTIES.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QuickMarkBanner
        staff={filteredStaff}
        onSubmit={(marks) => {
          setRecords((prev) => {
            const withoutToday = prev.filter(
              (r) => r.date !== todayKey || !(r.staffId in marks),
            );
            const todayEntries = Object.entries(marks).map(
              ([staffId, status]) => ({
                staffId,
                date: todayKey,
                status,
              }),
            );
            return [...withoutToday, ...todayEntries];
          });
        }}
      />

      <AttendanceSummaryBand
        presentToday={summary.presentToday}
        absentToday={summary.absentToday}
        onLeaveToday={summary.onLeaveToday}
        totalStaff={filteredStaff.length}
        avgAttendance={summary.avgAttendance}
      />

      <div className="flex min-w-0 max-w-content flex-col border [--content-inset:4rem]">
        <AttendanceMatrix
          staff={filteredStaff}
          days={days}
          records={records}
          onRecordsChange={setRecords}
        />
        <AttendanceLegend />
      </div>
    </div>
  );
}
