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
  requirePermissionTo,
} from "../permission/permission.middleware";
import { requireSubscription } from "../subscription/subscription.middleware";
import {
  availabilityQuerySchema,
  cancelBookingSchema,
  changeStatusSchema,
  createBookingSchema,
  createGuestSchema,
  extendBookingSchema,
  extensionOptionsQuerySchema,
  guestNoteSchema,
  guestTagSchema,
  occupancyQuerySchema,
  recordPaymentSchema,
  roomOccupancyQuerySchema,
  updateBookingSchema,
  updateGuestSchema,
} from "./booking.schema";
import { bookingService } from "./booking.service";

/** The caller's scope, or a 403 -- see `expense.routes`. */
function requireAccess(c: Context<AppEnv>) {
  const access = c.get("access");
  if (!access) {
    throw AppError.forbidden("You do not have access to this workspace");
  }
  return access;
}

/**
 * The HQ the caller is working under. Bookings roll up to the HQ even though
 * each one sits at a property, so this is what scopes every read and write.
 */
function requireHqOrganizationId(c: Context<AppEnv>) {
  const access = requireAccess(c);

  const hqOrganizationId =
    access.organization.kind === "hq"
      ? access.organization.id
      : access.organization.parentOrganizationId;

  if (!hqOrganizationId) {
    throw AppError.validation(
      "This workspace is not part of an HQ, so it has no booking book",
    );
  }

  return hqOrganizationId;
}

/**
 * The property filter to apply to a listing.
 *
 * A caller scoped to one property only ever sees that property, whatever they
 * ask for; at HQ scope, `propertyId` narrows the view and its absence means
 * the whole portfolio.
 */
async function resolvePropertyFilter(c: Context<AppEnv>) {
  const access = requireAccess(c);

  if (access.organization.kind !== "hq") {
    return access.organization.id;
  }

  const requested = c.req.query("propertyId");
  if (!requested || requested === "all") return undefined;

  await assertInScope(c, requested);
  return requested;
}

/**
 * Rejects a read whose caller believes a different workspace is active.
 *
 * See `expense.routes`: the client names the workspace it is rendering, so a
 * response in flight across a workspace switch is never read as belonging to
 * the new one. Scope still comes from the session, so this cannot widen
 * access -- it only turns a stale read into a retry.
 */
function assertActiveWorkspace(c: Context<AppEnv>) {
  const access = requireAccess(c);
  const claimed = c.req.query("activeOrganizationId");

  if (claimed && claimed !== access.organization.id) {
    throw AppError.validation(
      "Active workspace has changed; retry with the current one",
    );
  }
}

/** Confirms a booking belongs to the caller's HQ before acting on it. */
async function assertBookingInScope(c: Context<AppEnv>, id: string) {
  const hqOrganizationId = requireHqOrganizationId(c);
  const owner = await bookingService.findHqOrganizationId(id);

  if (!owner) {
    throw AppError.notFound("Booking not found");
  }

  if (owner !== hqOrganizationId) {
    throw AppError.forbidden("That is outside your current workspace");
  }
}

/** `assertBookingInScope` for a guest profile. */
async function assertGuestInScope(c: Context<AppEnv>, id: string) {
  const hqOrganizationId = requireHqOrganizationId(c);
  const owner = await bookingService.findGuestHqOrganizationId(id);

  if (!owner) {
    throw AppError.notFound("Guest not found");
  }

  if (owner !== hqOrganizationId) {
    throw AppError.forbidden("That is outside your current workspace");
  }
}

export const bookingRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  .get("/", requirePermissionTo("booking", "read"), async (c) => {
    assertActiveWorkspace(c);
    const hqOrganizationId = requireHqOrganizationId(c);
    const propertyId = await resolvePropertyFilter(c);

    const result = await bookingService.listByHqOrganization(hqOrganizationId, {
      propertyId,
    });

    return c.json(ok(result));
  })
  /**
   * The calendar's window. Declared before "/:id" so "calendar" is not taken
   * for a booking id.
   */
  .get("/calendar", requirePermissionTo("booking", "read"), async (c) => {
    assertActiveWorkspace(c);
    const hqOrganizationId = requireHqOrganizationId(c);
    const from = c.req.query("from");
    const to = c.req.query("to");

    if (!from || !to) {
      throw AppError.validation("from and to dates are required");
    }

    const propertyId = await resolvePropertyFilter(c);

    const result = await bookingService.listByDateRange(
      hqOrganizationId,
      from,
      to,
      { propertyId },
    );

    return c.json(ok(result));
  })
  .get("/availability", requirePermissionTo("booking", "read"), async (c) => {
    const parsed = availabilityQuerySchema.safeParse({
      propertyId: c.req.query("propertyId"),
      checkIn: c.req.query("checkIn"),
      checkOut: c.req.query("checkOut"),
      excludeBookingId: c.req.query("excludeBookingId"),
    });

    if (!parsed.success) {
      throw AppError.validation(
        "Invalid availability request",
        parsed.error.issues,
      );
    }

    await assertInScope(c, parsed.data.propertyId);

    const result = await bookingService.listAvailableRooms(parsed.data);
    return c.json(ok(result));
  })
  /**
   * Every room in a property with the stays clashing with these dates.
   *
   * Separate from "/availability", which returns only free rooms: the create
   * dialog needs to show booked rooms too, along with why they are booked.
   */
  .get(
    "/room-availability",
    requirePermissionTo("booking", "read"),
    async (c) => {
      const parsed = availabilityQuerySchema.safeParse({
        propertyId: c.req.query("propertyId"),
        checkIn: c.req.query("checkIn"),
        checkOut: c.req.query("checkOut"),
        excludeBookingId: c.req.query("excludeBookingId"),
      });

      if (!parsed.success) {
        throw AppError.validation(
          "Invalid availability request",
          parsed.error.issues,
        );
      }

      await assertInScope(c, parsed.data.propertyId);

      const result = await bookingService.listRoomsWithConflicts(parsed.data);
      return c.json(ok(result));
    },
  )
  /**
   * How full a property is on each night of a window, for the create dialog's
   * calendar shading.
   */
  .get("/occupancy", requirePermissionTo("booking", "read"), async (c) => {
    const parsed = occupancyQuerySchema.safeParse({
      propertyId: c.req.query("propertyId"),
      from: c.req.query("from"),
      to: c.req.query("to"),
    });

    if (!parsed.success) {
      throw AppError.validation(
        "Invalid occupancy request",
        parsed.error.issues,
      );
    }

    await assertInScope(c, parsed.data.propertyId);

    const result = await bookingService.listNightlyOccupancy(parsed.data);
    return c.json(ok(result));
  })
  .get("/guests", requirePermissionTo("booking", "read"), async (c) => {
    assertActiveWorkspace(c);
    const hqOrganizationId = requireHqOrganizationId(c);
    const result = await bookingService.listGuests(hqOrganizationId);
    return c.json(ok(result));
  })
  /**
   * Guests matching a partial phone number, for the booking form.
   *
   * Answers with an empty list rather than a 404 when nobody matches: a
   * first-time guest is the expected case, not an error. Declared before
   * "/guests/:id" so "lookup" is not taken for a guest id.
   */
  .get("/guests/lookup", requirePermissionTo("booking", "read"), async (c) => {
    const hqOrganizationId = requireHqOrganizationId(c);
    const phone = c.req.query("phone")?.trim();

    if (!phone) {
      throw AppError.validation("A phone number is required");
    }

    const result = await bookingService.searchGuestsByPhone(
      hqOrganizationId,
      phone,
    );

    return c.json(ok(result));
  })
  /**
   * The tag vocabulary in use. Declared before "/guests/:id" so "tags" is not
   * taken for a guest id.
   */
  .get("/guests/tags", requirePermissionTo("booking", "read"), async (c) => {
    const hqOrganizationId = requireHqOrganizationId(c);
    const result = await bookingService.listGuestTagsInUse(hqOrganizationId);
    return c.json(ok(result));
  })
  .get("/guests/:id", requirePermissionTo("booking", "read"), async (c) => {
    const id = c.req.param("id");
    await assertGuestInScope(c, id);

    const result = await bookingService.findGuest(id);
    if (!result) {
      throw AppError.notFound("Guest not found");
    }

    return c.json(ok(result));
  })
  .post(
    "/guests",
    requirePermissionTo("booking", "create"),
    zValidator("json", createGuestSchema),
    async (c) => {
      const hqOrganizationId = requireHqOrganizationId(c);
      const session = c.get("session");
      const result = await bookingService.createGuest(
        hqOrganizationId,
        session.user.id,
        c.req.valid("json"),
      );
      return c.json(ok(result));
    },
  )
  .patch(
    "/guests/:id",
    requirePermissionTo("booking", "update"),
    zValidator("json", updateGuestSchema),
    async (c) => {
      const id = c.req.param("id");
      await assertGuestInScope(c, id);

      const result = await bookingService.updateGuest(id, c.req.valid("json"));
      if (!result) {
        throw AppError.notFound("Guest not found");
      }

      return c.json(ok(result));
    },
  )
  .post(
    "/guests/:id/tags",
    requirePermissionTo("booking", "update"),
    zValidator("json", guestTagSchema),
    async (c) => {
      const id = c.req.param("id");
      await assertGuestInScope(c, id);

      const session = c.get("session");
      const result = await bookingService.addGuestTag(
        id,
        session.user.id,
        c.req.valid("json"),
      );

      return c.json(ok(result));
    },
  )
  .delete(
    "/guests/:id/tags/:tag",
    requirePermissionTo("booking", "update"),
    async (c) => {
      const id = c.req.param("id");
      await assertGuestInScope(c, id);

      const result = await bookingService.removeGuestTag(
        id,
        c.req.param("tag"),
      );
      return c.json(ok(result));
    },
  )
  .post(
    "/guests/:id/notes",
    requirePermissionTo("booking", "update"),
    zValidator("json", guestNoteSchema),
    async (c) => {
      const id = c.req.param("id");
      await assertGuestInScope(c, id);

      const session = c.get("session");
      const result = await bookingService.addGuestNote(
        id,
        session.user.id,
        c.req.valid("json"),
      );

      return c.json(ok(result));
    },
  )
  .delete(
    "/guests/notes/:noteId",
    requirePermissionTo("booking", "update"),
    async (c) => {
      const noteId = c.req.param("noteId");

      const guestId = await bookingService.findGuestIdByNote(noteId);
      if (!guestId) {
        throw AppError.notFound("Note not found");
      }

      await assertGuestInScope(c, guestId);

      const result = await bookingService.removeGuestNote(noteId, guestId);
      return c.json(ok(result));
    },
  )
  .get("/:id", requirePermissionTo("booking", "read"), async (c) => {
    const id = c.req.param("id");
    await assertBookingInScope(c, id);

    const result = await bookingService.findById(id);
    if (!result) {
      throw AppError.notFound("Booking not found");
    }

    return c.json(ok(result));
  })
  .get("/:id/audit", requirePermissionTo("booking", "read"), async (c) => {
    const id = c.req.param("id");
    await assertBookingInScope(c, id);

    const result = await bookingService.listAudit(id);
    return c.json(ok(result));
  })
  .post(
    "/",
    requirePermissionTo("booking", "create"),
    zValidator("json", createBookingSchema),
    async (c) => {
      const hqOrganizationId = requireHqOrganizationId(c);
      const session = c.get("session");
      const body = c.req.valid("json");

      await assertInScope(c, body.propertyId);

      const result = await bookingService.create(
        hqOrganizationId,
        session.user.id,
        body,
      );

      return c.json(ok(result));
    },
  )
  .patch(
    "/:id",
    requirePermissionTo("booking", "update"),
    zValidator("json", updateBookingSchema),
    async (c) => {
      const id = c.req.param("id");
      await assertBookingInScope(c, id);

      const session = c.get("session");
      const result = await bookingService.update(
        id,
        session.user.id,
        c.req.valid("json"),
      );

      if (!result) {
        throw AppError.notFound("Booking not found");
      }

      return c.json(ok(result));
    },
  )
  .post(
    "/:id/status",
    requirePermissionTo("booking", "update"),
    zValidator("json", changeStatusSchema),
    async (c) => {
      const id = c.req.param("id");
      await assertBookingInScope(c, id);

      const session = c.get("session");
      const result = await bookingService.changeStatus(
        id,
        session.user.id,
        c.req.valid("json"),
      );

      return c.json(ok(result));
    },
  )
  /** The nights this booking's own room is taken, for the arrival calendar. */
  .get(
    "/:id/room-occupancy",
    requirePermissionTo("booking", "read"),
    zValidator("query", roomOccupancyQuerySchema),
    async (c) => {
      const id = c.req.param("id");
      await assertBookingInScope(c, id);

      const result = await bookingService.listRoomOccupancy(
        id,
        c.req.valid("query"),
      );
      return c.json(ok(result));
    },
  )
  /** The rooms free for the nights a stay would extend into. */
  .get(
    "/:id/extension-options",
    requirePermissionTo("booking", "read"),
    // Declared rather than read straight off the request so the query shape
    // reaches the client's generated types.
    zValidator("query", extensionOptionsQuerySchema),
    async (c) => {
      const id = c.req.param("id");
      await assertBookingInScope(c, id);

      const { checkOut } = c.req.valid("query");

      const result = await bookingService.listExtensionOptions(id, checkOut);
      return c.json(ok(result));
    },
  )
  .post(
    "/:id/extend",
    requirePermissionTo("booking", "update"),
    zValidator("json", extendBookingSchema),
    async (c) => {
      const id = c.req.param("id");
      await assertBookingInScope(c, id);

      const session = c.get("session");
      const result = await bookingService.extend(
        id,
        session.user.id,
        c.req.valid("json"),
      );

      return c.json(ok(result));
    },
  )
  .post(
    "/:id/cancel",
    requirePermissionTo("booking", "cancel"),
    zValidator("json", cancelBookingSchema),
    async (c) => {
      const id = c.req.param("id");
      await assertBookingInScope(c, id);

      const session = c.get("session");
      const result = await bookingService.cancel(
        id,
        session.user.id,
        c.req.valid("json"),
      );

      return c.json(ok(result));
    },
  )
  .post(
    "/:id/payments",
    requirePermissionTo("booking", "update"),
    zValidator("json", recordPaymentSchema),
    async (c) => {
      const id = c.req.param("id");
      await assertBookingInScope(c, id);

      const session = c.get("session");
      const result = await bookingService.recordPayment(
        id,
        session.user.id,
        c.req.valid("json"),
      );

      return c.json(ok(result));
    },
  )
  .delete(
    "/payments/:paymentId",
    requirePermissionTo("booking", "update"),
    async (c) => {
      const paymentId = c.req.param("paymentId");

      const bookingId = await bookingService.findBookingIdByPayment(paymentId);
      if (!bookingId) {
        throw AppError.notFound("Payment not found");
      }

      await assertBookingInScope(c, bookingId);

      const session = c.get("session");
      const result = await bookingService.removePayment(
        paymentId,
        bookingId,
        session.user.id,
      );

      return c.json(ok(result));
    },
  )
  .delete("/:id", requirePermissionTo("booking", "cancel"), async (c) => {
    const id = c.req.param("id");
    await assertBookingInScope(c, id);

    const result = await bookingService.remove(id);
    if (!result) {
      throw AppError.notFound("Booking not found");
    }

    return c.json(ok(result));
  });
