import { zValidator } from "@hono/zod-validator";

import { AppError, createRouter, ok, requireSession } from "../../../core";
import {
  assertInScope,
  requirePermissionTo,
} from "../permission/permission.middleware";
import { requireSubscription } from "../subscription/subscription.middleware";
import {
  createPropertySchema,
  updateBusinessDetailsSchema,
  updatePoliciesSchema,
  updatePropertyDetailsSchema,
  updateTaxDetailsSchema,
  upsertPropertyRuleSchema,
} from "./property.schema";
import { propertyService } from "./property.service";

export const propertyRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  .patch(
    "/:id",
    requirePermissionTo("property", "update"),
    zValidator("json", updateBusinessDetailsSchema),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");

      await assertInScope(c, id);

      const result = await propertyService.updateBusinessDetails(id, body);
      if (!result) {
        throw AppError.notFound("Property not found");
      }

      return c.json(ok(result));
    },
  )
  .patch(
    "/:id/tax-details",
    requirePermissionTo("finance", "update"),
    zValidator("json", updateTaxDetailsSchema),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");

      await assertInScope(c, id);

      const result = await propertyService.updateTaxDetails(id, body);
      if (!result) {
        throw AppError.notFound("Property not found");
      }

      return c.json(ok(result));
    },
  )
  .patch(
    "/:id/property-details",
    requirePermissionTo("property", "update"),
    zValidator("json", updatePropertyDetailsSchema),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");

      await assertInScope(c, id);

      const result = await propertyService.updatePropertyDetails(id, body);
      if (!result) {
        throw AppError.notFound("Property not found");
      }

      return c.json(ok(result));
    },
  )
  .patch(
    "/:id/policies",
    requirePermissionTo("property", "update"),
    zValidator("json", updatePoliciesSchema),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");

      await assertInScope(c, id);

      const result = await propertyService.updatePolicies(id, body);
      if (!result) {
        throw AppError.notFound("Property not found");
      }

      return c.json(ok(result));
    },
  )
  /**
   * The properties the caller can currently see. Scope comes from the session,
   * not the query string: at HQ scope that is every property beneath the HQ,
   * at property scope it is just that one.
   */
  .get("/", requirePermissionTo("property", "read"), async (c) => {
    const access = c.get("access");
    if (!access) {
      throw AppError.forbidden("You do not have access to this workspace");
    }

    const result =
      access.organization.kind === "hq"
        ? await propertyService.list(access.organization.id)
        : await propertyService.listSelf(access.organization.id);

    return c.json(ok(result));
  })
  /**
   * The switcher's list: every property the user may switch into, regardless
   * of which one is currently active. Scoped to the caller's own memberships,
   * so it needs no organization parameter and cannot leak another user's
   * portfolio.
   */
  .get("/accessible", async (c) => {
    const session = c.get("session");
    const result = await propertyService.listAccessible(session.user.id);
    return c.json(ok(result));
  })
  .get("/:slug", requirePermissionTo("property", "read"), async (c) => {
    const slug = c.req.param("slug");
    const result = await propertyService.findBySlug(slug);
    if (!result) {
      throw AppError.notFound("Property not found");
    }

    // The slug names any property; only the one in scope may be read.
    await assertInScope(c, result.id);

    return c.json(ok(result));
  })
  .post("/", async (c) => {
    const body = createPropertySchema.safeParse(await c.req.json());
    if (!body.success) {
      throw AppError.validation("Invalid request", body.error.flatten());
    }

    const result = await propertyService.create(body.data, c.req.raw.headers);

    return c.json(ok(result));
  })
  .post(
    "/:id/cover-image",
    requirePermissionTo("property", "update"),
    async (c) => {
      const id = c.req.param("id");
      await assertInScope(c, id);

      const body = await c.req.parseBody();
      const file = body.file;

      if (!(file instanceof File)) {
        throw AppError.validation("An image file is required");
      }

      const result = await propertyService.updateCoverImage(id, file);
      if (!result) {
        throw AppError.notFound("Property not found");
      }

      return c.json(ok(result));
    },
  )
  .get("/:id/rules", requirePermissionTo("property", "read"), async (c) => {
    const id = c.req.param("id");
    await assertInScope(c, id);

    const result = await propertyService.listRules(id);
    return c.json(ok(result));
  })
  .put(
    "/:id/rules",
    requirePermissionTo("property", "update"),
    zValidator("json", upsertPropertyRuleSchema),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");

      await assertInScope(c, id);

      const result = await propertyService.upsertRule(id, body);
      return c.json(ok(result));
    },
  )
  .delete(
    "/:id/rules/:category",
    requirePermissionTo("property", "update"),
    async (c) => {
      const id = c.req.param("id");
      const category = c.req.param("category");

      await assertInScope(c, id);

      const result = await propertyService.removeRule(id, category);
      if (!result) {
        throw AppError.notFound("Rule not found");
      }

      return c.json(ok(result));
    },
  );
