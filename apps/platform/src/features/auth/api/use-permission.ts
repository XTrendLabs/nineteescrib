import {
  type AppRole,
  roles,
  type statement,
} from "@propertyos/auth/permissions";
import { useCachedActiveOrganization } from "./use-cached-organizations";
import { useCachedSession } from "./use-cached-session";

type Resource = keyof typeof statement;

function isAppRole(role: string): role is AppRole {
  return role in roles;
}

/**
 * The caller's role in the organization that is currently active.
 *
 * `getFullOrganization` already carries the member list, so this costs no
 * extra request.
 */
export function useActiveRole(): AppRole | undefined {
  const { data: session } = useCachedSession();
  const { data: activeOrganization } = useCachedActiveOrganization();

  const userId = session?.user.id;
  if (!userId || !activeOrganization) return undefined;

  const members = (
    activeOrganization as { members?: { userId: string; role: string }[] }
  ).members;
  const role = members?.find((entry) => entry.userId === userId)?.role;

  return role && isAppRole(role) ? role : undefined;
}

/**
 * Whether the caller may perform an action in the active organization, using
 * the same role definitions the server authorizes against.
 *
 * This hides affordances the user cannot use -- the server still enforces it.
 */
export function useHasPermission<R extends Resource>(
  resource: R,
  action: (typeof statement)[R][number],
) {
  const role = useActiveRole();
  if (!role) return false;

  return roles[role].authorize({ [resource]: [action] } as Record<
    string,
    string[]
  >).success;
}
