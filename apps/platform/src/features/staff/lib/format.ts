import { format } from "date-fns";

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) {
    return phone;
  }
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export function formatJoinedDate(date: Date): string {
  return format(date, "MMMM yyyy");
}

export function formatDateTime(date: Date): string {
  return format(date, "MMM d, h:mm a");
}

export function formatDay(date: Date): string {
  return format(date, "MMM d");
}
