import { cn } from "@propertyos/ui/lib/utils";
import { LayoutGridIcon, ListTreeIcon } from "lucide-react";

export type CalendarView = "hq" | "detailed";

export function ViewToggle({
  value,
  onChange,
}: {
  value: CalendarView;
  onChange: (value: CalendarView) => void;
}) {
  return (
    <div className="flex items-center border">
      <button
        type="button"
        onClick={() => onChange("hq")}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors",
          value === "hq"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        <LayoutGridIcon className="size-3.5" />
        Global HQ View
      </button>
      <button
        type="button"
        onClick={() => onChange("detailed")}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors",
          value === "detailed"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        <ListTreeIcon className="size-3.5" />
        Detailed Unit Grid
      </button>
    </div>
  );
}
