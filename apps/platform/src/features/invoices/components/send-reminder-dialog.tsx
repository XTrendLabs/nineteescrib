import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { cn } from "@propertyos/ui/lib/utils";
import { MailIcon, MessageCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate, formatInrFromPaise } from "../lib/format";
import type { Invoice, ReminderChannel } from "../lib/mock-data";

function buildMessage(invoice: Invoice): string {
  const balance = formatInrFromPaise(
    invoice.totalPaise - invoice.amountPaidPaise,
  );
  const checkInLabel = invoice.checkIn
    ? ` starts ${formatDate(invoice.checkIn)}`
    : "";
  return `Hi ${invoice.guestName}! Your stay at ${invoice.propertyName}${checkInLabel}. You have a pending balance of ${balance}. Click here to pay securely via UPI/Card: https://book.propertyos.in/inv/${invoice.publicToken}`;
}

export function SendReminderDialog({
  invoice,
  onOpenChange,
  onSend,
}: {
  invoice: Invoice | null;
  onOpenChange: (open: boolean) => void;
  onSend: (invoice: Invoice, channel: ReminderChannel) => void;
}) {
  const feedback = useFeedback();
  const [channel, setChannel] = useState<ReminderChannel>("whatsapp");

  useEffect(() => {
    if (invoice) {
      setChannel("whatsapp");
    }
  }, [invoice?.id]);

  const canEmail = Boolean(invoice?.guestEmail);

  return (
    <Dialog open={invoice !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Send Reminder{invoice ? ` — ${invoice.invoiceNumber}` : ""}
          </DialogTitle>
        </DialogHeader>

        {invoice && (
          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setChannel("whatsapp")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 border px-3 py-2 text-xs transition-colors",
                  channel === "whatsapp"
                    ? "border-foreground bg-muted"
                    : "border-border hover:bg-muted/40",
                )}
              >
                <MessageCircleIcon className="size-3.5" />
                WhatsApp
              </button>
              <button
                type="button"
                disabled={!canEmail}
                onClick={() => setChannel("email")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 border px-3 py-2 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  channel === "email"
                    ? "border-foreground bg-muted"
                    : "border-border hover:bg-muted/40",
                )}
              >
                <MailIcon className="size-3.5" />
                Email
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Message Preview
              </span>
              <p className="border bg-muted/20 p-3 text-xs leading-relaxed">
                {buildMessage(invoice)}
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Sending to{" "}
              {channel === "email" ? invoice.guestEmail : invoice.guestPhone}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!invoice) {
                return;
              }
              onSend(invoice, channel);
              feedback.success(
                "Reminder sent",
                `${channel === "whatsapp" ? "WhatsApp" : "Email"} reminder sent to ${invoice.guestName}.`,
              );
              onOpenChange(false);
            }}
          >
            Send Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
