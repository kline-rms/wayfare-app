// Live device location. Works on web (browser geolocation) and native via
// expo-location. Watches position so distance/ETA update as you move.
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

import { haversineKm, type LatLng } from '@/lib/geo';

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

// Compass bearing (deg, 0 = north) from a → b — the movement-derived heading
// fallback for devices/browsers that don't report a compass heading.
function bearingDeg(a: LatLng, b: LatLng): number {
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
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
            if (cancelled) return;
            setState((prev) => {
              const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              // Prefer the device compass; else derive heading from movement;
              // else keep the last known so the arrow doesn't snap to north.
              let heading = cleanHeading(pos.coords.heading);
              if (heading == null && prev.coords && haversineKm(prev.coords, coords) > 0.008) {
                heading = bearingDeg(prev.coords, coords);
              }
              return { coords, heading: heading ?? prev.heading, status: 'granted' };
            });
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
