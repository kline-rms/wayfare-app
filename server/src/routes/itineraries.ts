import type { FastifyInstance } from "fastify";
import type { Itinerary } from "../../../packages/shared/src/index.ts";
import type { Repo } from "../repo/types.ts";
import { SAMPLE_OWNER } from "../repo/types.ts";
import { requireAuth } from "../lib/auth.ts";
import { finalizeInBackground } from "../places/finalize.ts";

/** Can this user read this itinerary? (their own, or a shared sample) */
function canRead(it: Itinerary, uid: string): boolean {
  return it.ownerId === uid || it.ownerId === SAMPLE_OWNER || it.ownerId == null;
}

export function registerItineraryRoutes(app: FastifyInstance, repo: Repo) {
  // List the signed-in user's itineraries (plus shared samples).
  app.get("/api/itineraries", async (req, reply) => {
    const uid = requireAuth(req, reply);
    if (!uid) return;
    return repo.listItineraries(uid);
  });

  // Full itinerary with proposals + days.
  app.get<{ Params: { id: string } }>("/api/itineraries/:id", async (req, reply) => {
    const uid = requireAuth(req, reply);
    if (!uid) return;
    const it = await repo.getItinerary(req.params.id);
    if (!it) return reply.code(404).send({ error: "Itinerary not found" });
    if (!canRead(it, uid)) return reply.code(403).send({ error: "Not your itinerary" });
    return it;
  });

  // A single proposal within an itinerary.
  app.get<{ Params: { id: string; proposalId: string } }>(
    "/api/itineraries/:id/proposals/:proposalId",
    async (req, reply) => {
      const uid = requireAuth(req, reply);
      if (!uid) return;
      const it = await repo.getItinerary(req.params.id);
      if (!it) return reply.code(404).send({ error: "Itinerary not found" });
      if (!canRead(it, uid)) return reply.code(403).send({ error: "Not your itinerary" });
      const p = it.proposals.find((x) => x.id === req.params.proposalId);
      if (!p) return reply.code(404).send({ error: "Proposal not found" });
      return p;
    },
  );

  // Save a (generated) itinerary — owned by the signed-in user.
  app.post<{ Body: Itinerary }>("/api/itineraries", async (req, reply) => {
    const uid = requireAuth(req, reply);
    if (!uid) return;
    const it = req.body;
    if (!it?.id || !Array.isArray(it?.proposals)) {
      return reply.code(400).send({ error: "Body must be an Itinerary with id + proposals" });
    }
    if (await repo.getItinerary(it.id)) {
      return reply.code(409).send({ error: `Itinerary ${it.id} already exists` });
    }
    const saved = await repo.createItinerary({ ...it, ownerId: uid });
    // Finalize: crawl this trip's places once (deduped, cheap) and link Place IDs
    // back onto it in the background, so the response isn't blocked by Google.
    finalizeInBackground(saved, repo, req.log);
    return reply.code(201).send(saved);
  });

  // Update an itinerary (owner only).
  app.patch<{ Params: { id: string }; Body: Partial<Itinerary> }>("/api/itineraries/:id", async (req, reply) => {
    const uid = requireAuth(req, reply);
    if (!uid) return;
    const existing = await repo.getItinerary(req.params.id);
    if (!existing) return reply.code(404).send({ error: "Itinerary not found" });
    if (existing.ownerId !== uid) return reply.code(403).send({ error: "Not your itinerary" });
    const updated = await repo.updateItinerary(req.params.id, {
      ...req.body,
      ownerId: uid,
      updatedAt: new Date().toISOString(),
    });
    return updated;
  });

  // Delete an itinerary (owner only).
  app.delete<{ Params: { id: string } }>("/api/itineraries/:id", async (req, reply) => {
    const uid = requireAuth(req, reply);
    if (!uid) return;
    const existing = await repo.getItinerary(req.params.id);
    if (!existing) return reply.code(404).send({ error: "Itinerary not found" });
    if (existing.ownerId !== uid) return reply.code(403).send({ error: "Not your itinerary" });
    await repo.deleteItinerary(req.params.id);
    return { deleted: req.params.id };
  });
}
