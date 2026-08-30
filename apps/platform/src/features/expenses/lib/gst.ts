/**
 * GST arithmetic, in paise.
 *
 * Every function here works in whole paise and rounds once, at the end. The
 * three figures are always derived together so they cannot disagree: whatever
 * the mode, `base + gst === total` exactly, with any rounding remainder
 * absorbed into the GST line rather than left to drift.
 */

export type GstMode = "exclusive" | "inclusive";

export const GST_RATE_OPTIONS = [0, 500, 1200, 1800, 2800] as const;

/** Basis points to a display string: 1800 -> "18", 250 -> "2.5". */
export function bpsToPercentLabel(bps: number): string {
  return String(Math.round(bps) / 100);
}

/** A typed percent to basis points: "18" -> 1800, "2.5" -> 250. */
export function percentToBps(value: string): number {
  const percent = Number(value);
  if (!Number.isFinite(percent) || percent < 0) return 0;
  return Math.round(percent * 100);
}

export type GstBreakdown = {
  /** Pre-tax amount. */
  basePaise: number;
  /** The tax itself. */
  gstPaise: number;
  /** What is actually owed: always `basePaise + gstPaise`. */
  totalPaise: number;
};

/**
 * Splits an entered amount into base, GST and total.
 *
 * `exclusive` treats `amountPaise` as the pre-tax base and adds tax on top.
 * `inclusive` treats it as the final payable and works the tax back out of it,
 * so the total always equals what was typed.
 */
export function computeGst(
  amountPaise: number,
  rateBps: number,
  mode: GstMode,
): GstBreakdown {
  const amount = Math.max(0, Math.round(amountPaise));
  const rate = Math.max(0, Math.round(rateBps));

  if (rate === 0) {
    return { basePaise: amount, gstPaise: 0, totalPaise: amount };
  }

  if (mode === "inclusive") {
    // amount = base * (1 + rate); so base = amount / (1 + rate).
    // The base is rounded and the tax taken as the remainder, which keeps
    // base + gst exactly equal to the amount the user typed.
    const basePaise = Math.round((amount * 10_000) / (10_000 + rate));
    return {
      basePaise,
      gstPaise: amount - basePaise,
      totalPaise: amount,
    };
  }

  const gstPaise = Math.round((amount * rate) / 10_000);
  return {
    basePaise: amount,
    gstPaise,
    totalPaise: amount + gstPaise,
  };
}

/**
 * Recovers the amount to show in the input from a stored expense.
 *
 * The form's amount box holds the base when GST was added on top, and the
 * gross when it was included -- which is what `computeGst` consumes, so an
 * edit round-trips to the same three figures it was saved with.
 */
export function amountFromStored(
  totalPaise: number,
  taxPaise: number,
  mode: GstMode,
): number {
  return mode === "inclusive" ? totalPaise : totalPaise - taxPaise;
}
