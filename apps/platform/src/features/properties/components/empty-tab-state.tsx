import { Button } from "@propertyos/ui/components/button";
import type { LucideIcon } from "lucide-react";

export function EmptyTabState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 border border-dashed py-16 text-center">
      <Icon className="size-6 text-muted-foreground" />
      <p className="font-medium text-sm">{title}</p>
      <p className="max-w-sm text-muted-foreground text-xs">{description}</p>
      <Button size="sm" className="mt-2" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
