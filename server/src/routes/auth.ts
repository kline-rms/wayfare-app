import type { FastifyInstance } from "fastify";
import type { Repo, StoredUser } from "../repo/types.ts";
import { hashPassword, verifyPassword, signToken, newUid, requireAuth } from "../lib/auth.ts";

function publicUser(u: StoredUser) {
  return { id: u.id, email: u.email, displayName: u.displayName, createdAt: u.createdAt };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function registerAuthRoutes(app: FastifyInstance, repo: Repo) {
  app.post<{ Body: { email?: string; password?: string; displayName?: string } }>(
    "/api/auth/register",
    async (req, reply) => {
      const email = (req.body?.email ?? "").trim().toLowerCase();
      const password = req.body?.password ?? "";
      if (!EMAIL_RE.test(email)) return reply.code(400).send({ error: "Enter a valid email address." });
      if (password.length < 6) return reply.code(400).send({ error: "Password must be at least 6 characters." });
      if (await repo.getUserByEmail(email)) return reply.code(409).send({ error: "That email is already registered." });

      const user = await repo.createUser({
        id: newUid(),
        email,
        displayName: req.body?.displayName?.trim() || email.split("@")[0],
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
      });
      return reply.code(201).send({ token: signToken(user.id), user: publicUser(user) });
    },
  );

  app.post<{ Body: { email?: string; password?: string } }>("/api/auth/login", async (req, reply) => {
    const email = (req.body?.email ?? "").trim().toLowerCase();
    const password = req.body?.password ?? "";
    const user = await repo.getUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return reply.code(401).send({ error: "Wrong email or password." });
    }
    return reply.send({ token: signToken(user.id), user: publicUser(user) });
  });

  app.get("/api/auth/me", async (req, reply) => {
    const uid = requireAuth(req, reply);
    if (!uid) return;
    const user = await repo.getUser(uid);
    if (!user) return reply.code(404).send({ error: "User not found" });
    return publicUser(user);
  });
}
