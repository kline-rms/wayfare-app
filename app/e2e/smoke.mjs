// Optimized Wayfare smoke test — one browser session walks the whole app,
// capturing console errors, page errors and failed requests PER screen, and
// screenshotting each. Fast (single context, direct route navigation) and
// CI-friendly (exits non-zero if any screen logged an error).
//
//   node e2e/smoke.mjs                 # headless, uses $PW_CHROMIUM or Playwright's
//   BASE=http://localhost:8081 node e2e/smoke.mjs
//
// Needs Playwright (`npm i -D playwright` + `npx playwright install chromium`)
// or point $PW_CHROMIUM at a Chromium/Chrome binary.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:8081';
const EMAIL = process.env.E2E_EMAIL || 'e2e@wayfare.dev';
const PASS = process.env.E2E_PASS || 'secret123';
const OUT = new URL('./_shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const launch = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
const b = await chromium.launch(launch);
const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();

let errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push('[console] ' + m.text().slice(0, 240)));
p.on('pageerror', (e) => errs.push('[pageerror] ' + String(e.message).slice(0, 240)));
p.on('requestfailed', (r) => {
  const u = r.url();
  // Ignore external tile/CDN aborts from camera moves — not app faults.
  if (/tile|openfreemap|gstatic|googleapis/.test(u)) return;
  errs.push('[reqfail] ' + u.slice(0, 100) + ' :: ' + (r.failure()?.errorText || ''));
});

const results = [];
const step = async (name, fn) => {
  errs = [];
  try {
    await fn();
  } catch (e) {
    errs.push('[nav] ' + e.message.slice(0, 160));
  }
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}e2e-${name}.png` }).catch(() => {});
  const ok = errs.length === 0;
  results.push({ name, ok, errs: [...errs] });
  console.log(`${ok ? '✓' : '✗'} ${name.padEnd(14)} ${p.url()}`);
  if (!ok) errs.slice(0, 5).forEach((e) => console.log('    ' + e));
};

await step('login', async () => {
  await p.goto(`${BASE}/(auth)/login`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  const inputs = p.locator('input');
  await inputs.nth(0).fill(EMAIL);
  await inputs.nth(1).fill(PASS);
  await p.getByText('Log in', { exact: true }).first().click();
  await p.waitForTimeout(2200);
});
await step('home', () => p.goto(`${BASE}/(tabs)`, { waitUntil: 'networkidle' }));
await step('trips', () => p.goto(`${BASE}/(tabs)/trips`, { waitUntil: 'networkidle' }));
await step('alerts', () => p.goto(`${BASE}/(tabs)/alerts`, { waitUntil: 'networkidle' }));
await step('profile', () => p.goto(`${BASE}/(tabs)/profile`, { waitUntil: 'networkidle' }));
await step('open-trip', async () => {
  await p.goto(`${BASE}/(tabs)/trips`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await p.getByText(/plans? ·/i).first().click();
  await p.waitForTimeout(2200);
});
await step('open-day', async () => {
  await p.getByText(/^DAY 1/i).first().click();
  await p.waitForTimeout(2200);
});
await step('create', () => p.goto(`${BASE}/create`, { waitUntil: 'networkidle' }));

await b.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} screens clean.`);
process.exit(failed.length ? 1 : 0);
