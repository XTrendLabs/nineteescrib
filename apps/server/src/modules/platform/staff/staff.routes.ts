import { zValidator } from "@hono/zod-validator";
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
  assertStaffInScope,
  requirePermissionTo,
} from "../permission/permission.middleware";
import { requireSubscription } from "../subscription/subscription.middleware";
import {
  createStaffSchema,
  updateStaffPropertiesSchema,
  updateStaffSchema,
} from "./staff.schema";
import { staffService } from "./staff.service";

/**
 * Restricts a property-scoped caller to their own staff record.
 *
 * Someone working inside a single property can see who else works there, but
 * another person's profile -- their address, documents, emergency contact --
 * is not theirs to open or edit. Callers acting from the HQ are unaffected:
 * managing the roster is what HQ scope is for.
 */
async function assertOwnRecordAtPropertyScope(
  c: Context<AppEnv>,
  staffId: string,
) {
  const access = c.get("access");
  if (!access || access.organization.kind === "hq") return;

  const ownId = await staffService.findIdByUserId(c.get("session").user.id);
  if (ownId !== staffId) {
    throw AppError.forbidden("You can only view your own staff profile");
  }
}

/** Refuses an action that only makes sense from HQ scope. */
function assertHqScope(c: Context<AppEnv>, message: string) {
  const access = c.get("access");
  if (access?.organization.kind !== "hq") {
    throw AppError.forbidden(message);
  }
}

export const staffRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  .get("/", requirePermissionTo("staff", "read"), async (c) => {
    const access = c.get("access");
    if (!access) {
      throw AppError.forbidden("You do not have access to this workspace");
    }

    // The caller names the workspace it believes is active. Scope still comes
    // from the session, so this cannot widen anyone's access -- it exists so a
    // response is never read as belonging to a workspace it did not come from,
    // and so the client can key its cache per workspace.
    const activeOrganizationId = c.req.query("activeOrganizationId");
    if (
      activeOrganizationId &&
      activeOrganizationId !== access.organization.id
    ) {
      throw AppError.validation(
        "Active workspace has changed; retry with the current one",
      );
    }

    // Someone scoped to a single property sees that property's roster. Asking
    // for the HQ from inside a property is not a wider view they are entitled
    // to, so the scope decides the query rather than the query string.
    if (access.organization.kind !== "hq") {
      const result = await staffService.listByProperty(
        access.organization.id,
        c.get("session").user.id,
      );
      return c.json(ok(result));
    }

    const hqOrganizationId = c.req.query("hqOrganizationId");
    if (!hqOrganizationId) {
      throw AppError.validation("hqOrganizationId is required");
    }

    await assertInScope(c, hqOrganizationId);

    const result = await staffService.listByHqOrganization(
      hqOrganizationId,
      c.get("session").user.id,
    );
    return c.json(ok(result));
  })
  .get("/:id", requirePermissionTo("staff", "read"), async (c) => {
    await assertStaffInScope(c, c.req.param("id"));
    await assertOwnRecordAtPropertyScope(c, c.req.param("id"));

    const result = await staffService.findById(c.req.param("id"));
    if (!result) {
      throw AppError.notFound("Staff member not found");
    }

    return c.json(ok(result));
  })
  .post(
    "/",
    requirePermissionTo("staff", "create"),
    zValidator("json", createStaffSchema),
    async (c) => {
      const body = c.req.valid("json");
      await assertInScope(c, body.hqOrganizationId);

      const result = await staffService.create(body);
      return c.json(ok(result));
    },
  )
  .patch(
    "/:id",
    requirePermissionTo("staff", "update"),
    zValidator("json", updateStaffSchema),
    async (c) => {
      await assertStaffInScope(c, c.req.param("id"));
      await assertOwnRecordAtPropertyScope(c, c.req.param("id"));

      const result = await staffService.update(
        c.req.param("id"),
        c.req.valid("json"),
      );
      if (!result) {
        throw AppError.notFound("Staff member not found");
      }

      return c.json(ok(result));
    },
  )
  .put(
    "/:id/properties",
    requirePermissionTo("staff", "update"),
    zValidator("json", updateStaffPropertiesSchema),
    async (c) => {
      await assertStaffInScope(c, c.req.param("id"));
      // Which properties someone works at is an HQ decision -- editing your
      // own profile must not let you assign yourself elsewhere.
      assertHqScope(c, "Only HQ can change property assignments");

      const result = await staffService.setProperties(
        c.req.param("id"),
        c.req.valid("json").propertyIds,
      );
      if (!result) {
        throw AppError.notFound("Staff member not found");
      }

      return c.json(ok(result));
    },
  )
  .delete("/:id", requirePermissionTo("staff", "delete"), async (c) => {
    await assertStaffInScope(c, c.req.param("id"));

    const result = await staffService.remove(c.req.param("id"));
    if (!result) {
      throw AppError.notFound("Staff member not found");
    }

    return c.json(ok(result));
  });
