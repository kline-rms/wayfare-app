import { chromium } from '@playwright/test';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1360,height:1050},deviceScaleFactor:1.1});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto('http://127.0.0.1:5500/app-preview.html',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
await p.click('.tab[data-app="2"]'); await p.waitForTimeout(700);
const lanes=await p.$$('.approach[data-app="2"] .lane');
for(const idx of [1,4]){ await lanes[idx].scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  await lanes[idx].screenshot({path:`../design/_shots/a2-lane${idx+1}.png`}); }
await b.close();console.log('lanes:',lanes.length,'| errors:',errs.length?errs.slice(0,4):'none');
