// Distance + rough ETA helpers for the live "how far am I" feature.

export interface LatLng {
  lat: number;
  lng: number;
}

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rough ETA in minutes: walk if very close, otherwise a city-driving pace. */
export function etaMinutes(km: number): number {
  const speedKmh = km < 1.2 ? 4.8 : 18; // walking vs city Grab/taxi
  return Math.max(1, Math.round((km / speedKmh) * 60));
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

/** "1.4 km · ~6 min from you" */
export function formatEta(km: number): string {
  return `${formatDistance(km)} · ~${etaMinutes(km)} min from you`;
}
