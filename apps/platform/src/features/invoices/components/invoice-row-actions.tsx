import { Button } from "@propertyos/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@propertyos/ui/components/dropdown-menu";
import {
  DownloadIcon,
  EyeIcon,
  LinkIcon,
  MessageCircleIcon,
  MoreVerticalIcon,
  WalletIcon,
} from "lucide-react";
import type { Invoice } from "../lib/mock-data";

export function InvoiceRowActions({
  invoice,
  onView,
  onRecordPayment,
  onSendReminder,
  onCopyLink,
  onDownloadPdf,
}: {
  invoice: Invoice;
  onView: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onSendReminder: (invoice: Invoice) => void;
  onCopyLink: (invoice: Invoice) => void;
  onDownloadPdf: (invoice: Invoice) => void;
}) {
  const canCollect =
    invoice.status !== "paid" && invoice.status !== "cancelled";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm">
            <MoreVerticalIcon />
            <span className="sr-only">Actions</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(invoice)}>
          <EyeIcon />
          View Details
        </DropdownMenuItem>
        {canCollect && (
          <DropdownMenuItem onClick={() => onRecordPayment(invoice)}>
            <WalletIcon />
            Record Payment
          </DropdownMenuItem>
        )}
        {canCollect && (
          <DropdownMenuItem onClick={() => onSendReminder(invoice)}>
            <MessageCircleIcon />
            Send Reminder
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onCopyLink(invoice)}>
          <LinkIcon />
          Copy Pay Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownloadPdf(invoice)}>
          <DownloadIcon />
          Download PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
