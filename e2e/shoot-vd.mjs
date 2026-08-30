import { chromium } from '@playwright/test';
const b=await chromium.launch();
for (const scheme of ['dark','light']){
  const p=await b.newPage({viewport:{width:1240,height:1100},deviceScaleFactor:1.35,colorScheme:scheme});
  await p.goto('http://127.0.0.1:5500/visual-direction.html',{waitUntil:'networkidle'});
  await p.waitForTimeout(1600);
  await p.screenshot({path:`../design/_shots/vd-${scheme}.png`,fullPage:true});
  await p.close();
}
await b.close();console.log('ok');
