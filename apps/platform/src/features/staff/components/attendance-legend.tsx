import { ATTENDANCE_CYCLE } from "../lib/mock-data";
import { AttendanceStatusDot } from "./attendance-status-dot";

export function AttendanceLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs">
      <span className="text-muted-foreground">Legend:</span>
      {ATTENDANCE_CYCLE.map((status) => (
        <AttendanceStatusDot key={status} status={status} showLabel />
      ))}
    </div>
  );
}
