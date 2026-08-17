import { differenceInCalendarDays, format } from "date-fns";

export function formatInr(valuePaise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(valuePaise / 100);
}

export function formatStayRange(checkIn: Date, checkOut: Date): string {
  const nights = differenceInCalendarDays(checkOut, checkIn);
  return `${format(checkIn, "MMM d")} – ${format(checkOut, "MMM d")} (${nights}n)`;
}
