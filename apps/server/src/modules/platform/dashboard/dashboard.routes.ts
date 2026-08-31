import { zValidator } from "@hono/zod-validator";
import { type AppRole, roles } from "@propertyos/auth/permissions";
import type { Context } from "hono";

import {
  type AppEnv,
  AppError,
  createRouter,
  ok,
  requireSession,
} from "../../../core";
import {
  assertInScope,
  requirePermissionTo,
} from "../permission/permission.middleware";
import { requireSubscription } from "../subscription/subscription.middleware";
import { overviewQuerySchema } from "./dashboard.schema";
import { dashboardService } from "./dashboard.service";

/** The caller's scope, or a 403 -- see `expense.routes`. */
function requireAccess(c: Context<AppEnv>) {
  const access = c.get("access");
  if (!access) {
    throw AppError.forbidden("You do not have access to this workspace");
  }
  return access;
}

/**
 * The HQ the caller is working under. Bookings and expenses both roll up to
 * the HQ, so the overview reads against it and narrows by property from there.
 */
function requireHqOrganizationId(c: Context<AppEnv>) {
  const access = requireAccess(c);

  const hqOrganizationId =
    access.organization.kind === "hq"
      ? access.organization.id
      : access.organization.parentOrganizationId;

  if (!hqOrganizationId) {
    throw AppError.validation(
      "This workspace is not part of an HQ, so it has no overview",
    );
  }

  return hqOrganizationId;
}

function isAppRole(role: string): role is AppRole {
  return role in roles;
}

export const dashboardRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  .get(
    "/overview",
    // Everyone who can read a booking can see the operations half; the
    // service drops the money half for a role without `finance: read`.
    requirePermissionTo("booking", "read"),
    zValidator("query", overviewQuerySchema),
    async (c) => {
      const access = requireAccess(c);
      const hqOrganizationId = requireHqOrganizationId(c);
      const query = c.req.valid("query");

      // See `expense.routes`: the caller names the workspace it believes is
      // active so a response is never read as belonging to another one. Scope
      // still comes from the session, so this cannot widen access.
      if (
        query.activeOrganizationId &&
        query.activeOrganizationId !== access.organization.id
      ) {
        throw AppError.validation(
          "Active workspace has changed; retry with the current one",
        );
      }

      if (!isAppRole(access.role)) {
        throw AppError.forbidden(`Unknown role "${access.role}"`);
      }

      // A caller inside one property only ever sees that property, whatever
      // they ask for; at HQ scope `propertyId` narrows the view and its
      // absence means the whole portfolio.
      let propertyId: string | undefined;
      if (access.organization.kind === "hq") {
        const requested = query.propertyId;
        if (requested && requested !== "all") {
          await assertInScope(c, requested);
          propertyId = requested;
        }
      } else {
        propertyId = access.organization.id;
      }

      const result = await dashboardService.overview({
        hqOrganizationId,
        propertyId,
        scope: access.organization.kind === "hq" ? "hq" : "property",
        role: access.role,
        window: { from: query.from, to: query.to },
      });

      return c.json(ok(result));
    },
  );
