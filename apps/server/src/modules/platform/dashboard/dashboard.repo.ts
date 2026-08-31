import { createDb } from "@propertyos/db";
import { booking, bookingPayment, guest } from "@propertyos/db/schema/booking";
import { expense, expensePayment } from "@propertyos/db/schema/expense";
import { organization } from "@propertyos/db/schema/organization";
import { room } from "@propertyos/db/schema/room";
import { and, eq, sql } from "drizzle-orm";

const db = createDb();

/**
 * The dashboard reads the same books the bookings and expenses pages do, but
 * it only ever needs totals. Every query here aggregates in Postgres rather
 * than pulling rows for the client to add up: a portfolio's overview must cost
 * the same to render in year three as it did on the first day.
 */

/** A date window, as calendar days -- see the `date` columns in the schema. */
export type DateWindow = { from: string; to: string };

/**
 * Rows that hold inventory: cancelled stays never did, checked-out stays no
 * longer do, and an elapsed hold has let go of it.
 *
 * Mirrors `occupiesInventory` in `booking.repo` deliberately -- the dashboard
 * must count a room as taken on exactly the nights the calendar draws it as
 * taken, or the two surfaces will quietly disagree.
 */
const OCCUPIES = sql`
  ${booking.status} not in ('cancelled', 'checked_out')
  and (
    ${booking.kind} <> 'hold'
    or ${booking.holdExpiresAt} is null
    or ${booking.holdExpiresAt} > now()
  )
`;

/**
 * Stays that count as revenue: a real reservation that was not cancelled.
 *
 * Blocks and owner stays are excluded because they earn nothing -- counting a
 * maintenance block as a zero-value booking would drag the average rate down
 * without any money having failed to arrive.
 */
const EARNS = sql`
  ${booking.kind} = 'reservation'
  and ${booking.status} <> 'cancelled'
`;

/** Narrows to one property, or spans the whole HQ when none is named. */
function propertyFilter(propertyId?: string) {
  return propertyId
    ? sql`and ${booking.organizationId} = ${propertyId}`
    : sql``;
}

export const dashboardRepo = {
  /**
   * Where this HQ's bookings actually sit on the calendar, ignoring the
   * selected window entirely.
   *
   * An operator whose stays are all upcoming opens a trailing-30-day dashboard
   * on nothing but zeroes, which reads as a broken page rather than as a
   * correctly-empty window. This is what lets the empty state say "your
   * bookings are in October" and offer to go there, instead of implying the
   * business earned nothing.
   */
  async bookingSpan(input: { hqOrganizationId: string; propertyId?: string }) {
    const result = await db.execute<{
      total: number;
      earliest: string | null;
      latest: string | null;
    }>(sql`
      select
        count(*)::int as total,
        to_char(min(${booking.checkIn}), 'YYYY-MM-DD') as earliest,
        to_char(max(${booking.checkIn}), 'YYYY-MM-DD') as latest
      from ${booking}
      where ${booking.hqOrganizationId} = ${input.hqOrganizationId}
        and ${EARNS}
        ${propertyFilter(input.propertyId)}
    `);

    const row = result.rows[0];
    return {
      total: Number(row?.total ?? 0),
      earliest: row?.earliest ?? null,
      latest: row?.latest ?? null,
    };
  },

  /**
   * Headline totals for a window: what was booked, what was collected, and
   * what it cost.
   *
   * Revenue is attributed to the arrival date rather than spread across the
   * nights of the stay. That is the same basis the bookings page lists on, so
   * a month's revenue here always equals the sum of the bookings shown there
   * for that month -- a spread basis would be more precise and would make the
   * two disagree, which costs more trust than the precision buys.
   */
  async totals(input: {
    hqOrganizationId: string;
    propertyId?: string;
    window: DateWindow;
  }) {
    const { hqOrganizationId, propertyId, window } = input;

    const bookingRow = await db.execute<{
      booked_paise: string;
      due_collected_paise: string;
      booking_count: number;
      night_count: number;
      guest_count: number;
      cancelled_count: number;
    }>(sql`
      select
        coalesce(sum(b.total_amount_paise) filter (where b.earns), 0) as booked_paise,
        coalesce(sum(b.paid_paise) filter (where b.earns), 0) as due_collected_paise,
        count(*) filter (where b.earns)::int as booking_count,
        coalesce(sum(b.nights) filter (where b.earns), 0)::int as night_count,
        coalesce(sum(b.guest_count) filter (where b.earns), 0)::int as guest_count,
        count(*) filter (where b.cancelled)::int as cancelled_count
      from (
        select
          ${booking.totalAmountPaise} as total_amount_paise,
          ${booking.guestCount} as guest_count,
          (coalesce(${booking.actualCheckOut}, ${booking.checkOut})
            - coalesce(${booking.actualCheckIn}, ${booking.checkIn})) as nights,
          (${EARNS}) as earns,
          (${booking.kind} = 'reservation' and ${booking.status} = 'cancelled') as cancelled,
          coalesce((
            select sum(${bookingPayment.amountPaise})
            from ${bookingPayment}
            where ${bookingPayment.bookingId} = ${booking.id}
          ), 0) as paid_paise
        from ${booking}
        where ${booking.hqOrganizationId} = ${hqOrganizationId}
          and ${booking.checkIn} >= ${window.from}::date
          and ${booking.checkIn} <= ${window.to}::date
          ${propertyFilter(propertyId)}
      ) as b
    `);

    // Expenses are dated by when they were logged. `dueDate` is nullable and
    // describes when money must leave rather than when the cost was incurred,
    // so it cannot be the basis for "what this month cost".
    const expenseRow = await db.execute<{
      billed_paise: string;
      paid_paise: string;
      expense_count: number;
    }>(sql`
      select
        coalesce(sum(e.total_amount_paise), 0) as billed_paise,
        coalesce(sum(e.paid_paise), 0) as paid_paise,
        count(*)::int as expense_count
      from (
        select
          ${expense.totalAmountPaise} as total_amount_paise,
          coalesce((
            select sum(${expensePayment.amountPaise})
            from ${expensePayment}
            where ${expensePayment.expenseId} = ${expense.id}
          ), 0) as paid_paise
        from ${expense}
        where ${expense.hqOrganizationId} = ${hqOrganizationId}
          and ${expense.createdAt} >= ${window.from}::date
          and ${expense.createdAt} < (${window.to}::date + interval '1 day')
          ${
            propertyId
              ? // A property carries its own costs; HQ-shared rows belong to no
                // single property, so they stay out of a property's overview
                // rather than being split by a share this app does not model.
                sql`and ${expense.organizationId} = ${propertyId}`
              : sql``
          }
      ) as e
    `);

    // Cash actually received during the window, keyed on when it was paid
    // rather than on when the stay is.
    //
    // These two are genuinely different questions and the dashboard needs
    // both: `booked` is what the stays arriving in this window are worth, and
    // `collected` is what money came through the door. A deposit taken today
    // for a stay in December belongs in the second and not the first, and
    // scoping payments by check-in -- as this first did -- made an operator
    // with paid future bookings see a revenue of zero.
    const collectedRow = await db.execute<{ collected_paise: string }>(sql`
      select coalesce(sum(${bookingPayment.amountPaise}), 0) as collected_paise
      from ${bookingPayment}
      inner join ${booking} on ${booking.id} = ${bookingPayment.bookingId}
      where ${booking.hqOrganizationId} = ${hqOrganizationId}
        and ${booking.status} <> 'cancelled'
        and ${bookingPayment.paidAt} >= ${window.from}::date
        and ${bookingPayment.paidAt} <= ${window.to}::date
        ${propertyFilter(propertyId)}
    `);

    const b = bookingRow.rows[0];
    const e = expenseRow.rows[0];

    return {
      bookedRevenuePaise: Number(b?.booked_paise ?? 0),
      collectedRevenuePaise: Number(collectedRow.rows[0]?.collected_paise ?? 0),
      /** Paid so far against the stays arriving in this window. */
      dueCollectedPaise: Number(b?.due_collected_paise ?? 0),
      bookingCount: Number(b?.booking_count ?? 0),
      nightCount: Number(b?.night_count ?? 0),
      guestCount: Number(b?.guest_count ?? 0),
      cancelledCount: Number(b?.cancelled_count ?? 0),
      billedExpensePaise: Number(e?.billed_paise ?? 0),
      paidExpensePaise: Number(e?.paid_paise ?? 0),
      expenseCount: Number(e?.expense_count ?? 0),
    };
  },

  /**
   * Occupancy across a window, as booked room-nights over sellable room-nights.
   *
   * The denominator counts only published rooms and only the days each room
   * existed, so adding a property mid-month does not read as a collapse in
   * occupancy for the days before it was there.
   */
  async occupancy(input: {
    hqOrganizationId: string;
    propertyId?: string;
    window: DateWindow;
  }) {
    const { hqOrganizationId, propertyId, window } = input;

    const result = await db.execute<{
      booked_nights: number;
      available_nights: number;
    }>(sql`
      with nights as (
        select night::date as night
        from generate_series(
          ${window.from}::date,
          ${window.to}::date,
          interval '1 day'
        ) as night
      ),
      sellable as (
        select ${room.id} as room_id, ${room.createdAt}::date as created_on
        from ${room}
        inner join ${organization} on ${organization.id} = ${room.organizationId}
        where ${room.status} = 'published'
          and ${
            propertyId
              ? sql`${room.organizationId} = ${propertyId}`
              : sql`${organization.parentOrganizationId} = ${hqOrganizationId}`
          }
      ),
      available as (
        select count(*)::int as available_nights
        from sellable
        cross join nights
        where nights.night >= sellable.created_on
      ),
      booked as (
        select count(*)::int as booked_nights
        from ${booking}
        inner join nights
          on coalesce(${booking.actualCheckIn}, ${booking.checkIn}) <= nights.night
         and coalesce(${booking.actualCheckOut}, ${booking.checkOut}) > nights.night
        where ${booking.hqOrganizationId} = ${hqOrganizationId}
          and ${OCCUPIES}
          ${propertyFilter(propertyId)}
      )
      select booked.booked_nights, available.available_nights
      from booked, available
    `);

    const row = result.rows[0];
    return {
      bookedNights: Number(row?.booked_nights ?? 0),
      availableNights: Number(row?.available_nights ?? 0),
    };
  },

  /**
   * Revenue and expenses bucketed over the window, for the trend chart.
   *
   * The bucket width is chosen by the caller from the window length, and
   * `generate_series` emits empty buckets too -- a gap in the data must draw
   * as a zero, not as a missing point the line smooths over.
   */
  async trend(input: {
    hqOrganizationId: string;
    propertyId?: string;
    window: DateWindow;
    bucket: "day" | "week" | "month";
  }) {
    const { hqOrganizationId, propertyId, window, bucket } = input;
    const unit = sql.raw(`'${bucket}'`);

    const result = await db.execute<{
      bucket: string;
      revenue_paise: string;
      expense_paise: string;
      booking_count: number;
    }>(sql`
      with buckets as (
        select generate_series(
          date_trunc(${unit}, ${window.from}::timestamp),
          date_trunc(${unit}, ${window.to}::timestamp),
          ('1 ' || ${unit})::interval
        ) as bucket
      ),
      revenue as (
        select
          date_trunc(${unit}, ${booking.checkIn}::timestamp) as bucket,
          sum(${booking.totalAmountPaise}) as revenue_paise,
          count(*)::int as booking_count
        from ${booking}
        where ${booking.hqOrganizationId} = ${hqOrganizationId}
          and ${EARNS}
          and ${booking.checkIn} >= ${window.from}::date
          and ${booking.checkIn} <= ${window.to}::date
          ${propertyFilter(propertyId)}
        group by 1
      ),
      spend as (
        select
          date_trunc(${unit}, ${expense.createdAt}) as bucket,
          sum(${expense.totalAmountPaise}) as expense_paise
        from ${expense}
        where ${expense.hqOrganizationId} = ${hqOrganizationId}
          and ${expense.createdAt} >= ${window.from}::date
          and ${expense.createdAt} < (${window.to}::date + interval '1 day')
          ${
            propertyId
              ? sql`and ${expense.organizationId} = ${propertyId}`
              : sql``
          }
        group by 1
      )
      select
        to_char(buckets.bucket, 'YYYY-MM-DD') as bucket,
        coalesce(revenue.revenue_paise, 0) as revenue_paise,
        coalesce(spend.expense_paise, 0) as expense_paise,
        coalesce(revenue.booking_count, 0) as booking_count
      from buckets
      left join revenue on revenue.bucket = buckets.bucket
      left join spend on spend.bucket = buckets.bucket
      order by buckets.bucket
    `);

    return result.rows.map((r) => ({
      bucket: r.bucket,
      revenuePaise: Number(r.revenue_paise),
      expensePaise: Number(r.expense_paise),
      bookingCount: Number(r.booking_count),
    }));
  },

  /**
   * Per-property totals, for the portfolio comparison table.
   *
   * Only meaningful at HQ scope -- a caller inside one property has nothing to
   * compare it against, and the service does not ask for this there.
   */
  async byProperty(input: { hqOrganizationId: string; window: DateWindow }) {
    const { hqOrganizationId, window } = input;

    const result = await db.execute<{
      property_id: string;
      property_name: string;
      revenue_paise: string;
      collected_paise: string;
      expense_paise: string;
      booking_count: number;
      booked_nights: number;
      available_nights: number;
    }>(sql`
      with props as (
        select ${organization.id} as id, ${organization.name} as name
        from ${organization}
        where ${organization.parentOrganizationId} = ${hqOrganizationId}
      ),
      nights as (
        select night::date as night
        from generate_series(
          ${window.from}::date,
          ${window.to}::date,
          interval '1 day'
        ) as night
      ),
      revenue as (
        select
          ${booking.organizationId} as property_id,
          sum(${booking.totalAmountPaise}) as revenue_paise,
          sum(coalesce((
            select sum(${bookingPayment.amountPaise})
            from ${bookingPayment}
            where ${bookingPayment.bookingId} = ${booking.id}
          ), 0)) as collected_paise,
          count(*)::int as booking_count
        from ${booking}
        where ${booking.hqOrganizationId} = ${hqOrganizationId}
          and ${EARNS}
          and ${booking.checkIn} >= ${window.from}::date
          and ${booking.checkIn} <= ${window.to}::date
        group by 1
      ),
      spend as (
        select
          ${expense.organizationId} as property_id,
          sum(${expense.totalAmountPaise}) as expense_paise
        from ${expense}
        where ${expense.hqOrganizationId} = ${hqOrganizationId}
          and ${expense.organizationId} is not null
          and ${expense.createdAt} >= ${window.from}::date
          and ${expense.createdAt} < (${window.to}::date + interval '1 day')
        group by 1
      ),
      booked as (
        select ${booking.organizationId} as property_id, count(*)::int as booked_nights
        from ${booking}
        inner join nights
          on coalesce(${booking.actualCheckIn}, ${booking.checkIn}) <= nights.night
         and coalesce(${booking.actualCheckOut}, ${booking.checkOut}) > nights.night
        where ${booking.hqOrganizationId} = ${hqOrganizationId}
          and ${OCCUPIES}
        group by 1
      ),
      capacity as (
        select ${room.organizationId} as property_id, count(*)::int as available_nights
        from ${room}
        cross join nights
        where ${room.status} = 'published'
          and nights.night >= ${room.createdAt}::date
        group by 1
      )
      select
        props.id as property_id,
        props.name as property_name,
        coalesce(revenue.revenue_paise, 0) as revenue_paise,
        coalesce(revenue.collected_paise, 0) as collected_paise,
        coalesce(spend.expense_paise, 0) as expense_paise,
        coalesce(revenue.booking_count, 0) as booking_count,
        coalesce(booked.booked_nights, 0) as booked_nights,
        coalesce(capacity.available_nights, 0) as available_nights
      from props
      left join revenue on revenue.property_id = props.id
      left join spend on spend.property_id = props.id
      left join booked on booked.property_id = props.id
      left join capacity on capacity.property_id = props.id
      order by coalesce(revenue.revenue_paise, 0) desc, props.name
    `);

    return result.rows.map((r) => ({
      propertyId: r.property_id,
      propertyName: r.property_name,
      revenuePaise: Number(r.revenue_paise),
      collectedPaise: Number(r.collected_paise),
      expensePaise: Number(r.expense_paise),
      bookingCount: Number(r.booking_count),
      bookedNights: Number(r.booked_nights),
      availableNights: Number(r.available_nights),
    }));
  },

  /**
   * Where the bookings came from, over the window.
   *
   * Read off `booking.source`, which the create form already sets, so this is
   * a real split rather than the channel-sync placeholder it replaces.
   */
  async bySource(input: {
    hqOrganizationId: string;
    propertyId?: string;
    window: DateWindow;
  }) {
    const { hqOrganizationId, propertyId, window } = input;

    const result = await db.execute<{
      source: string;
      revenue_paise: string;
      booking_count: number;
    }>(sql`
      select
        ${booking.source} as source,
        coalesce(sum(${booking.totalAmountPaise}), 0) as revenue_paise,
        count(*)::int as booking_count
      from ${booking}
      where ${booking.hqOrganizationId} = ${hqOrganizationId}
        and ${EARNS}
        and ${booking.checkIn} >= ${window.from}::date
        and ${booking.checkIn} <= ${window.to}::date
        ${propertyFilter(propertyId)}
      group by 1
      order by 2 desc
    `);

    return result.rows.map((r) => ({
      source: r.source,
      revenuePaise: Number(r.revenue_paise),
      bookingCount: Number(r.booking_count),
    }));
  },

  /** Spend split by category, replacing the placeholder channel card. */
  async expensesByCategory(input: {
    hqOrganizationId: string;
    propertyId?: string;
    window: DateWindow;
  }) {
    const { hqOrganizationId, propertyId, window } = input;

    const result = await db.execute<{
      category: string;
      amount_paise: string;
      expense_count: number;
    }>(sql`
      select
        ${expense.category} as category,
        coalesce(sum(${expense.totalAmountPaise}), 0) as amount_paise,
        count(*)::int as expense_count
      from ${expense}
      where ${expense.hqOrganizationId} = ${hqOrganizationId}
        and ${expense.createdAt} >= ${window.from}::date
        and ${expense.createdAt} < (${window.to}::date + interval '1 day')
        ${
          propertyId
            ? sql`and ${expense.organizationId} = ${propertyId}`
            : sql``
        }
      group by 1
      order by 2 desc
    `);

    return result.rows.map((r) => ({
      category: r.category,
      amountPaise: Number(r.amount_paise),
      expenseCount: Number(r.expense_count),
    }));
  },

  /**
   * Today's arrivals and departures, plus who is currently in house.
   *
   * Always today regardless of the selected window: this is the operations
   * panel, and the front desk needs the shift in front of them, not whatever
   * range the owner happened to leave the date picker on.
   */
  /**
   * The next few live bookings, nearest arrival first.
   *
   * Deliberately as simple as it can be: no date arithmetic, no per-row flags,
   * no windowing. The only filter is "still live" -- an earlier version sorted
   * rows into due-in/due-out/upcoming buckets with `current_date` comparisons,
   * and every bucket came back empty, which is a lot of moving parts for a
   * card whose job is to show the next handful of stays. The desk reads the
   * dates and decides; the UI derives its buttons from `status` alone.
   */
  async recentBookings(input: {
    hqOrganizationId: string;
    propertyId?: string;
    window: DateWindow;
    limit?: number;
  }) {
    const { hqOrganizationId, propertyId, window, limit = 5 } = input;

    return (
      db
        .select({
          id: booking.id,
          ref: booking.ref,
          organizationId: booking.organizationId,
          propertyName: organization.name,
          roomName: room.name,
          guestName: guest.name,
          guestPhone: guest.phone,
          status: booking.status,
          source: booking.source,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          // The stay-date dialog floors an early check-out at the actual
          // arrival, so it needs these alongside the booked dates.
          actualCheckIn: booking.actualCheckIn,
          actualCheckOut: booking.actualCheckOut,
          guestCount: booking.guestCount,
          totalAmountPaise: booking.totalAmountPaise,
          paidPaise: sql<number>`coalesce((
            select sum(${bookingPayment.amountPaise})
            from ${bookingPayment}
            where ${bookingPayment.bookingId} = ${booking.id}
          ), 0)::bigint`,
        })
        .from(booking)
        // Every join here is a LEFT join on purpose. These tables supply display
        // labels -- a property name, a room name, a guest name -- and an INNER
        // join on any of them silently drops the whole booking when the label is
        // missing. That is what emptied this card while the revenue queries,
        // which join nothing, kept working: a booking must never disappear from
        // the desk's list because something it points at cannot be labelled.
        .leftJoin(organization, eq(organization.id, booking.organizationId))
        .leftJoin(room, eq(room.id, booking.roomId))
        .leftJoin(guest, eq(guest.id, booking.guestId))
        .where(
          and(
            eq(booking.hqOrganizationId, hqOrganizationId),
            propertyId ? eq(booking.organizationId, propertyId) : undefined,
            // Any stay touching the selected dates, using the same overlap
            // rule the calendar draws with -- a stay running through the
            // window belongs on it even when it started before.
            sql`${booking.checkIn} <= ${window.to}::date
                and ${booking.checkOut} >= ${window.from}::date`,
            // Cancelled stays need no action. Checked-out ones stay, because
            // a departure inside the window is part of what happened in it.
            sql`${booking.status} <> 'cancelled'`,
          ),
        )
        .orderBy(booking.checkIn)
        .limit(limit)
        .then((rows) =>
          rows.map((row) => ({
            ...row,
            paidPaise: Number(row.paidPaise),
            // What the settle sheet offers to collect. Derived here from the
            // payment rows rather than stored, for the same reason the expense
            // ledger derives its status: a cached balance is one more thing
            // that can disagree with the payments behind it.
            balanceDuePaise: row.totalAmountPaise - Number(row.paidPaise),
            // Left-joined labels can be null; the card renders strings. Falling
            // back here keeps the null handling in one place instead of at every
            // point of display.
            propertyName: row.propertyName ?? "Unknown property",
            roomName: row.roomName ?? "Unassigned room",
          })),
        )
    );
  },

  /**
   * Bookings that need someone to act: money outstanding on a stay that has
   * already started or is about to.
   *
   * Limited to the near future because an unpaid balance on a stay three
   * months out is normal, and listing it would bury the ones that are not.
   */
  async attention(input: { hqOrganizationId: string; propertyId?: string }) {
    const { hqOrganizationId, propertyId } = input;

    const result = await db.execute<{
      id: string;
      ref: string;
      property_name: string;
      guest_name: string | null;
      check_in: string;
      status: string;
      total_amount_paise: string;
      paid_paise: string;
    }>(sql`
      select
        b.id,
        b.ref,
        coalesce(o.name, 'Unknown property') as property_name,
        g.name as guest_name,
        to_char(b.check_in, 'YYYY-MM-DD') as check_in,
        b.status,
        b.total_amount_paise,
        coalesce(p.paid, 0) as paid_paise
      from ${booking} b
      -- LEFT, not INNER: the property name is a display label, and joining on
      -- it strictly would drop the balance entirely when it cannot resolve.
      left join ${organization} o on o.id = b.organization_id
      left join ${guest} g on g.id = b.guest_id
      left join lateral (
        select sum(amount_paise) as paid
        from ${bookingPayment}
        where booking_id = b.id
      ) p on true
      where b.hq_organization_id = ${hqOrganizationId}
        and b.status not in ('cancelled', 'checked_out')
        and b.check_in <= current_date + interval '3 days'
        and b.total_amount_paise > coalesce(p.paid, 0)
        ${propertyId ? sql`and b.organization_id = ${propertyId}` : sql``}
      order by b.check_in
      limit 8
    `);

    return result.rows.map((r) => ({
      id: r.id,
      ref: r.ref,
      propertyName: r.property_name,
      guestName: r.guest_name,
      checkIn: r.check_in,
      status: r.status,
      totalAmountPaise: Number(r.total_amount_paise),
      paidPaise: Number(r.paid_paise),
    }));
  },
};
