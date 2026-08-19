import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { formatInrFromPaise } from "../lib/format";
import {
  ITEM_TYPE_LABELS,
  type LineItemType,
  MOCK_PROPERTIES,
} from "../lib/mock-data";

const ITEM_TYPE_OPTIONS: LineItemType[] = [
  "room",
  "addon",
  "fnb",
  "service",
  "fee",
  "discount",
];

const TAX_RATE_OPTIONS = [0, 500, 1200, 1800];

const TAX_RATE_LABELS: Record<number, string> = {
  0: "0%",
  500: "5%",
  1200: "12%",
  1800: "18%",
};

type DraftItem = {
  key: string;
  description: string;
  amount: string;
  itemType: LineItemType;
};

function emptyItem(): DraftItem {
  return {
    key: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: "",
    amount: "",
    itemType: "room",
  };
}

export type CreateInvoiceForm = {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  propertyId: string;
  bookingRef: string;
  dueDate: string;
  guestGstin: string;
  companyName: string;
  taxRateBps: number;
  items: Array<{
    description: string;
    amountPaise: number;
    itemType: LineItemType;
  }>;
};

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (form: CreateInvoiceForm) => void;
}) {
  const feedback = useFeedback();
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [propertyId, setPropertyId] = useState(MOCK_PROPERTIES[0]?.id ?? "");
  const [bookingRef, setBookingRef] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [guestGstin, setGuestGstin] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [taxRateBps, setTaxRateBps] = useState(1800);
  const [items, setItems] = useState<DraftItem[]>(() => [emptyItem()]);

  useEffect(() => {
    if (open) {
      setGuestName("");
      setGuestPhone("");
      setGuestEmail("");
      setPropertyId(MOCK_PROPERTIES[0]?.id ?? "");
      setBookingRef("");
      setDueDate("");
      setGuestGstin("");
      setCompanyName("");
      setTaxRateBps(1800);
      setItems([emptyItem()]);
    }
  }, [open]);

  const propertyLabel =
    MOCK_PROPERTIES.find((p) => p.id === propertyId)?.name ?? "Select property";

  const validItems = items.filter(
    (item) => item.description.trim().length > 0 && Number(item.amount) > 0,
  );
  const subtotalPaise = validItems.reduce(
    (sum, item) => sum + Math.round(Number(item.amount) * 100),
    0,
  );
  const taxPaise = Math.round((subtotalPaise * taxRateBps) / 10000);
  const totalPaise = subtotalPaise + taxPaise;

  const canSave =
    guestName.trim().length > 0 &&
    guestPhone.trim().length > 0 &&
    validItems.length > 0;

  function updateItem(key: string, patch: Partial<DraftItem>) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 px-4 pb-4 lg:grid-cols-3">
          {/* Section: Guest & Stay */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-xs">Guest & Stay</p>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Guest Name *
              </span>
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Arjun Sen"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">Phone *</span>
              <Input
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="e.g. 9876543210"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">Email</span>
              <Input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">Property *</span>
              <Select
                value={propertyId}
                onValueChange={(v) => setPropertyId(v as string)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Property">
                    {propertyLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MOCK_PROPERTIES.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Booking Reference
              </span>
              <Input
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value)}
                placeholder="Optional, e.g. POS-104"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">Due Date</span>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Section: Line Items */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-xs">Line Items</p>
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, emptyItem()])}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline"
              >
                <PlusIcon className="size-3" />
                Add Item
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col gap-1.5 border p-2"
                >
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.key, { description: e.target.value })
                      }
                      placeholder="Description"
                      className="flex-1"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setItems((prev) =>
                            prev.filter((i) => i.key !== item.key),
                          )
                        }
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <TrashIcon className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={(e) =>
                        updateItem(item.key, { amount: e.target.value })
                      }
                      placeholder="Amount"
                    />
                    <Select
                      value={item.itemType}
                      onValueChange={(v) =>
                        updateItem(item.key, {
                          itemType: v as LineItemType,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type">
                          {ITEM_TYPE_LABELS[item.itemType]}
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
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Tax & B2B */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-xs">Tax & B2B</p>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">GST Rate</span>
              <Select
                value={String(taxRateBps)}
                onValueChange={(v) => setTaxRateBps(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rate">
                    {TAX_RATE_LABELS[taxRateBps]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TAX_RATE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {TAX_RATE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Company Name
              </span>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Optional, for B2B invoices"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">Guest GSTIN</span>
              <Input
                value={guestGstin}
                onChange={(e) => setGuestGstin(e.target.value)}
                placeholder="Optional, for ITC claim"
              />
            </div>

            <div className="flex flex-col gap-1 border-t pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatInrFromPaise(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Tax ({TAX_RATE_LABELS[taxRateBps]})
                </span>
                <span>{formatInrFromPaise(taxPaise)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-medium">
                <span>Total</span>
                <span>{formatInrFromPaise(totalPaise)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => {
              onSave({
                guestName: guestName.trim(),
                guestPhone: guestPhone.trim(),
                guestEmail: guestEmail.trim(),
                propertyId,
                bookingRef: bookingRef.trim(),
                dueDate,
                guestGstin: guestGstin.trim(),
                companyName: companyName.trim(),
                taxRateBps,
                items: validItems.map((item) => ({
                  description: item.description.trim(),
                  amountPaise: Math.round(Number(item.amount) * 100),
                  itemType: item.itemType,
                })),
              });
              feedback.success(
                "Invoice created",
                `A draft invoice for ${guestName.trim()} has been created.`,
              );
              onOpenChange(false);
            }}
          >
            Create Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
