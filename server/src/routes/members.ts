import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { Itinerary, Member, Share } from "../../../packages/shared/src/index.ts";
import type { Repo } from "../repo/types.ts";
import { SAMPLE_OWNER } from "../repo/types.ts";
import { requireAuth } from "../lib/auth.ts";

function canRead(it: Itinerary, uid: string): boolean {
  return it.ownerId === uid || it.ownerId === SAMPLE_OWNER || it.ownerId == null;
}

export function registerMemberRoutes(app: FastifyInstance, repo: Repo) {
  // ── Members: the dynamic "who should know this trip?" roster ───────────────
  app.post<{ Params: { id: string }; Body: { member: Member } }>(
    "/api/itineraries/:id/members",
    async (req, reply) => {
      const uid = requireAuth(req, reply);
      if (!uid) return;
      const it = await repo.getItinerary(req.params.id);
      if (!it) return reply.code(404).send({ error: "Itinerary not found" });
      if (!canRead(it, uid)) return reply.code(403).send({ error: "Not your itinerary" });
      const member = req.body?.member;
      if (!member?.id || !member.name?.trim()) {
        return reply.code(400).send({ error: "Body needs { member:{ id, name, role } }" });
      }
      const members = [...(it.members ?? []), { ...member, role: member.role ?? "viewer" }];
      return repo.updateItinerary(it.id, { members, updatedAt: new Date().toISOString() });
    },
  );

  app.patch<{ Params: { id: string; mid: string }; Body: Partial<Member> }>(
    "/api/itineraries/:id/members/:mid",
    async (req, reply) => {
      const uid = requireAuth(req, reply);
      if (!uid) return;
      const it = await repo.getItinerary(req.params.id);
      if (!it) return reply.code(404).send({ error: "Itinerary not found" });
      if (!canRead(it, uid)) return reply.code(403).send({ error: "Not your itinerary" });
      let found = false;
      const members = (it.members ?? []).map((m) => {
        if (m.id !== req.params.mid) return m;
        found = true;
        return { ...m, ...req.body, id: m.id };
      });
      if (!found) return reply.code(404).send({ error: "Member not found" });
      return repo.updateItinerary(it.id, { members, updatedAt: new Date().toISOString() });
    },
  );

  app.delete<{ Params: { id: string; mid: string } }>(
    "/api/itineraries/:id/members/:mid",
    async (req, reply) => {
      const uid = requireAuth(req, reply);
      if (!uid) return;
      const it = await repo.getItinerary(req.params.id);
      if (!it) return reply.code(404).send({ error: "Itinerary not found" });
      if (!canRead(it, uid)) return reply.code(403).send({ error: "Not your itinerary" });
      const members = (it.members ?? []).filter((m) => m.id !== req.params.mid);
      // also drop any share links tied to this member
      const shares = (it.shares ?? []).filter((s) => s.memberId !== req.params.mid);
      return repo.updateItinerary(it.id, { members, shares, updatedAt: new Date().toISOString() });
    },
  );

  // ── Share links ────────────────────────────────────────────────────────────
  app.post<{ Params: { id: string }; Body: { role?: Share["role"]; memberId?: string; label?: string } }>(
    "/api/itineraries/:id/shares",
    async (req, reply) => {
      const uid = requireAuth(req, reply);
      if (!uid) return;
      const it = await repo.getItinerary(req.params.id);
      if (!it) return reply.code(404).send({ error: "Itinerary not found" });
      if (!canRead(it, uid)) return reply.code(403).send({ error: "Not your itinerary" });
      // Token embeds the itinerary id so /shared/:token resolves without a scan.
      const share: Share = {
        token: `${it.id}~${randomUUID()}`,
        role: req.body?.role ?? "viewer",
        memberId: req.body?.memberId,
        label: req.body?.label,
        createdAt: new Date().toISOString(),
      };
      const shares = [...(it.shares ?? []), share];
      const updated = await repo.updateItinerary(it.id, { shares, updatedAt: new Date().toISOString() });
      return reply.code(201).send({ share, itinerary: updated });
    },
  );

  app.delete<{ Params: { id: string; token: string } }>(
    "/api/itineraries/:id/shares/:token",
    async (req, reply) => {
      const uid = requireAuth(req, reply);
      if (!uid) return;
      const it = await repo.getItinerary(req.params.id);
      if (!it) return reply.code(404).send({ error: "Itinerary not found" });
      if (!canRead(it, uid)) return reply.code(403).send({ error: "Not your itinerary" });
      const shares = (it.shares ?? []).filter((s) => s.token !== req.params.token);
      return repo.updateItinerary(it.id, { shares, updatedAt: new Date().toISOString() });
    },
  );

  // Resolve a share link — PUBLIC (no auth). The token carries the itinerary id.
  app.get<{ Params: { token: string } }>("/api/shared/:token", async (req, reply) => {
    const token = req.params.token;
    const itineraryId = token.split("~")[0];
    if (!itineraryId) return reply.code(400).send({ error: "Bad share token" });
    const it = await repo.getItinerary(itineraryId);
    if (!it) return reply.code(404).send({ error: "Shared trip not found" });
    const share = (it.shares ?? []).find((s) => s.token === token);
    if (!share) return reply.code(404).send({ error: "This link is no longer active" });
    return { itinerary: it, role: share.role };
  });

  // Accept a share into your account — cross-account access. Auth required.
  // Idempotent: re-accepting won't duplicate, and a later editor link upgrades a
  // prior viewer. Afterwards the trip appears in the accepter's list + is readable.
  app.post<{ Params: { token: string } }>("/api/shared/:token/accept", async (req, reply) => {
    const uid = requireAuth(req, reply);
    if (!uid) return;
    const token = req.params.token;
    const itineraryId = token.split("~")[0];
    if (!itineraryId) return reply.code(400).send({ error: "Bad share token" });
    const it = await repo.getItinerary(itineraryId);
    if (!it) return reply.code(404).send({ error: "Shared trip not found" });
    const share = (it.shares ?? []).find((s) => s.token === token);
    if (!share) return reply.code(404).send({ error: "This link is no longer active" });
    if (it.ownerId === uid) return { itinerary: it, role: "owner", already: true };

    const access = it.access ?? [];
    const existing = access.find((a) => a.userId === uid);
    let nextAccess = access;
    if (!existing) {
      nextAccess = [...access, { userId: uid, role: share.role, acceptedAt: new Date().toISOString() }];
    } else if (existing.role !== "editor" && share.role === "editor") {
      nextAccess = access.map((a) => (a.userId === uid ? { ...a, role: "editor" as const } : a));
    }
    const accessUserIds = Array.from(new Set(nextAccess.map((a) => a.userId)));
    const updated = await repo.updateItinerary(it.id, {
      access: nextAccess,
      accessUserIds,
      updatedAt: new Date().toISOString(),
    });
    return { itinerary: updated, role: share.role };
  });
}
