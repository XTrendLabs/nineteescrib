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
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { UploadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  type Expense,
  type ExpenseCategory,
  HQ_SHARED_ID,
  MOCK_PROPERTIES,
  MOCK_VENDORS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod,
} from "../lib/mock-data";

type InitialPaymentStatus = "unpaid" | "partial" | "paid";

type FormState = {
  title: string;
  category: ExpenseCategory;
  propertyId: string;
  vendorId: string;
  totalAmount: string;
  initialStatus: InitialPaymentStatus;
  initialAmountPaid: string;
  paymentMethod: PaymentMethod;
  referenceId: string;
  paymentDate: string;
  dueDate: string;
  isOwnerDeductible: boolean;
  taxAmount: string;
  vendorGstin: string;
  itcClaimable: boolean;
  notes: string;
};

function emptyForm(): FormState {
  return {
    title: "",
    category: "maintenance",
    propertyId: MOCK_PROPERTIES[0]?.id ?? HQ_SHARED_ID,
    vendorId: "",
    totalAmount: "",
    initialStatus: "unpaid",
    initialAmountPaid: "",
    paymentMethod: "upi",
    referenceId: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    isOwnerDeductible: false,
    taxAmount: "",
    vendorGstin: "",
    itcClaimable: false,
    notes: "",
  };
}

function formFromExpense(expense: Expense): FormState {
  return {
    title: expense.title,
    category: expense.category,
    propertyId: expense.propertyId,
    vendorId: expense.vendorId ?? "",
    totalAmount: (expense.totalAmountPaise / 100).toString(),
    initialStatus: expense.status,
    initialAmountPaid: (expense.amountPaidPaise / 100).toString(),
    paymentMethod: expense.payments.at(-1)?.method ?? "upi",
    referenceId: expense.payments.at(-1)?.referenceId ?? "",
    paymentDate: new Date().toISOString().slice(0, 10),
    dueDate: expense.dueDate ? expense.dueDate.toISOString().slice(0, 10) : "",
    isOwnerDeductible: expense.isOwnerDeductible,
    taxAmount: expense.taxAmountPaise
      ? (expense.taxAmountPaise / 100).toString()
      : "",
    vendorGstin: expense.vendorGstin ?? "",
    itcClaimable: expense.itcClaimable,
    notes: expense.notes ?? "",
  };
}

export function LogExpenseDialog({
  open,
  expense,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  expense: Expense | null;
  onOpenChange: (open: boolean) => void;
  onSave: (form: FormState, editing: Expense | null) => void;
}) {
  const feedback = useFeedback();
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(expense ? formFromExpense(expense) : emptyForm());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expense?.id]);

  const isEditing = expense !== null;
  const showPaymentFields =
    form.initialStatus === "partial" || form.initialStatus === "paid";
  const showDueDate =
    form.initialStatus === "unpaid" || form.initialStatus === "partial";
  const canSave = form.title.trim().length > 0 && Number(form.totalAmount) > 0;

  const propertyLabel =
    form.propertyId === HQ_SHARED_ID
      ? "HQ / Shared Expense"
      : (MOCK_PROPERTIES.find((p) => p.id === form.propertyId)?.name ??
        "Select property");

  const vendorLabel =
    MOCK_VENDORS.find((v) => v.id === form.vendorId)?.name ?? "Select vendor";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Expense" : "Log Expense"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 px-4 pb-4 lg:grid-cols-3">
          {/* Section: Basic Info */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-xs">Basic Info</p>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">Title *</span>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Pool Cleaning Services"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">Category *</span>
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
                Total Amount *
              </span>
              <Input
                type="number"
                value={form.totalAmount}
                onChange={(e) =>
                  setForm({ ...form, totalAmount: e.target.value })
                }
                placeholder="e.g. 10000"
              />
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
                    {form.vendorId ? vendorLabel : "Select vendor (optional)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MOCK_VENDORS.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section: Payment */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-xs">Payment</p>
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

            {showPaymentFields && (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs">
                    Initial Amount Paid
                  </span>
                  <Input
                    type="number"
                    value={form.initialAmountPaid}
                    onChange={(e) =>
                      setForm({ ...form, initialAmountPaid: e.target.value })
                    }
                    placeholder="e.g. 5000"
                  />
                </div>
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

            <Label className="border-t pt-3">
              <Checkbox
                checked={form.isOwnerDeductible}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isOwnerDeductible: checked === true })
                }
              />
              Deduct from Property Owner Payout Statement
            </Label>
          </div>

          {/* Section: Tax & Extras */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-xs">Tax & Extras</p>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Tax / GST Amount
              </span>
              <Input
                type="number"
                value={form.taxAmount}
                onChange={(e) =>
                  setForm({ ...form, taxAmount: e.target.value })
                }
                placeholder="e.g. 450"
              />
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
            <Label>
              <Checkbox
                checked={form.itcClaimable}
                onCheckedChange={(checked) =>
                  setForm({ ...form, itcClaimable: checked === true })
                }
              />
              Input Tax Credit (ITC) claimable
            </Label>

            <div className="flex flex-col gap-1.5 border-t pt-3">
              <span className="text-muted-foreground text-xs">
                Receipt Upload
              </span>
              <div className="flex flex-col items-center gap-1.5 border border-dashed py-4 text-center text-muted-foreground">
                <UploadIcon className="size-4" />
                <p className="text-[11px]">Drag & drop or click to upload</p>
                <p className="text-[10px]">Images or PDF, up to 10MB</p>
              </div>
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => {
              onSave(form, expense);
              feedback.success(
                isEditing ? "Expense updated" : "Expense logged",
                `${form.title} has been ${isEditing ? "updated" : "added"}.`,
              );
              onOpenChange(false);
            }}
          >
            {isEditing ? "Save Changes" : "Log Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
