import { cn } from "@propertyos/ui/lib/utils";
import { format, isToday } from "date-fns";
import { toDateKey } from "../lib/attendance-date";
import { getInitials } from "../lib/format";
import type {
  AttendanceCellStatus,
  AttendanceRecord,
  AttendanceStatus,
} from "../lib/mock-data";
import { useAttendanceMark } from "../lib/use-attendance-mark";
import { AttendanceStatusDot } from "./attendance-status-dot";

export type MarkInput = {
  staffId: string;
  date: string;
  status: AttendanceStatus;
  reason?: string;
};

type MatrixStaff = { id: string; fullName: string; joinedAt?: string };

/**
 * The day a member joined, as a comparable yyyy-MM-dd key.
 *
 * Comparing formatted local dates as strings keeps this in the viewer's own
 * timezone, matching how every other date in the grid is derived. Without a
 * joining date nothing is excluded.
 */
function joinedKey(member: MatrixStaff) {
  return member.joinedAt ? toDateKey(new Date(member.joinedAt)) : "";
}

const CELL_WIDTH = 36;
const LABEL_WIDTH = 176;

export function AttendanceMatrix({
  staff,
  days,
  records,
  markedDays,
  isLoading,
  canMark,
  onMark,
}: {
  staff: MatrixStaff[];
  days: Date[];
  records: AttendanceRecord[];
  /**
   * Which cells have actually been marked, as `staffId|date`.
   *
   * Per staff member: a shared per-day flag would let one person's mark decide
   * what everyone else's empty cell shows.
   */
  markedDays: Set<string>;
  isLoading?: boolean;
  /** When false the grid is read-only and cells do not open the mark dialog. */
  canMark?: boolean;
  onMark: (input: MarkInput) => void;
}) {
  const attendanceMark = useAttendanceMark();

  const recordMap = new Map<string, AttendanceRecord>();
  for (const record of records) {
    recordMap.set(`${record.staffId}|${record.date}`, record);
  }

  /**
   * Only exceptions are stored, so a cell with no record means present on a
   * day that was taken and unmarked on a day that was not.
   *
   * Days before someone joined are neither: they were not employed, so the
   * cell shows nothing rather than crediting them with attendance for a period
   * they were not here. A stored record still wins -- backdating someone's
   * start date should not silently discard marks already made.
   */
  function cellStatus(
    member: MatrixStaff,
    dateKey: string,
  ): AttendanceCellStatus {
    const record = recordMap.get(`${member.id}|${dateKey}`);
    if (record) return record.status;
    if (joinedKey(member) > dateKey) return "not_applicable";
    return markedDays.has(`${member.id}|${dateKey}`) ? "present" : "unmarked";
  }

  function handleCellClick(member: MatrixStaff, dateKey: string) {
    if (!canMark) return;
    // Nothing to record for a day before they joined.
    if (joinedKey(member) > dateKey) return;

    const current = recordMap.get(`${member.id}|${dateKey}`);
    attendanceMark.open({
      staffId: member.id,
      staffName: member.fullName,
      date: dateKey,
      status: current?.status ?? "present",
      reason: current?.reason ?? undefined,
      onSave: (status, reason) =>
        onMark({ staffId: member.id, date: dateKey, status, reason }),
    });
  }

  const gridTemplateColumns = `${LABEL_WIDTH}px repeat(${days.length}, ${CELL_WIDTH}px)`;

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        Loading attendance…
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        No staff to show. Add staff in the Directory tab to start tracking
        attendance.
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-auto">
      <div
        className="min-w-max"
        style={{ display: "grid", gridTemplateColumns }}
      >
        <div className="sticky top-0 left-0 z-30 border-r border-b bg-muted/50 px-2 py-2 font-medium text-xs shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]">
          Staff
        </div>
        {days.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "sticky top-0 z-20 flex items-center justify-center border-r border-b bg-muted/50 py-2 text-[10px]",
                // The palette is greyscale, so today is marked with colour
                // rather than a darker grey that would not read as deliberate.
                today && "bg-sky-100 font-semibold dark:bg-sky-950/60",
              )}
            >
              {today ? (
                <span
                  className="flex size-4 items-center justify-center rounded-full bg-sky-600 text-[9px] text-white"
                  title={`Today, ${format(day, "d MMM yyyy")}`}
                >
                  {format(day, "d")}
                </span>
              ) : (
                format(day, "d")
              )}
            </div>
          );
        })}

        {staff.map((member) => (
          <div key={member.id} className="contents">
            <div
              className="sticky left-0 z-10 flex min-w-0 items-center gap-2 border-r border-b bg-background px-2 py-1.5 text-xs shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]"
              style={{ gridColumn: "1 / span 1" }}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] text-muted-foreground">
                {getInitials(member.fullName)}
              </span>
              <span className="truncate" title={member.fullName}>
                {member.fullName}
              </span>
            </div>
            {days.map((day) => {
              const dateKey = toDateKey(day);
              const status = cellStatus(member, dateKey);
              const beforeJoining = status === "not_applicable";
              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={!canMark || beforeJoining}
                  aria-label={
                    beforeJoining
                      ? `${member.fullName}, ${dateKey}: not yet joined`
                      : `${member.fullName}, ${dateKey}`
                  }
                  onClick={() => handleCellClick(member, dateKey)}
                  className={cn(
                    "flex items-center justify-center border-r border-b py-1.5 transition-colors",
                    canMark && !beforeJoining
                      ? "hover:bg-muted/60"
                      : "cursor-default",
                    // Struck out rather than merely empty, so a gap before
                    // someone joined is legible as "not employed yet".
                    beforeJoining && "bg-muted/30",
                    isToday(day) &&
                      "bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-950/70",
                  )}
                >
                  <AttendanceStatusDot status={status} />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
