import { api } from "@/shared/lib/api-client";

export function useAttendance(
  hqOrganizationId: string | undefined,
  range: { from: string; to: string },
) {
  return api.api.platform.attendance.$get.useQuery({
    query: {
      hqOrganizationId: hqOrganizationId ?? "",
      from: range.from,
      to: range.to,
    },
    enabled: Boolean(hqOrganizationId),
  });
}
