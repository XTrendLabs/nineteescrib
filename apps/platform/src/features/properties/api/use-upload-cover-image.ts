import { api } from "@/shared/lib/api-client";

export function useUploadCoverImage() {
  return api.api.platform.properties[":id"]["cover-image"].$post.useMutation();
}
