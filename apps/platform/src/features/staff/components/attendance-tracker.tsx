import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { addDays, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";
import { MonthNavigator } from "@/features/calendar/components/month-navigator";
import { api } from "@/shared/lib/api-client";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { useAttendance } from "../api/use-attendance";
import { useBulkMarkAttendance } from "../api/use-bulk-mark-attendance";
import { useMarkAttendance } from "../api/use-mark-attendance";
import { monthRange, toDateKey } from "../lib/attendance-date";
import type { AttendanceRecord, AttendanceStatus } from "../lib/mock-data";
import { AttendanceLegend } from "./attendance-legend";
import { AttendanceMatrix, type MarkInput } from "./attendance-matrix";
import { AttendanceSummaryBand } from "./attendance-summary-band";
import { QuickMarkBanner } from "./quick-mark-banner";

/** The directory rows the tracker needs; a subset of the staff API response. */
type TrackedStaff = {
  id: string;
  fullName: string;
  properties: Array<{ id: string; name: string }>;
};

export function AttendanceTracker({
  staff,
  hqOrganizationId,
}: {
  staff: TrackedStaff[];
  hqOrganizationId: string | undefined;
}) {
  const feedback = useFeedback();
  const [month, setMonth] = useState(new Date());
  const [propertyFilter, setPropertyFilter] = useState("all");

  const range = useMemo(() => monthRange(month), [month]);
  const { data: response, isLoading } = useAttendance(hqOrganizationId, range);

  const markAttendance = useMarkAttendance();
  const bulkMark = useBulkMarkAttendance();

  const records = (response?.data?.records ?? []) as AttendanceRecord[];
  const markedDays = useMemo(
    () => new Set(response?.data?.markedDays ?? []),
    [response?.data?.markedDays],
  );

  /** Properties to filter by, derived from who is actually assigned where. */
  const properties = useMemo(() => {
    const byId = new Map<string, string>();
    for (const member of staff) {
      for (const property of member.properties) {
        byId.set(property.id, property.name);
      }
    }
    return [...byId].map(([id, name]) => ({ id, name }));
  }, [staff]);

  const filteredStaff = useMemo(
    () =>
      propertyFilter === "all"
        ? staff
        : staff.filter((s) =>
            s.properties.some((p) => p.id === propertyFilter),
          ),
    [staff, propertyFilter],
  );

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => addDays(start, i));
  }, [month]);

  const todayKey = toDateKey(new Date());

  const queryInput = {
    query: {
      hqOrganizationId: hqOrganizationId ?? "",
      from: range.from,
      to: range.to,
    },
  };

  /** Re-reads the month the mutation just changed. */
  function refetchMonth() {
    api.api.platform.attendance.$get.invalidate(queryInput);
  }

  /**
   * Applies a mark to the cached month straight away.
   *
   * A round-trip to confirm what the user just clicked makes the grid feel
   * unresponsive, so the cell moves immediately and the refetch afterwards
   * only reconciles. Returns the previous cache so a failed write can roll
   * back to it.
   */
  function applyLocally(marks: Array<MarkInput>) {
    const previous = api.api.platform.attendance.$get.getCache(queryInput);
    // Nothing cached yet means nothing to update optimistically; the refetch
    // after the write will populate it.
    if (!previous?.data) return previous;

    api.api.platform.attendance.$get.setCache(queryInput, (current) => {
      if (!current?.data) return previous;

      const touched = new Set(marks.map((m) => `${m.staffId}|${m.date}`));
      const kept = current.data.records.filter(
        (r) => !touched.has(`${r.staffId}|${r.date}`),
      );
      // Only exceptions are stored, so a present mark simply drops the row.
      const added = marks
        .filter((m) => m.status !== "present")
        .map((m) => ({
          staffId: m.staffId,
          date: m.date,
          status: m.status,
          reason: m.reason ?? null,
          organizationId: null,
        }));
      const dates = new Set(marks.map((m) => m.date));

      return {
        ...current,
        data: {
          ...current.data,
          records: [...kept, ...added],
          markedDays: [...new Set([...current.data.markedDays, ...dates])],
        },
      };
    });

    return previous;
  }

  /** Puts back the cache captured before an optimistic write. */
  function rollback(previous: ReturnType<typeof applyLocally>) {
    if (!previous) return;
    api.api.platform.attendance.$get.setCache(queryInput, previous);
  }

  const summary = useMemo(() => {
    const filteredIds = new Set(filteredStaff.map((s) => s.id));
    const inScope = records.filter((r) => filteredIds.has(r.staffId));

    // Stored records are exceptions only, so today's present count is whoever
    // is left after the exceptions -- and only once today has been taken.
    const todayExceptions = inScope.filter((r) => r.date === todayKey);
    const countToday = (status: AttendanceStatus) =>
      todayExceptions.filter((r) => r.status === status).length;

    const todayTaken = markedDays.has(todayKey);
    const presentToday = todayTaken
      ? filteredStaff.length - todayExceptions.length
      : 0;

    // Average across the days actually taken: dividing by the whole month
    // would count untaken days as absences.
    const takenDays = days.filter((day) => markedDays.has(toDateKey(day)));
    const possible = takenDays.length * filteredStaff.length;
    const takenKeys = new Set(takenDays.map(toDateKey));
    const shortfall = inScope
      .filter((r) => takenKeys.has(r.date))
      .reduce((total, r) => total + (r.status === "half_day" ? 0.5 : 1), 0);
    const avgAttendance = possible
      ? ((possible - shortfall) / possible) * 100
      : 0;

    return {
      presentToday,
      absentToday: countToday("absent"),
      onLeaveToday: countToday("on_leave"),
      avgAttendance,
      todayTaken,
    };
  }, [records, filteredStaff, todayKey, markedDays, days]);

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
                : (properties.find((p) => p.id === propertyFilter)?.name ??
                  "All Properties")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QuickMarkBanner
        staff={filteredStaff}
        alreadyMarked={summary.todayTaken}
        pending={bulkMark.isPending}
        onSubmit={(marks) => {
          if (!hqOrganizationId) return;

          const entries = Object.entries(marks).map(([staffId, status]) => ({
            staffId,
            status,
            date: todayKey,
          }));
          const previous = applyLocally(entries);

          bulkMark.mutate(
            {
              json: {
                hqOrganizationId,
                date: todayKey,
                marks: entries.map(({ staffId, status }) => ({
                  staffId,
                  status,
                })),
              },
            },
            {
              onSuccess: () => {
                refetchMonth();
                feedback.success(
                  "Attendance submitted",
                  `Recorded today's status for ${Object.keys(marks).length} staff members.`,
                );
              },
              onError: (error) => {
                rollback(previous);
                feedback.error(
                  "Couldn't submit attendance",
                  getApiErrorMessage(
                    error,
                    "Something went wrong. Please try again.",
                  ),
                );
              },
            },
          );
        }}
      />

      <AttendanceSummaryBand
        presentToday={summary.presentToday}
        absentToday={summary.absentToday}
        onLeaveToday={summary.onLeaveToday}
        totalStaff={filteredStaff.length}
        avgAttendance={summary.avgAttendance}
      />

      <div className="flex min-w-0 max-w-content flex-col border [--content-inset:6rem]">
        <AttendanceMatrix
          staff={filteredStaff}
          days={days}
          records={records}
          markedDays={markedDays}
          isLoading={isLoading}
          onMark={(input) => {
            if (!hqOrganizationId) return;

            const previous = applyLocally([input]);

            markAttendance.mutate(
              { json: { hqOrganizationId, ...input } },
              {
                onSuccess: refetchMonth,
                onError: (error) => {
                  rollback(previous);
                  feedback.error(
                    "Couldn't save attendance",
                    getApiErrorMessage(
                      error,
                      "Something went wrong. Please try again.",
                    ),
                  );
                },
              },
            );
          }}
        />
        <AttendanceLegend />
      </div>
    </div>
  );
}
