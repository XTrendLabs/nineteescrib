import { endOfMonth, format, startOfMonth } from "date-fns";

/**
 * A calendar day as `yyyy-MM-dd`, in the viewer's own timezone.
 *
 * `toISOString().slice(0, 10)` converts to UTC first, which lands on the
 * previous day for anyone east of UTC -- in IST every date before 05:30 local
 * shifts back one. `date-fns` formats the local date, so the day the user
 * clicked is the day that gets stored.
 */
export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** The `from`/`to` pair covering the month `date` falls in. */
export function monthRange(date: Date): { from: string; to: string } {
  return {
    from: toDateKey(startOfMonth(date)),
    to: toDateKey(endOfMonth(date)),
  };
}
