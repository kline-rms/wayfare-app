import { chromium } from '@playwright/test';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1360,height:1050},deviceScaleFactor:1.15});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto('http://127.0.0.1:5500/app-preview.html',{waitUntil:'networkidle'});
await p.waitForTimeout(3800);
// A1 live-day mannequin (lane5)
const a1=await p.$$('.approach[data-app="1"] .lane');
await a1[4].scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
await a1[4].screenshot({path:'../design/_shots/c-a1-live.png'});
// A2 calendar + night chips
await p.click('.tab[data-app="2"]'); await p.waitForTimeout(2000);
const a2=await p.$$('.approach[data-app="2"] .lane');
await a2[5].scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
await a2[5].screenshot({path:'../design/_shots/c-a2-cal.png'});
await a2[1].scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
await a2[1].screenshot({path:'../design/_shots/c-a2-tabs.png'});
await b.close();console.log('errors:',errs.length?errs.slice(0,4):'none');
