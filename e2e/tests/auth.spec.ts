import { test, expect } from '@playwright/test';
import { API_URL } from '../playwright.config';
import { authedContext, e2eSession } from './helpers';

function sampleItinerary(id: string) {
  return {
    id,
    title: 'A private trip',
    subtitle: 'test',
    dateRange: { start: '2026-10-01', end: '2026-10-02' },
    partySize: 2,
    currency: 'PHP',
    homeBase: 'Somewhere',
    assumptions: [],
    disclaimer: 'test',
    proposals: [
      { id: 'p1', name: 'Plan', shortName: 'P', style: 'Balanced', bestFor: 'x', fullDayFocus: '', weekdayRule: '', estTotal: { low: 0, high: 0 }, travelTotal: 0, days: [] },
    ],
    places: [],
  };
}

test('unauthenticated app redirects to the sign-in screen', async ({ page }) => {
  await page.goto('/trips'); // a gated tab
  await expect(page.getByText('Welcome back').first()).toBeVisible({ timeout: 60_000 });
});

test('sign in through the UI lands on Home', async ({ page }) => {
  await e2eSession(); // make sure the account exists
  await page.goto('/(auth)/login');
  await expect(page.getByText('Welcome back').first()).toBeVisible({ timeout: 60_000 });
  await page.getByPlaceholder('you@email.com').fill('e2e@wayfare.dev');
  await page.getByPlaceholder('••••••••').fill('secret123');
  await page.getByText('Log in', { exact: true }).click();
  await expect(page.getByText('Plan a new trip').first()).toBeVisible({ timeout: 30_000 });
});

test('trips are private to their owner', async () => {
  const a = await e2eSession('e2e@wayfare.dev');
  const b = await e2eSession('e2e-other@wayfare.dev');
  const ctxA = await authedContext(a.token);
  const ctxB = await authedContext(b.token);

  const id = `iso-${a.user.id.slice(0, 6)}-test`;
  // clean any leftover from a prior run, then create
  await ctxA.delete(`${API_URL}/api/itineraries/${id}`);
  const save = await ctxA.post(`${API_URL}/api/itineraries`, { data: sampleItinerary(id) });
  expect(save.status()).toBe(201);

  // Owner A sees it; other user B does not.
  const listA = (await (await ctxA.get(`${API_URL}/api/itineraries`)).json()).map((i: any) => i.id);
  const listB = (await (await ctxB.get(`${API_URL}/api/itineraries`)).json()).map((i: any) => i.id);
  expect(listA).toContain(id);
  expect(listB).not.toContain(id);

  // B cannot read or delete A's trip.
  expect((await ctxB.get(`${API_URL}/api/itineraries/${id}`)).status()).toBe(403);
  expect((await ctxB.delete(`${API_URL}/api/itineraries/${id}`)).status()).toBe(403);

  // Both still see the shared samples.
  expect(listB).toContain('family-bgc-2026');

  await ctxA.delete(`${API_URL}/api/itineraries/${id}`); // cleanup
});
