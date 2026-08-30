import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Input } from "@propertyos/ui/components/input";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { useState } from "react";

import { getApiErrorMessage } from "@/shared/lib/api-error";
import { useCreateGuest } from "../api/use-create-guest";

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  note: "",
};

export function AddGuestDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const feedback = useFeedback();
  const [form, setForm] = useState(EMPTY_FORM);
  const createGuest = useCreateGuest();

  function handleOpenChange(next: boolean) {
    // The form is only cleared once the dialog is closed for good -- discarding
    // what someone typed while the request is in flight would lose it if the
    // server rejects the guest.
    if (!next) {
      setForm(EMPTY_FORM);
    }
    onOpenChange(next);
  }

  const canSave =
    form.name.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    !createGuest.isPending;

  function handleSave() {
    if (!canSave) return;

    createGuest.mutate(
      {
        json: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          note: form.note.trim(),
        },
      },
      {
        onSuccess: () => {
          onCreated();
          feedback.success(
            "Guest added",
            `${form.name.trim()} has been added to your directory.`,
          );
          handleOpenChange(false);
        },
        onError: (error) => {
          feedback.error(
            "Couldn't add guest",
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
          <DialogTitle>Add Guest</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">Full Name *</span>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Priya Nair"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">Phone *</span>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">Email</span>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">First Note</span>
            <Input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Optional"
            />
          </div>

          {/* The phone is the guest's identity within an HQ, so the same
              number cannot be saved twice. */}
          <p className="text-[11px] text-muted-foreground">
            Guests are matched by phone number. Booking someone already listed
            here will add to their existing profile.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={createGuest.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={!canSave} onClick={handleSave}>
            {createGuest.isPending ? "Adding..." : "Add Guest"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
