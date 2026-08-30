// Generation orchestration: OpenAI when a key is set, deterministic stub otherwise.
import type { GenerateRequest, Itinerary } from "../../../packages/shared/src/index.ts";
import { env } from "../lib/env.ts";
import { chatJson } from "../lib/openai.ts";
import { proposalsMessages, timelineMessages } from "./prompt.ts";
import { stubProposalsRaw, stubTimelineRaw } from "./stub.ts";
import { normalizeActivity, normalizeItinerary } from "./schema.ts";

export interface GenerateResult {
  engine: "openai" | "stub";
  itinerary: Itinerary;
}

function tripDays(req: GenerateRequest): number {
  const a = new Date(`${req.startDate}T00:00:00Z`).getTime();
  const b = new Date(`${req.endDate}T00:00:00Z`).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

// Tiny in-memory cache so identical requests (regenerate, tests, refresh) don't
// re-bill OpenAI. Keyed by request/proposal; capped so it can't grow unbounded.
const cache = new Map<string, any>();
function memo<T>(key: string, make: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit as T);
  return make().then((v) => {
    if (cache.size > 50) cache.clear();
    cache.set(key, v);
    return v;
  });
}

/** Step 1 — three day-level proposals from the request (not persisted). */
export async function generateProposals(req: GenerateRequest): Promise<GenerateResult> {
  if (env.hasOpenAI) {
    try {
      const key = `prop:${JSON.stringify(req)}`;
      // Ceiling only (billed for actual tokens, which the concise prompt keeps
      // low). Sized generously so 3 proposals never truncate into invalid JSON.
      const maxTokens = Math.min(8000, 1500 + tripDays(req) * 3 * 220);
      const raw = await memo(key, () => chatJson<any>(proposalsMessages(req), { maxTokens }));
      return { engine: "openai", itinerary: normalizeItinerary(raw, req) };
    } catch (e) {
      // e.g. quota/billing/network — degrade to the draft rather than failing.
      console.warn("[generate] OpenAI failed, using stub draft:", (e as Error).message);
    }
  }
  return { engine: "stub", itinerary: normalizeItinerary(stubProposalsRaw(req), req) };
}

/**
 * Step 2 — expand one proposal's days into block-level activities, in place.
 * Returns a copy of the itinerary with the chosen proposal's days enriched.
 */
export async function expandTimeline(
  itinerary: Itinerary,
  proposalId: string,
  req: GenerateRequest,
): Promise<GenerateResult> {
  const proposal = itinerary.proposals.find((p) => p.id === proposalId);
  if (!proposal) throw new Error(`Proposal ${proposalId} not found`);

  let engine: GenerateResult["engine"] = "stub";
  let raw: any = stubTimelineRaw(proposal, req);
  if (env.hasOpenAI) {
    try {
      const key = `time:${itinerary.id}:${proposalId}`;
      // Ceiling only; sized for a full day of blocks + dining/grocery/places.
      const maxTokens = Math.min(12000, 1500 + proposal.days.length * 600);
      raw = await memo(key, () => chatJson<any>(timelineMessages(req, proposal), { maxTokens }));
      engine = "openai";
    } catch (e) {
      console.warn("[timeline] OpenAI failed, using stub draft:", (e as Error).message);
    }
  }

  const byDate = new Map<string, any[]>();
  for (const d of Array.isArray(raw?.days) ? raw.days : []) {
    if (d?.date && Array.isArray(d.activities)) byDate.set(d.date, d.activities);
  }

  const enrichedDays = proposal.days.map((d) => {
    const acts = byDate.get(d.date);
    if (!acts?.length) return d;
    const activities = acts.map((a: any, j: number) => normalizeActivity(a, d.id, j));
    const travel = activities.reduce((n, a) => n + (a.category?.match(/travel|airport/i) ? a.cost ?? 0 : 0), 0);
    const food = activities.reduce((n, a) => n + (a.category?.match(/travel|airport/i) ? 0 : a.cost ?? 0), 0);
    return { ...d, activities, cost: { travel, foodLow: food, foodHigh: food } };
  });

  const proposals = itinerary.proposals.map((p) =>
    p.id === proposalId ? { ...p, days: enrichedDays } : p,
  );

  // Merge the trip-wide guides so the saved itinerary matches the full format.
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "");
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const diningGuide = Array.isArray(raw?.diningGuide)
    ? raw.diningGuide
        .map((r: any) => ({
          restaurant: str(r?.restaurant),
          ...(str(r?.whenWho) ? { whenWho: str(r.whenWho) } : {}),
          ...(str(r?.recommendedOrder) ? { recommendedOrder: str(r.recommendedOrder) } : {}),
          ...(str(r?.budget) ? { budget: str(r.budget) } : {}),
          ...(str(r?.why) ? { why: str(r.why) } : {}),
          ...(str(r?.notes) ? { notes: str(r.notes) } : {}),
        }))
        .filter((r: any) => r.restaurant)
    : undefined;
  const groceryPlan = Array.isArray(raw?.groceryPlan)
    ? raw.groceryPlan
        .map((g: any) => ({
          ...(str(g?.when) ? { when: str(g.when) } : {}),
          store: str(g?.store),
          ...(str(g?.who) ? { who: str(g.who) } : {}),
          ...(str(g?.purpose) ? { purpose: str(g.purpose) } : {}),
          ...(str(g?.basket) ? { basket: str(g.basket) } : {}),
          ...(str(g?.budget) ? { budget: str(g.budget) } : {}),
          ...(str(g?.why) ? { why: str(g.why) } : {}),
        }))
        .filter((g: any) => g.store)
    : undefined;
  const places = Array.isArray(raw?.places) && raw.places.length
    ? raw.places.map((p: any) => {
        const lat = num(p?.lat);
        const lng = num(p?.lng);
        return {
          name: str(p?.name) || "Place",
          area: str(p?.area) || req.destination,
          lat,
          lng,
          coordinates: `${lat}, ${lng}`,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
          why: str(p?.why) || "On the itinerary",
        };
      })
    : itinerary.places;

  return {
    engine,
    itinerary: {
      ...itinerary,
      proposals,
      places,
      ...(diningGuide?.length ? { diningGuide } : {}),
      ...(groceryPlan?.length ? { groceryPlan } : {}),
      updatedAt: new Date().toISOString(),
    },
  };
}
