import { createDb } from "@propertyos/db";
import { booking } from "@propertyos/db/schema/booking";
import { organization } from "@propertyos/db/schema/organization";
import { room } from "@propertyos/db/schema/room";
import { and, asc, eq, ne, notInArray, or, sql } from "drizzle-orm";

const db = createDb();

/**
 * The statuses that no longer hold a room.
 *
 * Mirrors the platform repo deliberately: a guest booking from the public site
 * and a member booking from the front desk compete for the same inventory, so
 * they must agree on what "taken" means or the two can double-sell a night.
 */
const RELEASED_STATUSES: string[] = ["cancelled", "checked_out"];

const occupiedFrom = sql`coalesce(${booking.actualCheckIn}, ${booking.checkIn})`;
const occupiedTo = sql`coalesce(${booking.actualCheckOut}, ${booking.checkOut})`;

function occupiesInventory() {
  return and(
    notInArray(booking.status, RELEASED_STATUSES),
    or(
      ne(booking.kind, "hold"),
      sql`${booking.holdExpiresAt} is null or ${booking.holdExpiresAt} > now()`,
    ),
  );
}

function overlaps(checkIn: string, checkOut: string) {
  return and(
    sql`${occupiedFrom} < ${checkOut}`,
    sql`${occupiedTo} > ${checkIn}`,
  );
}

export const publicRepo = {
  /**
   * A property by its public slug, with the HQ above it.
   *
   * The HQ id comes back because every booking is filed against it -- a public
   * booking has no session to derive it from, so it is resolved here.
   */
  async findPropertyBySlug(slug: string) {
    const [row] = await db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        kind: organization.kind,
        hqOrganizationId: organization.parentOrganizationId,
      })
      .from(organization)
      .where(eq(organization.slug, slug))
      .limit(1);

    return row;
  },

  /**
   * The rooms a guest can actually book for these dates.
   *
   * Only published rooms: a draft room is still being set up and is not for
   * sale. Rooms taken for any part of the range are dropped rather than shown
   * as unavailable -- a public visitor has no use for a room they cannot have.
   */
  async listAvailableRooms(input: {
    propertyId: string;
    checkIn: string;
    checkOut: string;
  }) {
    return db
      .select({
        id: room.id,
        name: room.name,
        roomType: room.roomType,
        maxGuests: room.maxGuests,
        weekdayPrice: room.weekdayPrice,
        weekendPrice: room.weekendPrice,
      })
      .from(room)
      .where(
        and(
          eq(room.organizationId, input.propertyId),
          eq(room.status, "published"),
          sql`not exists (${db
            .select({ one: sql`1` })
            .from(booking)
            .where(
              and(
                eq(booking.roomId, room.id),
                occupiesInventory(),
                overlaps(input.checkIn, input.checkOut),
              ),
            )})`,
        ),
      )
      .orderBy(asc(room.name));
  },

  /**
   * How full the property is on each night of a window.
   *
   * Drives the shading on the public calendar, so a visitor can see where the
   * property is busy before picking dates rather than discovering it from an
   * empty room list afterwards. Counts only published rooms in the total, so
   * "full" means every sellable room is taken.
   */
  async listNightlyOccupancy(input: {
    propertyId: string;
    from: string;
    to: string;
  }) {
    const [totals] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(room)
      .where(
        and(
          eq(room.organizationId, input.propertyId),
          eq(room.status, "published"),
        ),
      );

    const rows = await db.execute<{ night: string; booked: number }>(sql`
      select
        to_char(night::date, 'YYYY-MM-DD') as night,
        count(distinct ${booking.roomId})::int as booked
      from generate_series(
        ${input.from}::date,
        ${input.to}::date - interval '1 day',
        interval '1 day'
      ) as night
      left join ${booking}
        on coalesce(${booking.actualCheckIn}, ${booking.checkIn}) <= night::date
       and coalesce(${booking.actualCheckOut}, ${booking.checkOut}) > night::date
       and ${booking.status} not in ('cancelled', 'checked_out')
       and (
         ${booking.kind} <> 'hold'
         or ${booking.holdExpiresAt} is null
         or ${booking.holdExpiresAt} > now()
       )
       and ${booking.organizationId} = ${input.propertyId}
      group by night
      order by night
    `);

    return {
      totalRooms: totals?.total ?? 0,
      nights: rows.rows.map((r) => ({
        night: r.night,
        booked: Number(r.booked),
      })),
    };
  },

  /** One room by id, scoped to its property so a stray id cannot cross over. */
  async findRoom(input: { propertyId: string; roomId: string }) {
    const [row] = await db
      .select({
        id: room.id,
        name: room.name,
        roomType: room.roomType,
        maxGuests: room.maxGuests,
        weekdayPrice: room.weekdayPrice,
        weekendPrice: room.weekendPrice,
        status: room.status,
      })
      .from(room)
      .where(
        and(
          eq(room.id, input.roomId),
          eq(room.organizationId, input.propertyId),
        ),
      )
      .limit(1);

    return row;
  },
};
