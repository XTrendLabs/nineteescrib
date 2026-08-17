import { Badge } from "@propertyos/ui/components/badge";

import type { GuestTag } from "../lib/mock-data";

const TAG_CONFIG: Record<
  GuestTag,
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  vip: { label: "VIP", variant: "default" },
  repeat: { label: "Repeat", variant: "success" },
  needs_care: { label: "Needs Care", variant: "warning" },
};

export function TagPill({ tag }: { tag: GuestTag }) {
  const config = TAG_CONFIG[tag];
  return (
    <Badge variant={config.variant} className="rounded-full">
      {config.label}
    </Badge>
  );
}
