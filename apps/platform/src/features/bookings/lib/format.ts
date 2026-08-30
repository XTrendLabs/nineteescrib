import { differenceInCalendarDays, format, parseISO } from "date-fns";

export function formatInr(valuePaise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(valuePaise / 100);
}

/**
 * A "YYYY-MM-DD" day to a local `Date`.
 *
 * `parseISO` on a date-only string builds it in local time, which is what a
 * calendar day means here. `new Date("2026-03-01")` would instead parse it as
 * UTC midnight and render as the previous day west of Greenwich.
 */
export function parseDay(day: string): Date {
  return parseISO(day);
}

export function formatStayRange(checkIn: string, checkOut: string): string {
  const start = parseDay(checkIn);
  const end = parseDay(checkOut);
  const nights = differenceInCalendarDays(end, start);
  return `${format(start, "MMM d")} – ${format(end, "MMM d")} (${nights}n)`;
}

/** An ISO instant from the API, for audit lines. */
export function formatTimestamp(value: string): string {
  return format(new Date(value), "MMM d, h:mm a");
}
