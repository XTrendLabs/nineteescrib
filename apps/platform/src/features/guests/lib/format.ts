import { format } from "date-fns";

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

export function formatLastStay(propertyName: string, date: Date): string {
  return `${propertyName} · ${format(date, "MMM yyyy")}`;
}
