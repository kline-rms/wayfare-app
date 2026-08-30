import type { FastifyInstance } from "fastify";
import type { Expense, Itinerary } from "../../../packages/shared/src/index.ts";
import type { Repo } from "../repo/types.ts";
import { SAMPLE_OWNER } from "../repo/types.ts";
import { requireAuth } from "../lib/auth.ts";
import { env } from "../lib/env.ts";
import { chatVisionJson } from "../lib/openai.ts";

function canRead(it: Itinerary, uid: string): boolean {
  return it.ownerId === uid || it.ownerId === SAMPLE_OWNER || it.ownerId == null;
}

interface ParsedReceipt {
  merchant?: string;
  date?: string | null;
  currency?: string | null;
  items?: { name: string; qty?: number; price?: number }[];
  total?: number;
}

const RECEIPT_PROMPT =
  "You are a precise receipt parser. Read this receipt image and return STRICT JSON: " +
  '{"merchant": string, "date": "YYYY-MM-DD" or null, "currency": ISO code like "PHP"/"USD" or null, ' +
  '"items": [{"name": string, "qty": number, "price": number}], "total": number}. ' +
  "Prices are plain numbers with no currency symbols. Only include line items actually visible; " +
  "never invent items. If a value is unreadable, use null (or omit qty).";

export function registerExpenseRoutes(app: FastifyInstance, repo: Repo) {
  // Read a receipt image into a structured draft (vision OCR). Stub if no key.
  app.post<{ Body: { imageUrl?: string } }>("/api/receipts/parse", async (req, reply) => {
    const uid = requireAuth(req, reply);
    if (!uid) return;
    const imageUrl = req.body?.imageUrl;
    if (!imageUrl || (!imageUrl.startsWith("data:") && !imageUrl.startsWith("http"))) {
      return reply.code(400).send({ error: "Body needs { imageUrl } (data: URL or https URL)" });
    }
    if (!env.hasOpenAI) {
      // Offline stub — lets the flow be demoed without a vision key.
      return {
        merchant: "Receipt",
        date: null,
        currency: null,
        items: [{ name: "Add items manually", qty: 1, price: 0 }],
        total: 0,
        engine: "stub",
      };
    }
    try {
      const parsed = await chatVisionJson<ParsedReceipt>(RECEIPT_PROMPT, imageUrl);
      return { ...parsed, engine: "openai" };
    } catch (e) {
      req.log.error(e);
      return reply.code(502).send({ error: (e as Error).message });
    }
  });

  // Add an expense to a trip's ledger (attach the receipt image + parsed items).
  app.post<{ Params: { id: string }; Body: { expense: Expense } }>(
    "/api/itineraries/:id/expenses",
    async (req, reply) => {
      const uid = requireAuth(req, reply);
      if (!uid) return;
      const it = await repo.getItinerary(req.params.id);
      if (!it) return reply.code(404).send({ error: "Itinerary not found" });
      if (!canRead(it, uid)) return reply.code(403).send({ error: "Not your itinerary" });
      const expense = req.body?.expense;
      if (!expense?.id || typeof expense.amount !== "number") {
        return reply.code(400).send({ error: "Body needs { expense:{ id, amount, ... } }" });
      }
      const expenses = [...(it.expenses ?? []), { ...expense, status: expense.status ?? "unpaid" }];
      return repo.updateItinerary(it.id, { expenses, updatedAt: new Date().toISOString() });
    },
  );

  // Update an expense (e.g. mark paid, attach proof). Body is a partial expense.
  app.patch<{ Params: { id: string; eid: string }; Body: Partial<Expense> }>(
    "/api/itineraries/:id/expenses/:eid",
    async (req, reply) => {
      const uid = requireAuth(req, reply);
      if (!uid) return;
      const it = await repo.getItinerary(req.params.id);
      if (!it) return reply.code(404).send({ error: "Itinerary not found" });
      if (!canRead(it, uid)) return reply.code(403).send({ error: "Not your itinerary" });
      let found = false;
      const expenses = (it.expenses ?? []).map((e) => {
        if (e.id !== req.params.eid) return e;
        found = true;
        return { ...e, ...req.body, id: e.id };
      });
      if (!found) return reply.code(404).send({ error: "Expense not found" });
      return repo.updateItinerary(it.id, { expenses, updatedAt: new Date().toISOString() });
    },
  );

  // Remove an expense.
  app.delete<{ Params: { id: string; eid: string } }>(
    "/api/itineraries/:id/expenses/:eid",
    async (req, reply) => {
      const uid = requireAuth(req, reply);
      if (!uid) return;
      const it = await repo.getItinerary(req.params.id);
      if (!it) return reply.code(404).send({ error: "Itinerary not found" });
      if (!canRead(it, uid)) return reply.code(403).send({ error: "Not your itinerary" });
      const expenses = (it.expenses ?? []).filter((e) => e.id !== req.params.eid);
      if (expenses.length === (it.expenses ?? []).length) {
        return reply.code(404).send({ error: "Expense not found" });
      }
      return repo.updateItinerary(it.id, { expenses, updatedAt: new Date().toISOString() });
    },
  );
}
