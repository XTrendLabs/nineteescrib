import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { Checkbox } from "@propertyos/ui/components/checkbox";
import { Input } from "@propertyos/ui/components/input";
import { cn } from "@propertyos/ui/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

import type { Billing, PropertyDetail } from "../../lib/mock-data";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      {children}
    </div>
  );
}

export function TaxesBillingTab({ property }: { property: PropertyDetail }) {
  const [billing, setBilling] = useState<Billing>(property.billing);

  function update<K extends keyof Billing>(key: K, value: Billing[K]) {
    setBilling((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">Tax Configuration</p>
        <Button
          size="sm"
          onClick={() =>
            toast.success("Billing settings saved", {
              description: `Tax and billing settings updated for ${property.name}.`,
            })
          }
        >
          Save Changes
        </Button>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
          <Field label="Tax Rate (%)">
            <Input
              type="number"
              value={billing.taxRateBps / 100}
              onChange={(e) =>
                update("taxRateBps", Math.round(Number(e.target.value) * 100))
              }
            />
          </Field>
          <Field label="Tax Type">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(billing.taxType === "exclusive" && "bg-muted")}
                onClick={() => update("taxType", "exclusive")}
              >
                Exclusive
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(billing.taxType === "inclusive" && "bg-muted")}
                onClick={() => update("taxType", "inclusive")}
              >
                Inclusive
              </Button>
            </div>
          </Field>
          <Field label="Tax Label">
            <Input
              value={billing.taxLabel}
              onChange={(e) => update("taxLabel", e.target.value)}
            />
          </Field>
          <Field label="GSTIN (optional)">
            <Input
              value={billing.gstin}
              onChange={(e) => update("gstin", e.target.value)}
              placeholder="22AAAAA0000A1Z5"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <p className="font-medium text-sm">Payment Gateway</p>
        <Card>
          <CardContent className="flex flex-col gap-3 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Badge
                  variant={billing.razorpayConnected ? "success" : "muted"}
                >
                  {billing.razorpayConnected
                    ? "● Connected"
                    : "○ Not Connected"}
                </Badge>
                <span>
                  Razorpay
                  {billing.razorpayConnected ? " (Key: rzp_live_xxxx...)" : ""}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  update("razorpayConnected", !billing.razorpayConnected)
                }
              >
                {billing.razorpayConnected ? "Disconnect" : "Connect"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant={billing.stripeConnected ? "success" : "muted"}>
                  {billing.stripeConnected ? "● Connected" : "○ Not Connected"}
                </Badge>
                <span>Stripe</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  update("stripeConnected", !billing.stripeConnected)
                }
              >
                {billing.stripeConnected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-medium text-sm">Invoice Settings</p>
        <Card>
          <CardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
            <Field label="Business Name">
              <Input
                value={billing.businessName}
                onChange={(e) => update("businessName", e.target.value)}
              />
            </Field>
            <Field label="Business Address">
              <Input
                value={billing.businessAddress}
                onChange={(e) => update("businessAddress", e.target.value)}
              />
            </Field>
            <Field label="Invoice Prefix">
              <Input
                value={billing.invoicePrefix}
                onChange={(e) => update("invoicePrefix", e.target.value)}
              />
            </Field>
            <button
              type="button"
              onClick={() => update("invoiceAuto", !billing.invoiceAuto)}
              className="flex w-fit items-center gap-2 self-end text-left text-xs"
            >
              <Checkbox checked={billing.invoiceAuto} tabIndex={-1} />
              Auto-generate on booking confirmation
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
