import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";
import z from "zod";

import {
  type AppEnv,
  AppError,
  createRouter,
  ok,
  requireSession,
} from "../../../core";
import { requirePermissionTo } from "../permission/permission.middleware";
import { requireSubscription } from "../subscription/subscription.middleware";
import { auditService } from "./audit.service";

/**
 * The workspace whose trail is being read, as an HQ id.
 *
 * Activity spans the HQ and every property under it, so at property scope this
 * climbs to the parent. Taken from the session, so no caller can read the
 * trail of a workspace they do not belong to.
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

const auditQuerySchema = z.object({
  activeOrganizationId: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional(),
  /** Keyset cursor from the previous page. */
  before: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional(),
});

export const auditRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  // Gated on `finance:read` rather than a read every role holds: the trail
  // names who did what and when, which is management information, not part of
  // doing the day-to-day job.
  .get(
    "/",
    requirePermissionTo("finance", "read"),
    zValidator("query", auditQuerySchema),
    async (c) => {
      const { activeOrganizationId, before } = c.req.valid("query");

      const access = c.get("access");
      if (
        activeOrganizationId &&
        activeOrganizationId !== access?.organization.id
      ) {
        throw AppError.validation(
          "Active workspace has changed; retry with the current one",
        );
      }

      const result = await auditService.list(
        requireHqOrganizationId(c),
        before,
      );
      return c.json(ok(result));
    },
  );
