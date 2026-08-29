import { relations } from "drizzle-orm";
import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { organization } from "./organization";
import { staff } from "./staff";

export const attendanceStatusValues = [
  "present",
  "absent",
  "on_leave",
  "half_day",
] as const;

/**
 * Attendance is stored as exceptions, not as a row per staff per day.
 *
 * Nearly every day is "present", so writing one row per person per day costs
 * ~18k rows a year at 50 staff to record almost no information. Only the
 * departures from present are kept here; `attendanceDay` records which days
 * were actually taken, which is what tells a missing row for a taken day
 * (present) apart from a day nobody has marked yet (unmarked).
 */
export const attendanceRecord = pgTable(
  "attendance_record",
  {
    id: text("id").primaryKey(),
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    // Denormalized from `staff` so the month query -- "everything for this HQ
    // between two dates" -- is one index range scan instead of a join. Safe to
    // copy: staff are hired at HQ level and never move between HQs.
    hqOrganizationId: text("hq_organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    // The property the shift was worked at. Null for staff who float across
    // every property under the HQ.
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "set null",
    }),
    // A real DATE: a calendar day carries no time and no zone, and storing it
    // as a timestamp would shift the day for anyone east of UTC.
    date: date("date").notNull(),
    status: text("status").notNull(),
    reason: text("reason"),
    markedByUserId: text("marked_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Makes re-marking a day an upsert rather than a read-then-write, and
    // stops a double submit from creating two rows for one cell.
    uniqueIndex("attendance_record_staffId_date_uq").on(
      table.staffId,
      table.date,
    ),
    // Serves the month range query directly.
    index("attendance_record_hqOrganizationId_date_idx").on(
      table.hqOrganizationId,
      table.date,
    ),
  ],
);

/**
 * Marks one staff member's day as taken.
 *
 * Without this a missing record is ambiguous -- it could mean present, or it
 * could mean nobody has marked that day yet. Recording the day makes the
 * distinction explicit, so an unmarked month reads as empty instead of as
 * perfect attendance.
 *
 * This is per staff member, not per HQ. A single flag for the whole
 * organization would make one person's mark decide what every other person's
 * empty cell shows -- marking one member absent would silently report everyone
 * else present for that day.
 */
export const attendanceDay = pgTable(
  "attendance_day",
  {
    id: text("id").primaryKey(),
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    // Carried for the same reason as on `attendanceRecord`: the month read
    // filters by HQ and date, and this keeps that a single index scan.
    hqOrganizationId: text("hq_organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    markedByUserId: text("marked_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("attendance_day_staffId_date_uq").on(table.staffId, table.date),
    index("attendance_day_hqOrganizationId_date_idx").on(
      table.hqOrganizationId,
      table.date,
    ),
  ],
);

export const attendanceRecordRelations = relations(
  attendanceRecord,
  ({ one }) => ({
    staff: one(staff, {
      fields: [attendanceRecord.staffId],
      references: [staff.id],
    }),
    hqOrganization: one(organization, {
      fields: [attendanceRecord.hqOrganizationId],
      references: [organization.id],
    }),
  }),
);

export const attendanceDayRelations = relations(attendanceDay, ({ one }) => ({
  staff: one(staff, {
    fields: [attendanceDay.staffId],
    references: [staff.id],
  }),
  hqOrganization: one(organization, {
    fields: [attendanceDay.hqOrganizationId],
    references: [organization.id],
  }),
}));
