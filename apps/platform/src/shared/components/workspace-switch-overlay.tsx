import { useSyncExternalStore } from "react";

import {
  getActiveViewState,
  subscribeActiveView,
} from "@/shared/lib/active-view-store";
import { LoadingOverlay } from "./loading-overlay";

/**
 * Shown only while the active organization is being switched. Switching
 * re-scopes every query on the page against a remote database, so without this
 * the UI shows stale data from the previous workspace until the refetch lands.
 */
export function WorkspaceSwitchOverlay() {
  const { isSwitching } = useSyncExternalStore(
    subscribeActiveView,
    getActiveViewState,
  );

  if (!isSwitching) return null;

  return <LoadingOverlay message="Switching workspace…" />;
}
