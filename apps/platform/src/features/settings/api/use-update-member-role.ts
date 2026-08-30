import { api } from "@/shared/lib/api-client";

export function useUpdateMemberRole() {
  return api.api.platform.settings.members[":id"].role.$patch.useMutation();
}
