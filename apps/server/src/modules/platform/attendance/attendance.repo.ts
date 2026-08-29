import { createDb } from "@propertyos/db";
import {
  attendanceDay,
  attendanceRecord,
} from "@propertyos/db/schema/attendance";
import { staff } from "@propertyos/db/schema/staff";
import { and, between, eq, inArray, sql } from "drizzle-orm";

const db = createDb();

/**
 * Only departures from "present" are stored, so a present mark is a delete of
 * whatever exception used to sit there.
 */
const isException = (status: string) => status !== "present";

type MarkInput = {
  staffId: string;
  status: string;
  reason?: string;
  organizationId?: string;
};

export const attendanceRepo = {
  /**
   * The exceptions and taken days for one HQ over a date range.
   *
   * Both halves are indexed on (hq_organization_id, date), and neither depends
   * on the other, so they overlap into a single round-trip's worth of latency.
   *
   * `staffId` narrows the result to one person, for a caller who may only see
   * their own attendance. It is an extra condition on the same index scan, so
   * it costs nothing beyond the rows it removes.
   */
  async listRange(
    hqOrganizationId: string,
    from: string,
    to: string,
    staffId?: string,
  ) {
    const [records, days] = await Promise.all([
      db
        .select({
          staffId: attendanceRecord.staffId,
          date: attendanceRecord.date,
          status: attendanceRecord.status,
          reason: attendanceRecord.reason,
          organizationId: attendanceRecord.organizationId,
        })
        .from(attendanceRecord)
        .where(
          and(
            eq(attendanceRecord.hqOrganizationId, hqOrganizationId),
            between(attendanceRecord.date, from, to),
            staffId ? eq(attendanceRecord.staffId, staffId) : undefined,
          ),
        ),
      db
        .select({ staffId: attendanceDay.staffId, date: attendanceDay.date })
        .from(attendanceDay)
        .where(
          and(
            eq(attendanceDay.hqOrganizationId, hqOrganizationId),
            between(attendanceDay.date, from, to),
            staffId ? eq(attendanceDay.staffId, staffId) : undefined,
          ),
        ),
    ]);

    // `staffId|date`, so a cell can ask whether that person was marked that
    // day rather than whether anyone was.
    return {
      records,
      markedDays: days.map((d) => `${d.staffId}|${d.date}`),
    };
  },

  /**
   * Which of `staffIds` belong to this HQ, with the day each joined. Guards
   * every write: the caller checks both membership and that the date being
   * marked is not before the person started.
   */
  async findStaffInHq(hqOrganizationId: string, staffIds: string[]) {
    if (staffIds.length === 0) return [];

    return db
      .select({ id: staff.id, joinedAt: staff.joinedAt })
      .from(staff)
      .where(
        and(
          eq(staff.hqOrganizationId, hqOrganizationId),
          inArray(staff.id, staffIds),
        ),
      );
  },

  /**
   * Records that `date` has been taken for each of `staffIds`. Idempotent.
   *
   * Per staff member, so marking one person never decides what another
   * person's unmarked cell shows.
   */
  markDayTaken(
    hqOrganizationId: string,
    date: string,
    staffIds: string[],
    markedByUserId?: string,
  ) {
    if (staffIds.length === 0) return undefined;

    return db
      .insert(attendanceDay)
      .values(
        staffIds.map((staffId) => ({
          id: crypto.randomUUID(),
          staffId,
          hqOrganizationId,
          date,
          markedByUserId,
        })),
      )
      .onConflictDoNothing({
        target: [attendanceDay.staffId, attendanceDay.date],
      });
  },

  /**
   * Writes one cell and marks the day taken.
   *
   * A present mark deletes the exception rather than storing it, which is what
   * keeps the table to exceptions only.
   */
  async mark(
    hqOrganizationId: string,
    input: MarkInput & { date: string },
    markedByUserId?: string,
  ) {
    const write = isException(input.status)
      ? db
          .insert(attendanceRecord)
          .values({
            id: crypto.randomUUID(),
            staffId: input.staffId,
            hqOrganizationId,
            organizationId: input.organizationId,
            date: input.date,
            status: input.status,
            reason: input.reason,
            markedByUserId,
          })
          .onConflictDoUpdate({
            target: [attendanceRecord.staffId, attendanceRecord.date],
            set: {
              status: input.status,
              reason: input.reason ?? null,
              organizationId: input.organizationId ?? null,
              markedByUserId: markedByUserId ?? null,
              updatedAt: new Date(),
            },
          })
      : db
          .delete(attendanceRecord)
          .where(
            and(
              eq(attendanceRecord.staffId, input.staffId),
              eq(attendanceRecord.date, input.date),
            ),
          );

    await Promise.all([
      write,
      attendanceRepo.markDayTaken(
        hqOrganizationId,
        input.date,
        [input.staffId],
        markedByUserId,
      ),
    ]);
  },

  /**
   * Writes a whole roster for one date.
   *
   * The exceptions go in as a single multi-row upsert and the present marks
   * leave as a single delete, so the cost is three round-trips whether the
   * roster holds one member or two hundred -- the same reasoning as
   * `staffRepo.syncMemberships`.
   */
  async bulkMark(
    hqOrganizationId: string,
    date: string,
    marks: MarkInput[],
    markedByUserId?: string,
  ) {
    const exceptions = marks.filter((m) => isException(m.status));
    const presentIds = marks
      .filter((m) => !isException(m.status))
      .map((m) => m.staffId);

    await Promise.all([
      exceptions.length > 0
        ? db
            .insert(attendanceRecord)
            .values(
              exceptions.map((m) => ({
                id: crypto.randomUUID(),
                staffId: m.staffId,
                hqOrganizationId,
                organizationId: m.organizationId,
                date,
                status: m.status,
                reason: m.reason,
                markedByUserId,
              })),
            )
            .onConflictDoUpdate({
              target: [attendanceRecord.staffId, attendanceRecord.date],
              set: {
                status: sql`excluded.status`,
                reason: sql`excluded.reason`,
                organizationId: sql`excluded.organization_id`,
                markedByUserId: sql`excluded.marked_by_user_id`,
                updatedAt: new Date(),
              },
            })
        : undefined,
      presentIds.length > 0
        ? db
            .delete(attendanceRecord)
            .where(
              and(
                eq(attendanceRecord.date, date),
                inArray(attendanceRecord.staffId, presentIds),
              ),
            )
        : undefined,
      attendanceRepo.markDayTaken(
        hqOrganizationId,
        date,
        marks.map((m) => m.staffId),
        markedByUserId,
      ),
    ]);
  },
};
