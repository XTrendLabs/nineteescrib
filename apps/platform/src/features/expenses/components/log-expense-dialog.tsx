import { Button } from "@propertyos/ui/components/button";
import { Checkbox } from "@propertyos/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Input } from "@propertyos/ui/components/input";
import { Label } from "@propertyos/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { useRef, useState } from "react";
import {
  type Expense,
  type HeldReceipt,
  HQ_SHARED_ID,
  normalizeCategory,
  normalizePaymentMethod,
} from "../lib/expense";
import { formatInrFromPaise } from "../lib/format";
import {
  amountFromStored,
  bpsToPercentLabel,
  computeGst,
  GST_RATE_OPTIONS,
  type GstMode,
  percentToBps,
} from "../lib/gst";
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  type ExpenseCategory,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod,
} from "../lib/mock-data";
import type { Vendor } from "../lib/vendor";
import { ReceiptManager } from "./receipt-manager";

/** Just enough of a property to offer it in the picker. */
export type DialogProperty = { id: string; name: string };

type InitialPaymentStatus = "unpaid" | "partial" | "paid";

export type FormState = {
  title: string;
  category: ExpenseCategory;
  propertyId: string;
  vendorId: string;
  initialStatus: InitialPaymentStatus;
  initialAmountPaid: string;
  paymentMethod: PaymentMethod;
  referenceId: string;
  paymentDate: string;
  dueDate: string;
  isOwnerDeductible: boolean;
  /** The pre-tax base when adding GST on top, or the gross when it is included. */
  amount: string;
  /** GST rate as a percent string, e.g. "18". */
  gstRate: string;
  gstMode: GstMode;
  vendorGstin: string;
  itcClaimable: boolean;
  notes: string;
};

function emptyForm(defaultPropertyId: string = HQ_SHARED_ID): FormState {
  return {
    title: "",
    category: "maintenance",
    propertyId: defaultPropertyId,
    vendorId: "",
    amount: "",
    gstRate: "0",
    gstMode: "exclusive",
    initialStatus: "unpaid",
    initialAmountPaid: "",
    paymentMethod: "upi",
    referenceId: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    isOwnerDeductible: false,
    vendorGstin: "",
    itcClaimable: false,
    notes: "",
  };
}

function formFromExpense(expense: Expense): FormState {
  const last = expense.payments.at(-1);
  const gstMode: GstMode =
    expense.gstMode === "inclusive" ? "inclusive" : "exclusive";

  return {
    title: expense.title,
    category: normalizeCategory(expense.category),
    propertyId: expense.propertyId,
    vendorId: expense.vendorId ?? "",
    // The box holds whichever figure was typed -- base or gross -- so the
    // breakdown reopens exactly as it was saved.
    amount: (
      amountFromStored(
        expense.totalAmountPaise,
        expense.taxAmountPaise,
        gstMode,
      ) / 100
    ).toString(),
    gstRate: bpsToPercentLabel(expense.gstRateBps),
    gstMode,
    initialStatus: expense.status,
    initialAmountPaid: (expense.amountPaidPaise / 100).toString(),
    paymentMethod: last ? normalizePaymentMethod(last.method) : "upi",
    referenceId: last?.referenceId ?? "",
    paymentDate: new Date().toISOString().slice(0, 10),
    // Already a calendar day (YYYY-MM-DD), which is what the input expects.
    dueDate: expense.dueDate ?? "",
    isOwnerDeductible: expense.isOwnerDeductible,
    vendorGstin: expense.vendorGstin ?? "",
    itcClaimable: expense.itcClaimable,
    notes: expense.notes ?? "",
  };
}

export function LogExpenseDialog({
  open,
  expense,
  vendors,
  properties,
  isPending = false,
  onOpenChange,
  onSave,
  onReceiptsChanged,
}: {
  open: boolean;
  expense: Expense | null;
  /** The real vendor directory, so the picker offers what was actually saved. */
  vendors: Vendor[];
  /** The properties in scope, for charging the expense to one of them. */
  properties: DialogProperty[];
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    form: FormState,
    editing: Expense | null,
    receipts: HeldReceipt[],
  ) => void;
  /** Refetches after a receipt is added or removed while editing. */
  onReceiptsChanged?: () => void;
}) {
  // A caller scoped to one property should not have to pick it every time;
  // with several, no default is assumed and the cost starts HQ-shared.
  const defaultPropertyId =
    properties.length === 1 ? properties[0].id : HQ_SHARED_ID;
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(defaultPropertyId),
  );
  // Receipts picked before the expense exists; uploaded once it has an id.
  const [heldReceipts, setHeldReceipts] = useState<HeldReceipt[]>([]);

  /**
   * Loads the form when the dialog opens on a different record.
   *
   * Deliberately keyed on the expense's *id* rather than the object: the row
   * is re-read from the list so an uploaded receipt appears straight away, and
   * depending on the object itself would make every refetch reset the form and
   * discard whatever the user was part-way through typing.
   */
  const loadedKey = `${open}:${expense?.id ?? "new"}`;
  const loadedRef = useRef<string | undefined>(undefined);
  if (open && loadedRef.current !== loadedKey) {
    loadedRef.current = loadedKey;
    setForm(expense ? formFromExpense(expense) : emptyForm(defaultPropertyId));
    // Never carry a previous expense's pending files into the next one.
    setHeldReceipts([]);
  }
  if (!open && loadedRef.current !== undefined) {
    loadedRef.current = undefined;
  }

  const isEditing = expense !== null;
  const showPaymentFields =
    form.initialStatus === "partial" || form.initialStatus === "paid";
  const showDueDate =
    form.initialStatus === "unpaid" || form.initialStatus === "partial";

  // The single source of truth for what this expense costs. Everything the
  // section shows -- and what is saved -- comes from this one calculation.
  const gst = computeGst(
    Math.round((Number(form.amount) || 0) * 100),
    percentToBps(form.gstRate),
    form.gstMode,
  );
  const hasGst = gst.gstPaise > 0;

  // A part payment cannot exceed what is owed; the server refuses it anyway.
  const initialPaidPaise = Math.round(
    (Number(form.initialAmountPaid) || 0) * 100,
  );
  const partialExceedsTotal =
    form.initialStatus === "partial" && initialPaidPaise > gst.totalPaise;

  const canSave =
    form.title.trim().length > 0 &&
    gst.totalPaise > 0 &&
    !partialExceedsTotal &&
    !isPending;

  const propertyLabel =
    form.propertyId === HQ_SHARED_ID
      ? "HQ / Shared Expense"
      : (properties.find((p) => p.id === form.propertyId)?.name ??
        "Select property");

  const vendorLabel =
    vendors.find((v) => v.id === form.vendorId)?.name ?? "Select vendor";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Expense" : "Log Expense"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid max-h-[70vh] grid-cols-1 gap-6 overflow-y-auto px-4 pb-4 lg:grid-cols-2">
          {/* ---------------- Amount & Payment ---------------- */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-xs">Amount & Payment</p>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                {form.gstMode === "inclusive"
                  ? "Amount (incl. GST) *"
                  : "Amount (before GST) *"}
              </span>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="e.g. 10000"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">GST Rate</span>
                <Select
                  value={
                    GST_RATE_OPTIONS.includes(
                      percentToBps(
                        form.gstRate,
                      ) as (typeof GST_RATE_OPTIONS)[number],
                    )
                      ? String(percentToBps(form.gstRate))
                      : "custom"
                  }
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      // "Custom" keeps whatever is typed and just reveals the
                      // free field, so switching to it never wipes a rate.
                      gstRate:
                        v === "custom"
                          ? form.gstRate
                          : bpsToPercentLabel(Number(v)),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="GST">
                      {GST_RATE_OPTIONS.includes(
                        percentToBps(
                          form.gstRate,
                        ) as (typeof GST_RATE_OPTIONS)[number],
                      )
                        ? `${form.gstRate}%`
                        : "Custom"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {GST_RATE_OPTIONS.map((bps) => (
                      <SelectItem key={bps} value={String(bps)}>
                        {bps === 0
                          ? "0% (exempt)"
                          : `${bpsToPercentLabel(bps)}%`}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom…</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">
                  Custom Rate (%)
                </span>
                <Input
                  type="number"
                  value={form.gstRate}
                  onChange={(e) =>
                    setForm({ ...form, gstRate: e.target.value })
                  }
                  placeholder="e.g. 18"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                How is GST applied?
              </span>
              <Select
                value={form.gstMode}
                onValueChange={(v) =>
                  setForm({ ...form, gstMode: v as GstMode })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="GST mode">
                    {form.gstMode === "inclusive"
                      ? "Amount includes GST"
                      : "Add GST on top"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exclusive">Add GST on top</SelectItem>
                  <SelectItem value="inclusive">Amount includes GST</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* The three figures, so which number is payable is never in doubt. */}
            <div className="flex flex-col gap-1 border bg-muted/30 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Base</span>
                <span>{formatInrFromPaise(gst.basePaise)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  GST{hasGst ? ` @ ${form.gstRate}%` : ""}
                </span>
                <span>{formatInrFromPaise(gst.gstPaise)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t pt-1.5 font-medium">
                <span>Total Payable</span>
                <span>{formatInrFromPaise(gst.totalPaise)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Initial Payment Status *
              </span>
              <Select
                value={form.initialStatus}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    initialStatus: v as InitialPaymentStatus,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status">
                    {form.initialStatus === "unpaid"
                      ? "Unpaid"
                      : form.initialStatus === "partial"
                        ? "Partial"
                        : "Fully Paid"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Fully Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.initialStatus === "partial" && (
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">
                  Amount Paid Now
                </span>
                <Input
                  type="number"
                  value={form.initialAmountPaid}
                  onChange={(e) =>
                    setForm({ ...form, initialAmountPaid: e.target.value })
                  }
                  placeholder="e.g. 5000"
                />
                <span className="text-[11px] text-muted-foreground">
                  {partialExceedsTotal
                    ? `Cannot exceed the ${formatInrFromPaise(gst.totalPaise)} total`
                    : `Leaves ${formatInrFromPaise(
                        Math.max(0, gst.totalPaise - initialPaidPaise),
                      )} outstanding`}
                </span>
              </div>
            )}

            {form.initialStatus === "paid" && (
              <p className="text-[11px] text-muted-foreground">
                Records a payment of {formatInrFromPaise(gst.totalPaise)} — the
                full amount.
              </p>
            )}

            {showPaymentFields && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-muted-foreground text-xs">
                      Payment Method
                    </span>
                    <Select
                      value={form.paymentMethod}
                      onValueChange={(v) =>
                        setForm({
                          ...form,
                          paymentMethod: v as PaymentMethod,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Method">
                          {PAYMENT_METHOD_LABELS[form.paymentMethod]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {PAYMENT_METHOD_LABELS[option]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-muted-foreground text-xs">
                      Payment Date
                    </span>
                    <Input
                      type="date"
                      value={form.paymentDate}
                      onChange={(e) =>
                        setForm({ ...form, paymentDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs">
                    Payment Reference / Txn ID
                  </span>
                  <Input
                    value={form.referenceId}
                    onChange={(e) =>
                      setForm({ ...form, referenceId: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
              </>
            )}

            {showDueDate && (
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">Due Date</span>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </div>
            )}
          </div>

          {/* ---------------- Details ---------------- */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-xs">Details</p>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">Title *</span>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Pool Cleaning Services"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">
                  Category *
                </span>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm({ ...form, category: v as ExpenseCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category">
                      {CATEGORY_LABELS[form.category]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category} value={category}>
                        {CATEGORY_LABELS[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">Vendor</span>
                <Select
                  value={form.vendorId}
                  onValueChange={(v) =>
                    setForm({ ...form, vendorId: v as string })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor">
                      {form.vendorId ? vendorLabel : "Optional"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.length === 0 ? (
                      <div className="px-2 py-1.5 text-muted-foreground text-xs">
                        No vendors yet
                      </div>
                    ) : (
                      vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Property Scope *
              </span>
              <Select
                value={form.propertyId}
                onValueChange={(v) =>
                  setForm({ ...form, propertyId: v as string })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Property">
                    {propertyLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={HQ_SHARED_ID}>
                    HQ / Shared Expense
                  </SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Vendor GSTIN
              </span>
              <Input
                value={form.vendorGstin}
                onChange={(e) =>
                  setForm({ ...form, vendorGstin: e.target.value })
                }
                placeholder="Optional"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Notes / Description
              </span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Free-text remarks"
                className="w-full min-w-0 resize-none rounded-none border border-input bg-transparent px-2.5 py-1.5 text-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">Receipts</span>
              <ReceiptManager
                expenseId={expense?.id}
                receipts={expense?.receipts ?? []}
                heldFiles={heldReceipts}
                onHeldFilesChange={setHeldReceipts}
                onUploaded={onReceiptsChanged}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-2 border-t pt-3">
              <Label>
                <Checkbox
                  checked={form.isOwnerDeductible}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, isOwnerDeductible: checked === true })
                  }
                />
                Deduct from Property Owner Payout Statement
              </Label>
              <Label>
                <Checkbox
                  checked={form.itcClaimable}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, itcClaimable: checked === true })
                  }
                />
                Input Tax Credit (ITC) claimable
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => {
              // The toast and the close belong to the caller, which is the
              // only side that learns whether the write succeeded.
              onSave(form, expense, heldReceipts);
            }}
          >
            {isPending
              ? isEditing
                ? "Saving..."
                : "Logging..."
              : isEditing
                ? "Save Changes"
                : "Log Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
