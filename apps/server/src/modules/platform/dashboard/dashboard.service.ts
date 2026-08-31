import type { AppRole } from "@propertyos/auth/permissions";
import { roles } from "@propertyos/auth/permissions";

import { type DateWindow, dashboardRepo } from "./dashboard.repo";

/**
 * The two shapes the overview takes.
 *
 * Which one a caller gets follows the organization they have active, not their
 * role: an HQ is a portfolio and reads as one, a property is an operation and
 * reads as one. An owner who drills into a single property is asking about
 * that property, and should see what its manager sees -- with more of it.
 */
export type DashboardScope = "hq" | "property";

/** Bucket width that keeps a chart legible without truncating the window. */
function bucketFor(window: DateWindow): "day" | "week" | "month" {
  const days =
    (Date.parse(`${window.to}T00:00:00Z`) -
      Date.parse(`${window.from}T00:00:00Z`)) /
      86_400_000 +
    1;

  if (days <= 31) return "day";
  if (days <= 182) return "week";
  return "month";
}

/**
 * Whether this role may see money at all.
 *
 * `staff` holds `finance: []`, so a caretaker gets the operations half of the
 * dashboard -- arrivals, departures, who is in house -- and no revenue,
 * expense or payout figure. Enforced here rather than only hidden in the UI,
 * so the numbers never leave the server for someone who cannot see them.
 */
function canReadFinance(role: AppRole) {
  return roles[role].authorize({ finance: ["read"] }).success;
}

export const dashboardService = {
  async overview(input: {
    hqOrganizationId: string;
    /** Set when the caller is inside one property, or filtering to one. */
    propertyId?: string;
    scope: DashboardScope;
    role: AppRole;
    window: DateWindow;
  }) {
    const { hqOrganizationId, propertyId, scope, role, window } = input;
    const showFinance = canReadFinance(role);

    // Operations are the one half everybody sees, so they are always fetched.
    // `bookingSpan` ignores the window on purpose -- it is what tells an empty
    // dashboard apart from an empty business.
    const [recentBookings, occupancy, span] = await Promise.all([
      dashboardRepo.recentBookings({ hqOrganizationId, propertyId, window }),
      dashboardRepo.occupancy({ hqOrganizationId, propertyId, window }),
      dashboardRepo.bookingSpan({ hqOrganizationId, propertyId }),
    ]);

    const operations = {
      recentBookings,
      occupancy: {
        ...occupancy,
        // Guarded rather than computed blind: a window with no published
        // rooms has no meaningful occupancy, and 0/0 must read as "no
        // inventory", not as an occupancy of zero.
        rate:
          occupancy.availableNights > 0
            ? (occupancy.bookedNights / occupancy.availableNights) * 100
            : null,
      },
    };

    if (!showFinance) {
      return { scope, showFinance, window, operations, span };
    }

    const [totals, trend, expensesByCategory, attention, byProperty] =
      await Promise.all([
        dashboardRepo.totals({ hqOrganizationId, propertyId, window }),
        dashboardRepo.trend({
          hqOrganizationId,
          propertyId,
          window,
          bucket: bucketFor(window),
        }),
        dashboardRepo.expensesByCategory({
          hqOrganizationId,
          propertyId,
          window,
        }),
        dashboardRepo.attention({ hqOrganizationId, propertyId }),
        // Only an HQ view has properties to compare; inside one property the
        // table would be a single row restating the totals above it.
        scope === "hq"
          ? dashboardRepo.byProperty({ hqOrganizationId, window })
          : Promise.resolve([]),
      ]);

    const netPaise = totals.bookedRevenuePaise - totals.billedExpensePaise;

    return {
      scope,
      showFinance,
      window,
      operations,
      span,
      finance: {
        ...totals,
        netPaise,
        // What the stays arriving in this window still owe. Compared against
        // the due-basis figure, not against `collectedRevenuePaise`, which
        // counts cash for stays outside the window and would net off against
        // an unrelated balance.
        outstandingPaise: totals.bookedRevenuePaise - totals.dueCollectedPaise,
        // Average nightly rate, over nights actually sold. Null rather than 0
        // when nothing sold, for the same reason as the occupancy rate.
        avgNightlyRatePaise:
          totals.nightCount > 0
            ? Math.round(totals.bookedRevenuePaise / totals.nightCount)
            : null,
        bucket: bucketFor(window),
        trend,
        expensesByCategory,
        attention,
        byProperty,
      },
    };
  },
};
