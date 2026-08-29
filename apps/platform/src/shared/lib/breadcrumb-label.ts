import { useEffect, useSyncExternalStore } from "react";

/**
 * Labels for dynamic route segments, so the breadcrumb can show a name where
 * the URL only carries an id.
 *
 * The header renders outside the route's component tree, so the page publishes
 * its label here rather than passing it down.
 */
let labels: Record<string, string> = {};
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getLabels() {
  return labels;
}

export function useBreadcrumbLabels() {
  return useSyncExternalStore(subscribe, getLabels, getLabels);
}

/**
 * Registers a display name for one URL segment (e.g. a staff id -> their
 * name). Clears it on unmount so a stale name never shows on the next page.
 */
export function useBreadcrumbLabel(
  segment: string | undefined,
  label: string | undefined,
) {
  useEffect(() => {
    if (!segment || !label) return;
    labels = { ...labels, [segment]: label };
    emit();

    return () => {
      const { [segment]: _removed, ...rest } = labels;
      labels = rest;
      emit();
    };
  }, [segment, label]);
}
