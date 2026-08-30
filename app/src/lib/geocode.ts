// Free, keyless forward geocoding via Nominatim (OpenStreetMap). Used to place a
// user-added stop on the map. Low-volume, best-effort — returns null on failure
// so adding a stop never blocks on the network.
export interface GeoHit {
  lat: number;
  lng: number;
  label: string;
}

const ENDPOINT = process.env.EXPO_PUBLIC_NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search';

/**
 * Resolve a place name to coordinates. `near` biases the query (e.g. the trip's
 * city/country) so "Star City" resolves to the right place.
 */
export async function geocode(query: string, near?: string): Promise<GeoHit | null> {
  const q = [query, near].filter(Boolean).join(', ');
  if (!q.trim()) return null;
  try {
    const url = `${ENDPOINT}?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'Wayfare/1.0' } });
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const hit = arr?.[0];
    if (!hit) return null;
    return { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name };
  } catch {
    return null;
  }
}
