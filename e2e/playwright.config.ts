import { defineConfig, devices } from '@playwright/test';

// The Expo web dev server (npm run web -> http://localhost:8081) and the
// Fastify API (npm run server -> http://localhost:4100) must both be running.
// Override with WEB_URL / API_URL.
export const WEB_URL = process.env.WEB_URL ?? 'http://localhost:8081';
export const API_URL = process.env.API_URL ?? 'http://localhost:4100';

export default defineConfig({
  testDir: './tests',
  // Metro compiles the web bundle on first hit; give navigations room.
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 90_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
