import type { FastifyInstance } from "fastify";
import { requireAuth } from "../lib/auth.ts";
import { env } from "../lib/env.ts";
import { getPlacesEnabled, getSpend, setPlacesEnabled } from "../lib/settings.ts";

function state() {
  return {
    // Whether a key is even configured — the toggle is inert without it.
    placesKeyConfigured: env.hasGoogleMaps,
    // The runtime gate. When false, NO Google Places request goes out.
    placesEnabled: getPlacesEnabled(),
    // Rough spend this server process, for visibility.
    spend: getSpend(),
  };
}

export function registerSettingsRoutes(app: FastifyInstance) {
  app.get("/api/settings", async (req, reply) => {
    const uid = requireAuth(req, reply);
    if (!uid) return;
    return state();
  });

  app.patch<{ Body: { placesEnabled?: boolean } }>("/api/settings", async (req, reply) => {
    const uid = requireAuth(req, reply);
    if (!uid) return;
    if (typeof req.body?.placesEnabled === "boolean") {
      // Never allow turning it on if there's no key (would just fail + confuse).
      setPlacesEnabled(req.body.placesEnabled && env.hasGoogleMaps);
    }
    return state();
  });
}
