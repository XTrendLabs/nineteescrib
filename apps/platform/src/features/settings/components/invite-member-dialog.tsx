import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Field, FieldLabel } from "@propertyos/ui/components/field";
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

import type { MemberRole } from "@/features/settings/lib/mock-data";

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: MemberRole) => void;
};

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export function InviteMemberDialog({
  open,
  onOpenChange,
  onInvite,
}: InviteMemberDialogProps) {
  const feedback = useFeedback();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("member");

  function handleSubmit() {
    if (!email.trim()) {
      feedback.error("Email required", "Enter an email address to invite.");
      return;
    }
    onInvite(email.trim(), role);
    feedback.success("Invitation sent", `An invite was sent to ${email}.`);
    setEmail("");
    setRole("member");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Send an email invite link to join your organization.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Role</FieldLabel>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as MemberRole)}
            >
              <SelectTrigger>
                <SelectValue>{ROLE_LABELS[role]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Send Invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
