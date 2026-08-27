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
import { LoadingButton } from "@propertyos/ui/components/loading-button";
import { useState } from "react";

import { useCreateProperty } from "../api/use-create-property";

const MIN_NAME_LENGTH = 2;

export function CreatePropertyDialog({
  open,
  onOpenChange,
  organizationId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string | undefined;
  onCreated: (slug: string) => void;
}) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const createProperty = useCreateProperty();

  function reset() {
    setName("");
    setTouched(false);
    createProperty.reset();
  }

  const trimmedName = name.trim();
  const validationError =
    trimmedName.length === 0
      ? "Property name is required"
      : trimmedName.length < MIN_NAME_LENGTH
        ? `Property name must be at least ${MIN_NAME_LENGTH} characters`
        : null;

  const canSubmit = validationError === null && Boolean(organizationId);

  function handleSubmit() {
    setTouched(true);
    if (!canSubmit || !organizationId) return;

    createProperty.mutate(
      { json: { hqOrganizationId: organizationId, name: trimmedName } },
      {
        onSuccess: (data) => {
          reset();
          onOpenChange(false);
          onCreated(data.data.slug);
        },
      },
    );
  }

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
            onBlur={() => setTouched(true)}
            placeholder="e.g. Sunrise Villa"
            aria-invalid={touched && validationError !== null}
            autoFocus
          />
          {touched && validationError && (
            <p className="text-destructive text-xs">{validationError}</p>
          )}
          {createProperty.isError && (
            <p className="text-destructive text-xs">
              Something went wrong creating this property. Please try again.
            </p>
          )}
        </div>
        <DialogFooter>
          <LoadingButton
            loading={createProperty.isPending}
            loadingText="Creating…"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Create Property
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
