import { zValidator } from "@hono/zod-validator";

import { createRouter, ok, requireSession } from "../../../core";
import {
  assertInScope,
  requirePermissionTo,
} from "../permission/permission.middleware";
import { requireSubscription } from "../subscription/subscription.middleware";
import {
  bulkMarkAttendanceSchema,
  listAttendanceSchema,
  markAttendanceSchema,
} from "./attendance.schema";
import { attendanceService } from "./attendance.service";

export const attendanceRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  .get(
    "/",
    requirePermissionTo("attendance", "read"),
    zValidator("query", listAttendanceSchema),
    async (c) => {
      const query = c.req.valid("query");
      await assertInScope(c, query.hqOrganizationId);

      const result = await attendanceService.list(query);
      return c.json(ok(result));
    },
  )
  .put(
    "/",
    requirePermissionTo("attendance", "update"),
    zValidator("json", markAttendanceSchema),
    async (c) => {
      const body = c.req.valid("json");
      await assertInScope(c, body.hqOrganizationId);

      const result = await attendanceService.mark(
        body,
        c.get("session").user.id,
      );
      return c.json(ok(result));
    },
  )
  .post(
    "/bulk",
    requirePermissionTo("attendance", "create"),
    zValidator("json", bulkMarkAttendanceSchema),
    async (c) => {
      const body = c.req.valid("json");
      await assertInScope(c, body.hqOrganizationId);

      const result = await attendanceService.bulkMark(
        body,
        c.get("session").user.id,
      );
      return c.json(ok(result));
    },
  );
