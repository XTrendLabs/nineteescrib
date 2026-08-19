import { Button } from "@propertyos/ui/components/button";
import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@propertyos/ui/components/sheet";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import {
  DownloadIcon,
  LinkIcon,
  MessageCircleIcon,
  PlusIcon,
  WalletIcon,
} from "lucide-react";
import { useState } from "react";
import {
  formatDate,
  formatDateTime,
  formatInrFromPaise,
  formatTaxRate,
} from "../lib/format";
import {
  type Invoice,
  ITEM_TYPE_LABELS,
  type LineItemType,
  PAYMENT_METHOD_LABELS,
  REMINDER_CHANNEL_LABELS,
} from "../lib/mock-data";
import { ItemTypeBadge } from "./item-type-badge";
import { InvoiceStatusPill } from "./status-pill";

const ITEM_TYPE_OPTIONS: LineItemType[] = [
  "room",
  "addon",
  "fnb",
  "service",
  "fee",
  "discount",
];

export function InvoiceDetailsDrawer({
  invoice,
  onOpenChange,
  onAddLineItem,
  onRecordPayment,
  onSendReminder,
  onCopyLink,
  onDownloadPdf,
}: {
  invoice: Invoice | null;
  onOpenChange: (open: boolean) => void;
  onAddLineItem: (
    invoice: Invoice,
    item: { description: string; amount: number; itemType: LineItemType },
  ) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onSendReminder: (invoice: Invoice) => void;
  onCopyLink: (invoice: Invoice) => void;
  onDownloadPdf: (invoice: Invoice) => void;
}) {
  const feedback = useFeedback();
  const [addingItem, setAddingItem] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [itemType, setItemType] = useState<LineItemType>("addon");

  function resetAddItem() {
    setAddingItem(false);
    setDescription("");
    setAmount("");
    setItemType("addon");
  }

  const canCollect =
    invoice !== null &&
    invoice.status !== "paid" &&
    invoice.status !== "cancelled";

  return (
    <Sheet
      open={invoice !== null}
      onOpenChange={(open) => {
        if (!open) {
          resetAddItem();
        }
        onOpenChange(open);
      }}
    >
      <SheetContent className="flex flex-col gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{invoice?.invoiceNumber ?? "Invoice"}</SheetTitle>
        </SheetHeader>

        {invoice && (
          <div className="flex flex-col gap-6 px-4 pb-6">
            <div className="flex flex-col gap-3 border-b pb-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <InvoiceStatusPill invoice={invoice} />
                <span className="text-[11px] text-muted-foreground">
                  Issued {formatDate(invoice.issueDate)}
                  {invoice.dueDate && ` · Due ${formatDate(invoice.dueDate)}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Guest</span>
                  <span className="font-medium">{invoice.guestName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{invoice.guestPhone}</span>
                </div>
                {invoice.guestEmail && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{invoice.guestEmail}</span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Property</span>
                  <span className="font-medium">{invoice.propertyName}</span>
                </div>
                {invoice.companyName && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">Company</span>
                    <span className="font-medium">{invoice.companyName}</span>
                  </div>
                )}
                {invoice.guestGstin && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground">GSTIN</span>
                    <span className="font-medium">{invoice.guestGstin}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-xs">Itemized Charges</p>
                {!addingItem && (
                  <button
                    type="button"
                    onClick={() => setAddingItem(true)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <PlusIcon className="size-3" />
                    Add Line Item
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {invoice.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 border-b py-1.5 text-xs last:border-b-0"
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
              </div>

              {addingItem && (
                <div className="flex flex-col gap-2 border bg-muted/20 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Minibar"
                    />
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Amount"
                    />
                  </div>
                  <Select
                    value={itemType}
                    onValueChange={(v) => setItemType(v as LineItemType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type">
                        {ITEM_TYPE_LABELS[itemType]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {ITEM_TYPE_LABELS[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={resetAddItem}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={
                        description.trim().length === 0 || Number(amount) <= 0
                      }
                      onClick={() => {
                        onAddLineItem(invoice, {
                          description: description.trim(),
                          amount: Math.round(Number(amount) * 100),
                          itemType,
                        });
                        feedback.success(
                          "Line item added",
                          `${description.trim()} added to ${invoice.invoiceNumber}.`,
                        );
                        resetAddItem();
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}

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
                      Tax ({formatTaxRate(invoice.items[0]?.taxRateBps ?? 0)})
                    </span>
                    <span>{formatInrFromPaise(invoice.taxPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1 font-medium">
                  <span>Total</span>
                  <span>{formatInrFromPaise(invoice.totalPaise)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Paid</span>
                  <span>{formatInrFromPaise(invoice.amountPaidPaise)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Balance Due</span>
                  <span>
                    {formatInrFromPaise(
                      invoice.totalPaise - invoice.amountPaidPaise,
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t pt-4">
              <p className="font-medium text-xs">Payment Transactions</p>
              {invoice.payments.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  No payments recorded yet.
                </p>
              ) : (
                invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-0.5 border-b pb-2 text-xs last:border-b-0"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {formatInrFromPaise(payment.amountPaise)} via{" "}
                        {PAYMENT_METHOD_LABELS[payment.method]}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDateTime(payment.date)}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {payment.transactionId
                        ? `Ref: ${payment.transactionId} · `
                        : ""}
                      Recorded by {payment.recordedBy}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-col gap-2 border-t pt-4">
              <p className="font-medium text-xs">Reminders Log</p>
              {invoice.reminders.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  No reminders sent yet.
                </p>
              ) : (
                invoice.reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between text-[11px] text-muted-foreground"
                  >
                    <span>
                      {REMINDER_CHANNEL_LABELS[reminder.channel]} reminder{" "}
                      {reminder.status === "failed" ? "failed" : "sent"}{" "}
                      {formatDateTime(reminder.sentAt)}
                      {reminder.sentBy ? ` by ${reminder.sentBy}` : " (auto)"}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap gap-2 border-t pt-4">
              {canCollect && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSendReminder(invoice)}
                >
                  <MessageCircleIcon />
                  Send Reminder
                </Button>
              )}
              {canCollect && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRecordPayment(invoice)}
                >
                  <WalletIcon />
                  Record Payment
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadPdf(invoice)}
              >
                <DownloadIcon />
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopyLink(invoice)}
              >
                <LinkIcon />
                Copy Pay Link
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
