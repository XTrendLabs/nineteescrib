import { Button } from "@propertyos/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { Skeleton } from "@propertyos/ui/components/skeleton";
import { PencilIcon } from "lucide-react";
import { useState } from "react";

import { useAmenities } from "@/features/rooms/api/use-amenities";
import { getAmenityIcon } from "@/features/rooms/lib/amenity-icons";
import type { Property } from "../../lib/property";
import { formatTime12Hour } from "../../lib/property";
import { DetailField } from "../detail-field";
import { PoliciesDialog } from "../policies-dialog";
import { PropertyRulesCard } from "../property-rules-card";

function AmenitiesCard() {
  const { data: response, isLoading } = useAmenities();
  const amenities = response?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Amenities</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-muted-foreground text-xs">
          Amenities are a shared platform catalog — pick from these when adding
          or editing a room.
        </p>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {amenities.map((amenity) => {
              const Icon = getAmenityIcon(amenity.icon);
              return (
                <div
                  key={amenity.id}
                  className="flex items-center gap-2 border p-2 text-xs"
                >
                  <Icon className="size-3.5 text-muted-foreground" />
                  {amenity.name}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PoliciesTab({ property }: { property: Property }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Check-in & Stay Limits</CardTitle>
          <CardAction>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogOpen(true)}
            >
              <PencilIcon />
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField
              label="Check-in Time"
              value={
                property.checkInTime
                  ? formatTime12Hour(property.checkInTime)
                  : null
              }
            />
            <DetailField
              label="Check-out Time"
              value={
                property.checkOutTime
                  ? formatTime12Hour(property.checkOutTime)
                  : null
              }
            />
            <DetailField
              label="Stay Limits"
              value={
                property.minStayNights || property.maxStayNights
                  ? `${property.minStayNights ?? "—"} to ${
                      property.maxStayNights ?? "—"
                    } nights`
                  : null
              }
            />
          </div>
        </CardContent>
      </Card>

      <PropertyRulesCard propertyId={property.id} />

      <AmenitiesCard />

      <PoliciesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        property={property}
      />
    </div>
  );
}
