import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
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

export function AssignWorkspaceDialog({
  open,
  onOpenChange,
  assignedPropertyIds,
  onAssign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignedPropertyIds: string[];
  onAssign: (propertyId: string, propertyName: string, role: StaffRole) => void;
}) {
  const feedback = useFeedback();
  const available = MOCK_PROPERTIES.filter(
    (p) => !assignedPropertyIds.includes(p.id),
  );
  const [propertyId, setPropertyId] = useState(available[0]?.id ?? "");
  const [role, setRole] = useState<StaffRole>("caretaker");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign New Workspace</DialogTitle>
          <DialogDescription>
            Link this staff member to an additional property.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4 pb-2">
          <div className="flex flex-col gap-1.5">
            <Label>Property</Label>
            <Select
              value={propertyId}
              onValueChange={(v) => setPropertyId(v as string)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {available.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!propertyId}
            onClick={() => {
              const property = MOCK_PROPERTIES.find((p) => p.id === propertyId);
              if (!property) {
                return;
              }
              onAssign(property.id, property.name, role);
              feedback.success(
                "Workspace assigned",
                `Added access to ${property.name}.`,
              );
              onOpenChange(false);
            }}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
