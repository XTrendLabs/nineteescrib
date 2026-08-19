import { Card, CardContent } from "@propertyos/ui/components/card";
import { Link } from "@tanstack/react-router";
import { MailIcon, PhoneIcon } from "lucide-react";
import { formatInrFromPaise } from "../lib/format";
import type { Vendor } from "../lib/mock-data";
import { CategoryBadge } from "./category-badge";

export function VendorCard({
  vendor,
  totalPaidPaise,
  totalPendingPaise,
  activeExpenseCount,
}: {
  vendor: Vendor;
  totalPaidPaise: number;
  totalPendingPaise: number;
  activeExpenseCount: number;
}) {
  return (
    <Link to="/expenses/vendors/$vendorId" params={{ vendorId: vendor.id }}>
      <Card className="p-4 transition-colors hover:bg-muted/30">
        <CardContent className="flex flex-col gap-3 px-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{vendor.name}</p>
              {vendor.contactPerson && (
                <p className="text-muted-foreground text-xs">
                  {vendor.contactPerson}
                </p>
              )}
            </div>
            <CategoryBadge category={vendor.category} />
          </div>

          <div className="flex flex-col gap-1 text-muted-foreground text-xs">
            {vendor.phone && (
              <span className="flex items-center gap-1.5">
                <PhoneIcon className="size-3" />
                {vendor.phone}
              </span>
            )}
            {vendor.email && (
              <span className="flex items-center gap-1.5">
                <MailIcon className="size-3" />
                {vendor.email}
              </span>
            )}
            {vendor.gstin && <span>GSTIN: {vendor.gstin}</span>}
          </div>

          <div className="grid grid-cols-3 gap-3 border-t pt-3 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">Paid</span>
              <span className="font-medium">
                {formatInrFromPaise(totalPaidPaise)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-medium">
                {formatInrFromPaise(totalPendingPaise)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">Active</span>
              <span className="font-medium">{activeExpenseCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
