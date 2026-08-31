import { Badge } from "@propertyos/ui/components/badge";

import { type GuestTag, tagLabel } from "../lib/guest";

/**
 * Colours for the tags with a settled meaning. Anything an operator invents
 * falls back to the neutral pill -- a tag does not need a colour to be useful,
 * and guessing one from arbitrary text would be arbitrary too.
 */
const TAG_VARIANTS: Record<
  string,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  vip: "default",
  repeat: "success",
  needs_care: "warning",
};

export function TagPill({ tag }: { tag: GuestTag }) {
  return (
    <Badge variant={TAG_VARIANTS[tag] ?? "outline"} className="rounded-full">
      {tagLabel(tag)}
    </Badge>
  );
}
