import { test, expect } from '@playwright/test';

// Reminder settings: the editable lead-time offsets render and toggle.
// (Actual OS notifications fire on the native app, not web.)
test('reminder settings render the editable lead times', async ({ page }) => {
  await page.goto('/reminders');
  await expect(page.getByText('Nudge me before').first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('1 hour before').first()).toBeVisible();
  await expect(page.getByText('15 min before').first()).toBeVisible();
  await expect(page.getByText('5 min before').first()).toBeVisible();
  await page.screenshot({ path: 'screens/reminders.png', fullPage: true });
});
