// Builds 4 palette-comparison artboards: the same representative Wayfare screen
// in each candidate color scheme, with real photos. Run: node build-palettes.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const DIR = path.dirname(fileURLToPath(import.meta.url));

const PALETTES = {
  Tangerine: { label: "Tangerine Warmth", bg: "#FFF6EE", card: "#FFFFFF", ink: "#241A14", sec: "#9C8B7E", ter: "#D8C6B6", line: "#F1E7DC", primary: "#FF6A3D", primaryd: "#E8532A", a1: "#FF9E1B", a2: "#17B3A6", a3: "#3E97E5", a4: "#E0447E" },
  Tropical: { label: "Tropical Fresh", bg: "#EFFaf6".toUpperCase(), card: "#FFFFFF", ink: "#123330", sec: "#6E8B84", ter: "#B4CFC7", line: "#E1F1EB", primary: "#10B8A6", primaryd: "#0C9E8E", a1: "#7CC93F", a2: "#FF6B6B", a3: "#3EA6FF", a4: "#FFB020" },
  Electric: { label: "Electric Play", bg: "#F5F4FF", card: "#FFFFFF", ink: "#1B1830", sec: "#8480A0", ter: "#CBC7E4", line: "#EAE8FA", primary: "#6C4DF0", primaryd: "#5A3CE0", a1: "#FF4D8D", a2: "#3EA6FF", a3: "#23C99A", a4: "#FFB020" },
  Sunset: { label: "Sunset Pop", bg: "#FFF3EF", card: "#FFFFFF", ink: "#2A1720", sec: "#9E8088", ter: "#E0C4C0", line: "#F6E4DE", primary: "#FF5C7A", primaryd: "#EE4468", a1: "#FF9E45", a2: "#7C5CFF", a3: "#23C99A", a4: "#FFC24B" },
};

const svg = {
  pin: (c, s = 15) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>`,
  clock: (c, s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  check: (c, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  coffee: (c, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a3 3 0 0 1 0 6h-1"/><path d="M3 8h14v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z"/><path d="M6 2v2M10 2v2M14 2v2"/></svg>`,
  temple: (c, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M4 21v-9M20 21v-9M10 21v-4a2 2 0 0 1 4 0v4M2 12l10-6 10 6"/></svg>`,
  tree: (c, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-6M8 16a4 4 0 0 1-1-7.5A4.5 4.5 0 0 1 15.5 6 4 4 0 0 1 16 16H8Z"/></svg>`,
  food: (c, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3v7a2 2 0 0 0 4 0V3M6 3v18M15 3c-1.5 1-2 3-2 5s.5 3 2 3v10"/></svg>`,
  sun: (s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="4" fill="#F7C948"/><g stroke="#F2B21A" stroke-width="1.6" stroke-linecap="round"><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.8 3.8l1.4 1.4M14.2 3.8l-1.4 1.4"/></g><path d="M8 13a4.5 4.5 0 0 1 4.4-3.5A4.5 4.5 0 0 1 21 12a3.5 3.5 0 0 1-.5 7H8a3.8 3.8 0 0 1 0-6z" fill="#E4E9EE" stroke="#CDD4DB" stroke-width="1.2"/></svg>`,
};

function demo(name, P) {
  const chip = (bg, ic) => `<div style="width:52px;height:52px;border-radius:18px;background:${bg};display:flex;align-items:center;justify-content:center">${ic}</div>`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><script src="./support.js"></script></head><body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
<style>
  *{box-sizing:border-box} body{margin:0;font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:${P.ink};background:${P.bg}}
  a{color:${P.primary};text-decoration:none}
  .orb{width:26px;height:26px;border-radius:50%;position:relative;background:radial-gradient(circle at 34% 28%,#CFF8D8 0%,#63DB8D 36%,#2BB161 70%,#159A4F 100%);box-shadow:inset 0 -3px 6px rgba(0,70,25,.35),0 3px 7px rgba(45,177,97,.45)}
  .orb::after{content:"";position:absolute;top:4px;left:6px;width:9px;height:6px;border-radius:50%;background:rgba(255,255,255,.8)}
</style>
</helmet>
<div style="width:390px;height:844px;overflow:hidden;background:${P.bg};display:flex;flex-direction:column;position:relative">
  <div style="height:50px;flex-shrink:0"></div>

  <!-- photo banner (very rounded) -->
  <div style="margin:6px 18px 0;height:186px;border-radius:30px;background-image:linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.55)),url('bgc.jpg');background-size:cover;background-position:center;position:relative;overflow:hidden">
    <div style="position:absolute;top:14px;right:14px;background:rgba(255,255,255,.92);border-radius:16px;padding:7px 11px;display:flex;align-items:center;gap:8px">${svg.sun()}<div style="line-height:1.05"><b style="font-size:15px;font-weight:800">10°</b><div style="font-size:10px;color:${P.sec};font-weight:600">Cloudy</div></div></div>
    <div style="position:absolute;left:18px;bottom:16px;color:#fff">
      <div style="font-size:24px;font-weight:800;letter-spacing:-.5px">BGC + Manila · 12 days</div>
      <div style="font-size:12.5px;font-weight:600;opacity:.9;margin-top:3px">from Avida, BGC · Aug 26 – Sep 6</div>
    </div>
  </div>

  <!-- category chips -->
  <div style="display:flex;gap:12px;padding:20px 20px 0">
    ${chip(P.a1, svg.coffee("#fff"))}${chip(P.a2, svg.temple("#fff"))}${chip(P.a3, svg.tree("#fff"))}${chip(P.a4, svg.food("#fff"))}
  </div>

  <!-- stat row -->
  <div style="display:flex;gap:6px;padding:22px 22px 0">
    ${[["5h 20m", "Travel"], ["8 km", "Distance"], ["4 stops", "Planned"]].map(([v, l]) => `<div style="flex:1"><div style="font-size:19px;font-weight:800;letter-spacing:-.4px">${v}</div><div style="font-size:12px;color:${P.sec};font-weight:500">${l}</div></div>`).join("")}
  </div>

  <!-- AI tip -->
  <div style="margin:18px 22px 0;display:flex;align-items:center;gap:12px;background:${P.card};border-radius:22px;padding:14px;box-shadow:0 8px 20px rgba(20,20,20,.06)">
    <div class="orb"></div><div style="font-size:13px;font-weight:500;color:${P.sec};line-height:1.4">Old Manila is quietest <b style="color:">right at 9 AM</b> — start there.</div>
  </div>

  <!-- stop card with food photo -->
  <div style="margin:14px 22px 0;display:flex;align-items:center;gap:13px;background:${P.card};border-radius:22px;padding:12px;box-shadow:0 8px 20px rgba(20,20,20,.06)">
    <div style="width:56px;height:56px;border-radius:16px;background-image:url('dinner.jpg');background-size:cover;background-position:center;flex-shrink:0"></div>
    <div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:700">Old Manila lunch</div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:5px">${svg.clock(P.sec)}<span style="font-size:12.5px;color:${P.sec};font-weight:500">1:00 PM</span><span style="width:1px;height:11px;background:${P.line}"></span>${svg.pin(P.sec)}<span style="font-size:12.5px;color:${P.sec};font-weight:500">Intramuros, Manila</span></div>
    </div>
    <div style="width:32px;height:32px;border-radius:16px;background:${P.a1}22;display:flex;align-items:center;justify-content:center">${svg.food(P.a1, 17)}</div>
  </div>

  <div style="flex:1"></div>

  <!-- bottom: floating white rounded card with inner rounded PRIMARY button -->
  <div style="margin:0 18px 26px;background:${P.card};border-radius:28px;padding:14px 14px 14px 20px;display:flex;align-items:center;gap:14px;box-shadow:0 14px 30px rgba(20,20,20,.10)">
    <div style="flex:1"><div style="font-size:16px;font-weight:800">You're at the Museum</div><div style="font-size:12.5px;color:${P.sec};font-weight:500">Confirm to complete this stop.</div></div>
    <div style="height:52px;border-radius:26px;background:${P.primary};color:#fff;display:flex;align-items:center;gap:8px;padding:0 20px;font-size:15px;font-weight:700">${svg.check("#fff")} I'm here</div>
  </div>

  <!-- palette label -->
  <div style="position:absolute;top:14px;left:0;right:0;display:flex;justify-content:center"><div style="background:${P.ink};color:${P.bg};font-size:11px;font-weight:800;letter-spacing:.5px;padding:5px 13px;border-radius:999px">${P.label.toUpperCase()}</div></div>
</div>
</x-dc>
</body></html>
`;
}

const names = Object.keys(PALETTES);
for (const n of names) fs.writeFileSync(path.join(DIR, `${n}.dc.html`), demo(n, PALETTES[n]), "utf8");

const W = 390, H = 844, GX = 90;
const canvas = {
  artboards: names.map((n, i) => ({ file: `${n}.dc.html`, x: i * (W + GX), y: 0, w: W, h: H, title: PALETTES[n].label })),
  annotations: [{ id: "t", x: 0, y: -150, w: 700, text: "Wayfare — Color Directions\nSame screen, four palettes. Pick the vibe; I'll apply the winner across all screens. Structure/rounding is the target look; only the color changes." }],
  launch: { view: "canvas" },
};
fs.writeFileSync(path.join(DIR, "canvas.json"), JSON.stringify(canvas, null, 2) + "\n", "utf8");
console.log(`wrote ${names.length} palette demos + canvas.json`);
