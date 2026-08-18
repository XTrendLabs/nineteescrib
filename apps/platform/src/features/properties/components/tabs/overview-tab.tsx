import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";
import { motion } from "motion/react";

import { formatInr, formatPercent } from "../../lib/format";
import type { PropertyDetail } from "../../lib/mock-data";
import { GalleryBlock } from "../gallery-block";

function MetricCard({
  label,
  value,
  index,
}: {
  label: string;
  value: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        type: "spring",
        stiffness: 220,
        damping: 26,
      }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="font-normal text-muted-foreground">
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-display-sm tabular-nums leading-none">{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function OverviewTab({ property }: { property: PropertyDetail }) {
  const cover =
    property.propertyGallery.find((img) => img.isCover) ??
    property.propertyGallery[0];

  const checklistItems: { label: string; done: boolean }[] = [
    { label: "Property details added", done: property.checklist.detailsAdded },
    {
      label: `Room types configured (${property.roomTypes.length} types, ${property.metrics.totalUnits} units)`,
      done: property.checklist.roomTypesConfigured,
    },
    {
      label: `Photos uploaded (${property.propertyGallery.length} images)`,
      done: property.checklist.photosUploaded,
    },
    {
      label: "Payment gateway connected",
      done: property.checklist.paymentGatewayConnected,
    },
    {
      label: "Booking link shared",
      done: property.checklist.bookingLinkShared,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {cover ? (
          <GalleryBlock colorIndex={cover.colorIndex} className="h-56 w-full" />
        ) : (
          <div className="h-56 w-full bg-muted" />
        )}
        <Card className="h-full">
          <CardContent className="flex flex-col gap-2 pt-4">
            <p className="text-display-sm">{property.name}</p>
            <p className="text-muted-foreground text-xs">
              {property.propertyType.charAt(0).toUpperCase() +
                property.propertyType.slice(1)}{" "}
              · {property.city}, {property.country}
            </p>
            <div className="mt-2 flex flex-col gap-1 text-xs">
              <p>
                <span className="text-muted-foreground">Address: </span>
                {property.addressLine1}, {property.city}, {property.state}{" "}
                {property.pinCode}
              </p>
              <p>
                <span className="text-muted-foreground">Map: </span>
                {property.latitude.toFixed(4)}° N,{" "}
                {property.longitude.toFixed(4)}° E
              </p>
              <p>
                <span className="text-muted-foreground">Check-in: </span>
                {property.policies.checkinTime} |{" "}
                <span className="text-muted-foreground">Out: </span>
                {property.policies.checkoutTime}
              </p>
              <p>
                <span className="text-muted-foreground">Slug: </span>
                {property.slug}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          index={0}
          label="Total Units"
          value={String(property.metrics.totalUnits)}
        />
        <MetricCard
          index={1}
          label="Current Occupancy"
          value={formatPercent(property.metrics.currentOccupancyPercent)}
        />
        <MetricCard
          index={2}
          label="This Month Revenue"
          value={formatInr(property.metrics.thisMonthRevenuePaise)}
        />
        <MetricCard
          index={3}
          label="Direct Booking Share"
          value={formatPercent(property.metrics.directBookingSharePercent)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup Completeness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {checklistItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                {item.done ? (
                  <CheckCircle2Icon className="size-4 shrink-0 text-success" />
                ) : (
                  <AlertTriangleIcon className="size-4 shrink-0 text-warning" />
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
