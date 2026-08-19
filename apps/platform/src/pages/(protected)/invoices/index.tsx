import { Button } from "@propertyos/ui/components/button";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, isAfter, isBefore, startOfMonth } from "date-fns";
import { PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { TablePagination } from "@/features/bookings/components/table-pagination";
import {
  CreateInvoiceDialog,
  type CreateInvoiceForm,
} from "@/features/invoices/components/create-invoice-dialog";
import {
  DEFAULT_INVOICE_FILTERS,
  FilterToolbar,
} from "@/features/invoices/components/filter-toolbar";
import { InvoiceDetailsDrawer } from "@/features/invoices/components/invoice-details-drawer";
import { InvoicesTable } from "@/features/invoices/components/invoices-table";
import { RecordPaymentDialog } from "@/features/invoices/components/record-payment-dialog";
import { SendReminderDialog } from "@/features/invoices/components/send-reminder-dialog";
import { SummaryBand } from "@/features/invoices/components/summary-band";
import {
  buildInvoices,
  type Invoice,
  type LineItemType,
  MOCK_PROPERTIES,
} from "@/features/invoices/lib/mock-data";

export const Route = createFileRoute("/(protected)/invoices/")({
  component: RouteComponent,
});

const TODAY = new Date("2026-08-19T00:00:00");

function RouteComponent() {
  const feedback = useFeedback();
  const [invoices, setInvoices] = useState<Invoice[]>(() => buildInvoices());
  const [filters, setFilters] = useState(DEFAULT_INVOICE_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailsInvoice, setDetailsInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null);

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      if (
        filters.propertyId !== "all" &&
        invoice.propertyId !== filters.propertyId
      ) {
        return false;
      }
      if (filters.status !== "all" && invoice.status !== filters.status) {
        return false;
      }
      if (filters.dateRange !== "all") {
        const cutoff =
          filters.dateRange === "last_7"
            ? addDays(TODAY, -7)
            : filters.dateRange === "last_30"
              ? addDays(TODAY, -30)
              : startOfMonth(TODAY);
        if (
          isBefore(invoice.issueDate, cutoff) ||
          isAfter(invoice.issueDate, TODAY)
        ) {
          return false;
        }
      }
      if (
        search &&
        !invoice.invoiceNumber.toLowerCase().includes(search) &&
        !invoice.guestName.toLowerCase().includes(search) &&
        !invoice.guestPhone.includes(search)
      ) {
        return false;
      }
      return true;
    });
  }, [invoices, filters]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const summary = useMemo(() => {
    const totalInvoicedPaise = invoices.reduce(
      (sum, inv) => sum + inv.totalPaise,
      0,
    );
    const totalCollectedPaise = invoices.reduce(
      (sum, inv) => sum + inv.amountPaidPaise,
      0,
    );
    const pendingBalancePaise = totalInvoicedPaise - totalCollectedPaise;
    const overdueCount = invoices.filter(
      (inv) => inv.status === "overdue",
    ).length;
    return {
      totalInvoicedPaise,
      totalCollectedPaise,
      pendingBalancePaise,
      overdueCount,
    };
  }, [invoices]);

  function updateInvoice(id: string, updater: (invoice: Invoice) => Invoice) {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? updater(inv) : inv)),
    );
    setDetailsInvoice((prev) =>
      prev && prev.id === id ? updater(prev) : prev,
    );
  }

  function handleCopyLink(invoice: Invoice) {
    const url = `https://book.propertyos.in/inv/${invoice.publicToken}`;
    navigator.clipboard?.writeText(url);
    feedback.success("Pay link copied", url);
  }

  function handleDownloadPdf(invoice: Invoice) {
    feedback.success(
      "PDF downloaded",
      `${invoice.invoiceNumber} receipt has been generated.`,
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="flex flex-col gap-6 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display-md">Guest Invoices</h1>
          <p className="text-muted-foreground text-sm">
            Itemized billing, partial payment tracking, and payment reminders
            for every guest stay.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          Create Invoice
        </Button>
      </div>

      <SummaryBand
        totalInvoicedPaise={summary.totalInvoicedPaise}
        totalCollectedPaise={summary.totalCollectedPaise}
        pendingBalancePaise={summary.pendingBalancePaise}
        overdueCount={summary.overdueCount}
      />

      <div className="flex flex-col gap-4">
        <FilterToolbar
          filters={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
        />
        <InvoicesTable
          invoices={paginated}
          onView={setDetailsInvoice}
          onRecordPayment={setPaymentInvoice}
          onSendReminder={setReminderInvoice}
          onCopyLink={handleCopyLink}
          onDownloadPdf={handleDownloadPdf}
        />
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>

      <CreateInvoiceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={(form: CreateInvoiceForm) => {
          const property = MOCK_PROPERTIES.find(
            (p) => p.id === form.propertyId,
          );
          const items = form.items.map((item, idx) => ({
            id: `invoice-new-${Date.now()}-item-${idx}`,
            description: item.description,
            quantity: 1,
            unitPricePaise: item.amountPaise,
            totalPaise: item.amountPaise,
            taxRateBps: form.taxRateBps,
            itemType: item.itemType,
          }));
          const subtotalPaise = items.reduce(
            (sum, item) => sum + item.totalPaise,
            0,
          );
          const taxPaise = Math.round(
            (subtotalPaise * form.taxRateBps) / 10000,
          );
          const totalPaise = subtotalPaise + taxPaise;

          const newInvoice: Invoice = {
            id: `invoice-new-${Date.now()}`,
            invoiceNumber: `INV-2026-${String(invoices.length + 1).padStart(4, "0")}`,
            propertyId: form.propertyId,
            propertyName: property?.name ?? "Unknown Property",
            bookingRef: form.bookingRef || undefined,
            guestName: form.guestName,
            guestEmail: form.guestEmail || undefined,
            guestPhone: form.guestPhone,
            guestGstin: form.guestGstin || undefined,
            companyName: form.companyName || undefined,
            status: "draft",
            issueDate: TODAY,
            dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
            items,
            subtotalPaise,
            discountPaise: 0,
            taxPaise,
            totalPaise,
            amountPaidPaise: 0,
            payments: [],
            reminders: [],
            publicToken: `sec_invoice-new-${Date.now()}`,
          };
          setInvoices((prev) => [newInvoice, ...prev]);
        }}
      />

      <InvoiceDetailsDrawer
        invoice={detailsInvoice}
        onOpenChange={(open) => !open && setDetailsInvoice(null)}
        onAddLineItem={(invoice, item) => {
          updateInvoice(invoice.id, (inv) => {
            const newItem = {
              id: `${inv.id}-item-${inv.items.length + 1}`,
              description: item.description,
              quantity: 1,
              unitPricePaise: item.amount,
              totalPaise: item.amount,
              taxRateBps: inv.items[0]?.taxRateBps ?? 0,
              itemType: item.itemType as LineItemType,
            };
            const items = [...inv.items, newItem];
            const subtotalPaise = items.reduce(
              (sum, i) => sum + i.totalPaise,
              0,
            );
            const taxPaise = Math.round(
              (subtotalPaise * newItem.taxRateBps) / 10000,
            );
            const totalPaise = subtotalPaise - inv.discountPaise + taxPaise;
            return {
              ...inv,
              items,
              subtotalPaise,
              taxPaise,
              totalPaise,
            };
          });
        }}
        onRecordPayment={(invoice) => {
          setDetailsInvoice(null);
          setPaymentInvoice(invoice);
        }}
        onSendReminder={(invoice) => {
          setDetailsInvoice(null);
          setReminderInvoice(invoice);
        }}
        onCopyLink={handleCopyLink}
        onDownloadPdf={handleDownloadPdf}
      />

      <RecordPaymentDialog
        invoice={paymentInvoice}
        onOpenChange={(open) => !open && setPaymentInvoice(null)}
        onSave={(invoice, payment) => {
          updateInvoice(invoice.id, (inv) => {
            const amountPaidPaise = inv.amountPaidPaise + payment.amountPaise;
            return {
              ...inv,
              amountPaidPaise,
              status: amountPaidPaise >= inv.totalPaise ? "paid" : "partial",
              payments: [
                ...inv.payments,
                {
                  id: `${inv.id}-pay-${inv.payments.length + 1}`,
                  amountPaise: payment.amountPaise,
                  method: payment.method,
                  date: TODAY,
                  transactionId: payment.transactionId,
                  recordedBy: "You",
                },
              ],
            };
          });
        }}
      />

      <SendReminderDialog
        invoice={reminderInvoice}
        onOpenChange={(open) => !open && setReminderInvoice(null)}
        onSend={(invoice, channel) => {
          updateInvoice(invoice.id, (inv) => ({
            ...inv,
            reminders: [
              ...inv.reminders,
              {
                id: `${inv.id}-reminder-${inv.reminders.length + 1}`,
                channel,
                recipient:
                  channel === "email" ? (inv.guestEmail ?? "") : inv.guestPhone,
                status: "sent",
                sentAt: TODAY,
                sentBy: "You",
              },
            ],
          }));
        }}
      />
    </motion.div>
  );
}
