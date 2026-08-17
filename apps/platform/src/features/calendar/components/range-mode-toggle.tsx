import { cn } from "@propertyos/ui/lib/utils";

export type RangeMode = "day" | "week" | "month";

const OPTIONS: { value: RangeMode; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export function RangeModeToggle({
  value,
  onChange,
}: {
  value: RangeMode;
  onChange: (value: RangeMode) => void;
}) {
  return (
    <div className="flex items-center border">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "px-2.5 py-1.5 text-xs transition-colors",
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
