import { cn } from "@propertyos/ui/lib/utils";

export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-none border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-bold text-[10px] text-amber-600 uppercase tracking-wider dark:text-amber-400",
        className,
      )}
    >
      Pro
    </span>
  );
}
