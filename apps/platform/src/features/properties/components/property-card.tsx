import { Card, CardContent, CardHeader } from "@propertyos/ui/components/card";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, ExternalLinkIcon, MapPinIcon } from "lucide-react";
import { motion } from "motion/react";

import { formatInr, formatPercent } from "../lib/format";
import type { PropertyDetail } from "../lib/mock-data";
import { GalleryBlock } from "./gallery-block";
import { StatusBadge } from "./status-badge";
import { TypeBadge } from "./type-badge";

export function PropertyCard({
  property,
  index,
}: {
  property: PropertyDetail;
  index: number;
}) {
  const cover =
    property.propertyGallery.find((img) => img.isCover) ??
    property.propertyGallery[0];
  const roomTypeCount = property.roomTypes.length;
  const [tenantSlug, propertySlug] = property.bookingLink.slug.split("/");

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
      <Card className="h-full gap-3 py-0">
        {cover ? (
          <GalleryBlock colorIndex={cover.colorIndex} className="h-36 w-full" />
        ) : (
          <div className="h-36 w-full bg-muted" />
        )}
        <CardHeader className="pt-3">
          <p className="text-display-sm leading-tight">{property.name}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeBadge type={property.propertyType} />
            <StatusBadge status={property.status} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pb-4">
          <p className="flex items-center gap-1 text-muted-foreground text-xs">
            <MapPinIcon className="size-3.5" />
            {property.city}
          </p>
          <p className="text-xs">
            {roomTypeCount} Room Type{roomTypeCount === 1 ? "" : "s"} ·{" "}
            {property.metrics.totalUnits} Unit
            {property.metrics.totalUnits === 1 ? "" : "s"}
          </p>
          <p className="text-muted-foreground text-xs">
            Occ: {formatPercent(property.metrics.currentOccupancyPercent)} |
            ADR:{" "}
            {formatInr(
              property.roomTypes.reduce(
                (sum, rt) => sum + rt.baseRatePaise,
                0,
              ) / Math.max(property.roomTypes.length, 1),
            )}
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <Link
              to="/properties/$propertyId"
              params={{ propertyId: property.id }}
              className="inline-flex items-center gap-1 font-medium text-foreground text-xs hover:underline"
            >
              Manage
              <ArrowRightIcon className="size-3.5" />
            </Link>
            <Link
              to="/book/$slug/$propertySlug"
              params={{
                slug: tenantSlug ?? "",
                propertySlug: propertySlug ?? "",
              }}
              target="_blank"
              className="inline-flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground hover:underline"
            >
              Booking Page
              <ExternalLinkIcon className="size-3" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
