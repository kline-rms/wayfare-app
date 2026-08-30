import { test, expect } from '@playwright/test';

// The 3D globe hero renders a three.js <canvas> on the splash (public, pre-redirect).
test('splash renders the 3D globe', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 90_000 });
  await page.waitForTimeout(1400); // let it spin a little
  await page.screenshot({ path: 'screens/globe.png' });
});
