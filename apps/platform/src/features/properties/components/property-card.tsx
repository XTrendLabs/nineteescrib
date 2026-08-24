import { Card, CardContent, CardHeader } from "@propertyos/ui/components/card";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, ExternalLinkIcon, MapPinIcon } from "lucide-react";
import { motion } from "motion/react";
import type { PropertyListItem } from "../lib/property";
import {
  normalizePropertyStatus,
  normalizePropertyType,
} from "../lib/property";
import { StatusBadge } from "./status-badge";
import { TypeBadge } from "./type-badge";

export function PropertyCard({
  property,
  index,
}: {
  property: PropertyListItem;
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
      <Card className="h-full gap-3">
        <CardHeader>
          <p className="text-display-sm leading-tight">{property.name}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeBadge type={normalizePropertyType(property.propertyType)} />
            <StatusBadge status={normalizePropertyStatus(property.status)} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pb-4">
          {property.city && (
            <p className="flex items-center gap-1 text-muted-foreground text-xs">
              <MapPinIcon className="size-3.5" />
              {property.city}
            </p>
          )}
          <div className="mt-1 flex items-center justify-between gap-2">
            <Link
              to="/properties/$propertySlug"
              params={{ propertySlug: property.slug }}
              className="inline-flex items-center gap-1 font-medium text-foreground text-xs hover:underline"
            >
              Manage
              <ArrowRightIcon className="size-3.5" />
            </Link>
            <Link
              to="/book/$slug/$propertySlug"
              params={{
                slug: "sunrise-retreats",
                propertySlug: property.slug,
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
