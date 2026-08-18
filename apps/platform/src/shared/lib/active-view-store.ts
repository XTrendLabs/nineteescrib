export type ActiveView =
  | { type: "hq" }
  | { type: "property"; propertyId: string };

export type ActiveViewState = {
  activeView: ActiveView;
  activePropertyName: string | undefined;
};

type Listener = () => void;

let state: ActiveViewState = {
  activeView: { type: "hq" },
  activePropertyName: undefined,
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

export function selectHq() {
  state = { activeView: { type: "hq" }, activePropertyName: undefined };
  emit();
}

export function selectProperty(propertyId: string, name: string) {
  state = {
    activeView: { type: "property", propertyId },
    activePropertyName: name,
  };
  emit();
}
