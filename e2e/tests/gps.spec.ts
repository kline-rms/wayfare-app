import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Live GPS/ETA: with a device position granted, the day's "UP NEXT" card shows a
// real distance/ETA, and the activity detail shows "… from you".
test.use({
  geolocation: { latitude: 14.5552, longitude: 121.053 }, // near the BGC home base
  permissions: ['geolocation'],
});

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test('day shows a live UP NEXT card with distance from you', async ({ page }) => {
  await page.goto('/day/fam-2026-09-12');
  await expect(page.getByText('UP NEXT').first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/from you/).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Navigate').first()).toBeVisible();
  await expect(page.getByText('Skip', { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: 'screens/gps-day.png', fullPage: true });
});

test('activity detail shows live distance', async ({ page }) => {
  await page.goto('/day/fam-2026-09-12');
  await expect(page.getByText(/Schedule ·/).first()).toBeVisible({ timeout: 60_000 });
  await page.getByText('Grab to museum', { exact: true }).first().click();
  await expect(page.getByText('Open in Google Maps').first()).toBeVisible({ timeout: 30_000 });
  // The day screen (with its own "from you") stays mounted under the pushed
  // activity screen, so scope to the visible instance.
  await expect(page.getByText(/from you/).filter({ visible: true }).first()).toBeVisible({ timeout: 20_000 });
});
