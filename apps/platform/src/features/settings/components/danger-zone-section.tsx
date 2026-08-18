import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Field, FieldLabel } from "@propertyos/ui/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { AlertTriangleIcon, SkullIcon } from "lucide-react";
import { useState } from "react";

import { ConfirmDestructiveDialog } from "@/features/settings/components/confirm-destructive-dialog";
import {
  MOCK_COMPANY_PROFILE,
  MOCK_MEMBERS,
} from "@/features/settings/lib/mock-data";

export function DangerZoneSection() {
  const feedback = useFeedback();
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState<string>("");

  const admins = MOCK_MEMBERS.filter((m) => m.role === "admin");

  function handleTransfer() {
    const owner = admins.find((m) => m.id === newOwnerId);
    feedback.success(
      "Ownership transfer initiated",
      owner
        ? `${owner.name} must accept the transfer to complete it.`
        : undefined,
    );
    setTransferOpen(false);
    setNewOwnerId("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-medium text-sm">Danger Zone</h2>
        <p className="flex items-center gap-1.5 text-destructive text-xs">
          <AlertTriangleIcon className="size-3.5" />
          These actions are irreversible. Proceed with extreme caution.
        </p>
      </div>

      <Card className="border-destructive/30">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-medium text-sm">Transfer Ownership</h3>
            <p className="text-muted-foreground text-xs">
              Transfer owner role to another admin member.
            </p>
          </div>
          <Button variant="outline" onClick={() => setTransferOpen(true)}>
            Transfer Ownership
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-medium text-sm">Delete Organization</h3>
            <p className="text-muted-foreground text-xs">
              Permanently delete this organization and all associated data.
              Active bookings will be cancelled.
            </p>
          </div>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <SkullIcon />
            Delete Organization
          </Button>
        </CardContent>
      </Card>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Ownership</DialogTitle>
            <DialogDescription>
              The selected admin will become the new organization owner. You
              will be re-authenticated to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-4 pb-4">
            <Field>
              <FieldLabel>New Owner</FieldLabel>
              <Select
                value={newOwnerId}
                onValueChange={(v) => setNewOwnerId(v as string)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {admins.find((m) => m.id === newOwnerId)?.name ??
                      "Select an admin"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!newOwnerId} onClick={handleTransfer}>
              Transfer Ownership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete organization"
        description="This permanently deletes all properties, bookings, guests, and staff data. This cannot be undone. A full data export will be triggered first."
        confirmLabel="Delete Organization"
        confirmationText={MOCK_COMPANY_PROFILE.slug}
        onConfirm={() =>
          feedback.success(
            "Deletion scheduled",
            "Your organization will be permanently deleted after the export completes.",
          )
        }
      />
    </div>
  );
}
