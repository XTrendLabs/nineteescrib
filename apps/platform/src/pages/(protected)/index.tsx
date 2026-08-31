import { Button } from "@propertyos/ui/components/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format, parseISO, subDays } from "date-fns";
import {
  AlertTriangleIcon,
  CalendarSearchIcon,
  PlusIcon,
  RotateCwIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { useHasPermission } from "@/features/auth/api/use-permission";
import { useOverview } from "@/features/dashboard/api/use-overview";
import { AttentionCard } from "@/features/dashboard/components/attention-card";
import { BreakdownCard } from "@/features/dashboard/components/breakdown-card";
import { DateRangePicker } from "@/features/dashboard/components/date-range-picker";
import { MetricTile } from "@/features/dashboard/components/metric-tile";
import { OverviewSkeleton } from "@/features/dashboard/components/overview-skeleton";
import { PropertyFilter } from "@/features/dashboard/components/property-filter";
import { PropertyTableCard } from "@/features/dashboard/components/property-table-card";
import { RecentBookingsCard } from "@/features/dashboard/components/recent-bookings-card";
import { TrendCard } from "@/features/dashboard/components/trend-card";
import {
  formatCategory,
  formatCount,
  formatDayLabel,
  formatPaise,
  formatRate,
} from "@/features/dashboard/lib/format";
import { useProperties } from "@/features/properties/api/use-properties";
import { CreatePropertyDialog } from "@/features/properties/components/create-property-dialog";

export const Route = createFileRoute("/(protected)/")({
  component: RouteComponent,
});

/** The API takes calendar days, so a picked range is formatted, never ISO'd. */
function toDay(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const { activeHqId, activeScopeId, isHqActive } = useActiveHq();

  const [filter, setFilter] = useState("all");
  // Last 30 days rather than month-to-date: on the 1st of a month the latter
  // opens on an empty page, which reads as a broken dashboard rather than as a
  // new month.
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const canCreateProperty = useHasPermission("property", "create");
  // Known before the request resolves -- both come from the session -- so the
  // skeleton can draw the right shape instead of guessing at it.
  const canReadFinance = useHasPermission("finance", "read");

  const { from, to } = useMemo(
    () => ({
      from: dateRange?.from ? toDay(dateRange.from) : "",
      to: toDay(dateRange?.to ?? dateRange?.from ?? new Date()),
    }),
    [dateRange],
  );

  const {
    data: propertiesResponse,
    isPending: propertiesPending,
    isFetching: propertiesFetching,
  } = useProperties(activeScopeId);

  const overview = useOverview({
    activeOrganizationId: activeScopeId,
    propertyId: isHqActive ? filter : "all",
    from,
    to,
  });

  const properties = propertiesResponse?.data ?? [];

  // Only claim "no properties" once a response for the *current* scope has
  // actually landed. Switching workspace re-fetches, and an undefined/stale
  // `data` mid-flight must not be mistaken for an empty portfolio.
  const hasNoProperties =
    Boolean(activeScopeId) &&
    !propertiesPending &&
    !propertiesFetching &&
    propertiesResponse !== undefined &&
    properties.length === 0;

  const firstName = session.data?.user.name?.split(" ")[0];
  const data = overview.data?.data;
  // The response is a discriminated union: a role without `finance: read` gets
  // a body with no `finance` key at all, so this narrows on the flag rather
  // than reaching for a property that may not be there.
  const finance = data?.showFinance ? data.finance : undefined;

  // Normalized once, here, rather than guarded at every call site. A response
  // from an older server build can be missing a list the page expects, and a
  // dashboard must degrade to an empty card rather than take the route down.
  const ops = {
    recentBookings: data?.operations.recentBookings ?? [],
    occupancy: data?.operations.occupancy,
  };
  const scope = isHqActive ? "hq" : "property";

  // The window is empty but the business is not: bookings exist, they are just
  // outside the selected dates.
  const emptySpan =
    data &&
    data.span.total > 0 &&
    data.span.earliest !== null &&
    data.span.latest !== null &&
    (data.operations.occupancy?.bookedNights ?? 0) === 0 &&
    (finance ? finance.bookingCount === 0 : true)
      ? {
          total: data.span.total,
          earliest: data.span.earliest,
          latest: data.span.latest,
        }
      : undefined;

  /** Widens the window to cover every booking the caller can see. */
  const showAllBookings = () => {
    if (!emptySpan) return;
    setDateRange({
      from: parseISO(emptySpan.earliest),
      to: parseISO(emptySpan.latest),
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-display-md">
            {firstName ? `Welcome back, ${firstName}` : "Overview"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isHqActive
              ? "Portfolio overview across all your properties"
              : "How this property is running"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Only an HQ has a portfolio to filter; inside one property the
              server narrows to it regardless, so the control would be a lie. */}
          {isHqActive && !hasNoProperties && (
            <PropertyFilter
              properties={properties}
              value={filter}
              onChange={setFilter}
            />
          )}
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </motion.div>

      {hasNoProperties && canCreateProperty && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-warning bg-warning/10 p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <p className="font-medium text-sm">No properties yet</p>
              <p className="text-muted-foreground text-xs">
                Add your first property to start seeing revenue, occupancy, and
                booking activity on this dashboard.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <PlusIcon />
            Add Property
          </Button>
        </div>
      )}

      {/* Three states, kept distinct on purpose. A failed request must not
          render as an overview full of zeroes -- "you earned nothing" and "we
          could not find out" are different answers, and only one of them is
          safe to act on. */}
      {overview.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-destructive bg-destructive/10 p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-sm">Could not load the overview</p>
              <p className="text-muted-foreground text-xs">
                {overview.error instanceof Error
                  ? overview.error.message
                  : "Something went wrong fetching your numbers."}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => overview.refetch()}
          >
            <RotateCwIcon />
            Retry
          </Button>
        </div>
      ) : overview.isPending || !data ? (
        <OverviewSkeleton scope={scope} showFinance={canReadFinance} />
      ) : (
        <div
          // A refetch after a filter or date change keeps the loaded layout and
          // dims it, rather than dropping back to the skeleton -- swapping the
          // whole page out on every date tweak reads as a navigation.
          className={
            overview.isFetching
              ? "flex flex-col gap-4 opacity-60 transition-opacity"
              : "flex flex-col gap-4 transition-opacity"
          }
        >
          {/* An empty window and an empty business look identical in the
              tiles below -- both are zero. `span` is fetched without the
              window precisely so the two can be told apart, and an operator
              whose stays are all upcoming gets told where they are rather
              than being shown a page of zeroes. */}
          {emptySpan && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-warning bg-warning/10 p-4">
              <div className="flex items-start gap-2.5">
                <CalendarSearchIcon className="mt-0.5 size-5 shrink-0 text-warning" />
                <div>
                  <p className="font-medium text-sm">
                    No bookings in the selected dates
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {`You have ${formatCount(emptySpan.total)} booking${
                      emptySpan.total === 1 ? "" : "s"
                    } between ${formatDayLabel(
                      emptySpan.earliest,
                      "day",
                    )} and ${formatDayLabel(emptySpan.latest, "day")}, outside this range.`}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={showAllBookings}>
                <CalendarSearchIcon />
                Show all bookings
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {finance && (
              <MetricTile
                index={0}
                label={isHqActive ? "Portfolio revenue" : "Revenue"}
                value={formatPaise(finance.bookedRevenuePaise)}
                // Two different bases, so the hint says which is which: the
                // headline is what the stays arriving in this window are
                // worth, while "received" is cash that actually came in
                // during it -- including deposits on stays further out.
                hint={`${formatPaise(finance.outstandingPaise)} still due · ${formatPaise(finance.collectedRevenuePaise)} received in period`}
              />
            )}
            <MetricTile
              index={1}
              label="Occupancy"
              value={formatRate(ops.occupancy?.rate ?? null)}
              hint={
                (ops.occupancy?.availableNights ?? 0) > 0
                  ? `${formatCount(ops.occupancy?.bookedNights ?? 0)} of ${formatCount(ops.occupancy?.availableNights ?? 0)} room-nights`
                  : "No published rooms in this period"
              }
            />
            {finance && (
              <MetricTile
                index={2}
                label="Net"
                value={formatPaise(finance.netPaise)}
                tone={
                  finance.netPaise > 0
                    ? "positive"
                    : finance.netPaise < 0
                      ? "negative"
                      : "default"
                }
                hint={`${formatPaise(finance.billedExpensePaise)} in expenses`}
              />
            )}
            <MetricTile
              index={3}
              label="Live bookings"
              value={formatCount(ops.recentBookings.length)}
              // These count what the desk still owes an action on, which
              // includes stays whose date has already passed -- so the label
              // says "due", not "today".
              hint="Nearest arrivals, awaiting action"
            />
          </div>

          {/* Today sits beside the chart: it is the card the page is opened
              for, and it renders for every role -- only the chart next to it
              is gated on finance. */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {finance && (
              <div className="lg:col-span-8">
                <TrendCard data={finance.trend} bucket={finance.bucket} />
              </div>
            )}
            <div className={finance ? "lg:col-span-4" : "lg:col-span-12"}>
              <RecentBookingsCard
                rows={ops.recentBookings}
                showFinance={data.showFinance}
                showProperty={isHqActive && filter === "all"}
                onChanged={() => overview.refetch()}
              />
            </div>
          </div>

          {/* HQ only: inside one property this would be a single row
              restating the tiles above it. */}
          {finance && isHqActive && (finance.byProperty?.length ?? 0) > 0 && (
            <PropertyTableCard rows={finance.byProperty} />
          )}

          {/* The two money follow-ups, side by side: what was spent, and what
              is still owed. */}
          {finance && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <BreakdownCard
                title="Expenses by category"
                emptyLabel="No expenses logged in this period."
                rows={finance.expensesByCategory?.map((row) => ({
                  key: row.category,
                  label: formatCategory(row.category),
                  amountPaise: row.amountPaise,
                  count: row.expenseCount,
                }))}
              />
              <AttentionCard
                rows={finance.attention}
                showProperty={isHqActive && filter === "all"}
              />
            </div>
          )}
        </div>
      )}

      {canCreateProperty && (
        <CreatePropertyDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          organizationId={activeHqId}
          onCreated={(slug) =>
            navigate({
              to: "/properties/$propertySlug",
              params: { propertySlug: slug },
            })
          }
        />
      )}
    </div>
  );
}
