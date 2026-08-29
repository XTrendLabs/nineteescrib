import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { DataTableContainer } from "@propertyos/ui/components/data-table";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { CreditCardIcon, DownloadIcon } from "lucide-react";
import {
  type Invoice,
  MOCK_INVOICES,
  MOCK_PAYMENT_METHOD,
} from "@/features/settings/lib/mock-data";

const STATUS_VARIANT: Record<
  Invoice["status"],
  "success" | "destructive" | "warning"
> = {
  Paid: "success",
  Failed: "destructive",
  Pending: "warning",
};

export function BillingInvoicesSection() {
  const feedback = useFeedback();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-medium text-sm">Billing Invoices</h2>
        <p className="text-muted-foreground text-xs">
          Your platform subscription payment method and invoice history.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Payment Method
        </h3>
        <Card>
          <CardContent className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs">
              <CreditCardIcon className="size-4 text-muted-foreground" />
              {MOCK_PAYMENT_METHOD.brand} ending in {MOCK_PAYMENT_METHOD.last4}{" "}
              | Exp: {MOCK_PAYMENT_METHOD.expiry}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                feedback.success(
                  "Redirecting",
                  "Opening secure card update form.",
                )
              }
            >
              Update Card
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Invoice History
        </h3>
        <DataTableContainer className="sm:[--content-inset:17.5rem]">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Invoice</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_INVOICES.map((invoice) => (
                <tr key={invoice.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-medium">{invoice.id}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {invoice.date}
                  </td>
                  <td className="px-3 py-2">{invoice.amount}</td>
                  <td className="px-3 py-2">
                    <Badge variant={STATUS_VARIANT[invoice.status]}>
                      {invoice.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        feedback.success(
                          "Downloading",
                          `${invoice.id} PDF is being prepared.`,
                        )
                      }
                    >
                      <DownloadIcon />
                      Download PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableContainer>
      </section>
    </div>
  );
}
