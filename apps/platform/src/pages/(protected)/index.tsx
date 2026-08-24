import { Button } from "@propertyos/ui/components/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { subDays } from "date-fns";
import { AlertTriangleIcon, PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { useCachedActiveOrganization } from "@/features/auth/api/use-cached-organizations";
import { ChannelSyncCard } from "@/features/hq-dashboard/components/channel-sync-card";
import { CheckinCockpitCard } from "@/features/hq-dashboard/components/checkin-cockpit-card";
import { DateRangePicker } from "@/features/hq-dashboard/components/date-range-picker";
import { MetricsBand } from "@/features/hq-dashboard/components/metrics-band";
import { PortfolioFilter } from "@/features/hq-dashboard/components/portfolio-filter";
import { PropertyShareCard } from "@/features/hq-dashboard/components/property-share-card";
import { RevenueChartCard } from "@/features/hq-dashboard/components/revenue-chart-card";
import {
  buildPortfolioMetrics,
  resolveDashboardProperties,
} from "@/features/hq-dashboard/lib/mock-data";
import { useProperties } from "@/features/properties/api/use-properties";
import { CreatePropertyDialog } from "@/features/properties/components/create-property-dialog";

export const Route = createFileRoute("/(protected)/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const { data: activeOrganization } = useCachedActiveOrganization();
  const { data: propertiesResponse, isLoading } = useProperties(
    activeOrganization?.id,
  );

  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const hasNoProperties =
    !isLoading && (propertiesResponse?.data.length ?? 0) === 0;

  const allProperties = useMemo(
    () => resolveDashboardProperties(propertiesResponse?.data),
    [propertiesResponse?.data],
  );

  const activeProperties = useMemo(
    () =>
      filter === "all"
        ? allProperties
        : allProperties.filter((p) => p.id === filter),
    [allProperties, filter],
  );

  const metrics = useMemo(
    () => buildPortfolioMetrics(activeProperties),
    [activeProperties],
  );

  const firstName = session.data?.user.name?.split(" ")[0];

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
            {firstName ? `Welcome back, ${firstName}` : "Owner HQ"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Portfolio overview across all your properties
          </p>
        </div>
        {!hasNoProperties && (
          <div className="flex flex-wrap items-center gap-2">
            <PortfolioFilter
              properties={allProperties}
              value={filter}
              onChange={setFilter}
            />
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        )}
      </motion.div>

      {hasNoProperties && (
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

      <MetricsBand metrics={metrics} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <RevenueChartCard properties={activeProperties} />
        </div>
        <div className="lg:col-span-4">
          <PropertyShareCard properties={activeProperties} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CheckinCockpitCard properties={activeProperties} />
        <ChannelSyncCard properties={activeProperties} />
      </div>

      <CreatePropertyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        organizationId={activeOrganization?.id}
        onCreated={(slug) =>
          navigate({
            to: "/properties/$propertySlug",
            params: { propertySlug: slug },
          })
        }
      />
    </div>
  );
}
