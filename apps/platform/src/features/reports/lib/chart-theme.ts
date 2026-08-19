/**
 * Monochrome chart palette, matching hq-dashboard/lib/chart-theme.ts so
 * report charts stay visually consistent with the rest of the app.
 */
export const CHART_SLOTS_LIGHT = [
  "#111111",
  "#6b7280",
  "#a8adb5",
  "#d1d5db",
] as const;
export const CHART_SLOTS_DARK = [
  "#f5f5f5",
  "#a1a1aa",
  "#71717a",
  "#52525b",
] as const;

export function getChartSlot(index: number, isDark: boolean): string {
  const slots = isDark ? CHART_SLOTS_DARK : CHART_SLOTS_LIGHT;
  return slots[index % slots.length];
}
