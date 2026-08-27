import type { AppRole, statement } from "@propertyos/auth/permissions";
import { roleLabels, roles } from "@propertyos/auth/permissions";

import { useCachedActiveOrganization } from "../api/use-cached-organizations";
import { useCachedSession } from "../api/use-cached-session";

type Resource = keyof typeof statement;

function isAppRole(role: string | undefined | null): role is AppRole {
  return typeof role === "string" && role in roles;
}

/** The signed-in user's role in the active organization. */
export function useActiveRole(): AppRole | undefined {
  const { data: session } = useCachedSession();
  const { data: activeOrganization } = useCachedActiveOrganization();

  const role = activeOrganization?.members?.find(
    (m) => m.userId === session?.user.id,
  )?.role;

  return isAppRole(role) ? role : undefined;
}

/**
 * Whether the user may perform an action in the active organization, e.g.
 * `useHasPermission("room", "create")`. Mirrors the server-side check in
 * permission.middleware.ts -- it hides UI, it does not secure anything.
 */
export function useHasPermission<R extends Resource>(
  resource: R,
  action: (typeof statement)[R][number],
): boolean {
  const role = useActiveRole();
  if (!role) return false;

  return roles[role].authorize({ [resource]: [action] } as Record<
    string,
    string[]
  >).success;
}

export type { AppRole };
export { roleLabels };
