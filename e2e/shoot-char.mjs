import { chromium } from '@playwright/test';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:900},deviceScaleFactor:1.4});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto('http://127.0.0.1:5500/character.html',{waitUntil:'networkidle'});await p.waitForTimeout(2200);
await p.click('button[data-model="CesiumMan.glb"]').catch(()=>{});
await p.waitForTimeout(2000);
await p.screenshot({path:'../design/_shots/char-casual.png'});
await b.close();console.log('errors:',errs.length?errs.slice(0,3):'none');
