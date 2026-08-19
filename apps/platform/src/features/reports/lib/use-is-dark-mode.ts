import { useTheme } from "@/components/theme-provider";

export function useIsDarkMode(): boolean {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark";
}
