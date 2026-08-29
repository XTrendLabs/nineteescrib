import {
  type AppRole,
  roles,
  type statement,
} from "@propertyos/auth/permissions";
import { createMiddleware } from "hono/factory";

import { type AppEnv, AppError } from "../../../core";
import { permissionRepo } from "./permission.repo";

type Resource = keyof typeof statement;

function isAppRole(role: string): role is AppRole {
  return role in roles;
}

/**
 * Loads the caller's scope from the active organization on their session, and
 * caches it for the rest of the request.
 *
 * The session names the organization the user is working in, so the request
 * itself does not need to be inspected -- whether the target arrives as a path
 * param, a query string or a JSON body is irrelevant to authorization.
 */
async function loadAccess(
  c: Parameters<Parameters<typeof createMiddleware<AppEnv>>[0]>[0],
) {
  const cached = c.get("access");
  if (cached) return cached;

  const session = c.get("session");
  const activeOrganizationId = session.session.activeOrganizationId;
  if (!activeOrganizationId) return undefined;

  const scope = await permissionRepo.findActiveScope(
    activeOrganizationId,
    session.user.id,
  );
  if (!scope) return undefined;

  const access = {
    role: scope.role,
    // At HQ scope the caller acts across the properties beneath it; at
    // property scope they act on the property itself.
    viaHq: scope.organization.kind === "hq",
    organization: scope.organization,
  };

  c.set("access", access);

  return access;
}

/**
 * Authorizes an action against the caller's active organization, e.g.
 * `requirePermissionTo("room", "create")`.
 *
 * Scope comes from the session, so a request can only ever act on the
 * organization the user currently has selected -- an HQ, or one property.
 */
export function requirePermissionTo<R extends Resource>(
  resource: R,
  action: (typeof statement)[R][number],
) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const access = await loadAccess(c);
    if (!access) {
      throw AppError.forbidden("You do not have access to this workspace");
    }

    if (!isAppRole(access.role)) {
      throw AppError.forbidden(`Unknown role "${access.role}"`);
    }

    const allowed = roles[access.role].authorize({
      [resource]: [action],
    } as Record<string, string[]>);

    if (!allowed.success) {
      throw AppError.forbidden(`Your role cannot ${action} ${resource}`);
    }

    await next();
  });
}

/**
 * Confirms a request targeting a specific organization is within the caller's
 * active scope: the organization itself, or -- at HQ scope -- one of its
 * properties. Use in handlers that read an organization id from the request.
 */
export async function assertInScope(
  c: Parameters<Parameters<typeof createMiddleware<AppEnv>>[0]>[0],
  organizationId: string,
) {
  const access = c.get("access");
  if (!access) {
    throw AppError.forbidden("You do not have access to this workspace");
  }

  if (organizationId === access.organization.id) return;

  const withinHq =
    access.organization.kind === "hq" &&
    (await permissionRepo.isChildOf(organizationId, access.organization.id));

  if (!withinHq) {
    throw AppError.forbidden("That is outside your current workspace");
  }
}

/** `assertInScope` for a room, resolved through the property that owns it. */
export async function assertRoomInScope(
  c: Parameters<Parameters<typeof createMiddleware<AppEnv>>[0]>[0],
  roomId: string,
) {
  const organizationId = await permissionRepo.findOrganizationIdByRoom(roomId);
  if (!organizationId) {
    throw AppError.notFound("Room not found");
  }
  await assertInScope(c, organizationId);
}

/**
 * `assertInScope` for a staff member, resolved through their HQ.
 *
 * The lookup carries the parent too, so the common "is this within my HQ"
 * check needs no follow-up query.
 */
export async function assertStaffInScope(
  c: Parameters<Parameters<typeof createMiddleware<AppEnv>>[0]>[0],
  staffId: string,
) {
  const scope = await permissionRepo.findStaffScope(staffId);
  if (!scope) {
    throw AppError.notFound("Staff member not found");
  }

  const access = c.get("access");
  if (!access) {
    throw AppError.forbidden("You do not have access to this workspace");
  }

  if (
    scope.organizationId === access.organization.id ||
    scope.parentOrganizationId === access.organization.id
  ) {
    return;
  }

  throw AppError.forbidden("That is outside your current workspace");
}
