// Push token registration — the bridge from a device to an account. The app
// posts its Expo push token here after permission; the server stores it on the
// user so flows like reimbursement can notify them.
import type { FastifyInstance } from "fastify";
import type { Repo } from "../repo/types.ts";
import { requireAuth } from "../lib/auth.ts";

export function registerPushRoutes(app: FastifyInstance, repo: Repo) {
  app.post<{ Body: { token?: string } }>("/api/push/register", async (req, reply) => {
    const uid = requireAuth(req, reply);
    if (!uid) return;
    const token = req.body?.token;
    if (!token || typeof token !== "string") return reply.code(400).send({ error: "Body needs { token }" });
    const user = await repo.getUser(uid);
    if (!user) return reply.code(404).send({ error: "User not found" });
    const tokens = Array.from(new Set([...(user.pushTokens ?? []), token]));
    await repo.updateUser(uid, { pushTokens: tokens });
    return { ok: true, devices: tokens.length };
  });

  // Remove a token (sign-out on a device).
  app.delete<{ Params: { token: string } }>("/api/push/register/:token", async (req, reply) => {
    const uid = requireAuth(req, reply);
    if (!uid) return;
    const user = await repo.getUser(uid);
    if (!user) return reply.code(404).send({ error: "User not found" });
    const tokens = (user.pushTokens ?? []).filter((t) => t !== req.params.token);
    await repo.updateUser(uid, { pushTokens: tokens });
    return { ok: true, devices: tokens.length };
  });
}
