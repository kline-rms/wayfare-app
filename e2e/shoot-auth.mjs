import { chromium } from '@playwright/test';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:420,height:820},deviceScaleFactor:2});
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR: '+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('CON: '+m.text().slice(0,200));});
await p.goto('http://localhost:8081', { waitUntil:'domcontentloaded', timeout:120000 });
await p.waitForFunction(()=>/log in/i.test(document.body?.innerText||''),{timeout:120000}).catch(()=>{});
const inputs = p.locator('input');
await inputs.nth(0).fill('e2e@wayfare.dev');
await inputs.nth(1).fill('secret123');
await p.getByText('Log in',{exact:true}).click().catch(async()=>{ await p.locator('text=Log in').first().click(); });
// wait for home
await p.waitForFunction(()=>/good morning|plan a new trip|your trips|no itineraries/i.test(document.body?.innerText||''),{timeout:60000}).catch(()=>{});
await p.waitForTimeout(4000);
await p.screenshot({path:'../design/_shots/app-home.png'});
console.log('HOME:', (await p.evaluate(()=>document.body?.innerText||'')).slice(0,160).replace(/\n+/g,' | '));
// go to the full map
await p.goto('http://localhost:8081/map', { waitUntil:'domcontentloaded', timeout:60000 });
await p.waitForTimeout(9000); // map tiles + OSRM + 3D
await p.screenshot({path:'../design/_shots/app-map.png'});
await b.close();
console.log('ERRORS('+errs.length+'):'); errs.slice(0,10).forEach(e=>console.log('  '+e));
