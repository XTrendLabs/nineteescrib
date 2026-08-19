import { Button } from "@propertyos/ui/components/button";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { createFileRoute } from "@tanstack/react-router";
import { DownloadIcon, ShieldCheckIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { ItemTypeBadge } from "@/features/invoices/components/item-type-badge";
import {
  formatDate,
  formatInrFromPaise,
  formatTaxRate,
} from "@/features/invoices/lib/format";
import { buildInvoices } from "@/features/invoices/lib/mock-data";

export const Route = createFileRoute("/pay/$publicToken")({
  component: RouteComponent,
});

function RouteComponent() {
  const { publicToken } = Route.useParams();
  const feedback = useFeedback();
  const invoices = useMemo(() => buildInvoices(), []);
  const invoice = invoices.find((inv) => inv.publicToken === publicToken);
  const [paid, setPaid] = useState(false);

  if (!invoice) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm">This payment link is invalid or expired.</p>
      </div>
    );
  }

  const balancePaise = paid ? 0 : invoice.totalPaise - invoice.amountPaidPaise;
  const amountPaidPaise = paid ? invoice.totalPaise : invoice.amountPaidPaise;

  return (
    <div className="flex min-h-svh justify-center bg-muted/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="flex w-full max-w-md flex-col gap-6 border bg-background p-5"
      >
        <div>
          <h1 className="font-medium text-base">{invoice.propertyName}</h1>
          <p className="text-muted-foreground text-xs">
            Invoice #{invoice.invoiceNumber}
          </p>
        </div>

        <div className="flex flex-col gap-1 border-t pt-4">
          <p className="font-medium text-xs">Guest Details</p>
          <p className="text-muted-foreground text-xs">
            {invoice.guestName}
            {invoice.guestEmail ? ` · ${invoice.guestEmail}` : ""} ·{" "}
            {invoice.guestPhone}
          </p>
          {invoice.checkIn && invoice.checkOut && (
            <p className="text-muted-foreground text-xs">
              Stay Dates: {formatDate(invoice.checkIn)} –{" "}
              {formatDate(invoice.checkOut)}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t pt-4">
          <p className="font-medium text-xs">Itemized Bill</p>
          {invoice.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <ItemTypeBadge itemType={item.itemType} />
                <span>
                  {item.description}
                  {item.quantity > 1 && ` × ${item.quantity}`}
                </span>
              </div>
              <span className="font-medium">
                {formatInrFromPaise(item.totalPaise)}
              </span>
            </div>
          ))}
          <div className="flex flex-col gap-1 border-t pt-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatInrFromPaise(invoice.subtotalPaise)}</span>
            </div>
            {invoice.discountPaise > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatInrFromPaise(invoice.discountPaise)}</span>
              </div>
            )}
            {invoice.taxPaise > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  GST ({formatTaxRate(invoice.items[0]?.taxRateBps ?? 0)})
                </span>
                <span>{formatInrFromPaise(invoice.taxPaise)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1 font-medium text-sm">
              <span>Total Invoice Amount</span>
              <span>{formatInrFromPaise(invoice.totalPaise)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 border-t pt-4 text-xs">
          <p className="font-medium text-xs">Payment Status</p>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Paid</span>
            <span>{formatInrFromPaise(amountPaidPaise)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Outstanding Balance</span>
            <span>{formatInrFromPaise(balancePaise)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t pt-4">
          {balancePaise > 0 ? (
            <Button
              onClick={() => {
                setPaid(true);
                feedback.success(
                  "Payment successful",
                  `${formatInrFromPaise(balancePaise)} paid for ${invoice.invoiceNumber}.`,
                );
              }}
            >
              Pay Outstanding Balance {formatInrFromPaise(balancePaise)}
            </Button>
          ) : (
            <p className="text-center text-success text-xs">
              This invoice has been paid in full.
            </p>
          )}
          <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheckIcon className="size-3" />
            Secured by Razorpay / UPI / Credit Card
          </p>

          <Button
            variant="outline"
            onClick={() =>
              feedback.success(
                "Receipt downloaded",
                "Your PDF receipt has been generated.",
              )
            }
          >
            <DownloadIcon />
            Download PDF Receipt
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
