import { format } from "date-fns";

export function formatInr(valuePaise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(valuePaise / 100);
}

export function formatDateShort(date: Date): string {
  return format(date, "MMM d, yyyy");
}

export function formatDateLong(date: Date): string {
  return format(date, "EEEE, MMMM d, yyyy");
}

export function formatMinutesSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
