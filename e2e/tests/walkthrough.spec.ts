import { test, expect } from '@playwright/test';
import { API_URL } from '../playwright.config';
import { authedContext, e2eSession } from './helpers';

// THE final walkthrough: a real user, welcome → sign in → generate → the
// schedule → an activity. No injected session — it logs in through the UI.
// One numbered screenshot per screen in screens/walkthrough/.
const CREDS = { email: 'e2e@wayfare.dev', password: 'secret123' };
const tap = (page: any, text: string) =>
  page.getByText(text, { exact: true }).filter({ visible: true }).first().click();

test('welcome → login → generate → schedule → activity', async ({ page }) => {
  test.setTimeout(180_000);
  await e2eSession(CREDS.email); // make sure the account exists
  const shot = (n: string) => page.screenshot({ path: `screens/walkthrough/${n}.png`, fullPage: true });

  // 1 — Welcome
  await page.goto('/');
  await shot('01-welcome');

  // 2 — Sign in (real UI)
  await expect(page.getByText('Welcome back').first()).toBeVisible({ timeout: 60_000 });
  await page.getByPlaceholder('you@email.com').fill(CREDS.email);
  await page.getByPlaceholder('••••••••').fill(CREDS.password);
  await shot('02-login');
  await page.getByText('Log in', { exact: true }).click();

  // 3 — Home
  await expect(page.getByText('Plan a new trip').first()).toBeVisible({ timeout: 30_000 });
  await shot('03-home');
  await tap(page, 'Plan a new trip');

  // 4 — Start method
  await expect(page.getByText('Chat with Wayfare AI').first()).toBeVisible();
  await shot('04-start');
  await tap(page, 'Chat with Wayfare AI');

  // 5..8 — Wizard
  await expect(page.getByText('Where to?').first()).toBeVisible();
  await shot('05-basics');
  await tap(page, 'Continue');
  await expect(page.getByText("What's the vibe?").first()).toBeVisible();
  await shot('06-vibe');
  await tap(page, 'Continue');
  await expect(page.getByText('Anything you love?').first()).toBeVisible();
  await shot('07-interests');
  await tap(page, 'Continue');
  await expect(page.getByText('Ready to generate').first()).toBeVisible();
  await shot('08-review');

  // 9 — Generating (real ChatGPT)
  await tap(page, 'Generate my plans');
  await page.waitForTimeout(800);
  await shot('09-generating');

  // 10 — Proposals
  await expect(page.getByText('Pick a direction').first()).toBeVisible({ timeout: 120_000 });
  await shot('10-proposals');
  await tap(page, 'Use this plan');

  // 11 — The itinerary
  await expect(page.getByText('Day by day').first()).toBeVisible({ timeout: 120_000 });
  await shot('11-itinerary');
  const tripId = page.url().match(/trip\/([^?]+)/)?.[1];
  expect(tripId).toBeTruthy();

  // 12 — The schedule (a day's blocks)
  await page.getByText(/^DAY 1/).first().click();
  await expect(page.getByText(/Schedule ·/).first()).toBeVisible({ timeout: 30_000 });
  await shot('12-schedule');
  const dayId = page.url().match(/day\/([^?]+)/)?.[1];

  // 13 — An activity's full detail (reliable deep-link using the saved data)
  const { token } = await e2eSession(CREDS.email);
  const ctx = await authedContext(token);
  const it = await (await ctx.get(`${API_URL}/api/itineraries/${tripId}`)).json();
  const day = it.proposals.flatMap((p: any) => p.days).find((d: any) => d.id === dayId);
  const act = day?.activities?.[0];
  if (act) {
    await page.goto(`/activity/${act.id}?it=${tripId}&day=${dayId}`);
    // The detail renders whether or not the block has a map (stay-put blocks don't).
    await expect(page.getByText(act.activity).filter({ visible: true }).first()).toBeVisible({ timeout: 30_000 });
    await shot('13-activity');
  }
});

test.afterAll(async () => {
  // Clean up the trip the walkthrough generated (keep the shared samples).
  const { token } = await e2eSession(CREDS.email);
  const ctx = await authedContext(token);
  const list = await (await ctx.get(`${API_URL}/api/itineraries`)).json();
  for (const it of list) {
    if (it.id === 'bgc-manila-2026' || it.id === 'family-bgc-2026') continue;
    await ctx.delete(`${API_URL}/api/itineraries/${it.id}`);
  }
});
