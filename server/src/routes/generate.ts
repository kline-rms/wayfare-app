import type { FastifyInstance } from "fastify";
import type { GenerateRequest, Itinerary } from "../../../packages/shared/src/index.ts";
import { env } from "../lib/env.ts";
import { requireAuth } from "../lib/auth.ts";
import { generateProposals, expandTimeline } from "../generate/index.ts";
import { chatJson } from "../lib/openai.ts";

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

  // Free-form → structured request. Extract a GenerateRequest from a plain
  // paragraph ("plan a BGC trip with my 3 kids, Sep 9-14…") so the user can just
  // describe the trip; flags what's still missing (a destination is the usual one).
  app.post<{ Body: { prompt?: string } }>("/api/generate/parse", async (req, reply) => {
    if (!requireAuth(req, reply)) return;
    const prompt = (req.body?.prompt ?? "").trim();
    if (!prompt) return reply.code(400).send({ error: "Body needs { prompt }" });
    const missingOf = (r: any) => ["destination", "startDate", "endDate"].filter((k) => !r?.[k]);
    if (!env.hasOpenAI) {
      return { request: { origin: "", destination: "", partySize: 2 }, missing: ["destination", "startDate", "endDate"], engine: "stub" };
    }
    const year = new Date().getFullYear();
    const sys =
      `You extract structured trip-planning parameters from a free-form request and return ONLY JSON.\n` +
      `Fields: origin (traveler's start / home area; "" if unknown), destination (the place/area to plan around; "" if none is given — DO NOT invent one), ` +
      `startDate & endDate (YYYY-MM-DD; "" if unknown; resolve month/day forms against year ${year}), partySize (integer TOTAL people including children; 0 if unknown), ` +
      `homeBase (named accommodation, else = origin), pace ("relaxed"|"balanced"|"packed"), budget ("shoestring"|"moderate"|"comfortable"|"luxury"), ` +
      `purpose (one line), interests (string[]), constraints (string — ages, nap/accessibility/stroller needs, etc.). ` +
      `Infer sensible pace/budget/interests from context; leave truly-unknown facts empty.`;
    let request: any;
    try {
      request = await chatJson([{ role: "system", content: sys }, { role: "user", content: prompt }], { temperature: 0.2, maxTokens: 700 });
    } catch (err) {
      return reply.code(502).send({ error: (err as Error).message });
    }
    if (!request.origin && request.homeBase) request.origin = request.homeBase;
    if (!request.partySize || request.partySize < 1) request.partySize = 0;
    return { request, missing: missingOf(request), engine: "openai" };
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
