import { differenceInCalendarDays, format, parseISO } from "date-fns";

export function formatInr(valuePaise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(valuePaise / 100);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * A "YYYY-MM-DD" day to a local `Date`.
 *
 * `parseISO` builds a date-only string in local time, which is what a calendar
 * day means here. `new Date("2026-03-01")` would parse it as UTC midnight and
 * render as the previous day west of Greenwich.
 */
function parseDay(day: string): Date {
  return parseISO(day);
}

/** The month of a guest's most recent stay, or a dash if they have not stayed. */
export function formatLastStay(date: string | null): string {
  if (!date) return "—";
  return format(parseDay(date), "MMM yyyy");
}

export function formatStayRange(checkIn: string, checkOut: string): string {
  const start = parseDay(checkIn);
  const end = parseDay(checkOut);
  const nights = differenceInCalendarDays(end, start);
  return `${format(start, "MMM d")} – ${format(end, "MMM d")} (${nights}n)`;
}

/** An ISO instant from the API, for note timestamps. */
export function formatNoteDate(value: string): string {
  return format(new Date(value), "MMM d, yyyy");
}
