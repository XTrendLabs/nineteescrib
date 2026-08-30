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

import { api } from "@/shared/lib/api-client";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { useCreateVendor } from "../api/use-create-vendor";
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  type ExpenseCategory,
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
  activeOrganizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Keys the list query this dialog invalidates; see `useVendors`. */
  activeOrganizationId: string | undefined;
}) {
  const feedback = useFeedback();
  const [form, setForm] = useState(EMPTY_FORM);
  const createVendor = useCreateVendor();

  function handleOpenChange(next: boolean) {
    // The form is only reset once the dialog is closed for good -- discarding
    // what someone typed while the request is still in flight would lose it if
    // the server rejects the vendor.
    if (!next) {
      setForm(EMPTY_FORM);
    }
    onOpenChange(next);
  }

  const canSave = form.name.trim().length > 0 && !createVendor.isPending;

  function handleSave() {
    if (!canSave) return;

    createVendor.mutate(
      {
        json: {
          name: form.name.trim(),
          contactPerson: form.contactPerson.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          category: form.category,
          gstin: form.gstin.trim(),
        },
      },
      {
        onSuccess: () => {
          api.api.platform.vendors.$get.invalidate({
            query: { activeOrganizationId: activeOrganizationId ?? "" },
          });
          feedback.success(
            "Vendor added",
            `${form.name.trim()} has been added to your directory.`,
          );
          handleOpenChange(false);
        },
        onError: (error) => {
          feedback.error(
            "Couldn't add vendor",
            getApiErrorMessage(
              error,
              "Something went wrong. Please try again.",
            ),
          );
        },
      },
    );
  }

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
          <Button
            variant="outline"
            disabled={createVendor.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={!canSave} onClick={handleSave}>
            {createVendor.isPending ? "Adding..." : "Add Vendor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
