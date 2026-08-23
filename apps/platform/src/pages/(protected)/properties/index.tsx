import { Button } from "@propertyos/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { useCachedActiveOrganization } from "@/features/auth/api/use-cached-organizations";
import {
  useCreatedProperties,
  useCreatePropertyAndNavigate,
} from "@/features/properties/api/use-created-properties";
import { useProperties } from "@/features/properties/api/use-properties";
import { CreatePropertyDialog } from "@/features/properties/components/create-property-dialog";
import {
  DEFAULT_FILTERS,
  FilterToolbar,
} from "@/features/properties/components/filter-toolbar";
import { PropertyCard } from "@/features/properties/components/property-card";
import {
  buildPropertyDetails,
  resolveProperties,
} from "@/features/properties/lib/mock-data";

export const Route = createFileRoute("/(protected)/properties/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: activeOrganization } = useCachedActiveOrganization();
  const { data: propertiesResponse } = useProperties(activeOrganization?.id);
  const { createdProperties } = useCreatedProperties();
  const createPropertyAndNavigate = useCreatePropertyAndNavigate();

  const properties = useMemo(
    () => [
      ...resolveProperties(propertiesResponse?.data),
      ...createdProperties,
    ],
    [propertiesResponse?.data, createdProperties],
  );

  const propertyDetails = useMemo(
    () => buildPropertyDetails(properties),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [properties.map((p) => p.id).join(",")],
  );

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  function handleCreate(name: string) {
    setCreateDialogOpen(false);
    createPropertyAndNavigate(name);
  }

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return propertyDetails.filter((property) => {
      if (filters.type !== "all" && property.propertyType !== filters.type) {
        return false;
      }
      if (filters.status !== "all" && property.status !== filters.status) {
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
  }, [propertyDetails, filters]);

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

      {filtered.length === 0 ? (
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
        onCreate={handleCreate}
      />
    </div>
  );
}
