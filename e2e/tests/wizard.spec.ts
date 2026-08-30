import { test, expect } from '@playwright/test';
import { API_URL } from '../playwright.config';
import { authedContext, e2eSession, signIn } from './helpers';

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

// Drives the real create wizard end to end: basics -> vibe -> interests ->
// review -> generate -> pick a proposal -> the timeline is written, saved, and
// opened. Proves the whole generation spine works through the UI.
const SEED_IDS = ['bgc-manila-2026', 'family-bgc-2026'];

// Clicks the visible instance of a control (two screens briefly coexist during
// the slide transition, so scope to what's actually on screen).
const tap = (page: any, text: string) =>
  page.getByText(text, { exact: true }).filter({ visible: true }).first().click();

test('create wizard generates, saves and opens a trip', async ({ page }) => {
  await page.goto('/create/basics');
  await expect(page.getByText('Where to?').first()).toBeVisible({ timeout: 60_000 });
  await tap(page, 'Continue');

  await expect(page.getByText("What's the vibe?").first()).toBeVisible();
  await tap(page, 'Continue');

  await expect(page.getByText('Anything you love?').first()).toBeVisible();
  await tap(page, 'Continue');

  await expect(page.getByText('Ready to generate').first()).toBeVisible();
  await tap(page, 'Generate my plans');

  // Generating -> 3 proposals.
  await expect(page.getByText('Pick a direction').first()).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: 'screens/wizard-proposals.png', fullPage: true });

  // Choose the first plan -> timeline written + saved -> trip opens.
  await tap(page, 'Use this plan');
  await expect(page.getByText('Day by day').first()).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: 'screens/wizard-trip.png', fullPage: true });
});

test.afterAll(async () => {
  const { token } = await e2eSession();
  const ctx = await authedContext(token);
  const list = await (await ctx.get(`${API_URL}/api/itineraries`)).json();
  for (const it of list) {
    if (!SEED_IDS.includes(it.id)) await ctx.delete(`${API_URL}/api/itineraries/${it.id}`);
  }
});
