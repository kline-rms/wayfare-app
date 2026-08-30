import { chromium } from '@playwright/test';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1360,height:1050},deviceScaleFactor:1.15,colorScheme:'dark'});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://127.0.0.1:5500/app-preview.html',{waitUntil:'networkidle'});
await p.waitForTimeout(3500);
const lanes=await p.$$('.approach.on .lane');
await lanes[1].scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
await lanes[1].screenshot({path:'../design/_shots/fix2-lane2-dark.png'});
// route map is last frame of lane 5 — scroll the row right
await lanes[4].scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
const row5 = await lanes[4].$('.row'); await row5.evaluate(r=>r.scrollLeft=r.scrollWidth);
await p.waitForTimeout(500);
await lanes[4].screenshot({path:'../design/_shots/fix2-map-dark.png'});
await b.close();console.log('errors:',errs.length?errs.slice(0,4):'none');
