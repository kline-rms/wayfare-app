// Places routes — the finalize-time enrichment crawl and the read paths that
// serve cached facts + live photos/reviews. See docs/places-caching-design.md.
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Repo } from "../repo/types.ts";
import { requireAuth } from "../lib/auth.ts";
import { enrichPlace, getPlaceCard, getPlaceReviews, resolvePlacePhoto, type EnrichInput } from "../places/service.ts";

/** Absolute origin of this server, used to build photo-proxy URLs in cards. */
function originBase(req: FastifyRequest): string {
  return `${req.protocol}://${req.headers.host}`;
}

const MAX_PLACES = 60; // a very generous single-itinerary cap

export function registerPlaceRoutes(app: FastifyInstance, repo: Repo) {
  // Finalize crawl: enrich every place on a locked itinerary, deduped against
  // the shared cache. Cheap by design — only misses/stale entries hit Google.
  app.post<{ Body: { itineraryId?: string; places: EnrichInput[] } }>(
    "/api/places/enrich",
    async (req, reply) => {
      const uid = requireAuth(req, reply);
      if (!uid) return;
      const { itineraryId, places } = req.body ?? ({} as any);
      if (!Array.isArray(places) || places.length === 0) {
        return reply.code(400).send({ error: "Body must be { places: [{ placeId | query }] }" });
      }
      if (places.length > MAX_PLACES) {
        return reply.code(400).send({ error: `Too many places (max ${MAX_PLACES})` });
      }
      const base = originBase(req);
      const cards = [];
      for (const p of places) {
        const cached = await enrichPlace(p, repo, itineraryId);
        cards.push(await getPlaceCard(cached.placeId, repo, base));
      }
      return { count: cards.length, places: cards };
    },
  );

  // Cached card for one place (facts + live photo URLs).
  app.get<{ Params: { placeId: string } }>("/api/places/:placeId/card", async (req, reply) => {
    const uid = requireAuth(req, reply);
    if (!uid) return;
    const card = await getPlaceCard(req.params.placeId, repo, originBase(req));
    if (!card) return reply.code(404).send({ error: "Place not cached" });
    return card;
  });

  // Live photo: resolve a cached reference to a short-lived, key-less image URL
  // and redirect. No bytes are stored; the API key never leaves the server.
  // Unauthenticated (image tags can't send bearer tokens) but ref-validated.
  app.get<{ Params: { placeId: string }; Querystring: { ref?: string; w?: string } }>(
    "/api/places/:placeId/photo",
    async (req, reply) => {
      const ref = req.query.ref;
      if (!ref) return reply.code(400).send({ error: "Missing ?ref" });
      const w = Math.min(Math.max(Number(req.query.w) || 800, 100), 1600);
      const uri = await resolvePlacePhoto(req.params.placeId, ref, w, repo);
      if (!uri) return reply.code(404).send({ error: "Photo unavailable" });
      return reply.redirect(uri, 302);
    },
  );

  // Live reviews (fetched fresh on demand; never stored).
  app.get<{ Params: { placeId: string } }>("/api/places/:placeId/reviews", async (req, reply) => {
    const uid = requireAuth(req, reply);
    if (!uid) return;
    return { reviews: await getPlaceReviews(req.params.placeId, repo) };
  });
}
