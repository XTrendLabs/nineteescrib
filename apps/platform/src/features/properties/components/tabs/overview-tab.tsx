import { Button } from "@propertyos/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { format } from "date-fns";
import {
  BriefcaseIcon,
  Building2Icon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PencilIcon,
  ReceiptIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";

import { useCachedActiveOrganization } from "@/features/auth/api/use-cached-organizations";
import { useCachedSession } from "@/features/auth/api/use-cached-session";
import type { Property } from "../../lib/property";
import { formatTime12Hour } from "../../lib/property";
import { BusinessDetailsDialog } from "../business-details-dialog";
import { DetailField } from "../detail-field";
import { EmptyTabState } from "../empty-tab-state";
import { PropertyDetailsDialog } from "../property-details-dialog";
import { StatCard } from "../stat-card";
import { TaxDetailsDialog } from "../tax-details-dialog";

export function OverviewTab({ property }: { property: Property }) {
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [businessDialogOpen, setBusinessDialogOpen] = useState(false);
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const { data: session } = useCachedSession();
  const { data: activeOrganization } = useCachedActiveOrganization();
  const hasAddress = Boolean(property.addressLine1 || property.city);
  const hasBusinessDetails = Boolean(
    property.ownerName ||
      property.contactPhone ||
      property.contactEmail ||
      property.whatsappNumber ||
      property.operationsOpenTime,
  );
  const hasTaxDetails = Boolean(
    property.gstNumber ||
      property.panNumber ||
      property.invoicePrefix ||
      property.billingAddress ||
      property.bankAccountNumber,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex h-56 w-full items-center justify-center bg-muted">
          <Building2Icon className="size-10 text-muted-foreground" />
        </div>
        <Card className="h-full">
          <CardHeader>
            <CardAction>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPropertyDialogOpen(true)}
              >
                <PencilIcon />
                Edit
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex h-full flex-col gap-3">
            <p className="text-display-sm">{property.name}</p>
            <div className="mt-2 flex flex-col gap-2">
              <DetailField
                label="Address"
                value={
                  hasAddress
                    ? [
                        property.addressLine1,
                        property.city,
                        property.state,
                        property.country,
                      ]
                        .filter(Boolean)
                        .join(", ")
                    : undefined
                }
              />
              <DetailField label="Slug" value={property.slug} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={UserIcon}
          label="Owner"
          value={property.ownerName || "Not set"}
        />
        <button
          type="button"
          className="text-left"
          onClick={() => setPropertyDialogOpen(true)}
        >
          <StatCard
            icon={MapPinIcon}
            label="Location"
            value={property.city || "Not set"}
          />
        </button>
        <button
          type="button"
          className="text-left"
          onClick={() => setBusinessDialogOpen(true)}
        >
          <StatCard
            icon={ClockIcon}
            label="Hours"
            value={
              property.operationsOpenTime && property.operationsCloseTime
                ? `${formatTime12Hour(property.operationsOpenTime)} – ${formatTime12Hour(property.operationsCloseTime)}`
                : "Not set"
            }
          />
        </button>
        <StatCard
          icon={CalendarIcon}
          label="Added"
          value={format(new Date(property.createdAt), "MMM d, yyyy")}
        />
      </div>

      {hasBusinessDetails ? (
        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
            <CardAction>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBusinessDialogOpen(true)}
              >
                <PencilIcon />
                Edit
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="Owner" value={property.ownerName} />
              <DetailField label="Phone" value={property.contactPhone} />
              <DetailField label="Email" value={property.contactEmail} />
              <DetailField label="WhatsApp" value={property.whatsappNumber} />
              <DetailField
                label="Hours"
                value={
                  property.operationsOpenTime && property.operationsCloseTime
                    ? `${formatTime12Hour(property.operationsOpenTime)} – ${formatTime12Hour(property.operationsCloseTime)}`
                    : undefined
                }
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyTabState
          icon={BriefcaseIcon}
          title="Business details not added yet"
          description="Add the owner, contact info, operations hours, and WhatsApp number for this property."
          actionLabel="Add Business Details"
          onAction={() => setBusinessDialogOpen(true)}
        />
      )}

      {hasTaxDetails ? (
        <Card>
          <CardHeader>
            <CardTitle>Taxes & Billing</CardTitle>
            <CardAction>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTaxDialogOpen(true)}
              >
                <PencilIcon />
                Edit
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 border-b py-2 text-xs first:pt-0 last:border-b-0">
              <span className="text-muted-foreground">GST Number</span>
              <span>{property.gstNumber || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b py-2 text-xs">
              <span className="text-muted-foreground">PAN Number</span>
              <span>{property.panNumber || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b py-2 text-xs">
              <span className="text-muted-foreground">Invoice Prefix</span>
              <span>{property.invoicePrefix || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b py-2 text-xs">
              <span className="text-muted-foreground">Billing Address</span>
              <span className="truncate">{property.billingAddress || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b py-2 text-xs">
              <span className="text-muted-foreground">Bank Name</span>
              <span>{property.bankName || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b py-2 text-xs">
              <span className="text-muted-foreground">Account Holder</span>
              <span>{property.bankAccountHolderName || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b py-2 text-xs">
              <span className="text-muted-foreground">Account Number</span>
              <span>{property.bankAccountNumber || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2 text-xs">
              <span className="text-muted-foreground">IFSC Code</span>
              <span>{property.bankIfscCode || "—"}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyTabState
          icon={ReceiptIcon}
          title="Tax & billing details not added yet"
          description="Add GST, PAN, invoicing, and payout bank details for this property."
          actionLabel="Add Tax Details"
          onAction={() => setTaxDialogOpen(true)}
        />
      )}

      <PropertyDetailsDialog
        open={propertyDialogOpen}
        onOpenChange={setPropertyDialogOpen}
        property={property}
      />
      <BusinessDetailsDialog
        open={businessDialogOpen}
        onOpenChange={setBusinessDialogOpen}
        property={property}
        defaultOwnerName={session?.user.name}
        defaultContactPhone={activeOrganization?.phoneNumber}
      />
      <TaxDetailsDialog
        open={taxDialogOpen}
        onOpenChange={setTaxDialogOpen}
        property={property}
      />
    </div>
  );
}
