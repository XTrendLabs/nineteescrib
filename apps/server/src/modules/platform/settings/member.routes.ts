import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";

import {
  type AppEnv,
  AppError,
  createRouter,
  ok,
  requireSession,
} from "../../../core";
import { requirePermissionTo } from "../permission/permission.middleware";
import { requireSubscription } from "../subscription/subscription.middleware";
import { updateMemberRoleSchema } from "./member.schema";
import { memberService } from "./member.service";
import { activeOrganizationQuerySchema } from "./settings.schema";

/**
 * The workspace the caller is working in, as an HQ id.
 *
 * Members are listed across the whole workspace -- the HQ and every property
 * under it -- so at property scope this climbs to the parent HQ. Taken from
 * the session rather than the request, so no caller can name a workspace they
 * do not belong to.
 */
function requireHqOrganizationId(c: Context<AppEnv>) {
  const access = c.get("access");
  if (!access) {
    throw AppError.forbidden("You do not have access to this workspace");
  }

  const hqOrganizationId =
    access.organization.kind === "hq"
      ? access.organization.id
      : access.organization.parentOrganizationId;

  // A standalone property with no HQ above it is its own workspace.
  return hqOrganizationId ?? access.organization.id;
}

function requireUserId(c: Context<AppEnv>) {
  return c.get("session").user.id;
}

function assertActiveOrganizationMatches(
  c: Context<AppEnv>,
  activeOrganizationId: string | undefined,
) {
  const access = c.get("access");
  if (
    activeOrganizationId &&
    activeOrganizationId !== access?.organization.id
  ) {
    throw AppError.validation(
      "Active workspace has changed; retry with the current one",
    );
  }
}

export const memberRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  // Reading the directory is gated on `staff:read`, which every role holds:
  // knowing who else works here is ordinary, and the staff directory already
  // shows the same people. Changing access is gated separately below.
  .get(
    "/",
    requirePermissionTo("staff", "read"),
    zValidator("query", activeOrganizationQuerySchema),
    async (c) => {
      assertActiveOrganizationMatches(
        c,
        c.req.valid("query").activeOrganizationId,
      );
      const result = await memberService.list(requireHqOrganizationId(c));
      return c.json(ok(result));
    },
  )
  .get(
    "/invitations",
    requirePermissionTo("staff", "read"),
    zValidator("query", activeOrganizationQuerySchema),
    async (c) => {
      assertActiveOrganizationMatches(
        c,
        c.req.valid("query").activeOrganizationId,
      );
      const result = await memberService.listInvitations(
        requireHqOrganizationId(c),
      );
      return c.json(ok(result));
    },
  )
  .patch(
    "/:id/role",
    requirePermissionTo("member", "update"),
    zValidator("json", updateMemberRoleSchema),
    async (c) => {
      const result = await memberService.updateRole(
        c.req.param("id"),
        requireHqOrganizationId(c),
        c.req.valid("json").role,
        requireUserId(c),
      );
      return c.json(ok(result));
    },
  )
  .delete("/:id", requirePermissionTo("member", "delete"), async (c) => {
    const result = await memberService.remove(
      c.req.param("id"),
      requireHqOrganizationId(c),
      requireUserId(c),
    );
    return c.json(ok(result));
  })
  .delete(
    "/invitations/:id",
    requirePermissionTo("invitation", "cancel"),
    async (c) => {
      const result = await memberService.revokeInvitation(
        c.req.param("id"),
        requireHqOrganizationId(c),
      );
      return c.json(ok(result));
    },
  );
