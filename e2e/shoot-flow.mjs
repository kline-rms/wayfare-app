import { chromium } from '@playwright/test';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1360,height:1100},deviceScaleFactor:1.1});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto('http://127.0.0.1:5500/living-flow.html',{waitUntil:'networkidle'});await p.waitForTimeout(1600);
const lanes=await p.$$('.lane');
for(let i=0;i<lanes.length;i++){ await lanes[i].scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  await lanes[i].screenshot({path:`../design/_shots/flow-lane${i+1}.png`}); }
await p.$eval('.cover',e=>e.scrollIntoView()); await p.waitForTimeout(400);
await p.screenshot({path:'../design/_shots/flow-cover.png'});
await b.close();console.log('errors:',errs.length?errs.slice(0,4):'none');
