import { Button } from "@propertyos/ui/components/button";
import { Checkbox } from "@propertyos/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useState } from "react";
import { MOCK_PROPERTIES, ROLE_LABELS, type StaffRole } from "../lib/mock-data";

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  email: "",
  role: "caretaker" as StaffRole,
  propertyIds: new Set<string>(),
};

export function InviteStaffDialog({
  open,
  onOpenChange,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: (name: string, phone: string, role: StaffRole) => void;
}) {
  const feedback = useFeedback();
  const [form, setForm] = useState(EMPTY_FORM);

  function reset() {
    setForm(EMPTY_FORM);
  }

  function toggleProperty(id: string) {
    setForm((prev) => {
      const next = new Set(prev.propertyIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { ...prev, propertyIds: next };
    });
  }

  const canSubmit =
    form.fullName.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.propertyIds.size > 0;

  function handleSubmit() {
    if (!canSubmit) {
      return;
    }
    feedback.success(
      "Invite sent",
      `${form.fullName} will receive a WhatsApp login link at ${form.phone}.`,
    );
    onInvited(form.fullName, form.phone, form.role);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite New Staff Member</DialogTitle>
          <DialogDescription>
            Sends an SMS/WhatsApp login link so they can complete their profile.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4 pb-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-name">Full Name *</Label>
            <Input
              id="invite-name"
              value={form.fullName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, fullName: e.target.value }))
              }
              placeholder="e.g. Sagar Patil"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-phone">Phone Number *</Label>
            <Input
              id="invite-phone"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Email (optional)</Label>
            <Input
              id="invite-email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="name@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-role">Assign Role *</Label>
            <Select
              value={form.role}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, role: v as StaffRole }))
              }
            >
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Assign Properties *</Label>
            <div className="flex flex-col gap-2 border p-3">
              {MOCK_PROPERTIES.map((property) => (
                <Label
                  key={property.id}
                  className="flex items-center gap-2 font-normal"
                >
                  <Checkbox
                    checked={form.propertyIds.has(property.id)}
                    onCheckedChange={() => toggleProperty(property.id)}
                  />
                  {property.name}
                </Label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={handleSubmit}>
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
