import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";

import {
  type AppEnv,
  AppError,
  createRouter,
  ok,
  requireSession,
} from "../../../core";
import { requirePermissionTo } from "../permission/permission.middleware";
import { requireSubscription } from "../subscription/subscription.middleware";
import { createVendorSchema, updateVendorSchema } from "./vendor.schema";
import { vendorService } from "./vendor.service";

/**
 * The HQ the caller is working under.
 *
 * Vendors are shared across every property beneath an HQ, so the directory is
 * the same whether someone is at HQ scope or inside one property -- at
 * property scope it is the parent HQ that owns the vendors. This is taken from
 * the session rather than the request, so no caller can name an HQ they do not
 * work under.
 *
 * `parentOrganizationId` already rides along on the cached scope, so this
 * costs no extra query.
 */
function requireHqOrganizationId(c: Context<AppEnv>) {
  const access = c.get("access");
  if (!access) {
    throw AppError.forbidden("You do not have access to this workspace");
  }

  const hqOrganizationId =
    access.organization.kind === "hq"
      ? access.organization.id
      : access.organization.parentOrganizationId;

  // A standalone property with no HQ above it has no shared directory to read.
  if (!hqOrganizationId) {
    throw AppError.validation(
      "This workspace is not part of an HQ, so it has no vendor directory",
    );
  }

  return hqOrganizationId;
}

/**
 * Confirms a vendor belongs to the caller's HQ.
 *
 * Ids are guessable and the route params are attacker-controlled, so every
 * by-id operation is checked against the scope the session establishes rather
 * than trusting that a client only ever sends back ids it was given.
 */
async function assertVendorInScope(c: Context<AppEnv>, id: string) {
  const hqOrganizationId = requireHqOrganizationId(c);
  const owner = await vendorService.findHqOrganizationId(id);

  if (!owner) {
    throw AppError.notFound("Vendor not found");
  }

  if (owner !== hqOrganizationId) {
    throw AppError.forbidden("That is outside your current workspace");
  }
}

export const vendorRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  .get("/", requirePermissionTo("vendor", "read"), async (c) => {
    const hqOrganizationId = requireHqOrganizationId(c);

    // The caller names the workspace it believes is active. Scope still comes
    // from the session, so this cannot widen anyone's access -- it exists so a
    // response is never read as belonging to a workspace it did not come from,
    // and so the client can key its cache per workspace.
    const activeOrganizationId = c.req.query("activeOrganizationId");
    const access = c.get("access");
    if (
      activeOrganizationId &&
      activeOrganizationId !== access?.organization.id
    ) {
      throw AppError.validation(
        "Active workspace has changed; retry with the current one",
      );
    }

    const result = await vendorService.list(hqOrganizationId);
    return c.json(ok(result));
  })
  .get("/:id", requirePermissionTo("vendor", "read"), async (c) => {
    const id = c.req.param("id");
    await assertVendorInScope(c, id);

    const result = await vendorService.findById(id);
    if (!result) {
      throw AppError.notFound("Vendor not found");
    }

    return c.json(ok(result));
  })
  .post(
    "/",
    requirePermissionTo("vendor", "create"),
    zValidator("json", createVendorSchema),
    async (c) => {
      const hqOrganizationId = requireHqOrganizationId(c);

      const result = await vendorService.create(
        hqOrganizationId,
        c.req.valid("json"),
      );
      return c.json(ok(result));
    },
  )
  .patch(
    "/:id",
    requirePermissionTo("vendor", "update"),
    zValidator("json", updateVendorSchema),
    async (c) => {
      const id = c.req.param("id");
      await assertVendorInScope(c, id);

      const result = await vendorService.update(id, c.req.valid("json"));
      if (!result) {
        throw AppError.notFound("Vendor not found");
      }

      return c.json(ok(result));
    },
  )
  .delete("/:id", requirePermissionTo("vendor", "delete"), async (c) => {
    const id = c.req.param("id");
    await assertVendorInScope(c, id);

    const result = await vendorService.remove(id);
    if (!result) {
      throw AppError.notFound("Vendor not found");
    }

    return c.json(ok(result));
  });
