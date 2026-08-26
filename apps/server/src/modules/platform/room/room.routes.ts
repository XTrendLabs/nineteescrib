import { zValidator } from "@hono/zod-validator";

import { AppError, createRouter, ok, requireSession } from "../../../core";
import { requirePermission } from "../permission/permission.middleware";
import { requireSubscription } from "../subscription/subscription.middleware";
import { createRoomSchema, updateRoomSchema } from "./room.schema";
import { roomService } from "./room.service";

export const roomRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  .use(requirePermission)
  .get("/amenities", async (c) => {
    const result = await roomService.listAmenities();
    return c.json(ok(result));
  })
  .get("/", async (c) => {
    const propertyId = c.req.query("propertyId");
    if (!propertyId) {
      throw AppError.validation("propertyId is required");
    }

    const result = await roomService.listByProperty(propertyId);

    return c.json(ok(result));
  })
  .post("/", zValidator("json", createRoomSchema), async (c) => {
    const body = c.req.valid("json");
    const result = await roomService.create(body);
    return c.json(ok(result));
  })
  .patch("/:id", zValidator("json", updateRoomSchema), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const result = await roomService.update(id, body);
    if (!result) {
      throw AppError.notFound("Room not found");
    }

    return c.json(ok(result));
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const result = await roomService.remove(id);
    if (!result) {
      throw AppError.notFound("Room not found");
    }

    return c.json(ok(result));
  })
  .post("/:id/images", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.parseBody();
    const file = body.file;

    if (!(file instanceof File)) {
      throw AppError.validation("An image file is required");
    }

    const result = await roomService.addImage(id, file);
    return c.json(ok(result));
  })
  .delete("/:id/images/:imageId", async (c) => {
    const imageId = c.req.param("imageId");
    const result = await roomService.removeImage(imageId);
    if (!result) {
      throw AppError.notFound("Image not found");
    }

    return c.json(ok(result));
  });
