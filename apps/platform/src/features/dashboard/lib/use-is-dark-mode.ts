import { useTheme } from "@/components/theme-provider";

/**
 * Resolves the app's next-themes state to a boolean for chart color
 * selection. Falls back to system preference when theme is "system".
 */
export function useIsDarkMode(): boolean {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark";
}
