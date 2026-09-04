// Walking-route geometry for the map. Uses OSRM (open-source, free) — the public
// demo server by default; point EXPO_PUBLIC_OSRM_URL at a self-hosted OSRM for
// production. Falls back to straight segments so the map always draws something.
import type { LineGeometry, MapStop } from '@/components/wayfare/wayfare-map.shared';
import { haversineKm, type LatLng } from '@/lib/geo';

const OSRM_BASE = process.env.EXPO_PUBLIC_OSRM_URL ?? 'https://router.project-osrm.org';

export type TravelProfile = 'driving' | 'walking' | 'cycling';

export interface NavStep {
  /** Human-readable maneuver, e.g. "Turn right onto Rizal Drive". */
  instruction: string;
  /** Length of this step in metres. */
  distanceM: number;
  /** Road/place name for the step, when OSRM provides one. */
  name?: string;
  /** OSRM maneuver type (turn, continue, arrive, …) — drives the step icon. */
  type: string;
  /** OSRM modifier (left, right, slight left, …). */
  modifier?: string;
  /** Where the maneuver happens: [lng, lat]. */
  location: [number, number];
}

export interface Directions {
  geometry: LineGeometry;
  /** Total route distance in metres. */
  distanceM: number;
  /** Estimated travel time in seconds. */
  durationS: number;
  steps: NavStep[];
  profile: TravelProfile;
  /** True when OSRM couldn't route and we drew a straight A→B fallback. */
  approximate: boolean;
}

// Rough travel speeds (m/s) for the straight-line fallback ETA when OSRM is
// unreachable or lacks the requested profile (its public demo is car-only).
const FALLBACK_SPEED: Record<TravelProfile, number> = { driving: 11.1, cycling: 4.2, walking: 1.4 };

const CARDINAL = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
function bearingWord(from: LatLng, to: LatLng): string {
  const y = Math.sin(((to.lng - from.lng) * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180);
  const x =
    Math.cos((from.lat * Math.PI) / 180) * Math.sin((to.lat * Math.PI) / 180) -
    Math.sin((from.lat * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180) * Math.cos(((to.lng - from.lng) * Math.PI) / 180);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return CARDINAL[Math.round(((deg + 360) % 360) / 45) % 8];
}

/** Turn an OSRM maneuver into a readable one-liner. */
function describe(maneuver: { type?: string; modifier?: string } | undefined, name?: string): string {
  const type = maneuver?.type ?? 'continue';
  const mod = maneuver?.modifier;
  const onto = name ? ` onto ${name}` : '';
  const on = name ? ` on ${name}` : '';
  switch (type) {
    case 'depart':
      return `Head ${mod ?? ''}`.trim() + (name ? ` on ${name}` : '');
    case 'turn':
      return `Turn ${mod ?? ''}`.trim() + onto;
    case 'new name':
      return `Continue${on}`;
    case 'continue':
      return `Continue ${mod ?? 'straight'}`.trim() + on;
    case 'merge':
      return `Merge ${mod ?? ''}`.trim() + onto;
    case 'on ramp':
      return `Take the ramp ${mod ?? ''}`.trim() + onto;
    case 'off ramp':
      return `Take the exit ${mod ?? ''}`.trim() + onto;
    case 'fork':
      return `Keep ${mod ?? 'straight'}`.trim() + ' at the fork' + onto;
    case 'roundabout':
    case 'rotary':
      return `Enter the roundabout` + onto;
    case 'end of road':
      return `Turn ${mod ?? ''}`.trim() + ' at the end of the road' + onto;
    case 'arrive':
      return `Arrive at your destination`;
    default:
      return (name ? `Continue on ${name}` : 'Continue') + (mod ? ` (${mod})` : '');
  }
}

/**
 * Full A→B directions for the in-app navigator: real geometry + turn-by-turn
 * steps + distance/ETA. Tries the requested profile; on any failure (network,
 * or a profile the server lacks) returns a straight-line, approximate route so
 * the navigator still works offline-ish. No API key, $0.
 */
export async function directions(from: LatLng, to: LatLng, profile: TravelProfile = 'driving'): Promise<Directions> {
  const km = haversineKm(from, to);
  const fallback: Directions = {
    geometry: { type: 'LineString', coordinates: [[from.lng, from.lat], [to.lng, to.lat]] },
    distanceM: km * 1000,
    durationS: (km * 1000) / FALLBACK_SPEED[profile],
    steps: [
      { instruction: `Head ${bearingWord(from, to)} toward your destination`, distanceM: km * 1000, type: 'depart', location: [from.lng, from.lat] },
      { instruction: 'Arrive at your destination', distanceM: 0, type: 'arrive', location: [to.lng, to.lat] },
    ],
    profile,
    approximate: true,
  };
  try {
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const res = await fetch(`${OSRM_BASE}/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=true`);
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      routes?: {
        geometry?: LineGeometry;
        distance?: number;
        duration?: number;
        legs?: { steps?: { distance?: number; name?: string; maneuver?: { type?: string; modifier?: string; location?: [number, number] } }[] }[];
      }[];
    };
    const r = data.routes?.[0];
    if (r?.geometry?.type !== 'LineString' || !r.geometry.coordinates?.length) return fallback;
    const steps: NavStep[] = (r.legs?.[0]?.steps ?? [])
      .map((s) => ({
        instruction: describe(s.maneuver, s.name),
        distanceM: s.distance ?? 0,
        name: s.name || undefined,
        type: s.maneuver?.type ?? 'continue',
        modifier: s.maneuver?.modifier,
        location: (s.maneuver?.location ?? [from.lng, from.lat]) as [number, number],
      }))
      // OSRM emits a zero-length "depart" duplicate sometimes; keep meaningful steps + the final arrive.
      .filter((s, i, arr) => s.distanceM > 0 || s.type === 'arrive' || i === 0);
    return {
      geometry: r.geometry,
      distanceM: r.distance ?? km * 1000,
      durationS: r.duration ?? (km * 1000) / FALLBACK_SPEED[profile],
      steps: steps.length ? steps : fallback.steps,
      profile,
      approximate: false,
    };
  } catch {
    return fallback;
  }
}

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
