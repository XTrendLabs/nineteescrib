import { useSyncExternalStore } from "react";

import {
  getActiveViewState,
  selectHq,
  selectProperty,
  subscribeActiveView,
} from "./active-view-store";

export function useActiveView() {
  const state = useSyncExternalStore(subscribeActiveView, getActiveViewState);

  return {
    activeView: state.activeView,
    activePropertyName: state.activePropertyName,
    selectHq,
    selectProperty,
  };
}
