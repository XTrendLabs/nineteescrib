import { differenceInDays, format } from "date-fns";

export function formatInrFromPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}

export function formatDateShort(date: Date): string {
  return format(date, "MMM d");
}

export function formatDateTime(date: Date): string {
  return format(date, "MMM d, h:mm a");
}

/**
 * Relative due-date label anchored on "today" (2026-08-19), e.g.
 * "Due in 3 days", "Due today", "Overdue by 2 days".
 */
export function formatDueRelative(dueDate: Date): string {
  const today = new Date("2026-08-19T00:00:00");
  const diff = differenceInDays(dueDate, today);
  if (diff === 0) {
    return "Due today";
  }
  if (diff > 0) {
    return `Due in ${diff} day${diff === 1 ? "" : "s"}`;
  }
  const overdue = Math.abs(diff);
  return `Overdue by ${overdue} day${overdue === 1 ? "" : "s"}`;
}

export function isOverdue(dueDate: Date): boolean {
  const today = new Date("2026-08-19T00:00:00");
  return differenceInDays(dueDate, today) < 0;
}
