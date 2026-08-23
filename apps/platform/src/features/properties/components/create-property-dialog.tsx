import { Button } from "@propertyos/ui/components/button";
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
import { useState } from "react";

export function CreatePropertyDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");

  function reset() {
    setName("");
  }

  const canSubmit = name.trim().length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Property</DialogTitle>
          <DialogDescription>
            Give it a name to get started — you can fill in address, rooms,
            pricing, and everything else after.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5 px-4">
          <Label htmlFor="property-name">Property Name</Label>
          <Input
            id="property-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sunrise Villa"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            disabled={!canSubmit}
            onClick={() => {
              onCreate(name.trim());
              reset();
            }}
          >
            Create Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
