// Walking-route geometry for the map. Uses OSRM (open-source, free) — the public
// demo server by default; point EXPO_PUBLIC_OSRM_URL at a self-hosted OSRM for
// production. Falls back to straight segments so the map always draws something.
import type { LineGeometry, MapStop } from '@/components/wayfare/wayfare-map.shared';

export async function walkRoute(stops: Pick<MapStop, 'lat' | 'lng'>[]): Promise<LineGeometry> {
  const straight: LineGeometry = { type: 'LineString', coordinates: stops.map((s) => [s.lng, s.lat]) };
  if (stops.length < 2) return straight;
  const coords = stops.map((s) => `${s.lng},${s.lat}`).join(';');
  const base = process.env.EXPO_PUBLIC_OSRM_URL ?? 'https://router.project-osrm.org';
  try {
    const res = await fetch(`${base}/route/v1/walking/${coords}?overview=full&geometries=geojson`);
    if (!res.ok) return straight;
    const data = (await res.json()) as { routes?: { geometry?: LineGeometry }[] };
    const g = data.routes?.[0]?.geometry;
    return g?.type === 'LineString' && g.coordinates?.length ? g : straight;
  } catch {
    return straight;
  }
}
