import { chromium } from '@playwright/test';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1360,height:1050},deviceScaleFactor:1.1});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto('http://127.0.0.1:5500/app-preview.html',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
await p.click('.tab[data-app="4"]'); await p.waitForTimeout(2800);
const a4man = await p.$$eval('.approach[data-app="4"] .man3d canvas', els=>els.length);
const lanes=await p.$$('.approach[data-app="4"] .lane');
for(const i of [1,3,4]){ await lanes[i].scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
  await lanes[i].screenshot({path:`../design/_shots/a4-lane${i+1}.png`}); }
await b.close();console.log('A4 mannequins:',a4man,'| errors:',errs.length?errs.slice(0,4):'none');
