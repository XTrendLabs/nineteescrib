import { AppError } from "../../../core";
import { attendanceRepo } from "./attendance.repo";
import {
  type BulkMarkAttendanceInput,
  type ListAttendanceInput,
  type MarkAttendanceInput,
  REASON_REQUIRED,
} from "./attendance.schema";

type ReasonRequired = (typeof REASON_REQUIRED)[number];

function needsReason(status: string): status is ReasonRequired {
  return (REASON_REQUIRED as readonly string[]).includes(status);
}

/**
 * A status that explains an absence is not much use without the explanation,
 * and the client already collects one -- so a missing reason is rejected here
 * rather than silently stored.
 */
function assertReason(status: string, reason?: string) {
  if (needsReason(status) && !reason) {
    throw AppError.validation(`A reason is required for "${status}"`);
  }
}

/** The joining day as a yyyy-MM-dd key, comparable with a request's date. */
function joinedKey(joinedAt: Date) {
  return joinedAt.toISOString().slice(0, 10);
}

export const attendanceService = {
  list({ hqOrganizationId, from, to }: ListAttendanceInput, staffId?: string) {
    return attendanceRepo.listRange(hqOrganizationId, from, to, staffId);
  },

  async mark(input: MarkAttendanceInput, markedByUserId?: string) {
    assertReason(input.status, input.reason);

    // The staff member must belong to the HQ the caller is scoped to;
    // otherwise a valid session could write attendance for someone else's HQ.
    const [member] = await attendanceRepo.findStaffInHq(
      input.hqOrganizationId,
      [input.staffId],
    );
    if (!member) {
      throw AppError.notFound("Staff member not found");
    }
    if (joinedKey(member.joinedAt) > input.date) {
      throw AppError.validation("That date is before this staff member joined");
    }

    await attendanceRepo.mark(input.hqOrganizationId, input, markedByUserId);
    return { staffId: input.staffId, date: input.date, status: input.status };
  },

  async bulkMark(input: BulkMarkAttendanceInput, markedByUserId?: string) {
    for (const mark of input.marks) {
      assertReason(mark.status, mark.reason);
    }

    const members = await attendanceRepo.findStaffInHq(
      input.hqOrganizationId,
      input.marks.map((m) => m.staffId),
    );
    const byId = new Map(members.map((m) => [m.id, m]));

    // Silently dropping the rest would report a success that did not happen.
    const unknown = input.marks.filter((m) => !byId.has(m.staffId));
    if (unknown.length > 0) {
      throw AppError.notFound(
        `${unknown.length} staff member(s) are not in this workspace`,
      );
    }

    const tooEarly = input.marks.filter((m) => {
      const member = byId.get(m.staffId);
      return member ? joinedKey(member.joinedAt) > input.date : false;
    });
    if (tooEarly.length > 0) {
      throw AppError.validation(
        `${tooEarly.length} staff member(s) had not joined on ${input.date}`,
      );
    }

    await attendanceRepo.bulkMark(
      input.hqOrganizationId,
      input.date,
      input.marks,
      markedByUserId,
    );

    return { date: input.date, marked: input.marks.length };
  },
};
