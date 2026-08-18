import { cn } from "@propertyos/ui/lib/utils";
import { ROLE_LABELS, type StaffRole } from "../lib/mock-data";

const ROLE_STYLES: Record<StaffRole, string> = {
  admin:
    "border-transparent bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900",
  manager:
    "border-transparent bg-neutral-700 text-white dark:bg-neutral-300 dark:text-neutral-900",
  caretaker:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  housekeeping:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
};

export function RoleBadge({
  role,
  className,
}: {
  role: StaffRole;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center whitespace-nowrap border px-2 py-0.5 font-medium text-[11px] leading-normal",
        ROLE_STYLES[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
