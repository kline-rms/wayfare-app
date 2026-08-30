import { test, expect, request } from '@playwright/test';
import { API_URL } from '../playwright.config';
import { authedContext, e2eSession } from './helpers';

// Server contract: proves the Fastify API serves the sample itineraries (built
// from docs/Family_Itinerary...xlsx) and enforces auth.
test.describe('API contract', () => {
  test('health check responds (public)', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${API_URL}/health`);
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).ok).toBe(true);
  });

  test('itineraries require authentication', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${API_URL}/api/itineraries`);
    expect(res.status()).toBe(401);
  });

  test('lists sample itineraries when signed in', async () => {
    const { token } = await e2eSession();
    const ctx = await authedContext(token);
    const list = await (await ctx.get(`${API_URL}/api/itineraries`)).json();
    const ids = list.map((i: any) => i.id);
    expect(ids).toContain('bgc-manila-2026');
    expect(ids).toContain('family-bgc-2026');
  });

  test('family itinerary has the full block schema', async () => {
    const { token } = await e2eSession();
    const ctx = await authedContext(token);
    const it = await (await ctx.get(`${API_URL}/api/itineraries/family-bgc-2026`)).json();

    expect(it.kind).toBe('family');
    expect(it.diningGuide.length).toBe(8);
    expect(it.groceryPlan.length).toBe(3);

    const days = it.proposals[0].days;
    expect(days.length).toBe(10);
    const totalBlocks = days.reduce((n: number, d: any) => n + (d.activities?.length ?? 0), 0);
    expect(totalBlocks).toBe(130);

    const wfh = days[1].activities.find((a: any) => a.momStatus === 'FOCUSED WFH');
    expect(wfh).toBeTruthy();
    expect(wfh.dadStatus).toBe('Working');
  });

  test('unknown itinerary returns 404', async () => {
    const { token } = await e2eSession();
    const ctx = await authedContext(token);
    const res = await ctx.get(`${API_URL}/api/itineraries/does-not-exist`);
    expect(res.status()).toBe(404);
  });
});
