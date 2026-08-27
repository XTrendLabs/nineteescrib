import { LoadingOverlay } from "./loading-overlay";

/**
 * Router pending state. Rendered as a full-screen overlay rather than inline,
 * so a route that is still loading does not leave a blank panel where the page
 * will be.
 */
export function Loading() {
  return <LoadingOverlay message="Loading…" />;
}
