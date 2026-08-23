// 3 unique, cinematic homepage structures (one dark palette). Run: node build-concepts.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { wrap, PALETTES, I } from "../build-dc.mjs";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const P = PALETTES.Nightfall;
const screens = {};

const dock = () => `<div style="position:absolute;left:50%;bottom:22px;transform:translateX(-50%);display:flex;gap:6px;align-items:center;background:rgba(20,17,16,.6);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:7px 8px">
  ${[["home", true], ["compass", false], ["bell", false], ["user", false]].map(([n, on]) => `<div style="width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;${on ? "background:var(--primary)" : ""}">${I[n](on ? "#fff" : "#A99C8C", 21)}</div>`).join("")}</div>`;

// ============ CONCEPT 1 — IMMERSIVE COVER ============
// The whole screen is the trip. Minimal floating UI. Gesture-forward.
screens.ImmersiveCover = `<div class="frame" style="position:relative;overflow:hidden;background:#000">
  <div class="kb" style="position:absolute;inset:0;background-image:url('bgc.jpg');background-size:cover;background-position:center"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,17,16,.55) 0%,transparent 26%,transparent 44%,rgba(20,17,16,.92) 100%)"></div>
  <div class="safe"></div>
  <div class="pad" style="position:relative;display:flex;align-items:center;justify-content:space-between;padding-top:6px">
    <span class="mono" style="font-size:12px;font-weight:600;letter-spacing:.28em;color:rgba(255,255,255,.82)">WAYFARE</span>
    <div style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px">KL</div>
  </div>
  <div class="pad" style="position:relative;margin-top:48px">
    <div class="a-pop" style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.14);backdrop-filter:blur(6px);border-radius:999px;padding:6px 13px">
      <span style="position:relative;width:7px;height:7px"><span style="position:absolute;inset:0;border-radius:50%;background:var(--primary);animation:livepulse 1.8s ease-out infinite"></span><span style="position:absolute;inset:1px;border-radius:50%;background:var(--primary)"></span></span>
      <span style="color:#fff;font-size:11px;font-weight:800;letter-spacing:.4px">DAY 4 · LIVE NOW</span></div>
    <h1 class="serif a-pop" style="animation-delay:.12s;color:#fff;font-size:64px;line-height:.92;margin:18px 0 0;letter-spacing:-1px">Tonight in<br><span style="font-style:italic">Old Manila</span></h1>
  </div>
  <div style="flex:1"></div>
  <!-- floating live "boarding pass" -->
  <div class="pad" style="position:relative;padding-bottom:96px">
    <div class="a-pop" style="animation-delay:.24s;background:rgba(30,26,23,.72);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.1);border-radius:26px;padding:16px 18px">
      <div style="display:flex;align-items:center;gap:13px">
        <div style="width:52px;height:52px;border-radius:15px;background-image:url('museum.jpg');background-size:cover;background-position:center;flex-shrink:0"></div>
        <div style="flex:1;min-width:0"><div class="mono" style="font-size:10px;letter-spacing:.2em;color:var(--primary)">UP NEXT · 12:30</div><div style="font-size:17px;font-weight:800;color:#fff;margin-top:2px">National Museum</div><div style="font-size:12px;color:rgba(255,255,255,.6);font-weight:600">1.4 km · 6 min from you</div></div>
        <div style="width:50px;height:50px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px rgba(255,106,61,.5)">${I.arrow("#fff", 22)}</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:7px;margin-top:14px;color:rgba(255,255,255,.5);font-size:11px;font-weight:700"><div style="width:34px;height:3px;border-radius:2px;background:rgba(255,255,255,.4)"></div>Swipe up for today's plan</div>
    </div>
  </div>
  ${dock()}
</div>`;

// ============ CONCEPT 2 — REEL (vertical cinematic filmstrip of the day) ============
const frame = (img, time, name, state) => {
  if (state === "now") return `<div style="position:relative;border-radius:24px;overflow:hidden;height:230px">
    <div class="kb" style="position:absolute;inset:0;background-image:url('${img}');background-size:cover;background-position:center"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,17,16,.25),transparent 40%,rgba(20,17,16,.9))"></div>
    <div style="position:absolute;top:12px;left:12px;display:flex;align-items:center;gap:7px;background:rgba(0,0,0,.4);border-radius:999px;padding:5px 11px"><span style="width:7px;height:7px;border-radius:50%;background:var(--primary);animation:livepulse 1.8s infinite"></span><span class="mono" style="font-size:10px;letter-spacing:.15em;color:#fff">NOW · ${time}</span></div>
    <div style="position:absolute;left:16px;right:16px;bottom:14px;color:#fff">
      <div class="serif" style="font-size:30px;line-height:1;letter-spacing:-.5px">${name}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px">
        <span style="font-size:12.5px;font-weight:700;color:rgba(255,255,255,.75)">1.4 km · 6 min from you</span>
        <div style="background:var(--primary);color:#fff;border-radius:999px;padding:8px 18px;font-size:13px;font-weight:800">Continue</div></div></div></div>`;
  const dim = state === "done";
  return `<div style="display:flex;align-items:center;gap:14px;padding:2px 4px;opacity:${dim ? ".45" : "1"}">
    <div style="width:${dim ? 44 : 56}px;height:${dim ? 44 : 56}px;border-radius:14px;background-image:url('${img}');background-size:cover;background-position:center;flex-shrink:0;position:relative">${dim ? `<div style="position:absolute;inset:0;border-radius:14px;background:rgba(20,17,16,.4);display:flex;align-items:center;justify-content:center">${I.checkC("#F2B36B", 18)}</div>` : ""}</div>
    <div style="flex:1"><div class="mono" style="font-size:10px;letter-spacing:.12em;color:var(--ter)">${time}</div><div style="font-size:16px;font-weight:800;color:var(--ink);margin-top:2px">${name}</div></div>
    ${dim ? "" : I.chevR("var(--ter)", 18)}</div>`;
};
screens.Reel = `<div class="frame" style="position:relative">
  <div class="safe"></div>
  <div class="pad" style="display:flex;align-items:flex-end;justify-content:space-between;padding-top:4px">
    <div><div class="mono" style="font-size:11px;letter-spacing:.2em;color:var(--sec)">SAT · AUG 29</div><h1 class="serif" style="font-size:40px;line-height:.95;margin:6px 0 0">Your day,<br><span style="font-style:italic">unspooled</span></h1></div>
    <div class="mono" style="font-size:12px;font-weight:600;color:var(--primary)">3/5</div>
  </div>
  <div style="flex:1;overflow:hidden;padding:22px 22px 0;display:flex;flex-direction:column;gap:18px">
    ${frame("cathedral.jpg", "11:00", "Casa Manila", "done")}
    ${frame("museum.jpg", "12:30", "National Museum", "now")}
    ${frame("cathedral.jpg", "14:00", "Manila Cathedral", "up")}
    ${frame("fortsantiago.jpg", "15:30", "Fort Santiago", "up")}
  </div>
  ${dock()}
</div>`;

// ============ CONCEPT 3 — EDITORIAL (type-forward magazine, asymmetric) ============
const idx = (n, name, meta, last) => `<div style="display:flex;align-items:baseline;gap:14px;padding:12px 0${last ? "" : ";border-bottom:1px solid var(--line)"}">
  <span class="mono" style="font-size:12px;color:var(--primary);width:22px">${n}</span>
  <div style="flex:1"><span style="font-size:16px;font-weight:700;color:var(--ink)">${name}</span></div>
  <span class="mono" style="font-size:11px;color:var(--ter)">${meta}</span></div>`;
screens.Editorial = `<div class="frame" style="position:relative">
  <div class="safe"></div>
  <div class="pad" style="display:flex;align-items:center;justify-content:space-between;padding-top:4px">
    <span class="mono" style="font-size:11px;letter-spacing:.24em;color:var(--sec)">THE DAILY · NO. 04</span>
    <div style="width:36px;height:36px;border-radius:50%;background:var(--card);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--ink);font-weight:800;font-size:12px">KL</div>
  </div>
  <div style="flex:1;overflow:hidden">
    <!-- masthead + offset image -->
    <div style="position:relative;margin-top:6px">
      <h1 class="serif a-pop" style="font-size:80px;line-height:.86;margin:0;padding:0 22px;letter-spacing:-2px">Manila,<br><span style="font-style:italic;color:var(--primary)">after dark</span></h1>
      <div class="a-pop" style="animation-delay:.12s;margin:18px 22px 0;height:158px;border-radius:4px;overflow:hidden;background-image:url('city.jpg');background-size:cover;background-position:center"></div>
      <p class="a-pop" style="animation-delay:.16s;font-size:14px;line-height:1.5;color:var(--sec);font-weight:500;margin:16px 22px 0;max-width:320px">A date night, mapped. Three stops, chosen for the two of you — starting at golden hour.</p>
    </div>
    <!-- index / contents -->
    <div class="pad a-pop" style="animation-delay:.2s;margin-top:26px">
      <div class="mono" style="font-size:11px;letter-spacing:.2em;color:var(--sec);border-bottom:1px solid var(--ink);padding-bottom:8px;margin-bottom:4px">TONIGHT'S PROGRAMME</div>
      ${idx("01", "Sunset drinks — Blue Leaf Sky", "6:00")}
      ${idx("02", "Dinner — Osteria Daniele", "7:30")}
      ${idx("03", "Dessert walk — Café Bola", "9:30", true)}
    </div>
  </div>
  <div class="pad" style="padding-bottom:26px"><div style="height:56px;border-radius:999px;background:var(--ink);color:var(--bg);display:flex;align-items:center;justify-content:center;gap:9px;font-size:15px;font-weight:800">Open the evening ${I.arrow("var(--bg)", 18)}</div></div>
</div>`;

// ============ CONCEPT 4 — ATLAS (map-home; spatial, discovery) ============
const pin = (x, y, img, ring) => `<div style="position:absolute;left:${x}px;top:${y}px;width:52px;height:52px;border-radius:16px;padding:3px;background:${ring};box-shadow:0 8px 18px rgba(0,0,0,.5)"><div style="width:100%;height:100%;border-radius:13px;background-image:url('${img}');background-size:cover;background-position:center"></div></div>`;
const recCard = (img, name, tag) => `<div style="width:150px;flex-shrink:0;border-radius:18px;overflow:hidden;position:relative;height:120px">
  <div style="position:absolute;inset:0;background-image:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.72)),url('${img}');background-size:cover;background-position:center"></div>
  <div style="position:absolute;left:11px;right:11px;bottom:10px;color:#fff"><div style="font-size:9.5px;font-weight:800;letter-spacing:.3px;color:var(--a1,#F2B36B)">${tag}</div><div style="font-size:13.5px;font-weight:800;margin-top:2px">${name}</div></div></div>`;
screens.Atlas = `<div class="frame" style="position:relative;overflow:hidden;background:#191410">
  <svg width="390" height="640" viewBox="0 0 390 640" style="position:absolute;top:0;left:0">
    <rect width="390" height="640" fill="#191410"/>
    <path d="M-10 470 Q120 440 210 486 T400 500 L400 640 L-10 640Z" fill="#12181F"/>
    <g stroke="#2A241F" stroke-width="11" stroke-linecap="round"><path d="M-10 200 H400"/><path d="M-10 330 H400"/><path d="M120 -10 V520"/><path d="M270 -10 V480"/></g>
    <g stroke="#3A322A" stroke-width="6"><path d="M-10 265 H400"/><path d="M190 -10 V480"/></g>
    <path d="M96 470 C140 400 128 340 200 306 S276 240 300 182" stroke="#FF6A3D" stroke-width="5" fill="none" stroke-linecap="round"/>
  </svg>
  <div style="position:absolute;left:78px;top:452px;width:56px;height:56px;border-radius:50%;background:rgba(255,106,61,.18)"></div>
  <div style="position:absolute;left:98px;top:472px;width:16px;height:16px;border-radius:50%;background:#FF6A3D;border:3px solid #191410"></div>
  ${pin(150, 150, "museum.jpg", "#6AA6FF")}
  ${pin(276, 218, "dinner.jpg", "#F2B36B")}
  ${pin(232, 356, "pastry.jpg", "#FF6A3D")}
  <div class="safe"></div>
  <div class="pad" style="position:relative;display:flex;gap:10px">
    <div style="flex:1;height:48px;border-radius:999px;background:rgba(30,26,23,.72);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:10px;padding:0 16px">${I.search("#A99C8C", 19)}<span style="font-size:14px;font-weight:600;color:#A99C8C">Explore near you</span></div>
    <div style="width:48px;height:48px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px">KL</div>
  </div>
  <div style="flex:1"></div>
  <div style="position:relative;background:rgba(25,20,16,.86);backdrop-filter:blur(18px);border-top:1px solid rgba(255,255,255,.08);border-radius:26px 26px 0 0;padding:16px 0 92px">
    <div class="pad" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><div><div class="mono" style="font-size:10px;letter-spacing:.2em;color:var(--primary)">TONIGHT · NEAR YOU</div><div class="serif" style="font-size:24px;color:#fff;margin-top:2px">3 stops on your route</div></div>${I.chevR("#A99C8C", 20)}</div>
    <div style="display:flex;gap:12px;overflow:hidden;padding:0 22px">${recCard("city.jpg", "Blue Leaf Sky", "ROOFTOP")}${recCard("dinner.jpg", "Osteria Daniele", "DINNER")}${recCard("pastry.jpg", "Café Bola", "DESSERT")}</div>
  </div>
  ${dock()}
</div>`;

// -- write --
const order = ["ImmersiveCover", "Reel", "Editorial", "Atlas"];
for (const n of order) fs.writeFileSync(path.join(DIR, `${n}.dc.html`), wrap(n, screens[n], P), "utf8");
const W = 390, H = 844, GX = 120;
const canvas = {
  artboards: order.map((n, i) => ({ file: `${n}.dc.html`, x: i * (W + GX), y: 0, w: W, h: H, title: n })),
  annotations: [
    { id: "t", x: 0, y: -150, w: 900, text: "Wayfare — Home, 3 unique cinematic structures (one dark palette, focus on layout)\nEach avoids the greeting-card-list pattern and the side-accent-bar card." },
    { id: "a", x: 0, y: -44, w: W, text: "① Immersive Cover — the whole screen is the trip; a floating live ‘boarding pass’; swipe-up peek; gesture dock." },
    { id: "b", x: W + GX, y: -44, w: W, text: "② Reel — your day as a vertical filmstrip; the NOW frame expands, done frames dim above, upcoming below." },
    { id: "c", x: 2 * (W + GX), y: -44, w: W, text: "③ Editorial — type-led magazine; huge serif masthead, offset image, numbered ‘programme’ index." },
    { id: "d", x: 3 * (W + GX), y: -44, w: W, text: "④ Atlas — map-home; your route on the map, photo pins, ‘near you’ recommendations, gesture dock." },
  ],
  launch: { view: "canvas" },
};
fs.writeFileSync(path.join(DIR, "canvas.json"), JSON.stringify(canvas, null, 2) + "\n", "utf8");
console.log(`wrote ${order.length} home concepts + canvas.json`);
