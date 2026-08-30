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
import {
  activeOrganizationQuerySchema,
  updateCompanyProfileSchema,
} from "./settings.schema";
import { settingsService } from "./settings.service";

/**
 * The organization whose settings are being read or written.
 *
 * Always the caller's active organization, taken from the session rather than
 * the request, so nobody can edit the business identity of a workspace they do
 * not belong to by naming its id.
 *
 * Unlike vendors, this does not climb to the parent HQ: a property has its own
 * legal identity, address and GSTIN, and its invoices carry them -- so the
 * profile belongs to whichever organization is actually active.
 */
function requireOrganizationId(c: Context<AppEnv>) {
  const access = c.get("access");
  if (!access) {
    throw AppError.forbidden("You do not have access to this workspace");
  }
  return access.organization.id;
}

/**
 * Rejects a request whose idea of the active workspace has gone stale.
 *
 * Scope still comes from the session, so this cannot widen anyone's access --
 * it exists so a response is never read as belonging to a workspace it did not
 * come from, and so a save cannot land on the workspace the user just switched
 * away from.
 */
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

export const settingsRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  // Read is gated on `property:read`, which every role holds, rather than on
  // `organization:update`: the business address and support email appear on
  // invoices and guest-facing documents, so staff need to see them. Only
  // editing is restricted, and the PATCH below enforces that separately.
  .get(
    "/company-profile",
    requirePermissionTo("property", "read"),
    zValidator("query", activeOrganizationQuerySchema),
    async (c) => {
      assertActiveOrganizationMatches(
        c,
        c.req.valid("query").activeOrganizationId,
      );
      const result = await settingsService.getCompanyProfile(
        requireOrganizationId(c),
      );
      return c.json(ok(result));
    },
  )
  .patch(
    "/company-profile",
    requirePermissionTo("organization", "update"),
    zValidator("query", activeOrganizationQuerySchema),
    zValidator("json", updateCompanyProfileSchema),
    async (c) => {
      assertActiveOrganizationMatches(
        c,
        c.req.valid("query").activeOrganizationId,
      );
      const result = await settingsService.updateCompanyProfile(
        requireOrganizationId(c),
        c.req.valid("json"),
      );
      return c.json(ok(result));
    },
  );
