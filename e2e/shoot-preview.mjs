import { chromium } from '@playwright/test';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1360,height:1050},deviceScaleFactor:1.1});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto('http://127.0.0.1:5500/app-preview.html',{waitUntil:'networkidle'});
await p.waitForTimeout(3500); // let GLB load + animate
await p.screenshot({path:'../design/_shots/prev-hero.png'});
const loaded = await p.$eval('#loading', el=>el.style.display==='none' || el.textContent).catch(()=>'no-el');
// scroll to lanes
const lanes=await p.$$('.approach.on .lane');
for(let i=0;i<lanes.length;i++){ await lanes[i].scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await lanes[i].screenshot({path:`../design/_shots/prev-lane${i+1}.png`}); }
await b.close();console.log('loadingState:',loaded,'| errors:',errs.length?errs.slice(0,5):'none');
