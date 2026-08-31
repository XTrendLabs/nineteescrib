import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Input } from "@propertyos/ui/components/input";
import { PhoneInput } from "@propertyos/ui/components/phone-input";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { useEffect, useState } from "react";

import { getApiErrorMessage } from "@/shared/lib/api-error";
import { useUpdateGuest } from "../api/use-update-guest";
import type { Guest } from "../lib/guest";
import { TagEditor } from "./tag-editor";

export function EditGuestDialog({
  guest,
  tagsInUse,
  onOpenChange,
  onSaved,
  onAddTag,
  onRemoveTag,
  isTagSaving,
}: {
  guest: Guest | null;
  tagsInUse: string[];
  onOpenChange: (open: boolean) => void;
  onSaved: (guestId: string) => void;
  onAddTag: (guestId: string, tag: string) => void;
  onRemoveTag: (guestId: string, tag: string) => void;
  isTagSaving?: boolean;
}) {
  const feedback = useFeedback();
  const updateGuest = useUpdateGuest();
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  // Reloaded whenever a different guest is opened, so the form always shows
  // the profile being edited rather than whoever was opened first.
  useEffect(() => {
    if (!guest) return;
    setForm({
      name: guest.name,
      phone: guest.phone,
      email: guest.email ?? "",
    });
  }, [guest]);

  const canSave =
    form.name.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    !updateGuest.isPending;

  function handleSave() {
    if (!guest || !canSave) return;

    updateGuest.mutate(
      {
        param: { id: guest.id },
        json: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
        },
      },
      {
        onSuccess: () => {
          onSaved(guest.id);
          feedback.success(
            "Guest updated",
            `${form.name.trim()} has been updated.`,
          );
          onOpenChange(false);
        },
        onError: (error) => {
          feedback.error(
            "Couldn't update guest",
            getApiErrorMessage(error, "Something went wrong. Try again."),
          );
        },
      },
    );
  }

  return (
    <Dialog open={guest !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Guest</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">Full Name *</span>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs">Phone *</span>
              <PhoneInput
                value={form.phone}
                onChange={(value) => setForm({ ...form, phone: value })}
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
            <span className="text-muted-foreground text-xs">Tags</span>
            {/* Tags save immediately rather than on Save Changes: each is its
                own row, and mixing the two would make Cancel ambiguous. */}
            {guest && (
              <TagEditor
                tags={guest.tags}
                tagsInUse={tagsInUse}
                onAdd={(tag) => onAddTag(guest.id, tag)}
                onRemove={(tag) => onRemoveTag(guest.id, tag)}
                disabled={isTagSaving}
              />
            )}
          </div>

          {/* Notes live in the profile drawer's timeline, one entry each, so
              they are not editable as a single field here. */}
          <p className="text-[11px] text-muted-foreground">
            Changing the phone number changes how this guest is matched on
            future bookings. Tags are saved as you add them.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={updateGuest.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={!canSave} onClick={handleSave}>
            {updateGuest.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
