import type { FastifyInstance } from "fastify";
import type { GenerateRequest, Itinerary } from "../../../packages/shared/src/index.ts";
import { env } from "../lib/env.ts";
import { requireAuth } from "../lib/auth.ts";
import { generateProposals, expandTimeline } from "../generate/index.ts";

function validate(body: any): { ok: true; req: GenerateRequest } | { ok: false; error: string } {
  const required = ["origin", "destination", "startDate", "endDate"];
  for (const f of required) {
    if (!body?.[f] || typeof body[f] !== "string") return { ok: false, error: `Missing field: ${f}` };
  }
  const partySize = Number(body.partySize);
  if (!Number.isFinite(partySize) || partySize < 1) return { ok: false, error: "partySize must be >= 1" };
  return { ok: true, req: { ...body, partySize } as GenerateRequest };
}

export function registerGenerateRoutes(app: FastifyInstance) {
  // Whether a real engine is wired (the app can show "AI" vs "draft" accordingly).
  app.get("/api/generate/status", async () => ({ engine: env.hasOpenAI ? "openai" : "stub", model: env.hasOpenAI ? env.openaiModel : null }));

  // Step 1 — 3 day-level proposals from a request (not persisted).
  app.post("/api/generate", async (req, reply) => {
    if (!requireAuth(req, reply)) return;
    const v = validate(req.body);
    if (!v.ok) return reply.code(400).send({ error: v.error });
    try {
      return await generateProposals(v.req);
    } catch (err) {
      req.log.error(err);
      return reply.code(502).send({ error: (err as Error).message });
    }
  });

  // Step 2 — expand a chosen proposal into block-level activities.
  app.post<{ Body: { itinerary: Itinerary; proposalId: string; request: GenerateRequest } }>(
    "/api/generate/timeline",
    async (req, reply) => {
      if (!requireAuth(req, reply)) return;
      const { itinerary, proposalId, request } = req.body ?? ({} as any);
      if (!itinerary?.proposals || !proposalId || !request?.destination) {
        return reply.code(400).send({ error: "Body needs { itinerary, proposalId, request }" });
      }
      try {
        return await expandTimeline(itinerary, proposalId, request);
      } catch (err) {
        req.log.error(err);
        return reply.code(502).send({ error: (err as Error).message });
      }
    },
  );
}
