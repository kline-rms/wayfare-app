// Purpose templates — DIFFERENT structure per purpose, mood coordinated to purpose,
// and each surfaces the itinerary FORMAT (time · destination · plan · travel mode+cost ·
// food cost range · notes). Run: node build-templates.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { wrap, PALETTES, I, cta } from "../build-dc.mjs";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const N = PALETTES.Neutral;
const screens = {};
const meta = {};

// mood-coordinated themes
const TH = {
  Date: { ...PALETTES.Nightfall, display: "serif" },                                            // romantic · cinematic dark
  City: { bg: "#EDF1F6", card: "#FFFFFF", ink: "#132033", sec: "#66768B", ter: "#AAB6C4", line: "#E2E7EE", primary: "#2E6BE0", primaryd: "#245BC4", a1: "#2E6BE0", a2: "#12B3A6", a3: "#3E97E5", a4: "#8B7CF0", display: "jakarta" }, // fresh · exploratory
  Foodie: { bg: "#FFF1E4", card: "#FFFBF6", ink: "#2A130A", sec: "#8E5C42", ter: "#C69B7E", line: "#F5E2D1", primary: "#E23B2E", primaryd: "#C72E22", a1: "#F2A100", a2: "#2E9E6E", a3: "#C1440F", a4: "#8A5A18", display: "grotesk" }, // delicious · tomato/mustard/basil
  Family: { bg: "#FAEADD", card: "#FFFBF6", ink: "#3A2418", sec: "#856349", ter: "#C7A88C", line: "#F0E1D3", primary: "#DA6A43", primaryd: "#C4562F", a1: "#DA6A43", a2: "#6BB86B", a3: "#3E97E5", a4: "#E0447E", display: "grotesk", ctaText: "#2E140C" }, // warm · cozy terracotta
};
const bcta = (label, txt, icon, shadow) => `<div style="height:60px;border-radius:999px;background:var(--primary);color:${txt};display:flex;align-items:center;justify-content:center;gap:9px;font-size:16px;font-weight:800;box-shadow:0 14px 26px ${shadow}">${label} ${icon}</div>`;

// ============ DATE — cinematic evening timeline + format (photos + real route) ============
const dConn = (txt) => `<div style="display:flex;align-items:center;gap:7px;padding:8px 0 8px 71px;color:rgba(255,255,255,.5);font-size:11px;font-weight:600">${I.car("rgba(255,255,255,.5)", 14)}${txt}</div>`;
const evStop = (img, time, name, place, plan, food) => `<div style="display:flex;gap:13px;align-items:flex-start">
  <div style="width:58px;height:58px;border-radius:16px;background-image:url('${img}');background-size:cover;background-position:center;flex-shrink:0"></div>
  <div style="flex:1;min-width:0">
    <div style="display:flex;justify-content:space-between;align-items:center"><div class="mono" style="font-size:11px;letter-spacing:.1em;color:var(--primary)">${time}</div><div style="display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--sec)">${I.food("var(--sec)", 13)}${food}</div></div>
    <div class="serif" style="font-size:24px;line-height:1;margin-top:4px;color:var(--ink)">${name}</div>
    <div style="font-size:12px;font-weight:600;color:var(--sec);margin-top:2px">${place}</div>
    <div style="font-size:12.5px;font-weight:500;color:var(--sec);font-style:italic;margin-top:5px;opacity:.9">${plan}</div>
  </div></div>`;
screens.Date = `<div class="frame" style="position:relative">
  <div style="height:230px;flex-shrink:0;position:relative;overflow:hidden">
    <div class="kb" style="position:absolute;inset:0;background-image:url('city.jpg');background-size:cover;background-position:center"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,17,16,.5),transparent 34%,rgba(20,17,16,.98))"></div>
    <div class="safe"></div>
    <div class="pad" style="position:relative;display:flex;justify-content:space-between"><div style="width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center">${I.back("#fff")}</div><div style="width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center">${I.share("#fff", 19)}</div></div>
    <div style="position:absolute;left:22px;right:22px;bottom:16px;color:#fff">
      <div class="mono a-pop" style="font-size:11px;letter-spacing:.22em;color:var(--primary)">DATE NIGHT · FRI AUG 29</div>
      <h1 class="serif a-pop" style="animation-delay:.1s;font-size:42px;line-height:.9;margin:8px 0 0">The Golden Evening</h1>
      <div class="a-pop" style="animation-delay:.16s;font-size:12.5px;font-weight:600;color:rgba(255,255,255,.78);margin-top:6px">from Avida, Makati · 2 people · est. ₱4.5–7k</div>
    </div>
  </div>
  <div style="flex:1;overflow:hidden;padding:14px 22px 0">
    ${dConn("6 min by Grab from Avida")}
    ${evStop("rooftop.jpg", "6:00 PM", "The Blue Leaf Sky", "Rooftop bar · Poblacion, Makati", "Cocktails as the skyline glows.", "₱1.2–2.4k")}
    ${dConn("8 min by Grab · ₱150")}
    ${evStop("dinner.jpg", "7:30 PM", "Osteria Daniele", "Italian · Salcedo, Makati", "A long, candle-lit dinner.", "₱2.4–4.2k")}
    ${dConn("14 min by Grab · ₱280 → BGC")}
    ${evStop("icecream.jpg", "9:30 PM", "Café Bola", "Dessert · High Street, BGC", "Gelato and a night walk.", "₱0.6–1.2k")}
  </div>
  <div class="pad" style="padding-bottom:22px;padding-top:4px">${bcta("Start the night", "#fff", I.nav("#fff", 18), "rgba(0,0,0,.42)")}</div>
</div>`;
meta.Date = TH.Date;

// ============ CITY BREAK — multi-day dashboard + format ============
const dayCard = (day, date, theme, img, state) => `<div style="flex-shrink:0;width:106px;border-radius:16px;overflow:hidden;position:relative;height:116px;${state === "on" ? "outline:3px solid var(--primary);outline-offset:-3px" : ""}">
  <div style="position:absolute;inset:0;background-image:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.72)),url('${img}');background-size:cover;background-position:center"></div>
  ${state === "done" ? `<div style="position:absolute;top:9px;right:9px">${I.checkC("#7CE0A8", 18)}</div>` : ""}
  <div style="position:absolute;left:11px;right:11px;bottom:10px;color:#fff"><div class="mono" style="font-size:9.5px;letter-spacing:.1em;opacity:.85">${date}</div><div style="font-size:14px;font-weight:800;margin-top:2px">${day}</div><div style="font-size:10.5px;font-weight:600;opacity:.85">${theme}</div></div></div>`;
const gCard = (img, name, time, plan, travel, cost) => `<div style="border-radius:18px;overflow:hidden;background:var(--card);box-shadow:0 6px 16px rgba(20,30,50,.08)"><div style="height:76px;background-image:url('${img}');background-size:cover;background-position:center"></div><div style="padding:10px 12px">
  <div style="display:flex;align-items:baseline;justify-content:space-between"><div style="font-size:13px;font-weight:800">${name}</div><div class="mono" style="font-size:10px;color:var(--sec)">${time}</div></div>
  <div style="font-size:11px;font-weight:500;color:var(--sec);margin-top:5px;line-height:1.3">${plan}</div>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px"><span style="display:flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;color:var(--sec)">${travel}</span><span style="font-size:11.5px;font-weight:800">${cost}</span></div></div></div>`;
const twk = (t) => `${I.walk("var(--sec)", 12)}<span>${t}</span>`;
const tcar = (t) => `${I.car("var(--sec)", 12)}<span>${t}</span>`;
const cityMap = `<svg width="346" height="112" viewBox="0 0 346 112" style="display:block"><rect width="346" height="112" fill="#E3E9F0"/><g stroke="#fff" stroke-width="8" stroke-linecap="round"><path d="M-10 38 H360"/><path d="M-10 82 H360"/><path d="M120 -10 V120"/><path d="M240 -10 V120"/></g><g stroke="#CBD6E4" stroke-width="4"><path d="M60 -10 V120"/></g><path d="M40 92 C90 66 110 38 180 44 S280 28 320 22" stroke="#2E6BE0" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="40" cy="92" r="6" fill="#2E6BE0" stroke="#fff" stroke-width="2"/><circle cx="320" cy="22" r="6" fill="#E8532A" stroke="#fff" stroke-width="2"/></svg>`;
screens.City = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:2px;display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:12px">${I.back()}<div><div style="font-size:17px;font-weight:800;letter-spacing:-.2px">Manila City Break</div><div class="sec" style="font-size:11.5px;font-weight:600">Aug 26 – Sep 6 · from Makati · 2 pax</div></div></div>
    <div style="width:42px;height:42px;border-radius:14px;background:var(--card);box-shadow:0 4px 12px rgba(20,30,50,.08);display:flex;align-items:center;justify-content:center">${I.share("#132033", 18)}</div>
  </div>
  <div style="display:flex;gap:10px;overflow:hidden;padding:14px 22px 4px">
    ${dayCard("Day 3", "FRI 28", "BGC", "bgc.jpg", "done")}
    ${dayCard("Day 4", "SAT 29", "Old Manila", "bgc.jpg", "on")}
    ${dayCard("Day 5", "SUN 30", "Binondo", "ramen.jpg", "")}
    ${dayCard("Day 6", "MON 31", "Makati", "city.jpg", "")}
  </div>
  <div class="pad" style="margin-top:10px"><div style="border-radius:18px;overflow:hidden;position:relative;box-shadow:0 6px 16px rgba(20,30,50,.08)">${cityMap}<div style="position:absolute;top:9px;left:10px;background:rgba(255,255,255,.92);border-radius:999px;padding:4px 10px;font-size:11px;font-weight:800">Sat · 4 stops · 6.2 km · ₱2.4k</div><div style="position:absolute;right:10px;bottom:9px;background:var(--primary);color:#fff;border-radius:999px;padding:5px 12px;font-size:11.5px;font-weight:800">View map</div></div></div>
  <div class="pad" style="margin-top:14px;display:flex;justify-content:space-between;align-items:center"><b style="font-size:15px;font-weight:800">Day 4 · Old Manila</b><span class="sec" style="font-size:11.5px;font-weight:700">9 AM – 6 PM</span></div>
  <div class="pad" style="flex:1;overflow:hidden;margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:12px;align-content:start">
    ${gCard("museum.jpg", "National Museum", "9:00 AM", "Neoclassical halls, free entry.", `${I.pin("var(--sec)", 12)}<span>start</span>`, "Free")}
    ${gCard("cathedral.jpg", "Manila Cathedral", "12:00 PM", "Baroque landmark in Intramuros.", twk("8 min"), "Free")}
    ${gCard("fortsantiago.jpg", "Fort Santiago", "2:30 PM", "Historic fort & Rizal shrine.", twk("6 min"), "₱150")}
    ${gCard("manilabay.jpg", "Manila Bay", "5:30 PM", "Golden hour on the baywalk.", tcar("12 min · ₱120"), "Free")}
  </div>
  <div class="pad" style="padding-bottom:22px;padding-top:8px">${bcta("Open full day", "#fff", I.arrow("#fff", 18), "rgba(46,107,224,.4)")}</div>
</div>`;
meta.City = TH.City;

// ============ FOODIE — food-crawl feed + format ============
const fConn = (txt) => `<div style="display:flex;align-items:center;justify-content:center;gap:7px;color:var(--sec);font-size:11.5px;font-weight:700">${I.walk("var(--sec)", 15)}${txt}</div>`;
const foodCard = (num, img, dish, place, time, tag, food, plan) => `<div style="border-radius:22px;overflow:hidden;background:var(--card);box-shadow:0 8px 20px rgba(90,20,0,.1)">
  <div style="height:118px;position:relative"><div style="position:absolute;inset:0;background-image:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.46)),url('${img}');background-size:cover;background-position:center"></div>
    <div style="position:absolute;top:11px;left:11px;width:28px;height:28px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px">${num}</div>
    <div style="position:absolute;top:11px;right:11px;background:var(--a1,#F2A100);color:#3a2200;font-size:9.5px;font-weight:800;letter-spacing:.3px;padding:5px 10px;border-radius:999px">${tag}</div>
    <div class="grotesk" style="position:absolute;left:13px;bottom:10px;right:13px;color:#fff;font-size:20px;line-height:1">${dish}</div></div>
  <div style="padding:10px 15px 12px">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div><div style="display:flex;align-items:center;gap:5px">${I.pin("var(--sec)", 13)}<span style="font-size:12px;font-weight:700;color:var(--sec)">${place}</span></div><div class="mono" style="font-size:10px;color:var(--ter);margin-top:2px">${time}</div></div>
      <span style="font-size:14px;font-weight:800;color:var(--primary)">${food}</span></div>
    <div style="font-size:11.5px;font-weight:500;color:var(--sec);margin-top:6px;line-height:1.35">${plan}</div></div></div>`;
screens.Foodie = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:2px;display:flex;align-items:center;gap:14px">${I.back()}<div><h1 class="grotesk" style="font-size:24px;margin:0">Binondo Bites</h1><div class="sec" style="font-size:11.5px;font-weight:600;margin-top:1px">Sun · from Makati · 2 pax · 4 stops · noon–8 PM</div></div></div>
  <div class="pad" style="margin-top:12px;display:flex;align-items:center;gap:7px">${[1, 2, 3, 4].map((n, i) => `<div style="flex:1;height:5px;border-radius:3px;background:${i === 0 ? "var(--primary)" : "var(--line)"}"></div>`).join("")}<span class="mono" style="font-size:11px;color:var(--primary);margin-left:4px">1/4</span></div>
  <div style="flex:1;overflow:hidden;padding:12px 22px 0;display:flex;flex-direction:column;gap:11px">
    <div style="display:flex;align-items:center;justify-content:center;gap:7px;color:var(--sec);font-size:11.5px;font-weight:700">${I.car("var(--sec)", 15)}25 min by Grab from Makati · ₱180</div>
    ${foodCard("1", "ramen.jpg", "Hand-pulled beef noodles", "Lan Zhou · Ongpin St", "12:00 PM", "MUST-TRY", "₱250–350", "Watch them pull the noodles at the counter.")}
    ${fConn("3 min walk to Nueva St")}
    ${foodCard("2", "coffee.jpg", "Kopi & kaya toast", "Café Mezzanine · Nueva St", "2:00 PM", "LOCAL FAV", "₱180–260", "A quiet second-floor break from the crowd.")}
    ${fConn("4 min walk back to Ongpin St")}
    ${foodCard("3", "pastry.jpg", "Fresh lumpia & hopia", "Eng Bee Tin · Ongpin", "4:00 PM", "TAKE-HOME", "₱120–220", "Grab hopia boxes to take home.")}
    ${fConn("5 min walk to Lucky Chinatown")}
    ${foodCard("4", "icecream.jpg", "Black-sesame soft-serve", "Lucky Chinatown Mall", "6:30 PM", "SWEET END", "₱150–300", "Cool down before the ride home.")}
  </div>
  <div class="pad" style="padding-bottom:20px;padding-top:8px">${bcta("Start the crawl", "#fff", I.nav("#fff", 18), "rgba(226,59,46,.4)")}</div>
</div>`;
meta.Foodie = TH.Foodie;

// ============ FAMILY — warm & cozy practical blocks + format ============
const chip = (icon, txt) => `<span style="display:inline-flex;align-items:center;gap:5px;background:var(--bg);padding:5px 10px;border-radius:999px;font-size:11px;font-weight:700;color:var(--sec)">${icon}${txt}</span>`;
// number badge = the stop's order in the day (its only job)
const famBlock = (num, img, name, time, plan, chips) => `<div style="background:var(--card);border-radius:24px;padding:13px;box-shadow:0 6px 18px rgba(80,40,10,.08)">
  <div style="display:flex;gap:13px;align-items:center">
    <div style="position:relative;width:64px;height:64px;flex-shrink:0"><div style="width:64px;height:64px;border-radius:20px;background-image:url('${img}');background-size:cover;background-position:center"></div><div style="position:absolute;top:-6px;left:-6px;width:24px;height:24px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;border:2px solid var(--card)">${num}</div></div>
    <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:16px;font-weight:800">${name}</div><div class="mono" style="font-size:10.5px;color:var(--sec)">${time}</div></div><div style="font-size:12.5px;font-weight:500;color:var(--sec);margin-top:3px">${plan}</div></div>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:11px">${chips}</div></div>`;
screens.Family = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:2px;display:flex;align-items:center;gap:14px">${I.back()}<div><h1 class="grotesk" style="font-size:26px;margin:0">A Family Day</h1><div class="sec" style="font-size:11.5px;font-weight:600;margin-top:1px">Sat · around Avida, BGC · 2 adults + 2 kids</div></div></div>
  <div class="pad" style="margin-top:14px;display:flex;gap:10px">
    ${[[I.clock("#DA6A43", 18), "6 hrs", "10–4 PM"], [I.walk("#DA6A43", 18), "4 stops", "all walkable"], [I.wallet("#DA6A43", 18), "₱2.3k", "for 4"]].map(([ic, a, b]) => `<div style="flex:1;background:var(--card);border-radius:20px;padding:12px;box-shadow:0 6px 16px rgba(80,40,10,.06)">${ic}<div style="font-size:16px;font-weight:800;margin-top:6px">${a}</div><div class="sec" style="font-size:11px;font-weight:600">${b}</div></div>`).join("")}
  </div>
  <div style="flex:1;overflow:hidden;padding:14px 22px 0;display:flex;flex-direction:column;gap:10px">
    ${famBlock("1", "sciencemuseum.jpg", "The Mind Museum", "10:00 AM", "6-min walk from home; hands-on floors.", chip(I.walk("var(--sec)", 12), "6 min") + chip(I.clock("var(--sec)", 12), "2h") + chip(I.users("var(--sec)", 12), "all ages") + chip(I.wallet("var(--sec)", 12), "₱750"))}
    ${famBlock("2", "dinner.jpg", "Lunch at High Street", "12:30 PM", "Casual lunch with a kids' menu.", chip(I.walk("var(--sec)", 12), "5 min") + chip(I.clock("var(--sec)", 12), "1h") + chip(I.wallet("var(--sec)", 12), "₱1.2k"))}
    ${famBlock("3", "playground.jpg", "Track 30th playground", "2:00 PM", "Open lawn to run it off.", chip(I.walk("var(--sec)", 12), "3 min") + chip(I.clock("var(--sec)", 12), "1h") + chip(I.wallet("var(--sec)", 12), "free"))}
    ${famBlock("4", "icecream.jpg", "Soft-serve at High Street", "3:30 PM", "Sweet finish before heading home.", chip(I.walk("var(--sec)", 12), "4 min") + chip(I.clock("var(--sec)", 12), "30m") + chip(I.wallet("var(--sec)", 12), "₱400"))}
  </div>
  <div class="pad" style="padding-bottom:22px;padding-top:6px">${bcta("See the day", "#2E140C", I.arrow("#2E140C", 18), "rgba(218,106,67,.4)")}</div>
</div>`;
meta.Family = TH.Family;

// ============ PURPOSE PICKER ============
const purposeCard = (img, label, sub, on) => `<div style="border-radius:20px;overflow:hidden;position:relative;height:118px;${on ? "outline:3px solid var(--primary);outline-offset:-3px" : "box-shadow:0 6px 16px rgba(20,20,20,.08)"}">
  <div style="position:absolute;inset:0;background-image:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.66)),url('${img}');background-size:cover;background-position:center"></div>
  ${on ? `<div style="position:absolute;top:10px;right:10px;width:24px;height:24px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center">${I.check("#fff", 15)}</div>` : ""}
  <div style="position:absolute;left:13px;right:13px;bottom:11px;color:#fff"><div style="font-size:15px;font-weight:800">${label}</div><div style="font-size:10.5px;font-weight:600;opacity:.82">${sub}</div></div></div>`;
screens.PurposePicker = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:2px;display:flex;align-items:center;gap:14px">${I.back()}<b style="font-size:17px;font-weight:800">New itinerary</b></div>
  <div class="pad" style="margin-top:22px"><h1 style="font-size:34px;font-weight:800;letter-spacing:-.7px;line-height:1;margin:0">What's the plan?</h1><p class="sec" style="font-size:14px;font-weight:500;margin:8px 0 0">Each purpose builds its own layout &amp; feel — same trip format underneath.</p></div>
  <div class="pad" style="flex:1;overflow:hidden;margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;align-content:start">
    ${purposeCard("city.jpg", "Date night", "romantic · evening", true)}
    ${purposeCard("bgc.jpg", "City break", "explore · multi-day", false)}
    ${purposeCard("dinner.jpg", "Foodie crawl", "delicious · wander", false)}
    ${purposeCard("museum.jpg", "Family day", "warm · all ages", false)}
    ${purposeCard("city.jpg", "Business trip", "efficient · nearby", false)}
    ${purposeCard("coffee.jpg", "Solo reset", "slow · you-time", false)}
  </div>
  <div class="pad" style="padding-bottom:24px;padding-top:6px">${cta("Build Date-night layout", I.arrow("#fff", 18))}</div>
</div>`;
meta.PurposePicker = N;

// -- write --
const order = ["PurposePicker", "Date", "City", "Foodie", "Family"];
for (const n of order) fs.writeFileSync(path.join(DIR, `${n}.dc.html`), wrap(n, screens[n], meta[n]), "utf8");
const W = 390, H = 844, GX = 110;
const canvas = {
  artboards: order.map((n, i) => ({ file: `${n}.dc.html`, x: i * (W + GX), y: 0, w: W, h: H, title: n })),
  annotations: [
    { id: "t", x: 0, y: -140, w: 940, text: "Wayfare — Purpose templates: different STRUCTURE + mood per purpose, same itinerary FORMAT underneath (time · destination · plan · travel mode+cost · food cost range · from-origin)." },
    { id: "p", x: 0, y: -42, w: W, text: "Picker → builds the chosen layout." },
    { id: "d", x: W + GX, y: -42, w: W, text: "Date — romantic evening timeline (serif, dark). Travel connectors + food ranges." },
    { id: "c", x: 2 * (W + GX), y: -42, w: W, text: "City — fresh multi-day dashboard: day rail + map + highlights grid w/ time+travel+cost." },
    { id: "f", x: 3 * (W + GX), y: -42, w: W, text: "Foodie — delicious feed: numbered dishes, walk connectors, food price ranges." },
    { id: "fa", x: 4 * (W + GX), y: -42, w: W, text: "Family — warm cozy blocks: time, plan, duration·ages·travel·cost chips, checklist." },
  ],
  launch: { view: "canvas" },
};
fs.writeFileSync(path.join(DIR, "canvas.json"), JSON.stringify(canvas, null, 2) + "\n", "utf8");
console.log(`wrote ${order.length} template screens (format + coordinated mood) + canvas.json`);
