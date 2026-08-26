import { zValidator } from "@hono/zod-validator";

import { AppError, createRouter, ok, requireSession } from "../../../core";
import { requirePermission } from "../permission/permission.middleware";
import { requireSubscription } from "../subscription/subscription.middleware";
import {
  createPropertySchema,
  updateBusinessDetailsSchema,
  updatePropertyDetailsSchema,
  updateTaxDetailsSchema,
} from "./property.schema";
import { propertyService } from "./property.service";

export const propertyRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  .use(requirePermission)
  .patch("/:id", zValidator("json", updateBusinessDetailsSchema), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const result = await propertyService.updateBusinessDetails(id, body);
    if (!result) {
      throw AppError.notFound("Property not found");
    }

    return c.json(ok(result));
  })
  .patch(
    "/:id/tax-details",
    zValidator("json", updateTaxDetailsSchema),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const result = await propertyService.updateTaxDetails(id, body);
      if (!result) {
        throw AppError.notFound("Property not found");
      }

      return c.json(ok(result));
    },
  )
  .patch(
    "/:id/property-details",
    zValidator("json", updatePropertyDetailsSchema),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const result = await propertyService.updatePropertyDetails(id, body);
      if (!result) {
        throw AppError.notFound("Property not found");
      }

      return c.json(ok(result));
    },
  )
  .get("/", async (c) => {
    const organizationId = c.req.query("organizationId");
    if (!organizationId) {
      throw AppError.validation("organizationId is required");
    }

    const result = await propertyService.list(organizationId);

    return c.json(ok(result));
  })
  .get("/:slug", async (c) => {
    const slug = c.req.param("slug");
    const result = await propertyService.findBySlug(slug);
    if (!result) {
      throw AppError.notFound("Property not found");
    }

    return c.json(ok(result));
  })
  .post("/", async (c) => {
    const body = createPropertySchema.safeParse(await c.req.json());
    if (!body.success) {
      throw AppError.validation("Invalid request", body.error.flatten());
    }

    const result = await propertyService.create(body.data);

    return c.json(ok(result));
  })
  .post("/:id/cover-image", async (c) => {
    const id = c.req.param("id");
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
  });
