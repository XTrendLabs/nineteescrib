import { Button } from "@propertyos/ui/components/button";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { authQueryKeys } from "@/features/auth/api/query-keys";
import {
  fetchOrganizationList,
  getActiveOrganizationId,
  useActiveHq,
} from "@/features/auth/api/use-cached-organizations";
import {
  fetchSession,
  SESSION_STALE_TIME,
} from "@/features/auth/api/use-cached-session";
import { useProperties } from "@/features/properties/api/use-properties";
import { CreatePropertyDialog } from "@/features/properties/components/create-property-dialog";
import {
  DEFAULT_FILTERS,
  FilterToolbar,
} from "@/features/properties/components/filter-toolbar";
import { PropertyCard } from "@/features/properties/components/property-card";
import {
  normalizePropertyStatus,
  normalizePropertyType,
} from "@/features/properties/lib/property";

export const Route = createFileRoute("/(protected)/properties/")({
  /**
   * This page is the HQ overview. When a single property is the active
   * organization the user is scoped to that property, so the all-properties
   * list is not theirs to see -- send them into their property instead.
   */
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData({
      queryKey: authQueryKeys.session(),
      queryFn: fetchSession,
      staleTime: SESSION_STALE_TIME,
    });

    const activeOrganizationId = getActiveOrganizationId(session);
    if (!activeOrganizationId) return;

    const organizations = await context.queryClient.ensureQueryData({
      queryKey: authQueryKeys.organizations(session?.user.id),
      queryFn: fetchOrganizationList,
      staleTime: SESSION_STALE_TIME,
    });

    const active = organizations?.find((o) => o.id === activeOrganizationId);
    if (active && active.kind !== "hq" && active.slug) {
      throw redirect({
        to: "/properties/$propertySlug",
        params: { propertySlug: active.slug },
        replace: true,
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  // Always the HQ in scope: when a property is the active organization this is
  // its parent, so this page keeps listing that HQ's properties.
  const { activeHqId, activeScopeId, activePropertySlug } = useActiveHq();

  // `beforeLoad` only guards navigation *to* this page. Switching scope while
  // already here does not re-run it, so leave as soon as the active
  // organization becomes a property.
  useEffect(() => {
    if (!activePropertySlug) return;
    navigate({
      to: "/properties/$propertySlug",
      params: { propertySlug: activePropertySlug },
      replace: true,
    });
  }, [activePropertySlug, navigate]);

  const { data: propertiesResponse, isLoading } = useProperties(activeScopeId);

  const properties = propertiesResponse?.data ?? [];

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return properties.filter((property) => {
      const propertyType = normalizePropertyType(property.propertyType);
      const status = normalizePropertyStatus(property.status);
      if (filters.type !== "all" && propertyType !== filters.type) {
        return false;
      }
      if (filters.status !== "all" && status !== filters.status) {
        return false;
      }
      if (
        search &&
        !property.name.toLowerCase().includes(search) &&
        !property.city.toLowerCase().includes(search)
      ) {
        return false;
      }
      return true;
    });
  }, [properties, filters]);

  return (
    <div className="flex flex-col gap-6 p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-display-md">Properties</h1>
          <p className="text-muted-foreground text-sm">
            Configure locations, room inventories, pricing, and booking links
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon />
          Add Property
        </Button>
      </motion.div>

      <FilterToolbar filters={filters} onChange={setFilters} />

      {isLoading ? null : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 border border-dashed py-16 text-center">
          <p className="text-sm">No properties yet</p>
          <p className="text-muted-foreground text-xs">
            Add your first property to start managing rooms, pricing, and
            bookings.
          </p>
          <Button
            size="sm"
            className="mt-2"
            onClick={() => setCreateDialogOpen(true)}
          >
            <PlusIcon />
            Add Property
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 border py-16 text-center">
          <p className="text-sm">No properties match your filters</p>
          <p className="text-muted-foreground text-xs">
            Try adjusting search or filter criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property, index) => (
            <PropertyCard key={property.id} property={property} index={index} />
          ))}

          <motion.button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: filtered.length * 0.06,
              type: "spring",
              stiffness: 220,
              damping: 26,
            }}
            className="flex min-h-48 flex-col items-center justify-center gap-1 border border-dashed p-6 text-center text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            <PlusIcon className="size-5" />
            <span className="font-medium text-sm">Add New Property</span>
            <span className="text-xs">
              Set up a new location in your portfolio.
            </span>
          </motion.button>
        </div>
      )}

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
    </div>
  );
}
