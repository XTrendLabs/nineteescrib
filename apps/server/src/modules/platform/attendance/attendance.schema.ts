import { attendanceStatusValues } from "@propertyos/db/schema/attendance";
import z from "zod";

/**
 * A calendar day, as sent by the client. Kept as a plain `yyyy-MM-dd` string
 * all the way to the DATE column -- parsing it into a Date here would
 * reintroduce the timezone shift the DATE column exists to avoid.
 */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a yyyy-MM-dd date");

/**
 * The widest range one read may ask for. The matrix shows a month, so 31 days
 * covers it; the cap is what stops a hand-written `from`/`to` from turning the
 * range scan into a full table scan.
 */
export const MAX_RANGE_DAYS = 31;

function daysBetween(from: string, to: string) {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.floor(ms / 86_400_000) + 1;
}

export const listAttendanceSchema = z
  .object({
    hqOrganizationId: z.string().min(1),
    from: dateString,
    to: dateString,
  })
  .refine((v) => v.from <= v.to, {
    path: ["to"],
    message: "`to` must not be before `from`",
  })
  .refine((v) => daysBetween(v.from, v.to) <= MAX_RANGE_DAYS, {
    path: ["to"],
    message: `Range must be ${MAX_RANGE_DAYS} days or fewer`,
  });

export type ListAttendanceInput = z.infer<typeof listAttendanceSchema>;

/** Statuses that require a reason to be recorded alongside them. */
export const REASON_REQUIRED = ["on_leave", "half_day"] as const;

const markFields = {
  staffId: z.string().min(1),
  date: dateString,
  status: z.enum(attendanceStatusValues),
  reason: z.string().trim().min(1).optional(),
  /** The property the shift was worked at, when the staff member is not floating. */
  organizationId: z.string().min(1).optional(),
};

export const markAttendanceSchema = z.object({
  hqOrganizationId: z.string().min(1),
  ...markFields,
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;

/**
 * The quick-mark banner submits the whole roster at once. It is one request
 * and one write, so marking 50 staff costs the same round-trips as marking 1.
 */
export const bulkMarkAttendanceSchema = z.object({
  hqOrganizationId: z.string().min(1),
  date: dateString,
  marks: z
    .array(
      z.object({
        staffId: z.string().min(1),
        status: z.enum(attendanceStatusValues),
        reason: z.string().trim().min(1).optional(),
        organizationId: z.string().min(1).optional(),
      }),
    )
    .min(1, "Nothing to mark"),
});

export type BulkMarkAttendanceInput = z.infer<typeof bulkMarkAttendanceSchema>;
