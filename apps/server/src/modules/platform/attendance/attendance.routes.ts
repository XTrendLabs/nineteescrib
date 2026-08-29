import { zValidator } from "@hono/zod-validator";
import { type AppRole, roles } from "@propertyos/auth/permissions";

import { AppError, createRouter, ok, requireSession } from "../../../core";
import {
  assertInScope,
  requirePermissionTo,
} from "../permission/permission.middleware";
import { staffService } from "../staff/staff.service";
import { requireSubscription } from "../subscription/subscription.middleware";
import {
  bulkMarkAttendanceSchema,
  listAttendanceSchema,
  markAttendanceSchema,
} from "./attendance.schema";
import { attendanceService } from "./attendance.service";

/**
 * Whether a role may mark attendance, and therefore see the full grid.
 *
 * Reading someone else's attendance and recording it are the same
 * responsibility, so one check drives both.
 */
function isAppRole(role: string): role is AppRole {
  return role in roles;
}

function roleCanMark(role: string) {
  return (
    isAppRole(role) && roles[role].authorize({ attendance: ["update"] }).success
  );
}

export const attendanceRoutes = createRouter()
  .use(requireSession)
  .use(requireSubscription)
  .get(
    "/",
    requirePermissionTo("attendance", "read"),
    zValidator("query", listAttendanceSchema),
    async (c) => {
      const query = c.req.valid("query");
      const access = c.get("access");
      if (!access) {
        throw AppError.forbidden("You do not have access to this workspace");
      }

      // Whoever can mark attendance sees the whole grid. Everyone else sees
      // only their own row -- another person's absences are not theirs to
      // read, so the filter is applied here rather than left to the client.
      const canMarkAttendance = roleCanMark(access.role);
      if (canMarkAttendance) {
        await assertInScope(c, query.hqOrganizationId);
        const result = await attendanceService.list(query);
        return c.json(ok(result));
      }

      const own = await staffService.findByUserId(c.get("session").user.id);
      if (!own) {
        // No staff record means there is no attendance of their own to show.
        return c.json(ok({ records: [], markedDays: [] }));
      }

      // Scope comes from the staff record, not from the request: a caller
      // reading their own history needs no HQ membership, and cannot reach
      // another HQ by naming one.
      const result = await attendanceService.list(
        { ...query, hqOrganizationId: own.hqOrganizationId },
        own.id,
      );
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
