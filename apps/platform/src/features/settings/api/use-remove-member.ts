import { api } from "@/shared/lib/api-client";

export function useRemoveMember() {
  return api.api.platform.settings.members[":id"].$delete.useMutation();
}
