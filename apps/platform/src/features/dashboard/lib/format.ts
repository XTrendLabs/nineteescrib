/**
 * Formatting for the overview.
 *
 * Every money value crossing the API is in paise -- see the schema -- so these
 * take paise and divide once, here. Nothing upstream of this file should be
 * converting to rupees, or the two representations start drifting.
 */

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const INR_COMPACT = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatPaise(paise: number): string {
  return INR.format(paise / 100);
}

/** For axis ticks and dense tiles, where the full figure will not fit. */
export function formatPaiseCompact(paise: number): string {
  return INR_COMPACT.format(paise / 100);
}

/** Null means "no basis to compute a rate", and renders as an em dash. */
export function formatRate(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

/** A calendar day (YYYY-MM-DD) as a short label, without parsing to an instant. */
export function formatDayLabel(
  day: string,
  bucket: "day" | "week" | "month",
): string {
  const [year, month, date] = day.split("-").map(Number);
  // Constructed as UTC and read back as UTC: these are calendar days, and
  // going through local time would shift the label by one east of UTC.
  const d = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, date ?? 1));

  if (bucket === "month") {
    return d.toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });
  }

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

const SOURCE_LABELS: Record<string, string> = {
  direct: "Direct",
  manual: "Walk-in / Manual",
  airbnb: "Airbnb",
  booking_com: "Booking.com",
};

export function formatSource(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

const CATEGORY_LABELS: Record<string, string> = {
  maintenance: "Maintenance",
  utilities: "Utilities",
  supplies: "Supplies",
  salaries: "Salaries",
  admin: "Admin",
  marketing: "Marketing",
  capex: "Capex",
  other: "Other",
};

export function formatCategory(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
