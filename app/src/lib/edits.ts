// Reactive edit signal: after adding/removing a stop we bump a version; screens
// that include `useEditsVersion()` in their data deps refetch automatically —
// reliable across screens without depending on navigation focus events.
import { useSyncExternalStore } from 'react';

let version = 0;
const listeners = new Set<() => void>();

export const edits = {
  /** Signal that an itinerary changed (a stop was added/removed). */
  markStale() {
    version += 1;
    listeners.forEach((l) => l());
  },
};

export function useEditsVersion(): number {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
    () => version,
  );
}
