import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { Input } from "@propertyos/ui/components/input";
import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";

import {
  DERIVED_TAGS,
  MAX_TAG_LENGTH,
  normalizeTag,
  SUGGESTED_TAGS,
  tagLabel,
} from "../lib/guest";
import { TagPill } from "./tag-pill";

/**
 * Adds and removes a guest's tags.
 *
 * Tags are free text, so this is an input with suggestions rather than a fixed
 * set of toggles: an operator can file guests by whatever vocabulary their
 * business uses. Suggestions come from the tags already in use across the HQ,
 * which keeps the vocabulary converging instead of fragmenting into
 * near-duplicates.
 */
export function TagEditor({
  tags,
  tagsInUse,
  onAdd,
  onRemove,
  disabled,
}: {
  tags: string[];
  tagsInUse: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const normalized = normalizeTag(draft);
  const isDerived = DERIVED_TAGS.includes(normalized);
  const alreadyOn = tags.includes(normalized);
  const canAdd =
    normalized.length > 0 &&
    normalized.length <= MAX_TAG_LENGTH &&
    !isDerived &&
    !alreadyOn &&
    !disabled;

  // Tags used elsewhere in the HQ that this guest does not have yet, plus the
  // starter set when an operator has not built a vocabulary of their own.
  const suggestions = [...new Set([...tagsInUse, ...SUGGESTED_TAGS])]
    .filter((tag) => !tags.includes(tag) && !DERIVED_TAGS.includes(tag))
    .slice(0, 8);

  function commit() {
    if (!canAdd) return;
    onAdd(normalized);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.length === 0 && (
          <span className="text-muted-foreground text-xs">No tags yet.</span>
        )}
        {tags.map((tag) =>
          // "repeat" is derived from the stay count, so it is shown but cannot
          // be removed -- there is nothing stored to remove.
          DERIVED_TAGS.includes(tag) ? (
            <TagPill key={tag} tag={tag} />
          ) : (
            <Badge
              key={tag}
              variant="outline"
              className="gap-1 rounded-full pr-1"
            >
              {tagLabel(tag)}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onRemove(tag)}
                className="rounded-full p-0.5 transition-colors hover:bg-muted disabled:opacity-50"
                aria-label={`Remove ${tagLabel(tag)}`}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ),
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Input
          value={draft}
          disabled={disabled}
          maxLength={MAX_TAG_LENGTH}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // The editor often sits inside a dialog form; Enter should add a
              // tag, not submit whatever is around it.
              e.preventDefault();
              commit();
            }
          }}
          placeholder="Add a tag..."
          className="h-8 text-xs"
        />
        <Button
          variant="outline"
          size="icon-sm"
          disabled={!canAdd}
          onClick={commit}
        >
          <PlusIcon />
        </Button>
      </div>

      {isDerived && (
        <p className="text-[11px] text-warning">
          “{tagLabel(normalized)}” is applied automatically from stay history.
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] text-muted-foreground">Suggested:</span>
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => onAdd(tag)}
              className="rounded-full border px-2 py-0.5 text-[11px] transition-colors hover:bg-muted disabled:opacity-50"
            >
              {tagLabel(tag)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
