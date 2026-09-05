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
        if (!res.ok) return reply.code(502).send({ error: `routing upstream ${res.status}` });
        const body = await res.json();
        if (cache.size >= MAX) cache.clear();
        cache.set(key, { at: Date.now(), body });
        return body;
      } catch {
        return reply.code(502).send({ error: "routing unavailable" });
      }
    },
  );
}
