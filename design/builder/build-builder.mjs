// Itinerary builder — REDESIGNED: immersive, borderless, type-led (Nightfall dark).
// Purpose → immersive proposal pager → customize activities → recommended places →
// customize places → confirm & generate. Run: node build-builder.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { wrap, PALETTES, I, cta } from "../build-dc.mjs";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const P = PALETTES.Nightfall;
const screens = {};

const bar = (step, total, title) => `<div class="safe"></div>
  <div class="pad" style="padding-top:2px;display:flex;align-items:center;justify-content:space-between">
    <div style="width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.07);display:flex;align-items:center;justify-content:center">${I.back("var(--ink)")}</div>
    <span class="mono" style="font-size:11px;letter-spacing:.18em;color:var(--sec)">${title || ""}</span>
    <span class="mono" style="font-size:12px;color:var(--primary)">${step}/${total}</span>
  </div>`;
const chip = (l, on) => `<span style="padding:10px 16px;border-radius:999px;font-size:13.5px;font-weight:700;${on ? "background:var(--primary);color:#fff" : "background:rgba(255,255,255,.06);color:var(--ink)"}">${l}</span>`;
const dot = (on) => `<span style="width:${on ? 22 : 7}px;height:7px;border-radius:4px;background:${on ? "var(--primary)" : "rgba(255,255,255,.28)"}"></span>`;

// ===== 1. Purpose =====
screens.Purpose = `<div class="frame" style="position:relative">
  ${bar(1, 5, "NEW ITINERARY")}
  <div class="pad" style="margin-top:34px">
    <div class="mono" style="font-size:11px;letter-spacing:.22em;color:var(--sec)">STEP ONE</div>
    <h1 class="serif" style="font-size:52px;line-height:.92;margin:14px 0 0;letter-spacing:-.5px">What's the<br><span style="font-style:italic;color:var(--primary)">occasion?</span></h1>
  </div>
  <div class="pad" style="margin-top:30px">
    <input class="serif" style="width:100%;background:transparent;border:none;border-bottom:2px solid var(--primary);outline:none;color:var(--ink);font-size:30px;padding:6px 0" value="A date with my wife">
    <div class="mono" style="font-size:10.5px;letter-spacing:.1em;color:var(--ter);margin-top:10px">TYPE FREELY — OR TAP A SUGGESTION</div>
  </div>
  <div class="pad" style="margin-top:20px;display:flex;flex-wrap:wrap;gap:9px">${chip("Date night", true)}${chip("Anniversary")}${chip("Family day")}${chip("Friends")}${chip("Foodie")}${chip("Solo reset")}</div>
  <div style="flex:1"></div>
  <div class="pad" style="margin-top:18px;display:flex;align-items:center;gap:8px;color:var(--sec)">${I.pin("var(--sec)", 15)}<span style="font-size:12.5px;font-weight:600">Makati → BGC · Fri, 6:00 PM – late</span></div>
  <div class="pad" style="padding-bottom:24px;padding-top:14px">${cta("See tonight's proposals", I.arrow("#fff", 18))}</div>
</div>`;

// ===== 2. Proposals — immersive pager =====
const oact = (ic, title, why) => `<div style="display:flex;align-items:center;gap:12px;padding:8px 0">
  <div style="width:34px;height:34px;border-radius:11px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0">${ic}</div>
  <div style="flex:1"><div style="font-size:14.5px;font-weight:800;color:#fff">${title}</div><div style="font-size:12px;font-weight:500;color:rgba(255,255,255,.62);margin-top:1px">${why}</div></div></div>`;
screens.Proposals = `<div class="frame" style="position:relative;overflow:hidden;background:#000">
  <div class="kb" style="position:absolute;inset:0;background-image:url('city.jpg');background-size:cover;background-position:center"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,17,16,.6) 0%,transparent 22%,rgba(20,17,16,.75) 52%,rgba(20,17,16,.97) 100%)"></div>
  <div style="position:relative;display:flex;flex-direction:column;height:100%">
    ${bar(2, 5, "PROPOSAL 1 OF 3")}
    <div style="flex:1"></div>
    <div class="pad">
      <div class="a-pop" style="display:inline-block;background:rgba(224,68,126,.9);color:#fff;font-size:10px;font-weight:800;letter-spacing:.3px;padding:4px 10px;border-radius:999px">FOR YOUR DATE NIGHT</div>
      <h1 class="serif a-pop" style="animation-delay:.08s;color:#fff;font-size:52px;line-height:.94;margin:14px 0 0;letter-spacing:-.5px">Golden<br><span style="font-style:italic">Evening</span></h1>
      <div class="a-pop" style="animation-delay:.14s;font-size:14px;color:rgba(255,255,255,.72);font-weight:600;margin-top:6px">Slow, romantic, unhurried · 3 activities</div>
      <div class="a-pop" style="animation-delay:.2s;margin-top:14px;border-top:1px solid rgba(255,255,255,.14)">
        ${oact(I.sun(16), "Sunset drinks", "Watch the skyline light up together")}
        ${oact(I.wine("#fff", 16), "A long dinner", "One unhurried, special meal")}
        ${oact(I.coffee("#fff", 16), "Dessert walk", "Wind down with sweets")}
      </div>
      <div class="a-pop" style="animation-delay:.28s;display:flex;gap:11px;margin-top:18px">
        <div style="flex:1;height:54px;border-radius:999px;border:1px solid rgba(255,255,255,.28);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14.5px;font-weight:800">Customize</div>
        <div style="flex:1.3;height:54px;border-radius:999px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;gap:8px;font-size:14.5px;font-weight:800;box-shadow:0 12px 26px rgba(255,106,61,.45)">Use all ${I.arrow("#fff", 17)}</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:18px 0 26px">${dot(true)}${dot(false)}${dot(false)}<span class="mono" style="font-size:10px;color:rgba(255,255,255,.5);margin-left:6px">SWIPE</span></div>
    </div>
  </div>
</div>`;

// ===== 3. Customize activities — borderless big rows =====
const bigRow = (title, why, on, swap) => `<div style="padding:16px 0;border-bottom:1px solid var(--line)">
  <div style="display:flex;align-items:center;gap:14px">
    <div style="flex:1"><div style="font-size:18px;font-weight:800;color:${on ? "var(--ink)" : "var(--sec)"}">${title}</div><div style="font-size:12.5px;font-weight:500;color:var(--sec);margin-top:2px">${why}</div></div>
    <div style="width:30px;height:30px;border-radius:50%;${on ? "background:var(--primary)" : "border:2px solid var(--ter)"};display:flex;align-items:center;justify-content:center;flex-shrink:0">${on ? I.check("#fff", 17) : ""}</div>
  </div>
  ${swap ? `<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:12px">${swap.map((s, i) => `<span style="font-size:11.5px;font-weight:700;padding:6px 11px;border-radius:999px;${i === 0 ? "background:rgba(255,106,61,.16);color:var(--primary)" : "background:rgba(255,255,255,.06);color:var(--sec)"}">${s}</span>`).join("")}</div>` : ""}</div>`;
screens.CustomizeActivities = `<div class="frame">
  ${bar(3, 5, "GOLDEN EVENING")}
  <div class="pad" style="margin-top:26px"><h1 class="serif" style="font-size:38px;line-height:.95;margin:0">Keep it, or<br><span style="font-style:italic;color:var(--primary)">swap it.</span></h1></div>
  <div style="flex:1;overflow:hidden;padding:16px 22px 0">
    ${bigRow("Sunset drinks", "Watch the skyline light up", true, ["Rooftop bar", "Wine bar", "Beach deck"])}
    ${bigRow("A long dinner", "One unhurried, special meal", true, ["Italian", "Omakase", "Steakhouse"])}
    ${bigRow("Dessert walk", "Wind down with sweets", true, ["Gelato", "Patisserie", "Night market"])}
    ${bigRow("Live music", "Add a late set", false)}
    <div style="display:flex;align-items:center;gap:12px;padding:16px 0;color:var(--sec)"><div style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.07);display:flex;align-items:center;justify-content:center">${I.plus("var(--sec)", 18)}</div><span style="font-size:15px;font-weight:700">Add something else</span></div>
  </div>
  <div class="pad" style="padding-bottom:24px;padding-top:6px">${cta("Continue · 3 kept")}</div>
</div>`;

// ===== 4. Recommended places — photo-forward, borderless =====
const bigPlace = (img, name, area, why, meta, delay) => `<div class="a-pop" style="animation-delay:${delay}s;position:relative;height:150px;border-radius:22px;overflow:hidden;flex-shrink:0">
  <div style="position:absolute;inset:0;background-image:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.8)),url('${img}');background-size:cover;background-position:center"></div>
  <div style="position:absolute;top:12px;left:12px;background:rgba(255,106,61,.92);color:#fff;font-size:9.5px;font-weight:800;letter-spacing:.3px;padding:4px 9px;border-radius:999px">WE PICKED</div>
  <div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,.4);color:#fff;font-size:11px;font-weight:800;padding:5px 10px;border-radius:999px;display:flex;align-items:center;gap:4px">${I.star("#F2B36B", 12)} ${meta}</div>
  <div style="position:absolute;left:15px;right:15px;bottom:13px;color:#fff">
    <div style="font-size:19px;font-weight:800">${name}</div>
    <div style="font-size:11.5px;font-weight:600;color:rgba(255,255,255,.7)">${area}</div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px"><span style="font-size:12px;color:rgba(255,255,255,.82);font-weight:500">${why}</span><span style="font-size:12.5px;font-weight:800;color:var(--a1,#F2B36B)">Change</span></div>
  </div></div>`;
screens.RecommendedPlaces = `<div class="frame">
  ${bar(4, 5, "3 ACTIVITIES")}
  <div class="pad" style="margin-top:16px"><div class="mono" style="font-size:11px;letter-spacing:.2em;color:var(--sec)">WE RECOMMEND</div><h1 class="serif" style="font-size:34px;line-height:.95;margin:6px 0 0">Where to <span style="font-style:italic;color:var(--primary)">go tonight</span></h1></div>
  <div style="flex:1;overflow:hidden;padding:14px 22px 0;display:flex;flex-direction:column;gap:12px">
    ${bigPlace("city.jpg", "The Blue Leaf Sky", "Rooftop · Makati · 0.9 km", "Best golden-hour view near you", "4.8", 0.05)}
    ${bigPlace("dinner.jpg", "Osteria Daniele", "Italian · Salcedo · 1.4 km", "Intimate, unhurried, perfect for two", "4.7", 0.15)}
    ${bigPlace("pastry.jpg", "Café Bola", "Dessert · BGC · 2.1 km", "A sweet, walkable last stop", "4.6", 0.25)}
  </div>
  <div class="pad" style="padding-bottom:22px;padding-top:10px">${cta("Confirm all places", I.check("#fff", 18))}<div style="text-align:center;margin-top:12px;font-size:14px;font-weight:800;color:var(--sec)">Customize places</div></div>
</div>`;

// ===== 5. Customize places — choose among recommendations =====
const optPlace = (img, name, area, why, on) => `<div style="position:relative;height:118px;border-radius:20px;overflow:hidden;${on ? "outline:2px solid var(--primary);outline-offset:-2px" : ""}">
  <div style="position:absolute;inset:0;background-image:linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.2)),url('${img}');background-size:cover;background-position:center"></div>
  <div style="position:absolute;inset:0;padding:14px 16px;display:flex;flex-direction:column;justify-content:center">
    <div style="font-size:16px;font-weight:800;color:#fff">${name}</div>
    <div style="font-size:11.5px;font-weight:600;color:rgba(255,255,255,.7)">${area}</div>
    <div style="font-size:12px;font-weight:500;color:rgba(255,255,255,.85);margin-top:5px">${why}</div>
  </div>
  <div style="position:absolute;top:14px;right:14px;width:26px;height:26px;border-radius:50%;${on ? "background:var(--primary)" : "border:2px solid rgba(255,255,255,.55)"};display:flex;align-items:center;justify-content:center">${on ? I.check("#fff", 15) : ""}</div></div>`;
screens.CustomizePlaces = `<div class="frame">
  ${bar(4, 5, "SUNSET DRINKS")}
  <div class="pad" style="margin-top:22px"><h1 class="serif" style="font-size:36px;line-height:.95;margin:0">Pick your<br><span style="font-style:italic;color:var(--primary)">rooftop</span></h1><div class="sec" style="font-size:13px;font-weight:500;margin-top:8px">Our top picks near Makati</div></div>
  <div style="flex:1;overflow:hidden;padding:18px 22px 0;display:flex;flex-direction:column;gap:13px">
    ${optPlace("city.jpg", "The Blue Leaf Sky", "0.9 km · quiet at 6 PM", "Best view, calm early evening", true)}
    ${optPlace("bgc.jpg", "Vantage Rooftop", "2.4 km · livelier", "Great cocktails, buzzy crowd", false)}
    ${optPlace("rooftop.jpg", "Aracama Terrace", "1.1 km · cozy", "Intimate, Filipino wines", false)}
  </div>
  <div class="pad" style="padding-bottom:24px;padding-top:8px">${cta("Use The Blue Leaf Sky")}</div>
</div>`;

// ===== 6. Confirm & generate =====
const tl = (time, act, place, last) => `<div style="display:flex;gap:14px;padding-bottom:${last ? 0 : 18}px">
  <div style="display:flex;flex-direction:column;align-items:center;padding-top:3px"><div style="width:11px;height:11px;border-radius:50%;background:var(--primary)"></div>${last ? "" : '<div style="width:2px;flex:1;background:var(--line);margin-top:3px"></div>'}</div>
  <div style="flex:1"><div class="mono" style="font-size:11px;color:var(--primary)">${time}</div><div style="font-size:16px;font-weight:800;margin-top:2px">${act}</div><div class="sec" style="font-size:12.5px;font-weight:600;margin-top:1px">${place}</div></div></div>`;
screens.ConfirmGenerate = `<div class="frame">
  ${bar(5, 5, "CONFIRM")}
  <div class="pad" style="margin-top:24px"><h1 class="serif" style="font-size:44px;line-height:.92;margin:0">Your night,<br><span style="font-style:italic;color:var(--primary)">in order.</span></h1></div>
  <div style="flex:1;overflow:hidden;padding:24px 26px 0">
    ${tl("6:00 PM", "Sunset drinks", "The Blue Leaf Sky · Makati")}
    ${tl("7:30 PM", "A long dinner", "Osteria Daniele · Salcedo")}
    ${tl("9:30 PM", "Dessert walk", "Café Bola · BGC", true)}
  </div>
  <div class="pad" style="display:flex;gap:12px;margin-bottom:6px">
    <div style="flex:1"><div class="mono" style="font-size:10px;color:var(--sec)">WINDOW</div><div style="font-size:15px;font-weight:800">6 – 11 PM</div></div>
    <div style="flex:1"><div class="mono" style="font-size:10px;color:var(--sec)">EST. COST</div><div style="font-size:15px;font-weight:800">₱4.5k – 7k</div></div>
  </div>
  <div class="pad" style="padding-bottom:24px;padding-top:12px">${cta("Generate the timeline", I.spark("#fff", 18))}</div>
</div>`;

// -- write --
const order = ["Purpose", "Proposals", "CustomizeActivities", "RecommendedPlaces", "CustomizePlaces", "ConfirmGenerate"];
for (const n of order) fs.writeFileSync(path.join(DIR, `${n}.dc.html`), wrap(n, screens[n], P), "utf8");
const W = 390, H = 844, GX = 100;
const canvas = {
  artboards: order.map((n, i) => ({ file: `${n}.dc.html`, x: i * (W + GX), y: 0, w: W, h: H, title: n })),
  annotations: [{ id: "t", x: 0, y: -130, w: 940, text: "Wayfare — Itinerary Builder (redesigned: immersive, borderless, type-led)\nPurpose (big serif prompt) → immersive full-screen proposal pager (swipe 3; activities overlaid, no side-border cards) → borderless customize · big-row swaps → photo-forward recommended places (we recommend) → choose among picks → cinematic confirm & generate." }],
  launch: { view: "canvas" },
};
fs.writeFileSync(path.join(DIR, "canvas.json"), JSON.stringify(canvas, null, 2) + "\n", "utf8");
console.log(`wrote ${order.length} redesigned builder screens + canvas.json`);
