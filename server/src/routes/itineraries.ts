import type { FastifyInstance } from "fastify";
import type { Activity, Itinerary } from "../../../packages/shared/src/index.ts";
import type { Repo } from "../repo/types.ts";
import { SAMPLE_OWNER } from "../repo/types.ts";
import { requireAuth } from "../lib/auth.ts";
import { finalizeInBackground, finalizeItineraryPlaces } from "../places/finalize.ts";

/** Can this user read this itinerary? (their own, or a shared sample) */
function canRead(it: Itinerary, uid: string): boolean {
  return it.ownerId === uid || it.ownerId === SAMPLE_OWNER || it.ownerId == null;
}

/** Parse a clock label to minutes-of-day for sorting; untimed blocks sort last. */
function timeMin(t?: string): number {
  if (!t) return 24 * 60;
  const m = /(\d{1,2})(?::(\d{2}))?/.exec(t);
  if (!m) return 24 * 60;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const ap = (/(AM|PM)/i.exec(t)?.[1] ?? "").toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + min;
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

  // Add a stop to a specific day — INSERT ONLY (never re-plans or re-sorts the
  // rest of the day). Works on readable itineraries incl. shared samples, and
  // preserves ownerId so a sample stays a sample. The block is flagged `added`.
  app.post<{ Params: { id: string }; Body: { dayId: string; activity: Activity } }>(
    "/api/itineraries/:id/activities",
    async (req, reply) => {
      const uid = requireAuth(req, reply);
      if (!uid) return;
      const it = await repo.getItinerary(req.params.id);
      if (!it) return reply.code(404).send({ error: "Itinerary not found" });
      if (!canRead(it, uid)) return reply.code(403).send({ error: "Not your itinerary" });
      const { dayId, activity } = req.body ?? ({} as { dayId?: string; activity?: Activity });
      if (!dayId || !activity?.activity) {
        return reply.code(400).send({ error: "Body needs { dayId, activity:{activity,...} }" });
      }
      let found = false;
      const proposals = it.proposals.map((p) => ({
        ...p,
        days: p.days.map((d) => {
          if (d.id !== dayId) return d;
          found = true;
          const list = [...(d.activities ?? []), { ...activity, added: true }];
          list.sort((a, b) => timeMin(a.time) - timeMin(b.time));
          return { ...d, activities: list };
        }),
      }));
      if (!found) return reply.code(404).send({ error: "Day not found in this itinerary" });
      return repo.updateItinerary(it.id, { proposals, updatedAt: new Date().toISOString() });
    },
  );

  // Remove a stop — ONLY user-added blocks can be removed (the AI plan is safe).
  app.delete<{ Params: { id: string; activityId: string } }>(
    "/api/itineraries/:id/activities/:activityId",
    async (req, reply) => {
      const uid = requireAuth(req, reply);
      if (!uid) return;
      const it = await repo.getItinerary(req.params.id);
      if (!it) return reply.code(404).send({ error: "Itinerary not found" });
      if (!canRead(it, uid)) return reply.code(403).send({ error: "Not your itinerary" });
      const aid = req.params.activityId;
      let removed = false;
      const proposals = it.proposals.map((p) => ({
        ...p,
        days: p.days.map((d) => {
          const acts = d.activities ?? [];
          const kept = acts.filter((a) => !(a.id === aid && a.added));
          if (kept.length !== acts.length) removed = true;
          return { ...d, activities: kept };
        }),
      }));
      if (!removed) return reply.code(404).send({ error: "Added stop not found (originals can't be removed)" });
      return repo.updateItinerary(it.id, { proposals, updatedAt: new Date().toISOString() });
    },
  );

  // Backfill Google Place data for an EXISTING trip on demand — the app's
  // "Load real photos & info" action. Runs the same finalize linker in the
  // FOREGROUND and persists the resolved Place IDs so the next read shows real
  // photos/facts, and later visits pass the Place ID (no repeat Text Search).
  // Fully gated: with Places OFF, enrichment returns stubs — no Google call,
  // nothing linked, $0. Idempotent — places already linked cost nothing.
  app.post<{ Params: { id: string } }>("/api/itineraries/:id/finalize-places", async (req, reply) => {
    const uid = requireAuth(req, reply);
    if (!uid) return;
    const it = await repo.getItinerary(req.params.id);
    if (!it) return reply.code(404).send({ error: "Itinerary not found" });
    if (!canRead(it, uid)) return reply.code(403).send({ error: "Not your itinerary" });
    const patched = await finalizeItineraryPlaces(it, repo);
    const linked = patched.places.filter((p) => p.placeId).length;
    if (linked > 0) {
      await repo.updateItinerary(it.id, { places: patched.places, proposals: patched.proposals });
    }
    return { linked, total: patched.places.length, itinerary: patched };
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
