import { test, expect, request } from '@playwright/test';
import { API_URL } from '../playwright.config';
import { authedContext, e2eSession } from './helpers';

// The generator spine: request -> 3 proposals -> expand a chosen one into a
// block timeline -> save (owned by the user) -> fetchable -> delete.
test.describe('AI generator', () => {
  test('status is public and reports an engine', async () => {
    const ctx = await request.newContext();
    const s = await (await ctx.get(`${API_URL}/api/generate/status`)).json();
    expect(['openai', 'stub']).toContain(s.engine);
  });

  test('generate requires authentication', async () => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${API_URL}/api/generate`, {
      data: { origin: 'x', destination: 'y', startDate: '2026-10-01', endDate: '2026-10-02', partySize: 2 },
    });
    expect(res.status()).toBe(401);
  });

  test('generate -> expand -> save -> delete (owned)', async () => {
    test.setTimeout(180_000);
    const { token } = await e2eSession();
    const ctx = await authedContext(token, 90_000);
    const req = {
      origin: 'Cebu',
      destination: 'BGC, Taguig',
      startDate: '2026-11-02',
      endDate: '2026-11-05',
      partySize: 3,
      purpose: 'Family weekend',
      pace: 'balanced',
      budget: 'comfortable',
      currency: 'PHP',
      interests: ['museums', 'coffee'],
    };

    const gen = await (await ctx.post(`${API_URL}/api/generate`, { data: req })).json();
    expect(gen.itinerary.proposals.length).toBe(3);
    expect(gen.itinerary.proposals[0].days.length).toBeGreaterThanOrEqual(3);
    expect(gen.itinerary.proposals[0].days[0].activities).toBeUndefined();

    const proposalId = gen.itinerary.proposals[0].id;
    const exp = await (
      await ctx.post(`${API_URL}/api/generate/timeline`, {
        data: { itinerary: gen.itinerary, proposalId, request: req },
      })
    ).json();
    const chosen = exp.itinerary.proposals.find((p: any) => p.id === proposalId);
    const blocks = chosen.days.reduce((n: number, d: any) => n + (d.activities?.length ?? 0), 0);
    expect(blocks).toBeGreaterThan(0);

    const save = await ctx.post(`${API_URL}/api/itineraries`, { data: exp.itinerary });
    expect(save.status()).toBe(201);
    const id = exp.itinerary.id;
    expect((await save.json()).ownerId).toBeTruthy(); // stamped with the owner

    const listed = await (await ctx.get(`${API_URL}/api/itineraries`)).json();
    expect(listed.map((i: any) => i.id)).toContain(id);

    const del = await ctx.delete(`${API_URL}/api/itineraries/${id}`);
    expect(del.status()).toBe(200);
  });

  test.afterAll(async () => {
    // Sweep any itineraries created during the run (keep the shared samples).
    const { token } = await e2eSession();
    const ctx = await authedContext(token);
    const list = await (await ctx.get(`${API_URL}/api/itineraries`)).json();
    for (const it of list) {
      if (it.id === 'bgc-manila-2026' || it.id === 'family-bgc-2026') continue;
      await ctx.delete(`${API_URL}/api/itineraries/${it.id}`);
    }
  });
});
