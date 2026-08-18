import { cn } from "@propertyos/ui/lib/utils";
import type { AttendanceStatus } from "../lib/mock-data";
import { ATTENDANCE_LABELS } from "../lib/mock-data";

const SOLID_CLASS: Partial<Record<AttendanceStatus, string>> = {
  present: "bg-emerald-500",
  absent: "bg-red-500",
  on_leave: "bg-amber-500",
};

export function AttendanceStatusDot({
  status,
  className,
  showLabel,
}: {
  status: AttendanceStatus;
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        role="img"
        aria-label={ATTENDANCE_LABELS[status]}
        className={cn(
          "inline-block size-2.5 shrink-0 rounded-full",
          status === "half_day"
            ? "bg-[conic-gradient(theme(colors.emerald.500)_0deg_180deg,theme(colors.amber.500)_180deg_360deg)]"
            : SOLID_CLASS[status],
          className,
        )}
      />
      {showLabel && (
        <span className="text-muted-foreground text-xs">
          {ATTENDANCE_LABELS[status]}
        </span>
      )}
    </span>
  );
}
