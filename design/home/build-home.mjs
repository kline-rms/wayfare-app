// Cinematic Home, rendered in 4 feeling-first palettes. Run: node build-home.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { wrap, I } from "../build-dc.mjs";
const DIR = path.dirname(fileURLToPath(import.meta.url));

// palettes carry the standard helmet fields + gradient (grad1/grad2) + live accent
const PAL = {
  Sunset: { label: "Sunset Voyage", feel: "golden-hour wanderlust", bg: "#FFF6EF", card: "#FFFFFF", ink: "#2A1C15", sec: "#9A8A7E", ter: "#D8C7B8", line: "#F1E6DB", primary: "#FF6A3D", primaryd: "#E8532A", a1: "#FF9E1B", a2: "#17B3A6", a3: "#3E97E5", a4: "#E0447E", grad1: "#FF7A45", grad2: "#FFB020", live: "#FF5A47" },
  Aqua: { label: "Aqua Escape", feel: "fresh tropical getaway", bg: "#ECF9F6", card: "#FFFFFF", ink: "#0F302D", sec: "#6E8B86", ter: "#B2CFC9", line: "#DCEFEA", primary: "#12B3A6", primaryd: "#0C9E8E", a1: "#7CC93F", a2: "#FF6B6B", a3: "#3EA6FF", a4: "#FFB020", grad1: "#14B8A6", grad2: "#3EA6FF", live: "#FF6B6B" },
  Grape: { label: "Grape Pop", feel: "playful & modern", bg: "#F6F2FF", card: "#FFFFFF", ink: "#241A33", sec: "#867B9C", ter: "#CBC2E0", line: "#EAE4F8", primary: "#7C4DF0", primaryd: "#6A3CE0", a1: "#FF4D8D", a2: "#3EA6FF", a3: "#23C99A", a4: "#FFB020", grad1: "#8B5CF6", grad2: "#FF5C9E", live: "#FF4D8D" },
  Neon: { label: "Neon Dusk", feel: "cinematic night", bg: "#14121C", card: "#211E2E", ink: "#F2EEFA", sec: "#A79FBE", ter: "#6A6382", line: "#2E2A3D", primary: "#FF5E7A", primaryd: "#E84868", a1: "#FF9E45", a2: "#38E1D6", a3: "#6AA6FF", a4: "#B07CFF", grad1: "#FF5E7A", grad2: "#9A6BFF", live: "#38E1D6" },
};

const tab = (active, P) => `<div style="height:76px;flex-shrink:0;background:var(--card);border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-around;padding:6px 8px 12px">
  ${[["Home", I.home], ["Trips", I.compass], ["Alerts", I.bell], ["Profile", I.user]].map(([l, ic]) => { const on = l === active; const c = on ? "var(--ink)" : (P.ter); return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">${ic(c, 24)}<span style="font-size:10.5px;font-weight:${on ? "800" : "600"};color:${c}">${l}</span></div>`; }).join("")}</div>`;

const schedRow = (time, txt, kind, P) => {
  const c = kind === "work" ? { bg: "#8883", tx: P.sec } : kind === "next" ? { bg: P.primary + "22", tx: P.primary } : { bg: "#8882", tx: P.sec };
  return `<div style="display:flex;align-items:center;gap:10px"><span class="mono" style="font-size:10.5px;color:var(--ter);width:42px">${time}</span><div style="flex:1;height:28px;border-radius:9px;background:${c.bg};display:flex;align-items:center;padding:0 11px;font-size:11.5px;font-weight:800;color:${c.tx}">${txt}</div></div>`;
};

function home(P) {
  return `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:4px;display:flex;align-items:center;gap:12px">
    <div style="width:46px;height:46px;border-radius:16px;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;animation:springIn .7s cubic-bezier(.2,.9,.3,1.25) both">KL</div>
    <div style="flex:1"><div class="sec" style="font-size:12.5px;font-weight:600">Good morning</div><div style="font-size:19px;font-weight:800;letter-spacing:-.3px">Kline</div></div>
    <div style="width:46px;height:46px;border-radius:16px;background:var(--card);box-shadow:0 6px 16px rgba(20,20,20,.10);display:flex;align-items:center;justify-content:center;position:relative">${I.bell("var(--ink)")}<span style="position:absolute;top:11px;right:12px;width:9px;height:9px;border-radius:50%;background:${P.live};border:2px solid var(--card)"></span></div>
  </div>

  <div style="flex:1;overflow:hidden;padding-top:14px">
    <!-- CINEMATIC HERO -->
    <div class="pad"><div style="border-radius:28px;overflow:hidden;position:relative;height:298px;box-shadow:0 20px 44px rgba(20,20,20,.18);animation:popIn .6s cubic-bezier(.2,.8,.2,1) both">
      <div class="kb" style="position:absolute;inset:0;background-image:url('bgc.jpg');background-size:cover;background-position:center"></div>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.15) 0%,transparent 34%,rgba(0,0,0,.78) 100%)"></div>
      <div style="position:absolute;inset:0;background:linear-gradient(140deg,${P.grad1}3d,transparent 52%)"></div>
      <div style="position:absolute;top:14px;left:14px;display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.34);backdrop-filter:blur(6px);border-radius:999px;padding:6px 12px">
        <span style="position:relative;width:8px;height:8px"><span style="position:absolute;inset:0;border-radius:50%;background:${P.live};animation:livepulse 1.8s ease-out infinite"></span><span style="position:absolute;inset:2px;border-radius:50%;background:${P.live}"></span></span>
        <span style="color:#fff;font-size:11px;font-weight:800;letter-spacing:.5px">LIVE · DAY 4</span>
      </div>
      <div style="position:absolute;top:14px;right:14px;background:rgba(255,255,255,.18);backdrop-filter:blur(6px);border-radius:999px;padding:6px 11px;display:flex;align-items:center;gap:6px">${I.spark("#fff", 14)}<span style="color:#fff;font-size:10.5px;font-weight:800;letter-spacing:.3px">AI PLAN</span></div>
      <div style="position:absolute;left:18px;right:18px;bottom:16px;color:#fff">
        <div class="a-pop" style="animation-delay:.25s"><div style="font-size:27px;font-weight:800;letter-spacing:-.6px">BGC + Manila</div>
          <div style="font-size:12.5px;font-weight:600;opacity:.88;margin-top:2px">from Avida, Taguig · Aug 26 – Sep 6</div></div>
        <div class="a-pop" style="animation-delay:.4s;display:flex;align-items:center;gap:10px;margin-top:12px;background:rgba(255,255,255,.15);backdrop-filter:blur(6px);border-radius:15px;padding:8px 10px">
          <div style="width:36px;height:36px;border-radius:11px;background-image:url('museum.jpg');background-size:cover;background-position:center;flex-shrink:0"></div>
          <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:800">Next · National Museum</div><div style="font-size:11px;font-weight:600;opacity:.85">1.4 km · 6 min · 12:30 PM</div></div>
          ${I.nav("#fff", 16)}
        </div>
        <div class="a-pop" style="animation-delay:.55s;display:flex;align-items:center;gap:12px;margin-top:12px">
          <div style="flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.3);overflow:hidden"><div style="width:38%;height:6px;border-radius:3px;background:#fff;animation:fillbar 1.2s .3s ease-out both"></div></div>
          <div style="background:var(--primary);color:#fff;border-radius:999px;padding:9px 20px;font-size:13px;font-weight:800;box-shadow:0 8px 18px ${P.primary}66">Continue</div>
        </div>
      </div>
    </div></div>

    <!-- QUICK CREATE -->
    <div class="pad a-pop" style="margin-top:16px;animation-delay:.12s;display:flex;gap:10px">
      <div style="flex:1;height:56px;border-radius:999px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;gap:9px;font-size:15.5px;font-weight:800;box-shadow:0 12px 26px ${P.primary}59">${I.spark("#fff", 18)} Plan a new trip</div>
      <div style="width:56px;height:56px;border-radius:999px;background:var(--card);box-shadow:0 8px 18px rgba(20,20,20,.10);display:flex;align-items:center;justify-content:center">${I.file("var(--ink)", 20)}</div>
    </div>

    <!-- TODAY AT A GLANCE (the generated format) -->
    <div class="pad a-pop" style="margin-top:22px;animation-delay:.2s">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b style="font-size:16px;font-weight:800">Today at a glance</b><span style="font-size:12.5px;font-weight:700;color:var(--primary)">Open calendar</span></div>
      <div class="card" style="border-radius:22px;padding:14px 15px;display:flex;flex-direction:column;gap:8px">
        ${schedRow("9–12", "National Museum · Intramuros", "next", P)}
        ${schedRow("1 PM", "Lunch · Binondo food crawl", "act", P)}
        ${schedRow("5:30", "Manila Bay · sunset", "act", P)}
      </div>
    </div>

    <!-- YOUR TRIPS -->
    <div class="pad a-pop" style="margin-top:22px;animation-delay:.28s">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b style="font-size:16px;font-weight:800">Your trips</b><span class="sec" style="font-size:12.5px;font-weight:700">See all</span></div>
      <div style="display:flex;gap:12px">
        ${["manilabay.jpg", "city.jpg"].map((im, i) => `<div class="card" style="width:160px;flex-shrink:0;border-radius:20px;overflow:hidden;padding:0"><div style="height:96px;background-image:url('${im}');background-size:cover;background-position:center"></div><div style="padding:11px 13px"><div style="font-size:14px;font-weight:800">${i ? "Cebu Food Run" : "Iloilo Getaway"}</div><div class="sec" style="font-size:11.5px;font-weight:600;margin-top:2px">${i ? "Feb 2026 · past" : "Sep 2026 · planned"}</div></div></div>`).join("")}
      </div>
    </div>
  </div>
  ${tab("Home", P)}
</div>`;
}

// ===== STRUCTURE B — recommendation-forward (we recommend the places) =====
const ideaCard = (img, title, tag, tagc, delay) => `<div class="a-pop" style="width:150px;flex-shrink:0;border-radius:20px;overflow:hidden;position:relative;height:180px;box-shadow:0 10px 24px rgba(20,20,20,.12);animation-delay:${delay}s">
  <div style="position:absolute;inset:0;background-image:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.62)),url('${img}');background-size:cover;background-position:center"></div>
  <span style="position:absolute;top:10px;left:10px;background:${tagc};color:#fff;font-size:9.5px;font-weight:800;letter-spacing:.3px;padding:4px 9px;border-radius:999px">${tag}</span>
  <div style="position:absolute;left:12px;right:12px;bottom:12px;color:#fff"><div style="font-size:14px;font-weight:800;line-height:1.15">${title}</div><div style="display:flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;opacity:.9;margin-top:4px"><svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>We recommend</div></div></div>`;
const popRow = (img, name, area, meta, P, last) => `<div style="display:flex;align-items:center;gap:12px;padding:11px 0${last ? "" : ";border-bottom:1px solid var(--line)"}">
  <div style="width:52px;height:52px;border-radius:15px;background-image:url('${img}');background-size:cover;background-position:center;flex-shrink:0"></div>
  <div style="flex:1;min-width:0"><div style="font-size:14.5px;font-weight:800">${name}</div><div class="sec" style="font-size:12px;font-weight:600;margin-top:1px">${area}</div></div>
  <span style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:800">${I.star("#F2B21A", 13)} ${meta}</span></div>`;
function home2(P) {
  return `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:4px;display:flex;align-items:center;gap:12px">
    <div style="flex:1"><div class="sec" style="font-size:12.5px;font-weight:600">Friday night in</div><div style="font-size:20px;font-weight:800;letter-spacing:-.3px">Makati &amp; BGC</div></div>
    <div style="width:46px;height:46px;border-radius:16px;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px">KL</div>
  </div>
  <div class="pad" style="margin-top:14px"><div style="height:58px;border-radius:999px;background:var(--card);box-shadow:0 10px 24px rgba(20,20,20,.10);display:flex;align-items:center;gap:12px;padding:0 18px;animation:popIn .5s cubic-bezier(.2,.8,.2,1) both">${I.search("var(--sec)", 20)}<span style="flex:1;font-size:15px;font-weight:600;color:var(--sec)">Plan a date, a day out, a trip…</span><div style="width:38px;height:38px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center">${I.spark("#fff", 17)}</div></div></div>
  <div style="flex:1;overflow:hidden;padding-top:8px">
    <div class="pad a-pop" style="margin-top:14px;animation-delay:.08s"><div style="display:flex;align-items:center;gap:12px;background:var(--card);border-radius:20px;padding:11px 13px;box-shadow:0 6px 16px rgba(20,20,20,.07)">
      <div style="width:46px;height:46px;border-radius:13px;background-image:url('bgc.jpg');background-size:cover;background-position:center;flex-shrink:0"></div>
      <div style="flex:1"><div style="font-size:14px;font-weight:800">BGC + Manila · Day 4</div><div class="sec" style="font-size:12px;font-weight:600">Next stop in 45 min</div></div>
      <div style="background:var(--primary);color:#fff;border-radius:999px;padding:8px 16px;font-size:12.5px;font-weight:800">Continue</div></div></div>
    <div class="pad" style="margin-top:22px;display:flex;justify-content:space-between;align-items:center"><b style="font-size:16px;font-weight:800">Ideas for a date night</b><span style="font-size:12.5px;font-weight:700;color:var(--primary)">See all</span></div>
    <div style="display:flex;gap:12px;overflow:hidden;padding:10px 22px 2px">
      ${ideaCard("city.jpg", "Rooftop sunset drinks", "ROMANTIC", P.grad1, 0.12)}
      ${ideaCard("dinner.jpg", "Hidden pasta bar", "FOODIE", P.a2, 0.2)}
      ${ideaCard("museum.jpg", "After-hours gallery", "CULTURE", P.a3, 0.28)}
    </div>
    <div class="pad" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px">
      <span style="padding:8px 14px;border-radius:999px;background:var(--primary);color:#fff;font-size:12.5px;font-weight:700">Romantic</span>
      <span style="padding:8px 14px;border-radius:999px;background:var(--card);box-shadow:0 3px 10px rgba(20,20,20,.06);font-size:12.5px;font-weight:700">Foodie</span>
      <span style="padding:8px 14px;border-radius:999px;background:var(--card);box-shadow:0 3px 10px rgba(20,20,20,.06);font-size:12.5px;font-weight:700">Nightlife</span>
      <span style="padding:8px 14px;border-radius:999px;background:var(--card);box-shadow:0 3px 10px rgba(20,20,20,.06);font-size:12.5px;font-weight:700">Outdoors</span>
    </div>
    <div class="pad" style="margin-top:20px"><b style="font-size:16px;font-weight:800">Popular near you</b></div>
    <div class="pad" style="margin-top:2px"><div class="card" style="border-radius:20px;padding:2px 16px">
      ${popRow("rooftop.jpg", "Aracama Terrace", "Wine bar · Makati · 1.1 km", "4.7", P)}
      ${popRow("pastry.jpg", "Café Bola", "Dessert · BGC · 2.1 km", "4.6", P, true)}
    </div></div>
  </div>
  ${tab("Home", P)}
</div>`;
}

const names = Object.keys(PAL);
for (const n of names) {
  fs.writeFileSync(path.join(DIR, `${n}.dc.html`), wrap(n, home(PAL[n]), PAL[n]), "utf8");
  fs.writeFileSync(path.join(DIR, `${n}B.dc.html`), wrap(`${n}B`, home2(PAL[n]), PAL[n]), "utf8");
}
const W = 390, H = 844, GX = 96, GY = 170;
const canvas = {
  artboards: [
    ...names.map((n, i) => ({ file: `${n}.dc.html`, x: i * (W + GX), y: 0, w: W, h: H, title: `A · ${PAL[n].label}` })),
    ...names.map((n, i) => ({ file: `${n}B.dc.html`, x: i * (W + GX), y: H + GY, w: W, h: H, title: `B · ${PAL[n].label}` })),
  ],
  annotations: [
    { id: "t", x: 0, y: -150, w: 940, text: "Wayfare — Home, two structures × four feeling-first palettes\nStructure A (top): cinematic active-trip hero (Ken-Burns, LIVE badge, animated progress) + today's schedule + trips.\nStructure B (bottom): recommendation-forward — search, a compact Continue strip, curated ‘ideas’ we recommend, categories, and popular-near-you." },
    ...names.map((n, i) => ({ id: `la${i}`, x: i * (W + GX), y: -46, w: W, text: `${PAL[n].label} — ${PAL[n].feel}` })),
  ],
  launch: { view: "canvas" },
};
fs.writeFileSync(path.join(DIR, "canvas.json"), JSON.stringify(canvas, null, 2) + "\n", "utf8");
console.log(`wrote ${names.length} cinematic-home palettes + canvas.json`);
