import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@propertyos/ui/components/tabs";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo } from "react";

import { authClient } from "@/features/auth/lib/auth-client";
import { useProperties } from "@/features/properties/api/use-properties";
import { StatusBadge } from "@/features/properties/components/status-badge";
import { AmenitiesTab } from "@/features/properties/components/tabs/amenities-tab";
import { BookingLinksTab } from "@/features/properties/components/tabs/booking-links-tab";
import { GalleryTab } from "@/features/properties/components/tabs/gallery-tab";
import { OverviewTab } from "@/features/properties/components/tabs/overview-tab";
import { PoliciesTab } from "@/features/properties/components/tabs/policies-tab";
import { PricingTab } from "@/features/properties/components/tabs/pricing-tab";
import { RoomsUnitsTab } from "@/features/properties/components/tabs/rooms-units-tab";
import { TaxesBillingTab } from "@/features/properties/components/tabs/taxes-billing-tab";
import { TypeBadge } from "@/features/properties/components/type-badge";
import {
  buildPropertyDetails,
  resolveProperties,
} from "@/features/properties/lib/mock-data";

export const Route = createFileRoute("/(protected)/properties/$propertyId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { propertyId } = Route.useParams();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const { data: propertiesResponse } = useProperties(activeOrganization?.id);

  const properties = useMemo(
    () => resolveProperties(propertiesResponse?.data),
    [propertiesResponse?.data],
  );

  const propertyDetails = useMemo(
    () => buildPropertyDetails(properties),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [properties.map((p) => p.id).join(",")],
  );

  const property = propertyDetails.find((p) => p.id === propertyId);

  if (!property) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-muted-foreground text-sm">
          This property could not be found.
        </p>
        <Link to="/properties" className="text-foreground text-sm underline">
          Back to Properties
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="flex flex-col gap-6 p-4"
    >
      <div className="flex flex-col gap-2">
        <Link
          to="/properties"
          className="w-fit text-muted-foreground text-xs hover:text-foreground hover:underline"
        >
          ← Properties
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-display-md">{property.name}</h1>
          <TypeBadge type={property.propertyType} />
          <StatusBadge status={property.status} />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTab value="overview">Overview</TabsTab>
          <TabsTab value="rooms">Rooms & Units</TabsTab>
          <TabsTab value="pricing">Pricing</TabsTab>
          <TabsTab value="gallery">Gallery</TabsTab>
          <TabsTab value="policies">Policies</TabsTab>
          <TabsTab value="amenities">Amenities</TabsTab>
          <TabsTab value="booking-links">Booking Links</TabsTab>
          <TabsTab value="taxes">Taxes & Billing</TabsTab>
        </TabsList>

        <TabsPanel value="overview">
          <OverviewTab property={property} />
        </TabsPanel>
        <TabsPanel value="rooms">
          <RoomsUnitsTab property={property} />
        </TabsPanel>
        <TabsPanel value="pricing">
          <PricingTab property={property} />
        </TabsPanel>
        <TabsPanel value="gallery">
          <GalleryTab property={property} />
        </TabsPanel>
        <TabsPanel value="policies">
          <PoliciesTab property={property} />
        </TabsPanel>
        <TabsPanel value="amenities">
          <AmenitiesTab property={property} />
        </TabsPanel>
        <TabsPanel value="booking-links">
          <BookingLinksTab property={property} />
        </TabsPanel>
        <TabsPanel value="taxes">
          <TaxesBillingTab property={property} />
        </TabsPanel>
      </Tabs>
    </motion.div>
  );
}
