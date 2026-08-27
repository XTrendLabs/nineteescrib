import { api } from "@/shared/lib/api-client";

/** The HQ organizations the signed-in user belongs to. */
export function useHqList() {
  return api.api.platform.hq.$get.useQuery({});
}
