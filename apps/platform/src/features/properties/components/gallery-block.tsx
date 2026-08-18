import { cn } from "@propertyos/ui/lib/utils";
import { ImageIcon } from "lucide-react";

const PALETTE = [
  "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
];

/**
 * Deterministic placeholder "photo" block — no external image URLs are used
 * anywhere in the Properties feature.
 */
export function GalleryBlock({
  colorIndex,
  label,
  className,
}: {
  colorIndex: number;
  label?: string;
  className?: string;
}) {
  const palette = PALETTE[colorIndex % PALETTE.length];
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 border border-border",
        palette,
        className,
      )}
    >
      <ImageIcon className="size-5 opacity-60" />
      {label && (
        <span className="px-1 text-center text-[10px] opacity-80">{label}</span>
      )}
    </div>
  );
}
