import { Skeleton } from "@propertyos/ui/components/skeleton";
import { SkeletonLayout } from "@propertyos/ui/components/skeleton-block";
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@propertyos/ui/components/tabs";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircleIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { usePropertyBySlug } from "@/features/properties/api/use-property-by-slug";
import { StatusBadge } from "@/features/properties/components/status-badge";
import { BookingLinksTab } from "@/features/properties/components/tabs/booking-links-tab";
import { OverviewTab } from "@/features/properties/components/tabs/overview-tab";
import { PoliciesTab } from "@/features/properties/components/tabs/policies-tab";
import { RoomsTab } from "@/features/properties/components/tabs/rooms-tab";
import { TaxesBillingTab } from "@/features/properties/components/tabs/taxes-billing-tab";
import { TypeBadge } from "@/features/properties/components/type-badge";
import {
  normalizePropertyStatus,
  normalizePropertyType,
} from "@/features/properties/lib/property";
import { PROPERTY_TAB_SKELETONS } from "@/features/properties/lib/skeleton-config";
import { isForbidden } from "@/shared/lib/api-error";

export const Route = createFileRoute("/(protected)/properties/$propertySlug")({
  component: RouteComponent,
});

function RouteComponent() {
  const { propertySlug } = Route.useParams();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: response, isLoading, error } = usePropertyBySlug(propertySlug);
  const property = response?.data;
  const { isHqActive } = useActiveHq();

  // These come back with the property itself; the rooms and rules tabs fetch
  // their own data when opened.
  const missingRooms = !property?.hasPublishedRoom;
  const hasRule = (category: string) =>
    property?.ruleCategories?.includes(category) ?? false;

  const missingBusinessDetails = property
    ? !(
        property.ownerName &&
        property.contactPhone &&
        property.contactEmail &&
        property.whatsappNumber &&
        property.operationsOpenTime &&
        property.operationsCloseTime
      )
    : false;

  const missingTaxDetails = property
    ? !(
        property.gstNumber ||
        property.panNumber ||
        property.invoicePrefix ||
        property.billingAddress ||
        property.bankAccountNumber
      )
    : false;

  const missingPolicies = property
    ? !(
        property.checkInTime &&
        property.checkOutTime &&
        hasRule("property_rules") &&
        hasRule("cancellation_policy")
      )
    : false;

  if (isLoading) {
    const shapes =
      PROPERTY_TAB_SKELETONS[activeTab] ?? PROPERTY_TAB_SKELETONS.overview;
    return (
      <div className="flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-64" />
        </div>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as string)}
        >
          <TabsList className="flex-wrap">
            <TabsTab value="overview">Overview</TabsTab>
            <TabsTab value="rooms">Rooms</TabsTab>
            <TabsTab value="policies">Policies & Amenities</TabsTab>
            <TabsTab value="booking-links">Booking Links</TabsTab>
            <TabsTab value="taxes">Taxes & Billing</TabsTab>
          </TabsList>
        </Tabs>
        <SkeletonLayout shapes={shapes} />
      </div>
    );
  }

  if (!property) {
    // The server returns 403 for a property the user is not assigned to, so
    // say so plainly rather than implying it does not exist. "Back to
    // Properties" is only offered to someone scoped to an HQ -- a
    // property-scoped user has no all-properties page to return to.
    const denied = isForbidden(error);

    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-muted-foreground text-sm">
          {denied
            ? "You do not have access to this property."
            : "This property could not be found."}
        </p>
        {isHqActive && (
          <Link to="/properties" className="text-foreground text-sm underline">
            Back to Properties
          </Link>
        )}
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
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-display-md">{property.name}</h1>
          <TypeBadge type={normalizePropertyType(property.propertyType)} />
          <StatusBadge status={normalizePropertyStatus(property.status)} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as string)}>
        <TabsList className="flex-wrap">
          <TabsTab value="overview" className="flex items-center gap-1.5">
            Overview
            {missingBusinessDetails && (
              <AlertCircleIcon className="size-3.5 text-destructive" />
            )}
          </TabsTab>
          <TabsTab value="rooms" className="flex items-center gap-1.5">
            Rooms
            {missingRooms && (
              <AlertCircleIcon className="size-3.5 text-destructive" />
            )}
          </TabsTab>
          <TabsTab value="policies" className="flex items-center gap-1.5">
            Policies & Amenities
            {missingPolicies && (
              <AlertCircleIcon className="size-3.5 text-destructive" />
            )}
          </TabsTab>
          <TabsTab value="booking-links" className="flex items-center gap-1.5">
            Booking Links
            <AlertCircleIcon className="size-3.5 text-destructive" />
          </TabsTab>
          <TabsTab value="taxes" className="flex items-center gap-1.5">
            Taxes & Billing
            {missingTaxDetails && (
              <AlertCircleIcon className="size-3.5 text-destructive" />
            )}
          </TabsTab>
        </TabsList>

        <TabsPanel value="overview">
          <OverviewTab property={property} />
        </TabsPanel>
        <TabsPanel value="rooms">
          <RoomsTab propertyId={property.id} propertySlug={property.slug} />
        </TabsPanel>
        <TabsPanel value="policies">
          <PoliciesTab property={property} />
        </TabsPanel>
        <TabsPanel value="booking-links">
          <BookingLinksTab />
        </TabsPanel>
        <TabsPanel value="taxes">
          <TaxesBillingTab property={property} />
        </TabsPanel>
      </Tabs>
    </motion.div>
  );
}
