import { chromium } from '@playwright/test';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:420,height:820},deviceScaleFactor:2});
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE: '+m.text().slice(0,300)); });
console.log('loading http://localhost:8081 (first bundle can take ~1min)...');
try{
  await p.goto('http://localhost:8081', { waitUntil:'domcontentloaded', timeout:120000 });
  // wait for the app to paint something recognizable, or 90s
  await p.waitForFunction(()=>/Wayfare|Get started|Welcome|log in/i.test(document.body?.innerText||''), { timeout:120000 }).catch(()=>{});
  await p.waitForTimeout(4000);
}catch(e){ errs.push('GOTO: '+e.message); }
const bodyText=(await p.evaluate(()=>document.body?.innerText||'').catch(()=>'')).slice(0,200).replace(/\n+/g,' | ');
await p.screenshot({path:'../design/_shots/app-1.png'});
await p.waitForTimeout(4000); // let splash redirect
await p.screenshot({path:'../design/_shots/app-2.png'});
await b.close();
console.log('BODY:', bodyText);
console.log('ERRORS ('+errs.length+'):'); errs.slice(0,12).forEach(e=>console.log('  '+e));
