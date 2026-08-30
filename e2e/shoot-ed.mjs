import { chromium } from '@playwright/test';
const b=await chromium.launch();
for(const s of ['light','dark']){const p=await b.newPage({viewport:{width:1240,height:1100},deviceScaleFactor:1.35,colorScheme:s});
await p.goto('http://127.0.0.1:5500/direction-editorial.html',{waitUntil:'networkidle'});await p.waitForTimeout(1600);
await p.screenshot({path:`../design/_shots/ed-${s}.png`,fullPage:true});await p.close();}
await b.close();console.log('ok');
