import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

// End-to-end read path: the Expo web app must fetch from the live Fastify server
// and render the Family itinerary the seed built from the xlsx. No offline
// fallback exists, so anything rendering here proves app <-> server is wired.
const FAMILY = 'family-bgc-2026';

test('splash redirects into the app shell', async ({ page }) => {
  await page.goto('/');
  // Splash auto-advances to the tabs; the Trips tab label lives in the tab bar.
  await expect(page.getByText('Trips', { exact: true }).first()).toBeVisible({ timeout: 60_000 });
});

test('Trips tab lists both itineraries from the server', async ({ page }) => {
  await page.goto('/trips');
  await expect(page.getByText("Couple's BGC + Manila Itinerary").first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("Family BGC Itinerary — Mom's Work Trip").first()).toBeVisible();
  await page.screenshot({ path: 'screens/trips.png', fullPage: true });
});

test('Family trip overview renders days + dining + grocery', async ({ page }) => {
  await page.goto(`/trip/${FAMILY}`);
  await expect(page.getByText("Family BGC Itinerary — Mom's Work Trip").first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Day by day').first()).toBeVisible();
  await expect(page.getByText('Arrival Night').first()).toBeVisible();
  await expect(page.getByText('Manila Ocean Park').first()).toBeVisible();
  // Curated sections that only exist on the family trip.
  await expect(page.getByText('Dining guide').first()).toBeVisible();
  await expect(page.getByText('Grocery plan').first()).toBeVisible();
  await page.screenshot({ path: 'screens/family-trip.png', fullPage: true });
});

test('Family day renders block-level schedule with per-person status', async ({ page }) => {
  // Sep 11 is the "Settle-in + Mom WFH" day — it carries the FOCUSED WFH block.
  await page.goto('/day/fam-2026-09-11');
  await expect(page.getByText(/Schedule ·/).first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('FOCUSED WFH').first()).toBeVisible();
  await expect(page.getByText('Mom', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Dad', { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: 'screens/family-day.png', fullPage: true });
});
