import { chromium } from '@playwright/test';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:420,height:820},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://127.0.0.1:5500/_map-test.html',{waitUntil:'load'});
// wait for map ready or error, up to 12s
await p.waitForFunction(()=>window.__mapReady||window.__mapError,{timeout:12000}).catch(()=>{});
await p.waitForTimeout(2500); // let tiles paint
const ready=await p.evaluate(()=>({ready:!!window.__mapReady,error:window.__mapError||null}));
await p.screenshot({path:'../design/_shots/maptest.png'});
await b.close();console.log('map:',JSON.stringify(ready),'| pageerrors:',errs.slice(0,3));
