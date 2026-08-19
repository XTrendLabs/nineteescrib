import { cn } from "@propertyos/ui/lib/utils";
import { CATEGORY_LABELS, type ExpenseCategory } from "../lib/mock-data";

export function CategoryBadge({
  category,
  className,
}: {
  category: ExpenseCategory;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center whitespace-nowrap border border-transparent bg-muted px-2 py-0.5 font-medium text-[11px] text-muted-foreground leading-normal",
        className,
      )}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}
