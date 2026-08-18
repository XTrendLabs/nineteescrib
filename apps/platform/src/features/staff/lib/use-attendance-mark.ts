import { openAttendanceMark } from "./attendance-mark-store";
import type { AttendanceStatus } from "./mock-data";

export function useAttendanceMark() {
  return {
    open: (input: {
      staffId: string;
      staffName: string;
      date: string;
      status: AttendanceStatus;
      reason?: string;
      onSave: (status: AttendanceStatus, reason?: string) => void;
    }) =>
      openAttendanceMark({
        target: {
          staffId: input.staffId,
          staffName: input.staffName,
          date: input.date,
          status: input.status,
          reason: input.reason,
        },
        onSave: input.onSave,
      }),
  };
}
