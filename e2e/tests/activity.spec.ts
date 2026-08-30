import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

// Layer 3: tapping a block on the day timeline opens the per-activity detail.
test('a travel block shows a map + Google Maps (no redundant roles)', async ({ page }) => {
  await page.goto('/day/fam-2026-09-12');
  await expect(page.getByText(/Schedule ·/).first()).toBeVisible({ timeout: 60_000 });
  await page.getByText('Grab to museum', { exact: true }).first().click();

  // Goes somewhere → map action is present.
  await expect(page.getByText('Open in Google Maps').first()).toBeVisible({ timeout: 30_000 });
  // Everyone's together on this block → no per-person breakdown.
  await expect(page.getByText("Who's doing what")).toHaveCount(0);
  await page.screenshot({ path: 'screens/activity-detail.png', fullPage: true });
});

test('a split-role block shows who is doing what', async ({ page }) => {
  // Sep 11: Mom does FOCUSED WFH while the Sister takes the kids.
  await page.goto('/day/fam-2026-09-11');
  await expect(page.getByText(/Schedule ·/).first()).toBeVisible({ timeout: 60_000 });
  await page.getByText('Mom focused WFH / Sister handles kids', { exact: true }).first().click();

  await expect(page.getByText("Who's doing what").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('FOCUSED WFH').filter({ visible: true }).first()).toBeVisible();
  // A stay-put WFH block → no map.
  await expect(page.getByText('Open in Google Maps')).toHaveCount(0);
});
