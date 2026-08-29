export type ActiveView =
  | { type: "hq" }
  | { type: "property"; propertyId: string };

type Listener = () => void;

/**
 * Only the transient switch flag lives here. The selected scope itself is not
 * stored: it is derived from Better Auth's active organization, so it is
 * already correct on a fresh login and can never drift from what the server
 * authorizes against.
 */
let isSwitching = false;

const listeners = new Set<Listener>();

export function subscribeActiveView(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getIsSwitching() {
  return isSwitching;
}

export function setSwitching(next: boolean) {
  if (isSwitching === next) return;
  isSwitching = next;
  for (const listener of listeners) {
    listener();
  }
}
