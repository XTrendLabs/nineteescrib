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
import { useState } from "react";

type ConfirmDestructiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  /** When set, the user must type this exact text to enable the confirm button. */
  confirmationText?: string;
  onConfirm: () => void;
};

export function ConfirmDestructiveDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmationText,
  onConfirm,
}: ConfirmDestructiveDialogProps) {
  const [typed, setTyped] = useState("");

  const isDisabled = Boolean(confirmationText) && typed !== confirmationText;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setTyped("");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {confirmationText && (
          <div className="flex flex-col gap-1.5 px-4 pb-4">
            <span className="text-muted-foreground text-xs">
              Type{" "}
              <span className="font-mono font-semibold text-foreground">
                {confirmationText}
              </span>{" "}
              to confirm.
            </span>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={confirmationText}
              autoComplete="off"
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isDisabled}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
              setTyped("");
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
