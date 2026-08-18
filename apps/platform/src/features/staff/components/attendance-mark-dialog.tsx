import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { cn } from "@propertyos/ui/lib/utils";
import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import {
  closeAttendanceMark,
  getAttendanceMarkState,
  subscribeAttendanceMark,
} from "../lib/attendance-mark-store";
import { ATTENDANCE_LABELS, type AttendanceStatus } from "../lib/mock-data";
import { AttendanceStatusDot } from "./attendance-status-dot";

const STATUS_OPTIONS: AttendanceStatus[] = [
  "present",
  "absent",
  "on_leave",
  "half_day",
];

const REASON_REQUIRED: AttendanceStatus[] = ["on_leave", "half_day"];

export function AttendanceMarkDialog() {
  const [state, setState] = useState(getAttendanceMarkState);
  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [reason, setReason] = useState("");

  useEffect(
    () => subscribeAttendanceMark(() => setState(getAttendanceMarkState())),
    [],
  );

  useEffect(() => {
    if (state.target) {
      setStatus(state.target.status);
      setReason(state.target.reason ?? "");
    }
  }, [state.target]);

  const target = state.target;
  const needsReason = REASON_REQUIRED.includes(status);

  function handleSave() {
    if (!target) {
      return;
    }
    state.onSave?.(
      status,
      needsReason ? reason.trim() || undefined : undefined,
    );
    closeAttendanceMark();
  }

  return (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) {
          closeAttendanceMark();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark attendance</DialogTitle>
          {target && (
            <DialogDescription>
              {target.staffName} · {format(parseISO(target.date), "EEE, MMM d")}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex flex-col gap-3 px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStatus(option)}
                className={cn(
                  "flex items-center gap-2 border px-3 py-2 text-left text-xs transition-colors",
                  status === option
                    ? "border-foreground bg-muted"
                    : "border-border hover:bg-muted/40",
                )}
              >
                <AttendanceStatusDot status={option} />
                {ATTENDANCE_LABELS[option]}
              </button>
            ))}
          </div>

          {needsReason && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="attendance-reason"
                className="font-medium text-muted-foreground text-xs"
              >
                Reason
              </label>
              <textarea
                id="attendance-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  status === "on_leave"
                    ? "e.g. Sick leave, personal leave..."
                    : "e.g. Left early for appointment..."
                }
                rows={3}
                className="w-full resize-none border border-input bg-transparent px-2.5 py-1.5 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeAttendanceMark}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
