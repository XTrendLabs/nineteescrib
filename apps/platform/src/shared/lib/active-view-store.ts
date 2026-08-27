export type ActiveView =
  | { type: "hq" }
  | { type: "property"; propertyId: string };

export type ActiveViewState = {
  activeView: ActiveView;
  activePropertyName: string | undefined;
  /**
   * True while the active organization is being switched. Switching re-scopes
   * every query on the page, so the app shows an overlay until it settles.
   */
  isSwitching: boolean;
};

type Listener = () => void;

let state: ActiveViewState = {
  activeView: { type: "hq" },
  activePropertyName: undefined,
  isSwitching: false,
};

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeActiveView(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getActiveViewState() {
  return state;
}

export function setHqView() {
  state = {
    ...state,
    activeView: { type: "hq" },
    activePropertyName: undefined,
  };
  emit();
}

export function setPropertyView(propertyId: string, name: string) {
  state = {
    ...state,
    activeView: { type: "property", propertyId },
    activePropertyName: name,
  };
  emit();
}

export function setSwitching(isSwitching: boolean) {
  if (state.isSwitching === isSwitching) return;
  state = { ...state, isSwitching };
  emit();
}
