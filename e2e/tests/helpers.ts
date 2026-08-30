import { request, type APIRequestContext, type Page } from '@playwright/test';
import { API_URL } from '../playwright.config';

export interface Session {
  token: string;
  user: { id: string; email: string; displayName?: string };
}

// A stable test account (register once, reuse on later runs) so we don't
// accumulate throwaway users in the real database.
export async function e2eSession(email = 'e2e@wayfare.dev'): Promise<Session> {
  const ctx = await request.newContext();
  const creds = { email, password: 'secret123' };
  let res = await ctx.post(`${API_URL}/api/auth/register`, { data: { ...creds, displayName: 'E2E' } });
  if (res.status() === 409) res = await ctx.post(`${API_URL}/api/auth/login`, { data: creds });
  const body = await res.json();
  return { token: body.token, user: body.user };
}

/** A request context that sends the Bearer token on every call. */
export async function authedContext(token: string, timeout = 30_000): Promise<APIRequestContext> {
  return request.newContext({ extraHTTPHeaders: { authorization: `Bearer ${token}` }, timeout });
}

/** Injects a session into the page's localStorage so the app loads signed-in. */
export async function signIn(page: Page, session?: Session): Promise<Session> {
  const s = session ?? (await e2eSession());
  await page.addInitScript(
    ([t, u]) => {
      localStorage.setItem('wayfare.token', t);
      localStorage.setItem('wayfare.user', u);
    },
    [s.token, JSON.stringify(s.user)] as const,
  );
  return s;
}
