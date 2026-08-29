import { api } from "@/shared/lib/api-client";

/**
 * Every property the logged-in user may switch into.
 *
 * Unlike `useProperties`, this does not depend on the active organization, so
 * the switcher keeps listing the whole portfolio after switching into a single
 * property.
 */
export function useAccessibleProperties() {
  return api.api.platform.properties.accessible.$get.useQuery({});
}
