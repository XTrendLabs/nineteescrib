import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { LoadingButton } from "@propertyos/ui/components/loading-button";
import { RichTextEditor } from "@propertyos/ui/components/rich-text-editor";
import { useEffect, useState } from "react";

import { api } from "@/shared/lib/api-client";
import { useUpsertPropertyRule } from "../api/use-upsert-property-rule";
import {
  PROPERTY_RULE_CATEGORY_DESCRIPTION,
  PROPERTY_RULE_CATEGORY_LABEL,
  type PropertyRuleCategory,
} from "../lib/property-rule";

export function PropertyRuleDialog({
  open,
  onOpenChange,
  propertyId,
  category,
  initialContent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  category: PropertyRuleCategory;
  initialContent: string;
}) {
  const upsertRule = useUpsertPropertyRule();
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (open) {
      setContent(initialContent);
      upsertRule.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialContent, upsertRule.reset]);

  function handleSubmit() {
    upsertRule.mutate(
      { param: { id: propertyId }, json: { category, content } },
      {
        onSuccess: () => {
          api.api.platform.properties[":id"].rules.$get.invalidate({
            param: { id: propertyId },
          });
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{PROPERTY_RULE_CATEGORY_LABEL[category]}</DialogTitle>
          <DialogDescription>
            {PROPERTY_RULE_CATEGORY_DESCRIPTION[category]}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 px-4">
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Start typing…"
          />

          {upsertRule.isError && (
            <p className="text-destructive text-xs">
              Something went wrong saving this. Please try again.
            </p>
          )}
        </div>

        <DialogFooter>
          <LoadingButton
            type="button"
            loading={upsertRule.isPending}
            loadingText="Saving…"
            disabled={content === ""}
            onClick={handleSubmit}
          >
            Save
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
