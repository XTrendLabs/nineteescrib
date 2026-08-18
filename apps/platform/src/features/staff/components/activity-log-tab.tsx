import { formatDateTime } from "../lib/format";
import type { StaffMember } from "../lib/mock-data";

export function ActivityLogTab({ staff }: { staff: StaffMember }) {
  return (
    <div className="flex flex-col gap-3">
      {staff.activity.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start gap-3 border-b pb-3 last:border-b-0"
        >
          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">{entry.text}</span>
            <span className="text-muted-foreground text-xs">
              {formatDateTime(entry.at)}
            </span>
          </div>
        </div>
      ))}

      {staff.activity.length === 0 && (
        <p className="py-8 text-center text-muted-foreground text-sm">
          No activity recorded yet.
        </p>
      )}
    </div>
  );
}
