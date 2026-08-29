import { api } from "@/shared/lib/api-client";

export function useMarkAttendance() {
  // The client's default "siblings" strategy would invalidate the attendance
  // query on its own, and the tracker also refetches the month explicitly --
  // together that fired two identical GETs per mark. The tracker owns the
  // refetch, so the automatic one is turned off here.
  return api.api.platform.attendance.$put.useMutation({ invalidate: "none" });
}
