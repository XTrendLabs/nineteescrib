import { zValidator } from "@hono/zod-validator";

import { AppError, createRouter, ok, requireSession } from "../../../core";
import { requirePermission } from "../permission/permission.middleware";
import { requireSubscription } from "../subscription/subscription.middleware";
import { createStaffSchema, updateStaffSchema } from "./staff.schema";
import { staffService } from "./staff.service";

export const staffRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  .use(requirePermission)
  .get("/", async (c) => {
    const hqOrganizationId = c.req.query("hqOrganizationId");
    if (!hqOrganizationId) {
      throw AppError.validation("hqOrganizationId is required");
    }

    const result = await staffService.listByHqOrganization(hqOrganizationId);
    return c.json(ok(result));
  })
  .get("/:id", async (c) => {
    const result = await staffService.findById(c.req.param("id"));
    if (!result) {
      throw AppError.notFound("Staff member not found");
    }

    return c.json(ok(result));
  })
  .post("/", zValidator("json", createStaffSchema), async (c) => {
    const result = await staffService.create(c.req.valid("json"));
    return c.json(ok(result));
  })
  .patch("/:id", zValidator("json", updateStaffSchema), async (c) => {
    const result = await staffService.update(
      c.req.param("id"),
      c.req.valid("json"),
    );
    if (!result) {
      throw AppError.notFound("Staff member not found");
    }

    return c.json(ok(result));
  })
  .delete("/:id", async (c) => {
    const result = await staffService.remove(c.req.param("id"));
    if (!result) {
      throw AppError.notFound("Staff member not found");
    }

    return c.json(ok(result));
  });
