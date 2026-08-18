export function usagePercent(used: number, limit: number) {
  if (limit <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((used / limit) * 100));
}

export function maskApiKey(key: string, visible = 4) {
  if (key.length <= visible) {
    return key;
  }
  return `${"•".repeat(Math.max(key.length - visible, 6))}${key.slice(-visible)}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
