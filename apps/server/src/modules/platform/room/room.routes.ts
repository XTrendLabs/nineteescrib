import { zValidator } from "@hono/zod-validator";

import { AppError, createRouter, ok, requireSession } from "../../../core";
import {
  assertInScope,
  assertRoomInScope,
  requirePermissionTo,
} from "../permission/permission.middleware";
import { requireSubscription } from "../subscription/subscription.middleware";
import { createRoomSchema, updateRoomSchema } from "./room.schema";
import { roomService } from "./room.service";

export const roomRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  .get("/amenities", async (c) => {
    const result = await roomService.listAmenities();
    return c.json(ok(result));
  })
  .get("/", requirePermissionTo("room", "read"), async (c) => {
    const propertyId = c.req.query("propertyId");
    if (!propertyId) {
      throw AppError.validation("propertyId is required");
    }

    await assertInScope(c, propertyId);

    const result = await roomService.listByProperty(propertyId);

    return c.json(ok(result));
  })
  .post(
    "/",
    requirePermissionTo("room", "create"),
    zValidator("json", createRoomSchema),
    async (c) => {
      const body = c.req.valid("json");
      await assertInScope(c, body.propertyId);

      const result = await roomService.create(body);
      return c.json(ok(result));
    },
  )
  .patch(
    "/:id",
    requirePermissionTo("room", "update"),
    zValidator("json", updateRoomSchema),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");

      await assertRoomInScope(c, id);

      const result = await roomService.update(id, body);
      if (!result) {
        throw AppError.notFound("Room not found");
      }

      return c.json(ok(result));
    },
  )
  .delete("/:id", requirePermissionTo("room", "delete"), async (c) => {
    const id = c.req.param("id");
    await assertRoomInScope(c, id);

    const result = await roomService.remove(id);
    if (!result) {
      throw AppError.notFound("Room not found");
    }

    return c.json(ok(result));
  })
  .post("/:id/images", requirePermissionTo("room", "update"), async (c) => {
    const id = c.req.param("id");
    await assertRoomInScope(c, id);

    const body = await c.req.parseBody();
    const file = body.file;

    if (!(file instanceof File)) {
      throw AppError.validation("An image file is required");
    }

    const result = await roomService.addImage(id, file);
    return c.json(ok(result));
  })
  .delete(
    "/:id/images/:imageId",
    requirePermissionTo("room", "update"),
    async (c) => {
      await assertRoomInScope(c, c.req.param("id"));

      const imageId = c.req.param("imageId");
      const result = await roomService.removeImage(imageId);
      if (!result) {
        throw AppError.notFound("Image not found");
      }

      return c.json(ok(result));
    },
  );
