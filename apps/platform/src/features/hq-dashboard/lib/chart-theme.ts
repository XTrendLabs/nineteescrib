/**
 * Monochrome chart palette per hq_dashboard_design.md §1 ("Monochrome Charts")
 * and DESIGN.md's near-monochrome brand voice. Fixed hue-free order —
 * property 1 is always the darkest slot, property 4 always the striped
 * hollow — so identity never depends on hue, which sidesteps CVD-separation
 * entirely by not encoding identity in hue at all. Direct labels + legend
 * are always shipped alongside these (see components) as the secondary
 * encoding, since lightness alone is a weaker identity channel than hue.
 */

export const CHART_SLOTS_LIGHT = [
  "#111111", // property 1 — solid black
  "#6b7280", // property 2 — slate gray
  "#a8adb5", // property 3 — mid gray (kept a step darker than d1d5db for 3:1 contrast)
  "#d1d5db", // property 4 — light gray (paired with a hatch texture below)
] as const;

export const CHART_SLOTS_DARK = [
  "#f5f5f5", // property 1 — near-white
  "#a1a1aa", // property 2 — light slate
  "#71717a", // property 3 — mid slate
  "#52525b", // property 4 — darker slate (paired with hatch texture)
] as const;

export const CHART_SURFACE_LIGHT = "#f5f5f5";
export const CHART_SURFACE_DARK = "#1a1a1a";

export function getChartSlot(index: number, isDark: boolean): string {
  const slots = isDark ? CHART_SLOTS_DARK : CHART_SLOTS_LIGHT;
  return slots[index % slots.length];
}

/** The 4th+ slot renders with a diagonal-stripe pattern fill, per spec, as the texture/secondary-encoding channel. */
export function usesStripePattern(index: number): boolean {
  return index % CHART_SLOTS_LIGHT.length === 3;
}
