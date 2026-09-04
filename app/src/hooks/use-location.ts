// Live device location. Works on web (browser geolocation) and native via
// expo-location. Watches position so distance/ETA update as you move.
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

import type { LatLng } from '@/lib/geo';

export type LocationStatus = 'idle' | 'granted' | 'denied' | 'unavailable';

export interface LiveLocation {
  coords: LatLng | null;
  /** Compass heading in degrees (0 = north), or null when unknown/stationary. */
  heading: number | null;
  status: LocationStatus;
  error?: string;
}

// expo/web report heading as -1 or null when it can't be determined.
function cleanHeading(h: number | null | undefined): number | null {
  return typeof h === 'number' && h >= 0 ? h : null;
}

export function useLocation(enabled = true): LiveLocation {
  const [state, setState] = useState<LiveLocation>({ coords: null, heading: null, status: 'idle' });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let sub: Location.LocationSubscription | undefined;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setState({ coords: null, heading: null, status: 'denied' });
          return;
        }
        // Immediate one-shot fix (watch alone can be slow to first-emit).
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (!cancelled)
            setState({ coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, heading: cleanHeading(pos.coords.heading), status: 'granted' });
        } catch {
          /* fall through to the watcher */
        }
        // Then keep it live as the user moves.
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
          (pos) => {
            if (!cancelled) {
              setState((prev) => ({
                coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                // Keep the last known heading when a fix reports none.
                heading: cleanHeading(pos.coords.heading) ?? prev.heading,
                status: 'granted',
              }));
            }
          },
        );
      } catch (e) {
        if (!cancelled) setState({ coords: null, heading: null, status: 'unavailable', error: (e as Error).message });
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);

  return state;
}
