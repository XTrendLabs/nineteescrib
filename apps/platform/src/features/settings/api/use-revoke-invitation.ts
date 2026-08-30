import { api } from "@/shared/lib/api-client";

export function useRevokeInvitation() {
  return api.api.platform.settings.members.invitations[
    ":id"
  ].$delete.useMutation();
}
