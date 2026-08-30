import { chromium } from '@playwright/test';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1360,height:1050},deviceScaleFactor:1.1});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto('http://127.0.0.1:5500/app-preview.html',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
// verify dock circle is square-ish bounding (perfect circle) on A1
const dockBox = await p.$eval('.approach[data-app="1"] .dock .d', el=>{const r=el.getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height)};});
await p.click('.tab[data-app="3"]'); await p.waitForTimeout(2500);
const a3man = await p.$$eval('.approach[data-app="3"] .man3d canvas', els=>els.length);
const lanes=await p.$$('.approach[data-app="3"] .lane');
for(const i of [0,3]){ await lanes[i].scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
  await lanes[i].screenshot({path:`../design/_shots/a3-lane${i+1}.png`}); }
await b.close();console.log('dock .d box:',dockBox,'| A3 mannequins:',a3man,'| errors:',errs.length?errs.slice(0,4):'none');
