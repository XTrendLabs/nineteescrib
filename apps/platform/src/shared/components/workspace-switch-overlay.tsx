import { useSyncExternalStore } from "react";

import {
  getIsSwitching,
  subscribeActiveView,
} from "@/shared/lib/active-view-store";
import { LoadingOverlay } from "./loading-overlay";

/**
 * Shown only while the active organization is being switched. Switching
 * re-scopes every query on the page against a remote database, so without this
 * the UI shows stale data from the previous workspace until the refetch lands.
 */
export function WorkspaceSwitchOverlay() {
  const isSwitching = useSyncExternalStore(subscribeActiveView, getIsSwitching);

  if (!isSwitching) return null;

  return <LoadingOverlay message="Switching workspace…" />;
}
