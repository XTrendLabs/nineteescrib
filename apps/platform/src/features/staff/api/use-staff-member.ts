import { api } from "@/shared/lib/api-client";

export function useStaffMember(id: string | undefined) {
  return api.api.platform.staff[":id"].$get.useQuery({
    param: { id: id ?? "" },
    enabled: Boolean(id),
  });
}
