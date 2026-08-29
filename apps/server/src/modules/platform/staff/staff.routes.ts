import { zValidator } from "@hono/zod-validator";

import { AppError, createRouter, ok, requireSession } from "../../../core";
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

export const staffRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  .get("/", requirePermissionTo("staff", "read"), async (c) => {
    const hqOrganizationId = c.req.query("hqOrganizationId");
    if (!hqOrganizationId) {
      throw AppError.validation("hqOrganizationId is required");
    }

    await assertInScope(c, hqOrganizationId);

    const result = await staffService.listByHqOrganization(hqOrganizationId);
    return c.json(ok(result));
  })
  .get("/:id", requirePermissionTo("staff", "read"), async (c) => {
    await assertStaffInScope(c, c.req.param("id"));

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
