import { test, expect } from '@playwright/test';
import { API_URL } from '../playwright.config';
import { authedContext, e2eSession, signIn } from './helpers';

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

// The whole thing, as a user would walk it: welcome → home → create wizard →
// generate → pick a plan → finished itinerary → a day's block schedule.
// Captures a numbered screenshot at every screen (screens/journey/NN-*.png).
const SEED_IDS = ['bgc-manila-2026', 'family-bgc-2026'];
const tap = (page: any, text: string) =>
  page.getByText(text, { exact: true }).filter({ visible: true }).first().click();

test('welcome to finished itinerary, end to end', async ({ page }) => {
  const shot = (n: string) => page.screenshot({ path: `screens/journey/${n}.png`, fullPage: true });

  // 1 — Welcome / splash → app shell
  await page.goto('/');
  await shot('01-welcome');
  await expect(page.getByText('Plan a new trip').first()).toBeVisible({ timeout: 60_000 });
  await shot('02-home');

  // 2 — Start a new trip
  await tap(page, 'Plan a new trip');
  await expect(page.getByText('Chat with Wayfare AI').first()).toBeVisible();
  await shot('03-start');

  // 3 — Wizard
  await tap(page, 'Chat with Wayfare AI');
  await expect(page.getByText('Where to?').first()).toBeVisible();
  await shot('04-basics');
  await tap(page, 'Continue');

  await expect(page.getByText("What's the vibe?").first()).toBeVisible();
  await shot('05-vibe');
  await tap(page, 'Continue');

  await expect(page.getByText('Anything you love?').first()).toBeVisible();
  await shot('06-interests');
  await tap(page, 'Continue');

  await expect(page.getByText('Ready to generate').first()).toBeVisible();
  await shot('07-review');

  // 4 — Generate (real ChatGPT when credits exist; graceful draft otherwise)
  await tap(page, 'Generate my plans');
  await page.waitForTimeout(700);
  await shot('08-generating');

  await expect(page.getByText('Pick a direction').first()).toBeVisible({ timeout: 120_000 });
  await shot('09-proposals');

  // 5 — Choose a plan → timeline written + saved → finished itinerary
  await tap(page, 'Use this plan');
  await expect(page.getByText('Day by day').first()).toBeVisible({ timeout: 120_000 });
  await shot('10-itinerary');

  // 6 — Drill into a day's block schedule
  await page.getByText(/^DAY 1/).first().click();
  await expect(page.getByText(/Schedule ·/).first()).toBeVisible({ timeout: 30_000 });
  await shot('11-day-schedule');
});

test.afterAll(async () => {
  const { token } = await e2eSession();
  const ctx = await authedContext(token);
  const list = await (await ctx.get(`${API_URL}/api/itineraries`)).json();
  for (const it of list) if (!SEED_IDS.includes(it.id)) await ctx.delete(`${API_URL}/api/itineraries/${it.id}`);
});
