import { Button } from "@propertyos/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { PencilIcon, ReceiptIcon } from "lucide-react";
import { useState } from "react";

import type { Property } from "../../lib/property";
import { DetailField } from "../detail-field";
import { EmptyTabState } from "../empty-tab-state";
import { TaxDetailsDialog } from "../tax-details-dialog";

export function TaxesBillingTab({ property }: { property: Property }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasTaxDetails = Boolean(
    property.gstNumber ||
      property.panNumber ||
      property.invoicePrefix ||
      property.billingAddress ||
      property.bankAccountNumber,
  );

  return (
    <div className="flex flex-col gap-6">
      {hasTaxDetails ? (
        <Card>
          <CardHeader>
            <CardTitle>Taxes & Billing</CardTitle>
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
              <DetailField label="GST Number" value={property.gstNumber} />
              <DetailField label="PAN Number" value={property.panNumber} />
              <DetailField
                label="Invoice Prefix"
                value={property.invoicePrefix}
              />
              <DetailField
                label="Billing Address"
                value={property.billingAddress}
              />
              <DetailField label="Bank Name" value={property.bankName} />
              <DetailField
                label="Account Holder"
                value={property.bankAccountHolderName}
              />
              <DetailField
                label="Account Number"
                value={property.bankAccountNumber}
              />
              <DetailField label="IFSC Code" value={property.bankIfscCode} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyTabState
          icon={ReceiptIcon}
          title="Tax & billing details not added yet"
          description="Add GST, PAN, invoicing, and payout bank details for this property."
          actionLabel="Add Tax Details"
          onAction={() => setDialogOpen(true)}
        />
      )}

      <TaxDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        property={property}
      />
    </div>
  );
}
