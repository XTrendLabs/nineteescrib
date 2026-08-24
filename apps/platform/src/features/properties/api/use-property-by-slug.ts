import { api } from "@/shared/lib/api-client";

export function usePropertyBySlug(slug: string | undefined) {
  return api.api.platform.properties[":slug"].$get.useQuery({
    param: { slug: slug ?? "" },
    enabled: Boolean(slug),
  });
}
