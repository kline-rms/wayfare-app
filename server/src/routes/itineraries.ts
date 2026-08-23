import type { FastifyInstance } from "fastify";
import type { Repo } from "../repo/types.ts";

export function registerItineraryRoutes(app: FastifyInstance, repo: Repo) {
  // List all itineraries (summaries only).
  app.get("/api/itineraries", async () => {
    return repo.listItineraries();
  });

  // Full itinerary with proposals + days.
  app.get<{ Params: { id: string } }>("/api/itineraries/:id", async (req, reply) => {
    const it = await repo.getItinerary(req.params.id);
    if (!it) return reply.code(404).send({ error: "Itinerary not found" });
    return it;
  });

  // A single proposal within an itinerary.
  app.get<{ Params: { id: string; proposalId: string } }>(
    "/api/itineraries/:id/proposals/:proposalId",
    async (req, reply) => {
      const p = await repo.getProposal(req.params.id, req.params.proposalId);
      if (!p) return reply.code(404).send({ error: "Proposal not found" });
      return p;
    },
  );
}
