import { chromium } from '@playwright/test';
const b=await chromium.launch();
// force DARK theme to test the contrast fix
const p=await b.newPage({viewport:{width:1360,height:1050},deviceScaleFactor:1.1,colorScheme:'dark'});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto('http://127.0.0.1:5500/app-preview.html',{waitUntil:'networkidle'});
await p.waitForTimeout(4000); // 2 GLB loads + animate
await p.screenshot({path:'../design/_shots/fix-hero-dark.png'});
const up3d = await p.$eval('#upnext3d canvas', c=>({w:c.width,h:c.height})).catch(()=>null);
const loadGone = await p.$eval('#loading', el=>el.style.display).catch(()=>'?');
// lane 5 (has upnext + map) and lane 2 (dock) in dark mode
const lanes=await p.$$('.approach.on .lane');
await lanes[4].scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
await lanes[4].screenshot({path:'../design/_shots/fix-lane5-dark.png'});
await lanes[1].scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
await lanes[1].screenshot({path:'../design/_shots/fix-lane2-dark.png'});
await b.close();
console.log('upnext canvas:',up3d,'| hero loading display:',loadGone,'| errors:',errs.length?errs.slice(0,4):'none');
