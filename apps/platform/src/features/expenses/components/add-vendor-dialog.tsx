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
import { useState } from "react";
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  type ExpenseCategory,
  type Vendor,
} from "../lib/mock-data";

const EMPTY_FORM = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  category: "maintenance" as ExpenseCategory,
  gstin: "",
};

export function AddVendorDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (vendor: Vendor) => void;
}) {
  const feedback = useFeedback();
  const [form, setForm] = useState(EMPTY_FORM);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(EMPTY_FORM);
    }
    onOpenChange(next);
  }

  const canSave = form.name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Vendor</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">Vendor Name *</span>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Sagar Plumbing & Repairs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Contact Person
              </span>
              <Input
                value={form.contactPerson}
                onChange={(e) =>
                  setForm({ ...form, contactPerson: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">Phone</span>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">Email</span>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">
                Services Category
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
              <span className="text-muted-foreground text-xs">GSTIN</span>
              <Input
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => {
              const vendor: Vendor = {
                id: `vendor-${Date.now()}`,
                name: form.name.trim(),
                contactPerson: form.contactPerson.trim() || undefined,
                phone: form.phone.trim() || undefined,
                email: form.email.trim() || undefined,
                category: form.category,
                gstin: form.gstin.trim() || undefined,
              };
              onSave(vendor);
              feedback.success(
                "Vendor added",
                `${vendor.name} has been added to your directory.`,
              );
              handleOpenChange(false);
            }}
          >
            Add Vendor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
