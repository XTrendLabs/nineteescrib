import { formatDate, formatInrFromPaise } from "../lib/format";
import type { Invoice } from "../lib/mock-data";
import { InvoiceRowActions } from "./invoice-row-actions";
import { InvoiceStatusPill } from "./status-pill";

export function InvoicesTable({
  invoices,
  onView,
  onRecordPayment,
  onSendReminder,
  onCopyLink,
  onDownloadPdf,
}: {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onSendReminder: (invoice: Invoice) => void;
  onCopyLink: (invoice: Invoice) => void;
  onDownloadPdf: (invoice: Invoice) => void;
}) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 border py-16 text-center">
        <p className="text-sm">No invoices match your filters</p>
        <p className="text-muted-foreground text-xs">
          Try adjusting search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border">
      <table className="w-full min-w-[860px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b bg-muted/40 text-muted-foreground">
            <th className="whitespace-nowrap px-3 py-2 font-medium">
              Inv ID / Date
            </th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Guest</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">
              Booking / Property
            </th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Status</th>
            <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
              Total
            </th>
            <th className="whitespace-nowrap px-3 py-2 text-right font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr
              key={invoice.id}
              className="border-b last:border-b-0 hover:bg-muted/30"
            >
              <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => onView(invoice)}
                    className="w-fit text-left font-medium hover:underline"
                  >
                    {invoice.invoiceNumber}
                  </button>
                  <span className="text-muted-foreground">
                    {formatDate(invoice.issueDate)}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5 align-middle">
                <div className="flex flex-col">
                  <span className="font-medium">{invoice.guestName}</span>
                  <span className="text-muted-foreground">
                    {invoice.guestEmail ?? invoice.guestPhone}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                <div className="flex flex-col">
                  {invoice.bookingRef && (
                    <span className="font-medium">{invoice.bookingRef}</span>
                  )}
                  <span className="text-muted-foreground">
                    {invoice.propertyName}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5 align-middle">
                <InvoiceStatusPill invoice={invoice} />
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right align-middle font-medium">
                {formatInrFromPaise(invoice.totalPaise)}
              </td>
              <td className="px-3 py-2.5 text-right align-middle">
                <InvoiceRowActions
                  invoice={invoice}
                  onView={onView}
                  onRecordPayment={onRecordPayment}
                  onSendReminder={onSendReminder}
                  onCopyLink={onCopyLink}
                  onDownloadPdf={onDownloadPdf}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
