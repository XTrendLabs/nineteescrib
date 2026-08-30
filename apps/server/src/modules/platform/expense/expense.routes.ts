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
import { isAllowedDocumentType } from "../storage/storage.service";
import { requireSubscription } from "../subscription/subscription.middleware";
import {
  createExpenseSchema,
  recordPaymentSchema,
  updateExpenseSchema,
} from "./expense.schema";
import { expenseService } from "./expense.service";

/** The caller's scope, or a 403 -- see `vendor.routes`. */
function requireAccess(c: Context<AppEnv>) {
  const access = c.get("access");
  if (!access) {
    throw AppError.forbidden("You do not have access to this workspace");
  }
  return access;
}

/**
 * The HQ the caller is working under. Expenses roll up to the HQ even when
 * charged to one property, so this is what scopes every read and write.
 */
function requireHqOrganizationId(c: Context<AppEnv>) {
  const access = requireAccess(c);

  const hqOrganizationId =
    access.organization.kind === "hq"
      ? access.organization.id
      : access.organization.parentOrganizationId;

  if (!hqOrganizationId) {
    throw AppError.validation(
      "This workspace is not part of an HQ, so it has no expense book",
    );
  }

  return hqOrganizationId;
}

/** Confirms an expense belongs to the caller's HQ before acting on it. */
async function assertExpenseInScope(c: Context<AppEnv>, id: string) {
  const hqOrganizationId = requireHqOrganizationId(c);
  const owner = await expenseService.findHqOrganizationId(id);

  if (!owner) {
    throw AppError.notFound("Expense not found");
  }

  if (owner !== hqOrganizationId) {
    throw AppError.forbidden("That is outside your current workspace");
  }
}

/** Matches the limit the upload control advertises. */
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

export const expenseRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  .get("/", requirePermissionTo("expense", "read"), async (c) => {
    const access = requireAccess(c);
    const hqOrganizationId = requireHqOrganizationId(c);

    // See `staff.routes`: the caller names the workspace it believes is
    // active so a response is never read as belonging to another one. Scope
    // still comes from the session, so this cannot widen access.
    const activeOrganizationId = c.req.query("activeOrganizationId");
    if (
      activeOrganizationId &&
      activeOrganizationId !== access.organization.id
    ) {
      throw AppError.validation(
        "Active workspace has changed; retry with the current one",
      );
    }

    // Someone scoped to a single property sees that property's spend plus the
    // HQ-shared costs it carries a share of -- not the whole business's book.
    const result =
      access.organization.kind === "hq"
        ? await expenseService.listByHqOrganization(hqOrganizationId)
        : await expenseService.listByProperty(
            access.organization.id,
            hqOrganizationId,
          );

    return c.json(ok(result));
  })
  .get("/:id", requirePermissionTo("expense", "read"), async (c) => {
    const id = c.req.param("id");
    await assertExpenseInScope(c, id);

    const result = await expenseService.findById(id);
    if (!result) {
      throw AppError.notFound("Expense not found");
    }

    return c.json(ok(result));
  })
  .post(
    "/",
    requirePermissionTo("expense", "create"),
    zValidator("json", createExpenseSchema),
    async (c) => {
      const hqOrganizationId = requireHqOrganizationId(c);
      const body = c.req.valid("json");

      // A named property must be one the caller can actually reach; an
      // HQ-shared expense names none, so there is nothing to check.
      if (body.organizationId) {
        await assertInScope(c, body.organizationId);
      }

      const result = await expenseService.create(
        hqOrganizationId,
        c.get("session").user.id,
        body,
      );
      return c.json(ok(result));
    },
  )
  .patch(
    "/:id",
    requirePermissionTo("expense", "update"),
    zValidator("json", updateExpenseSchema),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");

      await assertExpenseInScope(c, id);
      if (body.organizationId) {
        await assertInScope(c, body.organizationId);
      }

      const result = await expenseService.update(id, body);
      if (!result) {
        throw AppError.notFound("Expense not found");
      }

      return c.json(ok(result));
    },
  )
  .post(
    "/:id/payments",
    requirePermissionTo("expense", "update"),
    zValidator("json", recordPaymentSchema),
    async (c) => {
      const id = c.req.param("id");
      await assertExpenseInScope(c, id);

      const result = await expenseService.recordPayment(
        id,
        c.get("session").user.id,
        c.req.valid("json"),
      );
      if (!result) {
        throw AppError.notFound("Expense not found");
      }

      return c.json(ok(result));
    },
  )
  .delete(
    "/:id/payments/:paymentId",
    requirePermissionTo("expense", "update"),
    async (c) => {
      const paymentId = c.req.param("paymentId");

      // The payment is reached through its expense, so the scope check is the
      // same one every other route makes.
      const expenseId = await expenseService.findExpenseIdByPayment(paymentId);
      if (!expenseId || expenseId !== c.req.param("id")) {
        throw AppError.notFound("Payment not found");
      }
      await assertExpenseInScope(c, expenseId);

      await expenseService.removePayment(paymentId);

      const result = await expenseService.findById(expenseId);
      return c.json(ok(result));
    },
  )
  .post(
    "/:id/receipts",
    requirePermissionTo("expense", "update"),
    async (c) => {
      const id = c.req.param("id");
      await assertExpenseInScope(c, id);

      const body = await c.req.parseBody();
      const file = body.file;

      if (!(file instanceof File)) {
        throw AppError.validation("A receipt file is required");
      }

      // Checked here rather than left to the storage layer so the caller gets
      // a proper 400 naming the problem, not a generic failure.
      if (!isAllowedDocumentType(file.type)) {
        throw AppError.validation(
          "Receipts must be an image (JPEG, PNG, WebP, AVIF) or a PDF",
        );
      }

      if (file.size > MAX_RECEIPT_BYTES) {
        throw AppError.validation("Receipts must be 10MB or smaller");
      }

      const result = await expenseService.addReceipt(
        id,
        c.get("session").user.id,
        file,
      );
      return c.json(ok(result));
    },
  )
  .delete(
    "/:id/receipts/:receiptId",
    requirePermissionTo("expense", "update"),
    async (c) => {
      const receiptId = c.req.param("receiptId");

      // Reached through its expense, so the scope check is the usual one.
      const receipt = await expenseService.findReceiptById(receiptId);
      if (!receipt || receipt.expenseId !== c.req.param("id")) {
        throw AppError.notFound("Receipt not found");
      }
      await assertExpenseInScope(c, receipt.expenseId);

      const result = await expenseService.removeReceipt(receiptId);
      if (!result) {
        throw AppError.notFound("Receipt not found");
      }

      return c.json(ok(result));
    },
  )
  .delete("/:id", requirePermissionTo("expense", "delete"), async (c) => {
    const id = c.req.param("id");
    await assertExpenseInScope(c, id);

    const result = await expenseService.remove(id);
    if (!result) {
      throw AppError.notFound("Expense not found");
    }

    return c.json(ok(result));
  });
