import { cn } from "@propertyos/ui/lib/utils";
import { ITEM_TYPE_LABELS, type LineItemType } from "../lib/mock-data";

export function ItemTypeBadge({
  itemType,
  className,
}: {
  itemType: LineItemType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center whitespace-nowrap border border-transparent bg-muted px-2 py-0.5 font-medium text-[11px] text-muted-foreground leading-normal",
        className,
      )}
    >
      {ITEM_TYPE_LABELS[itemType]}
    </span>
  );
}
