import { chromium } from '@playwright/test';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1160,height:1000},deviceScaleFactor:1.3});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://127.0.0.1:5500/direction-playful.html',{waitUntil:'networkidle'});await p.waitForTimeout(1500);
await p.screenshot({path:'../design/_shots/dir-play-top.png'});
// scroll to applied screens
await p.evaluate(()=>document.querySelectorAll('section')[3].scrollIntoView());
await p.waitForTimeout(700);
await p.screenshot({path:'../design/_shots/dir-play-screens.png'});
await b.close();console.log('errors:',errs.length?errs:'none');
