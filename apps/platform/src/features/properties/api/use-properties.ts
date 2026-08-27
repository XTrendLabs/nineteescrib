import { api } from "@/shared/lib/api-client";

/**
 * The properties in the caller's current scope. The server derives that from
 * the session's active organization -- every property under an HQ, or just the
 * one when a single property is active -- so nothing needs passing here.
 *
 * `scopeId` is only used to key the cache, so switching workspace refetches
 * rather than showing the previous scope's list.
 */
export function useProperties(scopeId: string | undefined) {
  return api.api.platform.properties.$get.useQuery({
    query: { organizationId: scopeId ?? "" },
    enabled: Boolean(scopeId),
  });
}
