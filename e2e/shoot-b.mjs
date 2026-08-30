import { chromium } from '@playwright/test';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1360,height:1050},deviceScaleFactor:1.1});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto('http://127.0.0.1:5500/app-preview.html',{waitUntil:'networkidle'});
await p.waitForTimeout(4000);
// A1 generating mannequin + dock
const a1=await p.$$('.approach[data-app="1"] .lane');
await a1[3].scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
await a1[3].screenshot({path:'../design/_shots/b-a1-gen.png'});
const a1man = await p.$$eval('.approach[data-app="1"] .man3d canvas', els=>els.length);
// switch to A2
await p.click('.tab[data-app="2"]'); await p.waitForTimeout(2500);
const a2man = await p.$$eval('.approach[data-app="2"] .man3d canvas', els=>els.length);
const a2=await p.$$('.approach[data-app="2"] .lane');
await a2[1].scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
await a2[1].screenshot({path:'../design/_shots/b-a2-tabs.png'});
await a2[2].scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
await a2[2].screenshot({path:'../design/_shots/b-a2-create.png'});
await a2[5].scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
await a2[5].screenshot({path:'../design/_shots/b-a2-settings.png'});
await b.close();
console.log('A1 man canvases:',a1man,'| A2 man canvases:',a2man,'| errors:',errs.length?errs.slice(0,4):'none');
