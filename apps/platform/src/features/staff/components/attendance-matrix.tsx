import { cn } from "@propertyos/ui/lib/utils";
import { format, isToday } from "date-fns";
import { getInitials } from "../lib/format";
import type { AttendanceRecord, StaffMember } from "../lib/mock-data";
import { useAttendanceMark } from "../lib/use-attendance-mark";
import { AttendanceStatusDot } from "./attendance-status-dot";

const CELL_WIDTH = 36;
const LABEL_WIDTH = 176;

export function AttendanceMatrix({
  staff,
  days,
  records,
  onRecordsChange,
}: {
  staff: StaffMember[];
  days: Date[];
  records: AttendanceRecord[];
  onRecordsChange: (next: AttendanceRecord[]) => void;
}) {
  const attendanceMark = useAttendanceMark();

  const recordMap = new Map<string, AttendanceRecord>();
  for (const record of records) {
    recordMap.set(`${record.staffId}|${record.date}`, record);
  }

  function handleCellClick(member: StaffMember, dateKey: string) {
    const current = recordMap.get(`${member.id}|${dateKey}`);
    attendanceMark.open({
      staffId: member.id,
      staffName: member.fullName,
      date: dateKey,
      status: current?.status ?? "present",
      reason: current?.reason,
      onSave: (status, reason) => {
        const exists = records.some(
          (r) => r.staffId === member.id && r.date === dateKey,
        );
        if (exists) {
          onRecordsChange(
            records.map((r) =>
              r.staffId === member.id && r.date === dateKey
                ? { ...r, status, reason }
                : r,
            ),
          );
        } else {
          onRecordsChange([
            ...records,
            { staffId: member.id, date: dateKey, status, reason },
          ]);
        }
      },
    });
  }

  const gridTemplateColumns = `${LABEL_WIDTH}px repeat(${days.length}, ${CELL_WIDTH}px)`;

  return (
    <div className="max-h-[60vh] overflow-auto">
      <div
        className="min-w-max"
        style={{ display: "grid", gridTemplateColumns }}
      >
        <div className="sticky top-0 left-0 z-30 border-r border-b bg-muted/50 px-2 py-2 font-medium text-xs shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]">
          Staff
        </div>
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "sticky top-0 z-20 flex items-center justify-center border-r border-b bg-muted/50 py-2 text-[10px]",
              isToday(day) && "bg-neutral-100 dark:bg-neutral-800/60",
            )}
          >
            {format(day, "d")}
          </div>
        ))}

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
              const dateKey = day.toISOString().slice(0, 10);
              const status =
                recordMap.get(`${member.id}|${dateKey}`)?.status ?? "present";
              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => handleCellClick(member, dateKey)}
                  className={cn(
                    "flex items-center justify-center border-r border-b py-1.5 transition-colors hover:bg-muted/60",
                    isToday(day) && "bg-neutral-50 dark:bg-neutral-900/40",
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
