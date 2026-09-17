import { createDb } from "@propertyos/db";
import { user } from "@propertyos/db/schema/auth";
import { booking, bookingAudit } from "@propertyos/db/schema/booking";
import { organization } from "@propertyos/db/schema/organization";
import { and, desc, eq, lt, or } from "drizzle-orm";

const db = createDb();

export const auditRepo = {
  /**
   * The workspace's activity trail, newest first.
   *
   * The audit rows carry only a `bookingId`, so the workspace they belong to
   * is reached through the booking itself -- that join is what keeps one HQ's
   * trail from ever showing another's.
   *
   * Paged by keyset rather than OFFSET: the log only ever grows at the head,
   * and an OFFSET page would shift under the reader as new events land,
   * repeating or skipping rows. `(createdAt, id)` is ordered as a pair so ties
   * within the same millisecond still page cleanly.
   */
  async listByHqOrganization(
    hqOrganizationId: string,
    options: { limit: number; before?: { createdAt: Date; id: string } },
  ) {
    const cursor = options.before;

    return (
      db
        .select({
          id: bookingAudit.id,
          action: bookingAudit.action,
          description: bookingAudit.description,
          createdAt: bookingAudit.createdAt,
          actorUserId: bookingAudit.actorUserId,
          actorName: user.name,
          actorEmail: user.email,
          bookingId: booking.id,
          bookingRef: booking.ref,
          propertyName: organization.name,
        })
        .from(bookingAudit)
        .innerJoin(booking, eq(booking.id, bookingAudit.bookingId))
        // Left, not inner: an HQ-level booking has no property organization, and
        // an inner join would silently drop those events from the trail.
        .leftJoin(organization, eq(organization.id, booking.organizationId))
        // Left, because the actor is null when the public booking engine or a
        // channel webhook made the change rather than a signed-in member.
        .leftJoin(user, eq(user.id, bookingAudit.actorUserId))
        .where(
          and(
            eq(booking.hqOrganizationId, hqOrganizationId),
            cursor
              ? or(
                  lt(bookingAudit.createdAt, cursor.createdAt),
                  and(
                    eq(bookingAudit.createdAt, cursor.createdAt),
                    lt(bookingAudit.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(bookingAudit.createdAt), desc(bookingAudit.id))
        .limit(options.limit)
    );
  },
};
