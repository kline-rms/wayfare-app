// Routing proxy. The app routes through here instead of hitting a public OSRM
// directly, so: (1) the upstream is configured in ONE place (set OSRM_URL to a
// self-hosted OSRM for production — it overrides every mode), (2) responses are
// cached briefly to cut repeat calls (live re-routes, walk lines), and (3) the
// clients carry no third-party routing dependency. Default upstream is FOSSGIS's
// free per-mode instances (car/foot/bike), keyless + $0.
import type { FastifyInstance } from "fastify";

type Profile = "driving" | "walking" | "cycling";
const FOSSGIS: Record<Profile, string> = {
  driving: "https://routing.openstreetmap.de/routed-car",
  walking: "https://routing.openstreetmap.de/routed-foot",
  cycling: "https://routing.openstreetmap.de/routed-bike",
};
function upstream(profile: Profile): string {
  const override = process.env.OSRM_URL; // a single self-hosted OSRM for all modes
  return override ? override.replace(/\/$/, "") : FOSSGIS[profile];
}

// Small in-memory cache — same A→B within the window returns instantly.
const cache = new Map<string, { at: number; body: unknown }>();
const TTL_MS = 10 * 60 * 1000;
const MAX = 500;

const SPEED: Record<Profile, number> = { driving: 11.1, cycling: 4.2, walking: 1.4 };
function haversineM(a: number[], b: number[]): number {
  const R = 6371000;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const la1 = (a[1] * Math.PI) / 180;
  const la2 = (b[1] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// A straight-line OSRM-shaped route, so a flaky upstream never leaves the app
// without something drawable (the client would otherwise log the failure).
function straightFallback(coords: string, profile: Profile) {
  const pts = coords
    .split(";")
    .map((c) => c.split(",").map(Number))
    .filter((p) => p.length === 2 && p.every(Number.isFinite));
  let dist = 0;
  for (let i = 1; i < pts.length; i++) dist += haversineM(pts[i - 1], pts[i]);
  return {
    code: "Ok",
    routes: [{ geometry: { type: "LineString", coordinates: pts }, distance: dist, duration: dist / SPEED[profile], legs: [{ steps: [] }] }],
    waypoints: [],
    approximate: true,
  };
}

export function registerRouteRoutes(app: FastifyInstance) {
  app.get<{ Params: { profile: string }; Querystring: { coords?: string; steps?: string; overview?: string } }>(
    "/api/route/:profile",
    async (req, reply) => {
      const profile = (["driving", "walking", "cycling"].includes(req.params.profile) ? req.params.profile : "driving") as Profile;
      const coords = req.query.coords;
      // OSRM coords are "lng,lat;lng,lat" — validate loosely to avoid proxying junk.
      if (!coords || !/^-?\d[\d.,;-]*$/.test(coords)) {
        return reply.code(400).send({ error: "coords required as lng,lat;lng,lat" });
      }
      const steps = req.query.steps === "1" ? "true" : "false";
      const overview = req.query.overview === "false" ? "false" : "full";
      const key = `${profile}|${coords}|${steps}|${overview}`;

      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < TTL_MS) return hit.body;

      try {
        const url = `${upstream(profile)}/route/v1/${profile}/${coords}?overview=${overview}&geometries=geojson&steps=${steps}`;
        const res = await fetch(url);
        // Upstream hiccup → a straight-line fallback (200) so the app always has
        // something to draw; never surface a 5xx that just becomes console noise.
        const body = res.ok ? await res.json() : straightFallback(coords, profile);
        if (cache.size >= MAX) cache.clear();
        if (res.ok) cache.set(key, { at: Date.now(), body }); // don't cache the fallback
        return body;
      } catch {
        return straightFallback(coords, profile);
      }
    },
  );
}
