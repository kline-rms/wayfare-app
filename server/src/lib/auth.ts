// Auth primitives — zero dependency (Node crypto). Passwords are scrypt-hashed
// with a per-user salt; sessions are stateless HMAC-signed tokens.
import { randomBytes, scryptSync, timingSafeEqual, createHmac, randomUUID } from "node:crypto";
import { env } from "./env.ts";

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function newUid(): string {
  return randomUUID();
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(password, salt, 64);
  const orig = Buffer.from(hash, "hex");
  return test.length === orig.length && timingSafeEqual(test, orig);
}

/** Stateless session token: base64url(uid.exp).hmac — verified without storage. */
export function signToken(uid: string): string {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const body = `${uid}.${exp}`;
  const sig = createHmac("sha256", env.authSecret).update(body).digest("base64url");
  return `${Buffer.from(body).toString("base64url")}.${sig}`;
}

export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  const body = Buffer.from(b64, "base64url").toString();
  const expect = createHmac("sha256", env.authSecret).update(body).digest("base64url");
  if (sig.length !== expect.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  const [uid, expStr] = body.split(".");
  if (!uid || Number(expStr) < Math.floor(Date.now() / 1000)) return null;
  return uid;
}

/** Reads + verifies the Bearer token; replies 401 and returns null when absent/invalid. */
export function requireAuth(req: { headers: Record<string, unknown> }, reply: { code: (n: number) => { send: (b: unknown) => void } }): string | null {
  const header = req.headers["authorization"];
  const token = typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7) : undefined;
  const uid = verifyToken(token);
  if (!uid) {
    reply.code(401).send({ error: "Sign in required" });
    return null;
  }
  return uid;
}
