import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useSyncExternalStore } from "react";

import { authQueryKeys } from "@/features/auth/api/query-keys";
import {
  useActiveHq,
  useCachedActiveOrganization,
} from "@/features/auth/api/use-cached-organizations";
import { authClient } from "@/features/auth/lib/auth-client";
import type { ActiveView } from "./active-view-store";
import {
  getIsSwitching,
  setSwitching,
  subscribeActiveView,
} from "./active-view-store";

export function useActiveView() {
  const isSwitching = useSyncExternalStore(subscribeActiveView, getIsSwitching);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hqs } = useActiveHq();
  const { data: activeOrganization } = useCachedActiveOrganization();

  // Derived from the session, not remembered locally: an invited staff member
  // whose only membership is a property must see that property on first load,
  // before they have touched the switcher.
  const activeView: ActiveView =
    activeOrganization && activeOrganization.kind !== "hq"
      ? { type: "property", propertyId: activeOrganization.id }
      : { type: "hq" };

  /**
   * Selecting a scope sets Better Auth's active organization, which is what
   * the server authorizes against, and lands on the dashboard.
   *
   * Navigating away matters for correctness, not just tidiness: a URL naming
   * the previously selected property is out of scope once another is active,
   * and the server now refuses it.
   */
  const applyActiveOrganization = useCallback(
    async (organizationId: string) => {
      setSwitching(true);
      try {
        await authClient.organization.setActive({ organizationId });
        // Refetch rather than just invalidate, so the flag stays set until the
        // page actually has data for the new scope.
        await queryClient.refetchQueries({
          queryKey: authQueryKeys.session(),
        });
        await navigate({ to: "/" });
      } finally {
        setSwitching(false);
      }
    },
    [navigate, queryClient],
  );

  const selectHq = useCallback(
    async (hqId?: string) => {
      // Falls back to the only HQ when called without one, so callers that
      // just mean "go up a level" keep working.
      const targetId = hqId ?? (hqs?.length === 1 ? hqs[0].id : undefined);
      if (targetId) await applyActiveOrganization(targetId);
    },
    [applyActiveOrganization, hqs],
  );

  const selectProperty = useCallback(
    async (propertyId: string) => {
      await applyActiveOrganization(propertyId);
    },
    [applyActiveOrganization],
  );

  return {
    activeView,
    activePropertyName:
      activeView.type === "property" ? activeOrganization?.name : undefined,
    isSwitching,
    selectHq,
    selectProperty,
  };
}
