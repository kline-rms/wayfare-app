import { chromium } from '@playwright/test';
const b=await chromium.launch();const p=await b.newPage();
p.on('requestfailed',r=>console.log('FAILED',r.url()));
p.on('response',r=>{if(r.status()>=400)console.log(r.status(),r.url());});
await p.goto('http://127.0.0.1:5500/character.html',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);await b.close();
