import { api } from "@/shared/lib/api-client";

export function useUploadRoomImage() {
  return api.api.platform.rooms[":id"].images.$post.useMutation();
}
