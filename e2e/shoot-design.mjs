import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:5500';
const OUT = '/Users/codemeplz/Projects/Itinerary/design/_shots';
mkdirSync(OUT, { recursive: true });

// [path, outName, fullPage?]
const shots = [
  ['docs/wayfare-flow-map.html', '00-flow-map', true],
  ['Splash.dc.html', '01-splash'],
  ['Home.dc.html', '02-home'],
  ['TripOverview.dc.html', '03-trip-overview'],
  ['Itinerary.dc.html', '04-itinerary'],
  ['Calendar.dc.html', '05-calendar'],
  ['Proposals.dc.html', '06-proposals'],
  ['PlaceDetail.dc.html', '07-place-detail'],
  ['StopEditor.dc.html', '08-stop-editor'],
  ['Profile.dc.html', '09-profile'],
  ['create/StartMethod.dc.html', '10-create-start'],
  ['create/Review.dc.html', '11-create-review'],
  ['builder/ConfirmGenerate.dc.html', '12-builder-confirm'],
  ['templates/Foodie.dc.html', '13-foodie-menu'],
];

const browser = await chromium.launch();
for (const [path, name, full] of shots) {
  const page = await browser.newPage({
    viewport: full ? { width: 1200, height: 900 } : { width: 430, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(`${BASE}/${path}`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: !!full });
  await page.close();
  console.log('shot', name);
}
await browser.close();
console.log('DONE →', OUT);
