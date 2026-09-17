import { zValidator } from "@hono/zod-validator";

import { AppError, createRouter, ok } from "../../core";
import {
  publicAvailabilityQuerySchema,
  publicBookingSchema,
  publicOccupancyQuerySchema,
} from "./public.schema";
import { publicService } from "./public.service";

/**
 * The booking engine's public surface.
 *
 * Deliberately outside `/api/platform`: every route there runs behind a
 * session and a permission check, and a guest booking a room has neither.
 * Keeping the two apart means the public routes cannot inherit an
 * authenticated helper by accident, and makes the whole unauthenticated
 * surface one file long and reviewable at a glance.
 *
 * Nothing here takes an organization id from the caller -- the property is
 * resolved from its slug, and everything else is scoped to what that resolves
 * to, so a crafted request cannot reach another property's inventory.
 */
export const publicRoutes = createRouter()
  .get("/properties/:slug", async (c) => {
    const property = await publicService.getProperty(c.req.param("slug"));
    return c.json(ok(property));
  })

  .get(
    "/properties/:slug/availability",
    zValidator("query", publicAvailabilityQuerySchema),
    async (c) => {
      const query = c.req.valid("query");
      const result = await publicService.listAvailability(
        c.req.param("slug"),
        query,
      );
      return c.json(ok(result));
    },
  )

  .get(
    "/properties/:slug/occupancy",
    zValidator("query", publicOccupancyQuerySchema),
    async (c) => {
      const result = await publicService.listOccupancy(
        c.req.param("slug"),
        c.req.valid("query"),
      );
      return c.json(ok(result));
    },
  )

  .post(
    "/properties/:slug/bookings",
    zValidator("json", publicBookingSchema),
    async (c) => {
      const input = c.req.valid("json");

      // Nobody can book a night that has already passed.
      const today = new Date().toLocaleDateString("en-CA");
      if (input.checkIn < today) {
        throw AppError.validation("Check-in cannot be in the past");
      }

      const booking = await publicService.createBooking(
        c.req.param("slug"),
        input,
      );
      return c.json(ok(booking), 201);
    },
  );
