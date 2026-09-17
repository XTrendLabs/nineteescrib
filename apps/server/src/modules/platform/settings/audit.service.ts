import { auditRepo } from "./audit.repo";

/** One page of the log. The table shows ten rows at a time. */
export const AUDIT_PAGE_SIZE = 10;

/**
 * Human-readable labels for the actions the booking service records.
 *
 * The stored `action` is a machine token ("payment_recorded"); the log is read
 * by people, so it is mapped here rather than in the client -- an unmapped
 * value falls back to the token with its underscores removed, so a new action
 * shows up as something readable the day it is added instead of nothing.
 */
const ACTION_LABELS: Record<string, string> = {
  created: "Created booking",
  updated: "Updated booking",
  confirmed: "Confirmed booking",
  cancelled: "Cancelled booking",
  rescheduled: "Rescheduled stay",
  extended: "Extended stay",
  payment_recorded: "Recorded payment",
  payment_removed: "Removed payment",
  checked_in: "Checked in guest",
  checked_out: "Checked out guest",
  no_show: "Marked as no-show",
};

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action.replaceAll("_", " ");
}

export type AuditEntry = {
  id: string;
  action: string;
  actionLabel: string;
  description: string;
  createdAt: Date;
  /** "System" when a webhook or the public booking engine made the change. */
  actor: string;
  actorEmail: string | null;
  /** The booking the event belongs to, e.g. "POS-3". */
  target: string;
  bookingId: string;
  propertyName: string | null;
};

export const auditService = {
  /**
   * A page of the workspace's activity, newest first.
   *
   * Returns one row more than asked for to decide whether another page exists,
   * then drops it -- cheaper than a second COUNT query over a table that only
   * grows.
   */
  async list(hqOrganizationId: string, before?: string) {
    const cursor = decodeCursor(before);

    const rows = await auditRepo.listByHqOrganization(hqOrganizationId, {
      limit: AUDIT_PAGE_SIZE + 1,
      before: cursor,
    });

    const hasMore = rows.length > AUDIT_PAGE_SIZE;
    const page = hasMore ? rows.slice(0, AUDIT_PAGE_SIZE) : rows;

    const entries: AuditEntry[] = page.map((row) => ({
      id: row.id,
      action: row.action,
      actionLabel: actionLabel(row.action),
      description: row.description,
      createdAt: row.createdAt,
      // A null actor is not missing data: it is the booking engine or a
      // channel acting on its own, which reads as "System".
      actor: row.actorName ?? "System",
      actorEmail: row.actorEmail ?? null,
      target: row.bookingRef,
      bookingId: row.bookingId,
      propertyName: row.propertyName ?? null,
    }));

    const last = page.at(-1);

    return {
      entries,
      /** Pass back as `before` to fetch the next page; null when at the end. */
      nextCursor:
        hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    };
  },
};

/**
 * The cursor is the sort key itself -- the timestamp and id of the last row on
 * the page -- encoded as one opaque string so the client passes it back
 * without having to understand it.
 */
function encodeCursor(createdAt: Date, id: string) {
  return `${createdAt.toISOString()}|${id}`;
}

function decodeCursor(value: string | undefined) {
  if (!value) return undefined;

  const separator = value.lastIndexOf("|");
  if (separator === -1) return undefined;

  const createdAt = new Date(value.slice(0, separator));
  const id = value.slice(separator + 1);

  // A malformed cursor means the first page rather than an error: it can only
  // come from a stale link or a hand-edited URL, and refusing the whole
  // request would leave the log unreadable.
  if (Number.isNaN(createdAt.getTime()) || !id) return undefined;

  return { createdAt, id };
}
