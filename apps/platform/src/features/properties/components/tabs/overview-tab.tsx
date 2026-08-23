import { Button } from "@propertyos/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { Input } from "@propertyos/ui/components/input";
import { Label } from "@propertyos/ui/components/label";
import { PhoneInput } from "@propertyos/ui/components/phone-input";
import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

import { formatInr, formatPercent } from "../../lib/format";
import type { BusinessDetails, PropertyDetail } from "../../lib/mock-data";
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      {children}
    </div>
  );
}

export function OverviewTab({ property }: { property: PropertyDetail }) {
  const cover =
    property.propertyGallery.find((img) => img.isCover) ??
    property.propertyGallery[0];

  const [address, setAddress] = useState({
    addressLine1: property.addressLine1,
    city: property.city,
    state: property.state,
    country: property.country,
    pinCode: property.pinCode,
  });
  const [business, setBusiness] = useState<BusinessDetails>(property.business);

  function updateBusiness<K extends keyof BusinessDetails>(
    key: K,
    value: BusinessDetails[K],
  ) {
    setBusiness((prev) => ({ ...prev, [key]: value }));
  }

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
                <span className="text-muted-foreground">Owner: </span>
                {business.ownerName}
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

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm">Business Details</p>
          <Button
            size="sm"
            onClick={() =>
              toast.success("Business details saved", {
                description: `Details updated for ${property.name}.`,
              })
            }
          >
            Save Changes
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col gap-4 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Address Line 1">
                <Input
                  value={address.addressLine1}
                  onChange={(e) =>
                    setAddress({ ...address, addressLine1: e.target.value })
                  }
                />
              </Field>
              <Field label="Owner Name">
                <Input
                  value={business.ownerName}
                  onChange={(e) => updateBusiness("ownerName", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="City">
                <Input
                  value={address.city}
                  onChange={(e) =>
                    setAddress({ ...address, city: e.target.value })
                  }
                />
              </Field>
              <Field label="State">
                <Input
                  value={address.state}
                  onChange={(e) =>
                    setAddress({ ...address, state: e.target.value })
                  }
                />
              </Field>
              <Field label="Country">
                <Input
                  value={address.country}
                  onChange={(e) =>
                    setAddress({ ...address, country: e.target.value })
                  }
                />
              </Field>
              <Field label="PIN Code">
                <Input
                  value={address.pinCode}
                  onChange={(e) =>
                    setAddress({ ...address, pinCode: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <PhoneInput
                  value={business.phone}
                  onChange={(phone) => updateBusiness("phone", phone)}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={business.email}
                  onChange={(e) => updateBusiness("email", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Operations Start Time">
                <Input
                  type="time"
                  value={business.operationsStartTime}
                  onChange={(e) =>
                    updateBusiness("operationsStartTime", e.target.value)
                  }
                />
              </Field>
              <Field label="Operations End Time">
                <Input
                  type="time"
                  value={business.operationsEndTime}
                  onChange={(e) =>
                    updateBusiness("operationsEndTime", e.target.value)
                  }
                />
              </Field>
              <Field label="WhatsApp Number">
                <PhoneInput
                  value={business.whatsappNumber}
                  onChange={(phone) => updateBusiness("whatsappNumber", phone)}
                />
              </Field>
            </div>
          </CardContent>
        </Card>
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
