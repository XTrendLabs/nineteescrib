import { api } from "@/shared/lib/api-client";

export function useUpdateRoom() {
  return api.api.platform.rooms[":id"].$patch.useMutation();
}
