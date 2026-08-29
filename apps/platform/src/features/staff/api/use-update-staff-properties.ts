import { api } from "@/shared/lib/api-client";

/**
 * Assignments are their own endpoint: reconciling organization membership is
 * expensive, and a detail edit should not pay for it.
 */
export function useUpdateStaffProperties() {
  return api.api.platform.staff[":id"].properties.$put.useMutation();
}
