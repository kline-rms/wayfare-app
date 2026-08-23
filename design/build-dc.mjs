// Generates the 9 Wayfare .dc.html artboards in the minimal/neutral style
// (from docs/design-reference.webp). Shared tokens + components → per-screen bodies.
// Run: node build-dc.mjs   → writes *.dc.html + canvas.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const DIR = path.dirname(fileURLToPath(import.meta.url));

// ---------- palettes (accents a1..a4 map to --orange/--green/--blue/--purple) ----------
export const PALETTES = {
  Neutral: { bg: "#ECEBE8", card: "#FFFFFF", ink: "#191A1C", sec: "#9B9A96", ter: "#C3C1BC", line: "#EEEDEA", primary: "#17181A", primaryd: "#2C2D31", a1: "#F26B2A", a2: "#34B87E", a3: "#3E97E5", a4: "#8B7CF0", label: "Neutral" },
  Nightfall: { bg: "#141110", card: "#1E1A17", ink: "#F4EEE5", sec: "#A99C8C", ter: "#8B7F70", line: "#2C2622", primary: "#FF6A3D", primaryd: "#E8532A", a1: "#F2B36B", a2: "#F0563F", a3: "#6AA6FF", a4: "#E0447E", label: "Nightfall" },
  Tangerine: { bg: "#FFF6EE", card: "#FFFFFF", ink: "#241A14", sec: "#9C8B7E", ter: "#D8C6B6", line: "#F1E7DC", primary: "#FF6A3D", primaryd: "#E8532A", a1: "#FF9E1B", a2: "#17B3A6", a3: "#3E97E5", a4: "#E0447E", label: "Tangerine Warmth" },
  Tropical: { bg: "#EFFAF6", card: "#FFFFFF", ink: "#123330", sec: "#6E8B84", ter: "#B4CFC7", line: "#E1F1EB", primary: "#10B8A6", primaryd: "#0C9E8E", a1: "#7CC93F", a2: "#FF6B6B", a3: "#3EA6FF", a4: "#FFB020", label: "Tropical Fresh" },
  Electric: { bg: "#F5F4FF", card: "#FFFFFF", ink: "#1B1830", sec: "#8480A0", ter: "#CBC7E4", line: "#EAE8FA", primary: "#6C4DF0", primaryd: "#5A3CE0", a1: "#FF4D8D", a2: "#3EA6FF", a3: "#23C99A", a4: "#FFB020", label: "Electric Play" },
  Sunset: { bg: "#FFF3EF", card: "#FFFFFF", ink: "#2A1720", sec: "#9E8088", ter: "#E0C4C0", line: "#F6E4DE", primary: "#FF5C7A", primaryd: "#EE4468", a1: "#FF9E45", a2: "#7C5CFF", a3: "#23C99A", a4: "#FFC24B", label: "Sunset Pop" },
};

// ---------- shared head/helmet (palette-driven) ----------
export const helmet = (P) => `<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=Bricolage+Grotesque:opsz,wght@12..96,600..800&display=swap">
<style>
  .serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:0}
  .grotesk{font-family:'Bricolage Grotesque','Plus Jakarta Sans',sans-serif;font-weight:800;letter-spacing:-.5px}
  .mono{font-family:ui-monospace,'SF Mono','DM Mono',monospace}
  :root{
    --bg:${P.bg}; --card:${P.card}; --ink:${P.ink}; --sec:${P.sec}; --ter:${P.ter};
    --line:${P.line}; --primary:${P.primary}; --primaryd:${P.primaryd}; --black:${P.primary}; --knob:${P.primaryd};
    --orange:${P.a1}; --green:${P.a2}; --blue:${P.a3}; --purple:${P.a4};
  }
  *{box-sizing:border-box}
  body{margin:0;font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased}
  a{color:var(--ink);text-decoration:none}
  .frame{width:390px;height:844px;overflow:hidden;background:var(--bg);display:flex;flex-direction:column;position:relative}
  .safe{height:52px;flex-shrink:0}
  .pad{padding:0 22px}
  .card{background:var(--card);border-radius:24px;box-shadow:0 8px 22px rgba(20,20,20,.06)}
  .sec{color:var(--sec)}
  .h1{font-size:28px;font-weight:800;letter-spacing:-.7px;line-height:1.08;margin:0}
  .cta{position:relative;height:60px;border-radius:30px;background:var(--black);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0;box-shadow:0 14px 26px rgba(23,24,26,.26)}
  .cta .knob{position:absolute;right:8px;top:8px;width:44px;height:44px;border-radius:50%;background:var(--knob);display:flex;align-items:center;justify-content:center}
  .chipbtn{height:38px;border-radius:19px;background:var(--card);box-shadow:0 6px 16px rgba(20,20,20,.10);display:flex;align-items:center;gap:6px;padding:0 14px;font-size:13px;font-weight:700}
  .rbtn{box-shadow:0 8px 18px rgba(23,24,26,.22)}
  .softsh{box-shadow:0 10px 24px rgba(20,20,20,.10)}
  .navbtn{box-shadow:0 7px 16px rgba(0,0,0,.16)}
  .stopcard{margin-bottom:10px}
  .iconchip{width:40px;height:40px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .weather{background:var(--card);border-radius:15px;padding:7px 12px;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(20,20,20,.05)}
  .orb{width:26px;height:26px;border-radius:50%;flex-shrink:0;background-color:var(--ink);background-repeat:no-repeat;background-position:center;background-size:56%;background-image:url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20d='M12%202l1.9%206.4L20%2010l-6.1%201.6L12%2018l-1.9-6.4L4%2010l6.1-1.6z'%20fill='%23fff'/%3E%3C/svg%3E");animation:orbpulse 2.8s ease-in-out infinite}
  .aitip{display:flex;align-items:center;gap:12px;background:var(--card);border-radius:22px;padding:14px;box-shadow:0 6px 16px rgba(20,20,20,.05)}
  .stat{flex:1;display:flex;flex-direction:column;gap:3px}
  .stat b{font-size:19px;font-weight:800;letter-spacing:-.4px}
  .stat span{font-size:12px;color:var(--sec);font-weight:500}
  .rail{width:40px;display:flex;flex-direction:column;align-items:center;flex-shrink:0}
  .dash{width:2px;flex:1;margin-top:6px;background-image:repeating-linear-gradient(to bottom,var(--ter) 0 4px,transparent 4px 10px)}
  .stopcard{flex:1;background:var(--card);border-radius:20px;box-shadow:0 6px 16px rgba(20,20,20,.06);padding:14px 15px;margin-bottom:12px}
  .field{height:56px;border-radius:16px;background:var(--card);box-shadow:0 3px 10px rgba(20,20,20,.04);display:flex;align-items:center;gap:12px;padding:0 16px}
  .field input{border:none;outline:none;background:transparent;font-family:inherit;font-size:15px;font-weight:500;color:var(--ink);width:100%}
  .field input::placeholder{color:var(--ter)}
  .label{font-size:13px;font-weight:600;color:var(--sec);margin-bottom:8px}
  .photo{background:linear-gradient(135deg,#DAD8D3 0%,#C8C5BF 55%,#D2CFC9 100%);position:relative;overflow:hidden}
  .photo .pi{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:.45}
  .dots{display:flex;gap:6px;align-items:center}
  .dots i{width:6px;height:6px;border-radius:3px;background:var(--ter);display:block}
  .dots i.on{width:20px;background:var(--ink)}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes sheetUp{0%{transform:translateY(115%)}70%{transform:translateY(-6px)}100%{transform:translateY(0)}}
  @keyframes springIn{0%{transform:scale(.5);opacity:0}55%{transform:scale(1.1);opacity:1}75%{transform:scale(.96)}100%{transform:scale(1)}}
  @keyframes popIn{0%{transform:scale(.86) translateY(12px);opacity:0}100%{transform:scale(1) translateY(0);opacity:1}}
  @keyframes ring{0%{transform:scale(.25);opacity:.5}100%{transform:scale(2.7);opacity:0}}
  @keyframes floatUp{0%{transform:translate(0,0) scale(1);opacity:0}20%{opacity:1}100%{transform:translate(var(--dx,0),-96px) scale(.35);opacity:0}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes drift{0%,100%{transform:translateY(5px)}50%{transform:translateY(-5px)}}
  @keyframes drawline{to{stroke-dashoffset:0}}
  @keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(23,24,26,.18)}50%{box-shadow:0 0 40px 6px rgba(23,24,26,.10)}}
  @keyframes orbpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.09)}}
  @keyframes staggerUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes kenburns{from{transform:scale(1.04)}to{transform:scale(1.16)}}
  @keyframes livepulse{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.9);opacity:0}}
  @keyframes fillbar{from{width:0}}
  .kb{animation:kenburns 20s ease-in-out infinite alternate}
  .a-fade{animation:fadeIn .35s ease both}
  .a-sheet{animation:sheetUp .5s cubic-bezier(.2,.8,.2,1) both}
  .a-spring{animation:springIn .7s cubic-bezier(.2,.9,.3,1.2) both}
  .a-pop{animation:popIn .4s cubic-bezier(.2,.8,.2,1) both}
  .a-spin{animation:spin 1s linear infinite}
  .a-drift{animation:drift 3s ease-in-out infinite}
</style>
</helmet>`;

// ---------- inline svg icons ----------
const I = {
  bell: (c = "#191A1C", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.5 21a2 2 0 0 0 3 0"/></svg>`,
  home: (c = "#191A1C", s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>`,
  compass: (c = "#191A1C", s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>`,
  gear: (c = "#191A1C", s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15a1.6 1.6 0 0 0-1.5-1H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 3 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 8 4.6a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1A1.6 1.6 0 0 0 16 4.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>`,
  checkC: (c = "#34B87E", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>`,
  check: (c = "#fff", s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  globe: (c = "#191A1C", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/></svg>`,
  wallet: (c = "#191A1C", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14h2"/></svg>`,
  logout: (c = "#E5484D", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h11"/></svg>`,
  flag: (c = "#191A1C", s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4h13l-2 4 2 4H5"/></svg>`,
  edit: (c = "#191A1C", s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`,
  moon: (c = "#191A1C", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A8 8 0 1 1 11.2 3 6.2 6.2 0 0 0 21 12.8Z"/></svg>`,
  upload: (c = "#191A1C", s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/><path d="M12 15V3M7 8l5-5 5 5"/></svg>`,
  file: (c = "#191A1C", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>`,
  users: (c = "#191A1C", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.4"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.2a3.4 3.4 0 0 1 0 5.6M21 20a6 6 0 0 0-4-5.6"/></svg>`,
  wand: (c = "#191A1C", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4V2M15 10v-2M11 6H9M21 6h-2M18 3l-1.4 1.4M18 9l-1.4-1.4M4 20l10-10"/></svg>`,
  search: (c = "#191A1C", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>`,
  close: (c = "#191A1C", s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  brief: (c = "#191A1C", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></svg>`,
  calClock: (c = "#191A1C", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6M8 2v4M16 2v4M3 10h18"/><circle cx="17.5" cy="17.5" r="4"/><path d="M17.5 16v1.5l1 .8"/></svg>`,
  alert: (c = "#D8524D", s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>`,
  refresh: (c = "#191A1C", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>`,
  wine: (c = "#fff", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8M12 15v7M6 3h12l-1 6a5 5 0 0 1-10 0z"/></svg>`,
  car: (c = "#191A1C", s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13"/><path d="M4 13h16v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M7 16h.01M17 16h.01"/></svg>`,
  walk: (c = "#191A1C", s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="1.6"/><path d="M11 21l2-5-3-2 1-5 3 2 2 2M9 13l1-4"/></svg>`,
  music: (c = "#fff", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>`,
  swap: (c = "#191A1C", s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3l4 4-4 4M20 7H8M8 21l-4-4 4-4M4 17h12"/></svg>`,
  heart2: (c = "#E0447E", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" stroke="none"><path d="M12 21s-7-4.5-9.5-9A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>`,
  arrow: (c = "#fff", s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>`,
  back: (c = "#191A1C", s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
  chevR: (c = "#191A1C", s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>`,
  cal: (c = "#9B9A96", s = 17) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>`,
  clock: (c = "#9B9A96", s = 15) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  pin: (c = "#9B9A96", s = 15) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>`,
  plus: (c = "#191A1C", s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`,
  minus: (c = "#191A1C", s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>`,
  locate: (c = "#191A1C", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="4"/></svg>`,
  nav: (c = "#fff", s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>`,
  dots3: (c = "#191A1C", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>`,
  coffee: (c = "#fff", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a3 3 0 0 1 0 6h-1"/><path d="M3 8h14v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z"/><path d="M6 2v2M10 2v2M14 2v2"/></svg>`,
  train: (c = "#fff", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 11h16"/><circle cx="8.5" cy="14" r="1"/><circle cx="15.5" cy="14" r="1"/><path d="m7 20-1.5 2M17 20l1.5 2"/></svg>`,
  temple: (c = "#fff", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M4 21v-9M20 21v-9M6 12v9M18 12v9M10 21v-4a2 2 0 0 1 4 0v4M2 12l10-6 10 6"/></svg>`,
  food: (c = "#fff", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3v7a2 2 0 0 0 2 2 2 2 0 0 0 2-2V3M6 3v18M15 3c-1.5 1-2 3-2 5s.5 3 2 3v10"/></svg>`,
  star: (c = "#F2B21A", s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" stroke="none"><path d="m12 3 2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.9 6.6 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>`,
  share: (c = "#191A1C", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 3v13M7 8l5-5 5 5"/></svg>`,
  heart: (c = "#191A1C", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.5-1.6 3-3.3 3-5.5A3.5 3.5 0 0 0 12 6a3.5 3.5 0 0 0-10 2.5C2 10.7 3.5 12.4 5 14l7 7z"/></svg>`,
  sun: (c = "#F2B21A", s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="4" fill="#F7C948"/><g stroke="#F2B21A" stroke-width="1.6" stroke-linecap="round"><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.8 3.8l1.4 1.4M12.8 12.8l1.4 1.4M14.2 3.8l-1.4 1.4"/></g><path d="M8 13a4.5 4.5 0 0 1 4.4-3.5A4.5 4.5 0 0 1 21 12a3.5 3.5 0 0 1-.5 7H8a3.8 3.8 0 0 1 0-6z" fill="#D9DEE4" stroke="#C4CBD3" stroke-width="1.2"/></svg>`,
  spark: (c = "#fff", s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2 5.5L19.5 10l-5.5 2L12 17l-2-5-5.5-2L10 8.5z"/></svg>`,
  send: (c = "#fff", s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z"/></svg>`,
  mail: (c = "#191A1C", s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>`,
  lock: (c = "#191A1C", s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
  eye: (c = "#C3C1BC", s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  user: (c = "#191A1C", s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
  route: (c = "#191A1C", s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.5"/></svg>`,
  image: (c = "#8C8983", s = 40) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="m21 15-5-5L5 21"/></svg>`,
  yen: (c = "#191A1C", s = 17) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4l5 7 5-7M8 12h8M8 16h8M12 11v8"/></svg>`,
  peso: (c = "#191A1C", s = 17) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 20V4h4.5a4 4 0 0 1 0 8H8M5 9h10M5 13h10"/></svg>`,
  google: () => `<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C36.2 6.5 30.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5Z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C36.2 6.5 30.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z"/><path fill="#4CAF50" d="M24 44c6.3 0 12-2.4 16.3-6.4l-7.5-6.3C30.3 33 27.3 34 24 34c-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.5 39.6 16.2 44 24 44Z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l7.5 6.3C43.9 36.6 44 30.5 44 24c0-1.2-.1-2.3-.4-3.5Z"/></svg>`,
};

// ---------- shared component builders ----------
const cta = (label, icon = I.nav()) => `<div class="cta">${label}<div class="knob">${icon}</div></div>`;
const weatherChip = () => `<div class="weather">${I.sun()}<div style="display:flex;flex-direction:column;line-height:1.1"><b style="font-size:16px;font-weight:800">10°</b><span style="font-size:11px;color:var(--sec);font-weight:500">Cloudy</span></div></div>`;
const statRow = (items) => `<div style="display:flex;gap:6px">${items.map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("")}</div>`;
const aiTip = (html) => `<div class="aitip"><div class="orb"></div><div style="font-size:13px;font-weight:500;color:#54524E;line-height:1.4">${html}</div></div>`;
const chipIcon = (color, svg) => `<div class="iconchip" style="background:${color}">${svg}</div>`;
const photo = (extra = "", h = "100%", label = "") => `<div class="photo" style="height:${h}">${I.image() ? `<div class="pi">${I.image()}</div>` : ""}${label}${extra}</div>`;

function stop(color, icon, title, time, addr, isLast = false, done = false) {
  const chip = done
    ? `<div class="iconchip" style="background:#E7F6EE">${I.checkC("#34B87E", 22)}</div>`
    : chipIcon(color, icon);
  return `<div style="display:flex;gap:12px">
    <div class="rail">${chip}${isLast ? "" : '<div class="dash"></div>'}</div>
    <div class="stopcard"${done ? ' style="opacity:.72"' : ""}>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="font-size:15px;font-weight:700">${title}</div>${done ? '<span style="font-size:10px;font-weight:800;color:#1E8A50;background:#E7F6EE;padding:2px 8px;border-radius:999px">ARRIVED</span>' : ""}</div>
      <div style="display:flex;align-items:center;gap:14px">
        <div style="display:flex;align-items:center;gap:5px">${I.clock()}<span style="font-size:12.5px;color:var(--sec);font-weight:500">${time}</span></div>
        <div style="width:1px;height:13px;background:var(--line)"></div>
        <div style="display:flex;align-items:center;gap:5px;min-width:0">${I.pin()}<span style="font-size:12.5px;color:var(--sec);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px">${addr}</span></div>
      </div>
    </div>
  </div>`;
}

// =====================================================================
// SCREEN BODIES
// =====================================================================
const screens = {};

// ---- Splash ----
screens.Splash = `<div class="frame" style="position:relative;justify-content:space-between;overflow:hidden">
  <div class="kb" style="position:absolute;inset:0;background-image:url('bgc.jpg');background-size:cover;background-position:center"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,17,16,.32) 0%,rgba(20,17,16,.5) 48%,rgba(20,17,16,.92) 100%)"></div>
  <div class="safe" style="position:relative"></div>
  <div class="pad" style="position:relative;flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:22px">
    <div style="width:60px;height:60px;border-radius:18px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.32);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;animation:springIn .8s cubic-bezier(.2,.9,.3,1.25) both">${I.route("#fff", 30)}</div>
    <div class="a-pop" style="animation-delay:.35s">
      <h1 style="font-size:54px;font-weight:800;letter-spacing:-1.6px;line-height:.96;margin:0;color:#fff">Wayfare</h1>
      <p style="font-size:17px;color:rgba(255,255,255,.84);font-weight:500;margin:14px 0 0;max-width:290px;line-height:1.45">Tell us where you are — we'll plan where you go.</p>
    </div>
  </div>
  <div class="pad" style="position:relative;padding-bottom:56px;display:flex;align-items:center;justify-content:space-between">
    <div class="dots"><i class="on" style="background:#fff"></i><i style="background:rgba(255,255,255,.5)"></i><i style="background:rgba(255,255,255,.5)"></i></div>
    <span style="font-size:14px;font-weight:700;color:rgba(255,255,255,.72)">Getting ready…</span>
  </div>
</div>`;

// ---- Onboarding ----
screens.Onboarding = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="display:flex;justify-content:flex-end;padding-top:6px"><span style="font-size:15px;font-weight:600;color:var(--sec)">Skip</span></div>
  <div class="pad" style="margin-top:10px">
    <div class="card" style="height:320px;border-radius:26px;overflow:hidden;position:relative;box-shadow:0 12px 30px rgba(20,20,20,.07);display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;inset:0;background:linear-gradient(160deg,#F4F3F1,#E7E5E1)"></div>
      <div style="position:relative;display:flex;flex-direction:column;gap:12px;width:250px">
        <div class="card" style="align-self:flex-start;padding:12px 14px;border-radius:16px 16px 16px 4px;font-size:13px;font-weight:600">Where are you starting from?</div>
        <div style="align-self:flex-end;background:var(--black);color:#fff;padding:12px 14px;border-radius:16px 16px 4px 16px;font-size:13px;font-weight:600">BGC → Old Manila</div>
        <div class="card" style="align-self:flex-start;padding:13px 14px;border-radius:16px;display:flex;align-items:center;gap:11px">
          <div class="orb"></div><div style="line-height:1.2"><div style="font-size:13px;font-weight:700">5-day plan ready</div><div style="font-size:11px;color:var(--sec)">3 styles · day-by-day</div></div>
        </div>
      </div>
    </div>
  </div>
  <div class="pad" style="margin-top:34px">
    <h1 style="font-size:32px;font-weight:800;letter-spacing:-.8px;line-height:1.1;margin:0">Plan any trip by<br>just chatting</h1>
    <p style="font-size:16px;color:var(--sec);font-weight:500;line-height:1.5;margin:14px 0 0">Business, romance, family, or a solo adventure — describe it and get a day-by-day plan built around where you're coming from.</p>
  </div>
  <div style="flex:1"></div>
  <div class="pad" style="padding-bottom:46px;display:flex;align-items:center;justify-content:space-between">
    <div class="dots"><i class="on"></i><i></i><i></i></div>
    <div class="cta" style="width:150px">Next<div class="knob">${I.arrow()}</div></div>
  </div>
</div>`;

// ---- auth field helper ----
const authField = (label, icon, value, type = "text", trail = "") =>
  `<div><div class="label">${label}</div><div class="field">${icon}<input type="${type}" value="${value}">${trail ? `<div style="flex:1"></div>${trail}` : ""}</div></div>`;

// ---- Register ----
screens.Register = `<div class="frame">
  <div style="height:184px;flex-shrink:0;position:relative;overflow:hidden;background-image:linear-gradient(180deg,rgba(0,0,0,.24),rgba(0,0,0,.6)),url('bgc.jpg');background-size:cover;background-position:center">
    <div class="safe" style="position:absolute;top:0;left:0"></div>
    <div class="navbtn" style="position:absolute;top:56px;left:22px;width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center">${I.back()}</div>
    <div style="position:absolute;left:22px;right:22px;bottom:16px;color:#fff">
      <h1 style="font-size:30px;font-weight:800;letter-spacing:-.5px;margin:0">Create your account</h1>
      <p style="font-size:14px;font-weight:500;color:rgba(255,255,255,.85);margin:6px 0 0">Start planning smarter trips in seconds.</p>
    </div>
  </div>
  <div class="pad" style="margin-top:22px;display:flex;flex-direction:column;gap:16px">
    ${authField("Full name", I.user(), "Kline Lozada")}
    ${authField("Email", I.mail(), "klinelozada@gmail.com", "email")}
    ${authField("Password", I.lock(), "········", "password", I.eye())}
  </div>
  <div class="pad" style="margin-top:22px">${cta("Create account", I.arrow())}</div>
  <div class="pad" style="margin-top:18px;display:flex;align-items:center;gap:14px"><div style="flex:1;height:1px;background:#DEDCD8"></div><span class="sec" style="font-size:13px;font-weight:600">or</span><div style="flex:1;height:1px;background:#DEDCD8"></div></div>
  <div class="pad" style="margin-top:16px"><div class="field" style="height:56px;border-radius:999px;justify-content:center;gap:12px;font-weight:600;font-size:15px">${I.google()}Continue with Google</div></div>
  <div style="flex:1"></div>
  <div class="pad" style="padding-bottom:34px;text-align:center;font-size:14px;color:var(--sec)">Already have an account? <b style="color:var(--ink)">Log in</b></div>
</div>`;

// ---- Login ----
screens.Login = `<div class="frame">
  <div style="height:210px;flex-shrink:0;position:relative;overflow:hidden;background-image:linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,.62)),url('city.jpg');background-size:cover;background-position:center">
    <div class="safe" style="position:absolute;top:0;left:0"></div>
    <div style="position:absolute;top:56px;left:22px;display:flex;align-items:center;gap:11px">
      <div style="width:42px;height:42px;border-radius:13px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center">${I.route("#fff", 22)}</div>
      <span style="font-size:20px;font-weight:800;letter-spacing:-.4px;color:#fff">Wayfare</span>
    </div>
    <div style="position:absolute;left:22px;right:22px;bottom:16px;color:#fff">
      <h1 style="font-size:34px;font-weight:800;letter-spacing:-.6px;margin:0">Welcome back</h1>
      <p style="font-size:14px;font-weight:500;color:rgba(255,255,255,.85);margin:6px 0 0">Log in to keep planning your trips.</p>
    </div>
  </div>
  <div class="pad" style="margin-top:24px;display:flex;flex-direction:column;gap:18px">
    ${authField("Email", I.mail(), "klinelozada@gmail.com", "email")}
    ${authField("Password", I.lock(), "········", "password", I.eye())}
  </div>
  <div class="pad" style="margin-top:14px;text-align:right;font-size:13px;font-weight:700">Forgot password?</div>
  <div class="pad" style="margin-top:14px">${cta("Log in", I.arrow())}</div>
  <div class="pad" style="margin-top:22px;display:flex;align-items:center;gap:14px"><div style="flex:1;height:1px;background:#DEDCD8"></div><span class="sec" style="font-size:13px;font-weight:600">or</span><div style="flex:1;height:1px;background:#DEDCD8"></div></div>
  <div class="pad" style="margin-top:18px"><div class="field" style="height:56px;border-radius:999px;justify-content:center;gap:12px;font-weight:600;font-size:15px">${I.google()}Continue with Google</div></div>
  <div style="flex:1"></div>
  <div class="pad" style="padding-bottom:40px;text-align:center;font-size:14px;color:var(--sec)">New here? <b style="color:var(--ink)">Create account</b></div>
</div>`;

// ---- Chat (Main) ----
const aiBub = (t) => `<div class="card" style="align-self:flex-start;max-width:250px;padding:11px 14px;border-radius:16px 16px 16px 5px;font-size:14px;font-weight:500;line-height:1.4">${t}</div>`;
const meBub = (t) => `<div style="align-self:flex-end;background:var(--black);color:#fff;padding:11px 14px;border-radius:16px 16px 5px 16px;font-size:14px;font-weight:600">${t}</div>`;
const sumCell = (l, v, vc = "var(--ink)") => `<div style="flex:1"><div style="font-size:11px;font-weight:700;color:var(--ter);letter-spacing:.3px">${l}</div><div style="font-size:14px;font-weight:700;margin-top:2px;color:${vc}">${v}</div></div>`;
screens.Main = `<div class="frame">
  <div class="safe"></div>
  <div style="height:56px;display:flex;align-items:center;gap:12px;padding:0 18px;border-bottom:1px solid var(--line)">
    ${I.back()}
    <div class="orb" style="width:32px;height:32px"></div>
    <div style="flex:1;line-height:1.15"><div style="font-size:15px;font-weight:800">New trip</div><div style="font-size:11.5px;color:var(--sec)">AI trip planner</div></div>
    ${I.dots3("#9B9A96")}
  </div>
  <div style="flex:1;overflow:hidden;padding:14px 16px 6px;display:flex;flex-direction:column;gap:8px">
    ${aiBub("Hi! Where are you starting from?")}
    ${meBub("Avida, BGC · Taguig")}
    ${aiBub("Nice — and where to?")}
    ${meBub("Around Manila & Makati")}
    ${aiBub("What's the occasion?")}
    <div style="align-self:flex-start;display:flex;flex-wrap:wrap;gap:7px;max-width:280px">
      <span style="padding:8px 13px;border-radius:999px;background:var(--black);color:#fff;font-size:12.5px;font-weight:700">Couple</span>
      <span class="chipbtn" style="height:34px">Business</span><span class="chipbtn" style="height:34px">Family</span><span class="chipbtn" style="height:34px">Solo</span>
    </div>
    <div class="card" style="align-self:stretch;margin-top:4px;padding:15px;border-radius:18px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">${I.spark("#191A1C", 16)}<b style="font-size:15px;font-weight:800">Trip summary</b></div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <div style="flex:1;background:var(--bg);border-radius:12px;padding:9px 11px"><div style="font-size:10px;font-weight:700;color:var(--ter)">FROM</div><div style="font-size:14px;font-weight:700">BGC, Taguig</div></div>
        ${I.arrow("#C3C1BC", 18)}
        <div style="flex:1;background:#EEF5EF;border-radius:12px;padding:9px 11px"><div style="font-size:10px;font-weight:700;color:#5FB584">TO</div><div style="font-size:14px;font-weight:700;color:#1E8A50">Manila &amp; Makati</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:12px">${sumCell("PURPOSE", "Couple trip")}${sumCell("DATES", "Aug 26 – Sep 6")}</div>
      <div style="display:flex;gap:12px">${sumCell("TRAVELERS", "2 adults")}${sumCell("BUDGET · PACE", "Mid · Relaxed")}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">${I.brief("#9B9A96", 15)}<span style="font-size:12px;font-weight:600;color:var(--sec)">Blocked: Work 7 AM–4 PM · weekdays</span></div>
      <div class="cta" style="height:50px;border-radius:999px;margin-top:14px;font-size:15px">Generate 3 plans<div class="knob" style="width:36px;height:36px;top:7px;right:7px">${I.spark("#fff", 16)}</div></div>
    </div>
  </div>
  <div style="padding:10px 16px 16px;border-top:1px solid var(--line);display:flex;align-items:center;gap:10px">
    <div style="flex:1;height:48px;border-radius:24px;background:var(--card);box-shadow:0 3px 10px rgba(20,20,20,.04);display:flex;align-items:center;padding:0 16px;color:var(--ter);font-size:14px;font-weight:500">Message Wayfare…</div>
    <div class="rbtn" style="width:48px;height:48px;border-radius:24px;background:var(--black);display:flex;align-items:center;justify-content:center">${I.send()}</div>
  </div>
</div>`;

// ---- Proposals ----
const propCard = (img, color, tag, name, desc, price, meta) => `<div class="card" style="padding:13px;border-radius:24px;display:flex;gap:13px">
  <div style="flex:1;min-width:0;display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;gap:8px"><span style="width:9px;height:9px;border-radius:3px;background:${color}"></span><span style="font-size:10.5px;font-weight:800;letter-spacing:.4px;color:var(--sec)">${tag}</span></div>
    <div style="font-size:19px;font-weight:800;letter-spacing:-.4px;margin-top:6px">${name}</div>
    <p style="font-size:12.5px;color:var(--sec);font-weight:500;line-height:1.4;margin:3px 0 0">${desc}</p>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:12px">
      <div><div style="font-size:10.5px;color:var(--ter);font-weight:600">Est. · 2 pax · ${meta}</div><div style="font-size:15px;font-weight:800">${price}</div></div>
      <div class="rbtn" style="width:38px;height:38px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center">${I.arrow("#fff", 16)}</div>
    </div>
  </div>
  <div style="width:90px;flex-shrink:0;border-radius:18px;background-image:url('${img}');background-size:cover;background-position:center"></div>
</div>`;
screens.Proposals = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:6px;display:flex;align-items:center;gap:12px">${I.back()}<span class="sec" style="font-size:14px;font-weight:600">Your plans</span></div>
  <div class="pad" style="margin-top:16px">
    <h1 class="h1" style="font-size:30px">BGC + Manila · 12 days</h1>
    <div style="display:flex;align-items:center;gap:7px;margin-top:9px">${I.pin("#9B9A96", 15)}<span class="sec" style="font-size:13px;font-weight:600">from Avida, BGC · couple trip · 2 people</span></div>
  </div>
  <div class="pad" style="margin-top:14px;display:flex;flex-direction:column;gap:12px">
    <div class="a-pop" style="animation-delay:.05s">${propCard("bgc.jpg", "var(--blue)", "BALANCED", "Balanced Couple Week", "Best overall mix — Sat Old Manila, Sun Makati, Mon relaxed BGC.", "₱19.4k – 33.7k", "12 days")}</div>
    <div class="a-pop" style="animation-delay:.15s">${propCard("city.jpg", "var(--purple)", "ROMANTIC", "Romantic Staycation", "More couple time, less touring — spa days, lazy Sundays, dinners.", "₱21.5k – 37.6k", "12 days")}</div>
    <div class="a-pop" style="animation-delay:.25s">${propCard("museum.jpg", "var(--orange)", "EXPLORE", "Explore Manila", "Maximize sightseeing — Old Manila, Binondo, Makati & BGC.", "₱19.0k – 33.5k", "12 days")}</div>
  </div>
  <div style="flex:1"></div>
  <div class="pad" style="padding-bottom:24px"><div class="chipbtn" style="height:50px;border-radius:999px;justify-content:center;font-size:14.5px">${I.route("#191A1C", 18)} Regenerate with tweaks</div></div>
</div>`;

// ---- Itinerary (live day: up-next photo + GPS distance + cancel-next) ----
const laterRow = (img, name, time, area) => `<div style="display:flex;align-items:center;gap:12px;padding:8px 0">
  <div style="width:50px;height:50px;border-radius:14px;background-image:url('${img}');background-size:cover;background-position:center;flex-shrink:0"></div>
  <div style="flex:1;min-width:0"><div style="font-size:14.5px;font-weight:700">${name}</div><div class="sec" style="font-size:12px;font-weight:500;margin-top:2px">${area}</div></div>
  <span class="sec" style="font-size:12.5px;font-weight:700">${time}</span>
</div>`;
screens.Itinerary = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:2px;display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">${I.cal()}<span class="sec" style="font-size:13.5px;font-weight:600">Sat, Aug 29</span></div>
      <h1 class="h1" style="font-size:26px">BGC → Old Manila</h1>
      <div class="sec" style="font-size:13px;font-weight:600;margin-top:6px">from Avida, Taguig · place to place · Day 4</div>
    </div>
    ${weatherChip()}
  </div>
  <div class="pad" style="margin-top:16px">${statRow([["6 min", "To next stop"], ["6.2 km", "Total route"], ["4 stops", "Today"]])}</div>
  <div style="flex:1;overflow:hidden;padding:18px 22px 0">
    <div style="font-size:12px;font-weight:800;color:var(--sec);letter-spacing:.5px;margin-bottom:10px;display:flex;align-items:center;gap:7px"><span style="width:8px;height:8px;border-radius:50%;background:#34B87E"></span>UP NEXT · LIVE FROM YOUR LOCATION</div>
    <div class="card" style="border-radius:24px;overflow:hidden;padding:0">
      <div style="height:118px;background-image:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.55)),url('museum.jpg');background-size:cover;background-position:center;position:relative">
        <span style="position:absolute;top:12px;left:12px;background:rgba(255,255,255,.92);border-radius:999px;padding:5px 11px;font-size:10.5px;font-weight:800">NEXT · 12:30 PM</span>
        <div style="position:absolute;left:14px;right:14px;bottom:12px;color:#fff"><div style="font-size:17px;font-weight:800">National Museum of Fine Arts</div><div style="font-size:11.5px;font-weight:600;opacity:.9">Padre Burgos Ave, Ermita, Manila</div></div>
      </div>
      <div style="padding:13px 15px">
        <div style="display:flex;align-items:center;gap:9px">${I.nav("#191A1C", 17)}<span style="font-size:14.5px;font-weight:800">1.4 km · 6 min drive</span><span class="sec" style="font-size:12.5px;font-weight:500">from you now</span></div>
        <div style="display:flex;gap:10px;margin-top:12px">
          <div class="chipbtn" style="flex:1;height:46px;justify-content:center;border-radius:999px;gap:7px">${I.close("#E5484D", 16)}<span style="color:#E5484D">Cancel next</span></div>
          <div class="rbtn" style="flex:1;height:46px;border-radius:999px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;gap:8px;font-size:14.5px;font-weight:700">${I.nav("#fff", 16)} Navigate</div>
        </div>
      </div>
    </div>
    <div style="font-size:12px;font-weight:800;color:var(--sec);letter-spacing:.5px;margin:20px 0 6px">LATER TODAY</div>
    ${laterRow("cathedral.jpg", "Manila Cathedral", "2:00 PM", "Intramuros, Manila")}
    ${laterRow("fortsantiago.jpg", "Fort Santiago", "3:30 PM", "Intramuros, Manila")}
    ${laterRow("manilabay.jpg", "Manila Bay sunset", "5:30 PM", "Roxas Blvd, Manila")}
  </div>
  <div class="pad" style="padding-bottom:20px;padding-top:6px">${cta("Open route map", I.nav("#fff", 18))}</div>
</div>`;

/* legacy itinerary kept for reference
screens._ItineraryOld = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:2px;display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">${I.cal()}<span class="sec" style="font-size:13.5px;font-weight:600">Sunday, Nov 9</span></div>
      <h1 class="h1" style="font-size:28px">Gion → Arashiyama</h1>
      <div class="sec" style="font-size:13px;font-weight:600;margin-top:6px">Kyoto · from Makati · Day 2</div>
    </div>
    ${weatherChip()}
  </div>
  <p class="pad sec" style="font-size:13.5px;font-weight:500;line-height:1.45;margin:12px 0 0">Bamboo groves and temple gardens, then a riverside lunch and an onsen back in town.</p>
  <div class="pad" style="margin-top:14px">${statRow([["5h 20m", "Avg Travel Time"], ["8 km", "Total Distance"], ["4 stops", "Planned Stops"]])}</div>
  <div class="pad" style="margin-top:12px">${aiTip('Golden hour at the bamboo grove is <b style="color:var(--ink)">7–8 AM</b>.')}</div>
  <div class="pad" style="margin-top:14px;display:flex;justify-content:space-between;align-items:center">
    <b style="font-size:17px;font-weight:800">Stops & Activities</b>
    <div class="chipbtn">${I.plus()} Add Stop</div>
  </div>
  <div style="flex:1;overflow:hidden;padding:12px 22px 0">
    ${stop("var(--orange)", I.coffee(), "Arabica — Arashiyama", "8:30 AM", "3-47 Sagatenryuji, Ukyo Ward", false, true)}
    ${stop("var(--green)", I.train(), "Bamboo Grove Walk", "9:30 AM", "Sagano, Ukyo Ward, Kyoto")}
    ${stop("var(--blue)", I.temple(), "Tenryū-ji Temple", "11:00 AM", "68 Sagatenryuji, Ukyo Ward")}
    ${stop("var(--purple)", I.food(), "Riverside lunch", "1:00 PM", "Arashiyama, Kyoto", true)}
  </div>
  <div class="pad" style="padding-bottom:18px;padding-top:4px">${cta("Start Route Map")}</div>
</div>`;
*/

// ---- RouteMap (Google Maps embed style — single marker, free "pin only" usage) ----
const gmap = `<svg width="390" height="620" viewBox="0 0 390 620" style="position:absolute;inset:0">
  <rect width="390" height="620" fill="#E8EAED"/>
  <path d="M-10 430 Q 110 396 210 440 T 400 452 L400 620 L-10 620Z" fill="#AADAF6"/>
  <rect x="34" y="120" width="128" height="96" rx="10" fill="#CDEBB0"/>
  <rect x="250" y="250" width="120" height="84" rx="10" fill="#CDEBB0"/>
  <g stroke="#FFFFFF" stroke-width="11" stroke-linecap="round"><path d="M-10 210 H400"/><path d="M-10 330 H400"/><path d="M120 -10 V500"/><path d="M270 -10 V470"/></g>
  <g stroke="#FCE8A6" stroke-width="7"><path d="M-10 270 H400"/><path d="M190 -10 V470"/></g>
  <path d="M96 452 C 132 384 122 330 190 300 S 268 236 296 176" stroke="#1A73E8" stroke-width="6" fill="none" stroke-linecap="round"/>
</svg>`;
screens.RouteMap = `<div class="frame">
  <div style="position:relative;flex:1;overflow:hidden">
    ${gmap}
    <!-- current location: blue dot + accuracy ring -->
    <div style="position:absolute;left:76px;top:432px;width:60px;height:60px;border-radius:50%;background:rgba(26,115,232,.16)"></div>
    <div style="position:absolute;left:96px;top:452px;width:18px;height:18px;border-radius:50%;background:#1A73E8;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>
    <!-- destination: google red pin -->
    <div style="position:absolute;left:280px;top:150px"><svg width="34" height="46" viewBox="0 0 24 34"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 22 12 22s12-13 12-22C24 5.4 18.6 0 12 0z" fill="#EA4335"/><circle cx="12" cy="12" r="4.6" fill="#fff"/></svg></div>
    <div class="safe" style="position:absolute;top:0;left:0"></div>
    <!-- top: back + search bar -->
    <div style="position:absolute;top:58px;left:18px;right:18px;display:flex;gap:10px">
      <div class="navbtn" style="width:46px;height:46px;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center">${I.back()}</div>
      <div style="flex:1;height:46px;border-radius:14px;background:#fff;box-shadow:0 4px 12px rgba(20,20,20,.14);display:flex;align-items:center;gap:10px;padding:0 14px">${I.search("#9B9A96", 18)}<span style="font-size:14px;font-weight:600">BGC → Old Manila route</span></div>
    </div>
    <div style="position:absolute;left:18px;bottom:20px;display:flex;flex-direction:column;background:#fff;border-radius:14px;box-shadow:0 4px 12px rgba(20,20,20,.14);overflow:hidden">
      <div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--line)">${I.plus()}</div>
      <div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center">${I.minus()}</div>
    </div>
    <div class="navbtn" style="position:absolute;right:18px;bottom:20px;width:46px;height:46px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center">${I.locate()}</div>
    <div style="position:absolute;left:10px;bottom:0;font-size:12px;font-weight:600;color:#5F6368;background:rgba(255,255,255,.72);padding:2px 6px;border-radius:4px">Google</div>
  </div>
  <div style="background:var(--bg);border-radius:26px 26px 0 0;margin-top:-22px;position:relative;padding:16px 22px 24px">
    <div style="width:40px;height:5px;border-radius:3px;background:#D6D4CF;margin:0 auto 14px"></div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
      <div style="width:44px;height:44px;border-radius:14px;background-image:url('museum.jpg');background-size:cover;background-position:center;flex-shrink:0"></div>
      <div style="flex:1"><div style="font-size:15px;font-weight:700">Next: National Museum</div><div class="sec" style="font-size:12.5px;font-weight:500">1.4 km · 6 min drive · arrive 12:30 PM</div></div>
    </div>
    <div style="display:flex;gap:10px">
      <div class="chipbtn" style="flex:1;height:52px;justify-content:center;border-radius:999px;gap:7px">${I.close("#E5484D", 16)}<span style="color:#E5484D">Cancel next</span></div>
      <div class="rbtn" style="flex:1.4;height:52px;border-radius:999px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;gap:8px;font-size:15px;font-weight:700">${I.nav("#fff", 17)} Start navigation</div>
    </div>
  </div>
</div>`;

// ---- PlaceDetail ----
const infoCard = (icon, label, value) => `<div class="card" style="flex:1;padding:13px 14px;display:flex;align-items:center;gap:10px">${icon}<div style="line-height:1.2"><div style="font-size:11px;color:var(--sec);font-weight:600">${label}</div><div style="font-size:14px;font-weight:700;margin-top:1px">${value}</div></div></div>`;
const review = (quote, author, withPhoto = false) => `<div style="display:flex;gap:12px;align-items:flex-start">
  <div style="flex:1"><p style="font-size:14px;font-style:italic;line-height:1.5;margin:0;color:#2C2B28">"${quote}"</p><div class="sec" style="font-size:12.5px;font-weight:600;margin-top:8px">— ${author}</div></div>
  ${withPhoto ? `<div style="width:64px;height:64px;border-radius:16px;flex-shrink:0;background-image:url('fortsantiago.jpg');background-size:cover;background-position:center"></div>` : ""}</div>`;
screens.PlaceDetail = `<div class="frame">
  <div style="height:252px;flex-shrink:0;position:relative;overflow:hidden;background-image:linear-gradient(180deg,rgba(0,0,0,.30),rgba(0,0,0,0) 32%),url('museum.jpg');background-size:cover;background-position:center">
    <div class="safe" style="position:absolute;top:0;left:0"></div>
    <div style="position:absolute;top:60px;left:20px;right:20px;display:flex;justify-content:space-between">
      <div class="navbtn" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center">${I.back()}</div>
      <div class="navbtn" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center">${I.dots3()}</div>
    </div>
    <div style="position:absolute;bottom:16px;left:0;right:0;display:flex;justify-content:center"><div class="dots"><i class="on" style="background:#fff"></i><i style="background:rgba(255,255,255,.6)"></i><i style="background:rgba(255,255,255,.6)"></i><i style="background:rgba(255,255,255,.6)"></i></div></div>
  </div>
  <div style="flex:1;overflow:hidden;padding:18px 22px 0">
    <h1 class="h1" style="font-size:26px">National Museum of Fine Arts</h1>
    <div style="display:flex;align-items:center;gap:6px;margin-top:10px">${I.pin("#9B9A96", 15)}<span class="sec" style="font-size:13.5px;font-weight:500">Padre Burgos Ave, Ermita, Manila</span></div>
    <div style="display:flex;gap:12px;margin-top:16px">
      ${infoCard(I.clock("#191A1C", 18), "Opening Hours", "9 AM – 6 PM · Tue–Sun")}
      ${infoCard(I.peso(), "Entry", "Free")}
    </div>
    <p class="sec" style="font-size:14px;font-weight:500;line-height:1.5;margin:14px 0 0">The old Legislative Building, now home to Juan Luna's Spoliarium and the country's finest classical art.</p>
    <div style="margin-top:12px">${aiTip('Quietest <b style="color:var(--ink)">right at opening (9 AM)</b>. Allow about 90 minutes for the main galleries.')}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px"><b style="font-size:17px;font-weight:800">Reviews</b><div style="display:flex;align-items:center;gap:4px"><span class="sec" style="font-size:13px;font-weight:700">See more</span>${I.chevR("#9B9A96", 15)}</div></div>
    <div style="margin-top:12px;display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:center;gap:4px">${[0, 0, 0, 0, 0].map(() => I.star()).join("")}<span style="font-size:13px;font-weight:700;margin-left:6px">4.8</span><span class="sec" style="font-size:12.5px;font-weight:500;margin-left:2px">· 2,140 reviews</span></div>
      ${review("Spoliarium in person is breathtaking — and it's free. Give yourself time to linger.", "Ella K., Jan 2026", true)}
    </div>
  </div>
  <div style="padding:8px 18px 24px;background:var(--bg)">
    <div class="softsh" style="background:var(--card);border-radius:28px;padding:12px 12px 12px 20px;display:flex;align-items:center;gap:14px">
      <div style="flex:1;min-width:0">
        <div style="font-size:16px;font-weight:800">You're at the Museum</div>
        <div class="sec" style="font-size:12px;font-weight:500">Confirm to complete this stop.<span style="color:var(--ter)"> · Tickets — soon</span></div>
      </div>
      <div style="height:54px;border-radius:27px;background:var(--primary);color:#fff;display:flex;align-items:center;gap:9px;padding:0 22px;font-size:15px;font-weight:700;box-shadow:0 10px 20px rgba(23,24,26,.26)">${I.check("#fff")} I'm here</div>
    </div>
  </div>
</div>`;

// ---- shared components for ecosystem screens ----
const tabbar = (active) => `<div style="height:76px;flex-shrink:0;background:var(--card);border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-around;padding:6px 8px 12px">
  ${[["Home", I.home], ["Trips", I.compass], ["Alerts", I.bell], ["Profile", I.user]].map(([l, ic]) => { const on = l === active; const c = on ? "var(--ink)" : "#B7B5B0"; return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">${ic(c, 24)}<span style="font-size:10.5px;font-weight:${on ? "800" : "600"};color:${c}">${l}</span></div>`; }).join("")}
</div>`;
const toggle = (on) => `<div style="width:46px;height:28px;border-radius:14px;background:${on ? "var(--primary)" : "#D9D7D3"};position:relative;flex-shrink:0"><div style="position:absolute;top:3px;${on ? "right:3px" : "left:3px"};width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.2)"></div></div>`;
const listRow = (icon, title, sub, trail, last = false) => `<div style="display:flex;align-items:center;gap:14px;padding:13px 0${last ? "" : ";border-bottom:1px solid var(--line)"}">
  <div style="width:40px;height:40px;border-radius:13px;background:var(--bg);display:flex;align-items:center;justify-content:center;flex-shrink:0">${icon}</div>
  <div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:700">${title}</div>${sub ? `<div class="sec" style="font-size:12.5px;font-weight:500;margin-top:1px">${sub}</div>` : ""}</div>
  ${trail || I.chevR("#C3C1BC", 16)}
</div>`;
const tripRow = (img, name, dates, status, sc, last = false) => `<div style="display:flex;align-items:center;gap:13px;padding:11px 0${last ? "" : ";border-bottom:1px solid var(--line)"}">
  <div style="width:56px;height:56px;border-radius:16px;background-image:url('${img}');background-size:cover;background-position:center;flex-shrink:0"></div>
  <div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:700">${name}</div><div class="sec" style="font-size:12.5px;font-weight:500;margin-top:2px">${dates}</div></div>
  <span style="font-size:10px;font-weight:800;color:${sc};background:${sc}1f;padding:4px 9px;border-radius:999px">${status}</span>
</div>`;
const notifRow = (chip, title, sub, time, last = false) => `<div style="display:flex;gap:13px;padding:14px 0${last ? "" : ";border-bottom:1px solid var(--line)"}">
  ${chip}
  <div style="flex:1;min-width:0"><div style="font-size:14.5px;font-weight:700;line-height:1.3">${title}</div><div class="sec" style="font-size:12.5px;font-weight:500;margin-top:3px;line-height:1.35">${sub}</div></div>
  <span class="sec" style="font-size:11px;font-weight:600;flex-shrink:0">${time}</span>
</div>`;

// ---- Home / My Trips ----
screens.Home = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:4px;display:flex;align-items:center;gap:12px">
    <div style="width:46px;height:46px;border-radius:16px;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px">KL</div>
    <div style="flex:1"><div class="sec" style="font-size:12.5px;font-weight:600">Good morning</div><div style="font-size:19px;font-weight:800;letter-spacing:-.3px">Kline</div></div>
    <div style="width:46px;height:46px;border-radius:16px;background:var(--card);box-shadow:0 6px 16px rgba(20,20,20,.08);display:flex;align-items:center;justify-content:center;position:relative">${I.bell()}<span style="position:absolute;top:11px;right:12px;width:9px;height:9px;border-radius:50%;background:#E5484D;border:2px solid #fff"></span></div>
  </div>
  <div style="flex:1;overflow:hidden;padding-top:16px">
    <div class="pad" style="font-size:12px;font-weight:800;color:var(--sec);letter-spacing:.5px;margin-bottom:10px">UPCOMING</div>
    <div class="pad">
      <div class="softsh" style="border-radius:28px;overflow:hidden;position:relative;height:196px;background-image:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.62)),url('bgc.jpg');background-size:cover;background-position:center">
        <div style="position:absolute;top:14px;left:14px;background:rgba(255,255,255,.92);border-radius:999px;padding:5px 12px;font-size:10.5px;font-weight:800;letter-spacing:.4px">DAY 4 OF 12</div>
        <div style="position:absolute;left:18px;right:18px;bottom:16px;color:#fff">
          <div style="font-size:23px;font-weight:800;letter-spacing:-.4px">BGC + Manila</div>
          <div style="font-size:12.5px;font-weight:600;opacity:.9;margin-top:2px">from Avida, BGC · Aug 26 – Sep 6</div>
          <div style="margin-top:12px;display:flex;align-items:center;gap:12px">
            <div style="flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.32)"><div style="width:38%;height:6px;border-radius:3px;background:#fff"></div></div>
            <div style="background:#fff;color:var(--ink);border-radius:999px;padding:8px 18px;font-size:13px;font-weight:800;box-shadow:0 6px 14px rgba(0,0,0,.22)">Open</div>
          </div>
        </div>
      </div>
    </div>
    <div class="pad" style="margin-top:18px"><div class="cta" style="height:54px;gap:9px">${I.spark("#fff", 18)} Plan a new trip</div></div>
    <div class="pad" style="margin-top:22px;display:flex;justify-content:space-between;align-items:center"><b style="font-size:16px;font-weight:800">Your trips</b><span class="sec" style="font-size:13px;font-weight:700">See all</span></div>
    <div class="pad" style="margin-top:6px"><div class="card" style="padding:4px 16px;border-radius:24px">
      ${tripRow("bgc.jpg", "BGC + Manila", "Aug 26 – Sep 6, 2026", "ACTIVE", "#1E8A50")}
      ${tripRow("manilabay.jpg", "Iloilo family visit", "Sep 4 – 6", "UPCOMING", "#9B9A96", true)}
    </div></div>
  </div>
  ${tabbar("Home")}
</div>`;

// ---- Trip Overview ----
const dayRow = (img, badge, theme, meta, state) => `<div style="display:flex;align-items:center;gap:13px;padding:12px;border-radius:20px;${state === "today" ? "background:var(--card);box-shadow:0 8px 20px rgba(20,20,20,.07)" : ""}">
  <div style="width:52px;height:52px;border-radius:15px;background-image:url('${img}');background-size:cover;background-position:center;flex-shrink:0;position:relative">${state === "done" ? `<div style="position:absolute;inset:0;border-radius:15px;background:rgba(23,24,26,.5);display:flex;align-items:center;justify-content:center">${I.check("#fff", 20)}</div>` : ""}</div>
  <div style="flex:1;min-width:0">
    <div style="display:flex;align-items:center;gap:8px"><span style="font-size:11px;font-weight:800;color:var(--sec)">${badge}</span>${state === "today" ? '<span style="font-size:9.5px;font-weight:800;color:#1E8A50;background:#E7F6EE;padding:2px 7px;border-radius:999px">TODAY</span>' : ""}</div>
    <div style="font-size:15px;font-weight:700;margin-top:2px">${theme}</div>
    <div class="sec" style="font-size:12px;font-weight:500;margin-top:2px">${meta}</div>
  </div>
  ${I.chevR("#C3C1BC", 16)}
</div>`;
screens.TripOverview = `<div class="frame">
  <div style="height:236px;flex-shrink:0;position:relative;overflow:hidden;background-image:linear-gradient(180deg,rgba(0,0,0,.32),rgba(0,0,0,0) 30%,rgba(0,0,0,.55)),url('bgc.jpg');background-size:cover;background-position:center">
    <div class="safe" style="position:absolute;top:0;left:0"></div>
    <div style="position:absolute;top:58px;left:20px;right:20px;display:flex;justify-content:space-between">
      <div class="navbtn" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center">${I.back()}</div>
      <div class="navbtn" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center">${I.share("#191A1C", 19)}</div>
    </div>
    <div style="position:absolute;left:22px;right:22px;bottom:18px;color:#fff">
      <div style="font-size:12.5px;font-weight:700;opacity:.9">Balanced Couple Week · from Avida, BGC</div>
      <div style="font-size:28px;font-weight:800;letter-spacing:-.6px;margin-top:3px">BGC + Manila</div>
    </div>
  </div>
  <div style="flex:1;overflow:hidden;padding:18px 22px 0">
    ${statRow([["12 days", "Duration"], ["Aug 26–Sep 6", "Dates"], ["₱19–34k", "Est. budget"]])}
    <div style="margin-top:20px;display:flex;justify-content:space-between;align-items:center"><b style="font-size:17px;font-weight:800">Itinerary</b><span class="sec" style="font-size:13px;font-weight:700">this week</span></div>
    <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px">
      ${dayRow("city.jpg", "DAY 3 · FRI AUG 28", "Proper date night in BGC", "3 stops · all done", "done")}
      ${dayRow("museum.jpg", "DAY 4 · SAT AUG 29", "Old Manila day", "4 stops · 1 done", "today")}
      ${dayRow("bgc.jpg", "DAY 5 · SUN AUG 30", "Makati & relaxation", "4 stops", "")}
    </div>
  </div>
  <div class="pad" style="padding-bottom:24px;padding-top:8px">${cta("View today's route")}</div>
</div>`;

// ---- Notifications / Reminders inbox ----
screens.Notifications = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:4px;display:flex;align-items:center;justify-content:space-between">
    <h1 class="h1" style="font-size:28px">Alerts</h1>
    <div style="width:44px;height:44px;border-radius:14px;background:var(--card);box-shadow:0 6px 16px rgba(20,20,20,.08);display:flex;align-items:center;justify-content:center">${I.gear("#191A1C", 21)}</div>
  </div>
  <div style="flex:1;overflow:hidden;padding-top:16px">
    <div class="pad" style="font-size:12px;font-weight:800;color:var(--sec);letter-spacing:.5px;margin-bottom:6px">TODAY</div>
    <div class="pad"><div class="card" style="padding:2px 16px;border-radius:24px">
      ${notifRow(`<div class="iconchip" style="background:var(--blue)">${I.temple("#fff")}</div>`, "Leave in 1 hour — Manila Cathedral", "Arrive 2:00 PM · ~6 min walk across Intramuros.", "now")}
      ${notifRow(`<div class="orb" style="width:40px;height:40px"></div>`, "Tip: Fort Santiago is best near sunset", "You're ahead of schedule — save it for later.", "12m")}
      ${notifRow(`<div class="iconchip" style="background:#E7F6EE">${I.checkC("#34B87E", 22)}</div>`, "Checked in at National Museum", "Stop marked complete in your timeline.", "1h", true)}
    </div></div>
    <div class="pad" style="font-size:12px;font-weight:800;color:var(--sec);letter-spacing:.5px;margin:20px 0 6px">EARLIER</div>
    <div class="pad"><div class="card" style="padding:2px 16px;border-radius:24px">
      ${notifRow(`<div class="iconchip" style="background:var(--purple)">${I.food("#fff")}</div>`, "15 min before — Lunch in Intramuros", "Wrap up at the museum and head to Casa Manila.", "Yst")}
      ${notifRow(`<div class="iconchip" style="background:var(--orange)">${I.coffee("#fff")}</div>`, "1 hour before — Old Manila day", "Grab to the National Museum for 9:00 AM.", "Yst", true)}
    </div></div>
  </div>
  ${tabbar("Alerts")}
</div>`;

// ---- Reminder Settings ----
const intervalRow = (label, sub, on, last = false) => `<div style="display:flex;align-items:center;gap:14px;padding:14px 0${last ? "" : ";border-bottom:1px solid var(--line)"}">
  <div style="width:40px;height:40px;border-radius:13px;background:var(--bg);display:flex;align-items:center;justify-content:center;flex-shrink:0">${I.bell(on ? "var(--ink)" : "#B7B5B0", 19)}</div>
  <div style="flex:1"><div style="font-size:15px;font-weight:700">${label}</div><div class="sec" style="font-size:12px;font-weight:500;margin-top:1px">${sub}</div></div>
  ${toggle(on)}
</div>`;
screens.ReminderSettings = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:4px;display:flex;align-items:center;gap:14px">${I.back()}<b style="font-size:18px;font-weight:800">Reminders</b></div>
  <div style="flex:1;overflow:hidden;padding-top:18px">
    <p class="pad sec" style="font-size:14px;font-weight:500;line-height:1.5;margin:0">We'll nudge you before each stop so you're never rushing to your next engagement.</p>
    <div class="pad" style="margin-top:14px;font-size:12px;font-weight:800;color:var(--sec);letter-spacing:.5px;margin-bottom:8px">REMIND ME BEFORE EACH STOP</div>
    <div class="pad"><div class="card" style="padding:2px 16px;border-radius:24px">
      ${intervalRow("1 hour before", "Time to prepare and head out", true)}
      ${intervalRow("15 minutes before", "Final heads-up", true)}
      ${intervalRow("30 minutes before", "Optional extra nudge", false)}
      <div style="display:flex;align-items:center;gap:12px;padding:14px 0"><div style="width:40px;height:40px;border-radius:13px;background:var(--bg);display:flex;align-items:center;justify-content:center">${I.plus("#191A1C", 18)}</div><span style="font-size:14.5px;font-weight:700;color:var(--sec)">Add a custom interval</span></div>
    </div></div>
    <div class="pad" style="margin-top:14px;font-size:12px;font-weight:800;color:var(--sec);letter-spacing:.5px;margin-bottom:8px">OPTIONS</div>
    <div class="pad"><div class="card" style="padding:2px 16px;border-radius:24px">
      ${listRow(I.nav("#191A1C", 19), "Travel-time aware", "Adds your Grab / transit time", toggle(true))}
      ${listRow(I.bell("#191A1C", 19), "Sound & vibration", "Play a chime with each alert", toggle(true), true)}
    </div></div>
    <div class="pad"><div class="aitip" style="margin-top:12px"><div class="orb"></div><div style="font-size:13px;font-weight:500;color:var(--sec);line-height:1.4">You'll be reminded <b style="color:var(--ink)">1 hour</b> and <b style="color:var(--ink)">15 minutes</b> before each stop.</div></div></div>
  </div>
  <div class="pad" style="padding-bottom:24px;padding-top:8px">${cta("Save reminders", I.check("#fff"))}</div>
</div>`;

// ---- Push notification (lock screen) ----
const pushBanner = (icon, title, body, time) => `<div style="background:rgba(255,255,255,.78);backdrop-filter:blur(14px);border-radius:24px;padding:14px;display:flex;gap:12px;box-shadow:0 8px 24px rgba(0,0,0,.18)">
  <div style="width:40px;height:40px;border-radius:11px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--primary)">${icon}</div>
  <div style="flex:1;min-width:0">
    <div style="display:flex;justify-content:space-between"><span style="font-size:12px;font-weight:800">Wayfare</span><span style="font-size:11px;color:#6B6B6B;font-weight:600">${time}</span></div>
    <div style="font-size:14px;font-weight:800;margin-top:2px">${title}</div>
    <div style="font-size:12.5px;color:#33322F;font-weight:500;margin-top:2px;line-height:1.35">${body}</div>
  </div>
</div>`;
screens.PushBanner = `<div class="frame" style="background-image:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.55)),url('city.jpg');background-size:cover;background-position:center">
  <div style="height:96px;flex-shrink:0"></div>
  <div style="text-align:center;color:#fff">
    <div style="font-size:15px;font-weight:600;opacity:.9">Saturday, August 29</div>
    <div style="font-size:80px;font-weight:700;letter-spacing:-2px;line-height:1;margin-top:2px">13:00</div>
  </div>
  <div style="flex:1"></div>
  <div style="padding:0 16px 40px;display:flex;flex-direction:column;gap:10px">
    ${pushBanner(I.temple("#fff", 20), "Leave in 1 hour — Manila Cathedral", "Arrive 2:00 PM. About 6 min walk across Intramuros.", "now")}
    ${pushBanner(I.food("#fff", 20), "15 min before — Lunch at Casa Manila", "Head over from the National Museum to make your 1:00 PM table.", "12:45 PM")}
  </div>
</div>`;

// ---- Profile / Settings ----
screens.Profile = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:4px;display:flex;align-items:center;justify-content:space-between"><h1 class="h1" style="font-size:28px">Profile</h1><div style="width:44px;height:44px;border-radius:14px;background:var(--card);box-shadow:0 6px 16px rgba(20,20,20,.08);display:flex;align-items:center;justify-content:center">${I.edit("#191A1C", 19)}</div></div>
  <div style="flex:1;overflow:hidden;padding-top:16px">
    <div class="pad" style="display:flex;align-items:center;gap:15px">
      <div style="width:66px;height:66px;border-radius:22px;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:22px">KL</div>
      <div><div style="font-size:19px;font-weight:800">Kline Lozada</div><div class="sec" style="font-size:13px;font-weight:500;margin-top:2px">klinelozada@gmail.com</div></div>
    </div>
    <div class="pad" style="margin-top:22px;font-size:12px;font-weight:800;color:var(--sec);letter-spacing:.5px;margin-bottom:6px">TRAVEL</div>
    <div class="pad"><div class="card" style="padding:2px 16px;border-radius:24px">
      ${listRow(I.pin("#191A1C", 19), "Home base", "Makati, Metro Manila", `<span class="sec" style="font-size:13px;font-weight:600">Edit</span>`)}
      ${listRow(I.wallet("#191A1C", 19), "Currency", "Philippine Peso (₱)", I.chevR("#C3C1BC", 16))}
      ${listRow(I.bell("#191A1C", 19), "Reminders", "1 hour & 15 min before", I.chevR("#C3C1BC", 16), true)}
    </div></div>
    <div class="pad" style="margin-top:18px;font-size:12px;font-weight:800;color:var(--sec);letter-spacing:.5px;margin-bottom:6px">APP</div>
    <div class="pad"><div class="card" style="padding:2px 16px;border-radius:24px">
      ${listRow(I.moon("#191A1C", 19), "Dark mode", "", toggle(false))}
      ${listRow(I.globe("#191A1C", 19), "About Wayfare", "", I.chevR("#C3C1BC", 16))}
      ${listRow(I.logout("#E5484D", 19), `<span style="color:#E5484D">Sign out</span>`, "", `<span></span>`, true)}
    </div></div>
  </div>
  ${tabbar("Profile")}
</div>`;

// ---- Calendar (Gantt-style day schedule with blocked work time) ----
const HR = 34, T0 = 6; // px per hour, start hour
const y = (h) => (h - T0) * HR;
const block = (t1, t2, title, sub, kind) => {
  const c = kind === "work" ? { bg: "#E4E2DE", bar: "#B7B5B0", tx: "var(--sec)" } : kind === "travel" ? { bg: "#FBF1DF", bar: "#E0A94E", tx: "#8A5A18" } : { bg: "#E8F0FB", bar: "#3E97E5", tx: "#1E5E9E" };
  return `<div style="position:absolute;left:56px;right:12px;top:${y(t1)}px;height:${y(t2) - y(t1)}px;background:${c.bg};border-radius:12px;padding:8px 10px 8px 12px;overflow:hidden;border-left:none">
    <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${c.bar}"></div>
    <div style="font-size:13px;font-weight:800;color:${c.tx}">${title}</div><div style="font-size:11px;font-weight:600;color:${c.tx};opacity:.8;margin-top:1px">${sub}</div></div>`;
};
const dayPip = (d, n, on) => `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1"><span style="font-size:11px;font-weight:700;color:${on ? "#fff" : "var(--sec)"}">${d}</span><div style="width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;${on ? "background:var(--primary);color:#fff" : "color:var(--ink)"}">${n}</div></div>`;
screens.Calendar = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:2px;display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:14px">${I.back()}<b style="font-size:18px;font-weight:800">Schedule</b></div><span class="sec" style="font-size:13px;font-weight:700">August 2026</span></div>
  <div class="pad" style="margin-top:16px;display:flex;gap:4px">${dayPip("WED", 26)}${dayPip("THU", 27, true)}${dayPip("FRI", 28)}${dayPip("SAT", 29)}${dayPip("SUN", 30)}${dayPip("MON", 31)}</div>
  <div class="pad" style="margin-top:14px;display:flex;gap:14px">
    <div style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:#B7B5B0"></span><span class="sec" style="font-size:11.5px;font-weight:600">Work · blocked</span></div>
    <div style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:#3E97E5"></span><span class="sec" style="font-size:11.5px;font-weight:600">Activity</span></div>
    <div style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:#E0A94E"></span><span class="sec" style="font-size:11.5px;font-weight:600">Travel</span></div>
  </div>
  <div style="flex:1;overflow:hidden;margin-top:12px;position:relative">
    ${Array.from({ length: 9 }, (_, i) => T0 + i * 2).map((h) => `<div style="position:absolute;left:0;right:12px;top:${y(h)}px;height:1px;background:var(--line)"></div><div style="position:absolute;left:14px;top:${y(h) - 7}px;font-size:11px;font-weight:600;color:var(--ter)">${h > 12 ? h - 12 : h} ${h >= 12 ? "PM" : "AM"}</div>`).join("")}
    ${block(7, 16, "Work", "7:00 AM – 4:00 PM · blocked", "work")}
    ${block(16.25, 17, "Home & change", "Grab · ~20 min", "travel")}
    ${block(17.5, 19.5, "BGC High Street dinner", "Bonifacio High Street", "act")}
    ${block(19.5, 21, "Dessert & walk", "Burgos Circle", "act")}
  </div>
</div>`;

// ---- Commitments / availability (work blocks, engagements, stay-up-late) ----
screens.Commitments = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:2px;display:flex;align-items:center;gap:14px">${I.back()}<b style="font-size:18px;font-weight:800">Availability</b></div>
  <div style="flex:1;overflow:hidden;padding-top:16px">
    <p class="pad sec" style="font-size:14px;font-weight:500;line-height:1.5;margin:0">Tell us when you're busy — AI plans around it and never double-books your time.</p>
    <div class="pad" style="margin-top:16px;font-size:12px;font-weight:800;color:var(--sec);letter-spacing:.5px;margin-bottom:8px">RECURRING</div>
    <div class="pad"><div class="card" style="padding:14px 16px;border-radius:24px">
      <div style="display:flex;align-items:center;gap:13px">
        <div style="width:40px;height:40px;border-radius:13px;background:var(--bg);display:flex;align-items:center;justify-content:center">${I.brief("#191A1C", 20)}</div>
        <div style="flex:1"><div style="font-size:15px;font-weight:700">Work</div><div class="sec" style="font-size:12.5px;font-weight:500;margin-top:1px">7:00 AM – 4:00 PM</div></div>${toggle(true)}
      </div>
      <div style="display:flex;gap:6px;margin-top:12px">${["M", "T", "W", "T", "F", "S", "S"].map((d, i) => `<div style="flex:1;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:800;${i < 5 ? "background:var(--primary);color:#fff" : "background:var(--bg);color:var(--ter)"}">${d}</div>`).join("")}</div>
    </div></div>
    <div class="pad" style="margin-top:16px;font-size:12px;font-weight:800;color:var(--sec);letter-spacing:.5px;margin-bottom:8px">THIS TRIP</div>
    <div class="pad"><div class="card" style="padding:2px 16px;border-radius:24px">
      ${listRow(I.calClock("#191A1C", 19), "Family dinner", "Fri, Sep 4 · 7:00 PM", `<span class="sec" style="font-size:13px;font-weight:700">Edit</span>`)}
      <div style="display:flex;align-items:center;gap:12px;padding:13px 0"><div style="width:40px;height:40px;border-radius:13px;background:var(--bg);display:flex;align-items:center;justify-content:center">${I.plus("#191A1C", 18)}</div><span style="font-size:14.5px;font-weight:700;color:var(--sec)">Add an engagement</span></div>
    </div></div>
    <div class="pad" style="margin-top:16px;font-size:12px;font-weight:800;color:var(--sec);letter-spacing:.5px;margin-bottom:8px">PLANNING WINDOW</div>
    <div class="pad"><div class="card" style="padding:2px 16px;border-radius:24px">
      ${listRow(I.clock("#191A1C", 19), "Weekday activities", "5:00 PM – 11:00 PM", I.chevR("#C3C1BC", 16))}
      ${listRow(I.moon("#191A1C", 19), "Stay up late", "Allow plans past 11:00 PM", toggle(false), true)}
    </div></div>
  </div>
  <div class="pad" style="padding-bottom:22px;padding-top:8px">${cta("Save availability", I.check("#fff"))}</div>
</div>`;

// ================= P1 gap pages =================

// ---- Onboarding slides 2 & 3 ----
const onb = (dotIdx, illo, head, sub, btn) => `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="display:flex;justify-content:flex-end;padding-top:6px"><span style="font-size:15px;font-weight:600;color:var(--sec)">Skip</span></div>
  <div class="pad" style="margin-top:10px"><div class="card" style="height:320px;border-radius:26px;overflow:hidden;position:relative;box-shadow:0 12px 30px rgba(20,20,20,.07);display:flex;align-items:center;justify-content:center">
    <div style="position:absolute;inset:0;background:linear-gradient(160deg,#F4F3F1,#E7E5E1)"></div>${illo}</div></div>
  <div class="pad a-pop" style="margin-top:34px;animation-delay:.1s"><h1 style="font-size:32px;font-weight:800;letter-spacing:-.8px;line-height:1.1;margin:0">${head}</h1>
    <p style="font-size:16px;color:var(--sec);font-weight:500;line-height:1.5;margin:14px 0 0">${sub}</p></div>
  <div style="flex:1"></div>
  <div class="pad" style="padding-bottom:46px;display:flex;align-items:center;justify-content:space-between">
    <div class="dots">${[0, 1, 2].map((i) => `<i class="${i === dotIdx ? "on" : ""}"></i>`).join("")}</div>
    <div class="cta" style="width:${btn.length > 8 ? 180 : 150}px">${btn}<div class="knob">${I.arrow()}</div></div>
  </div>
</div>`;
screens.OnboardingB = onb(1,
  `<div style="position:relative;width:250px;display:flex;flex-direction:column;gap:12px">
    <div class="card" style="border-radius:18px;overflow:hidden;padding:0"><div style="height:96px;background-image:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.5)),url('museum.jpg');background-size:cover;background-position:center;position:relative"><span style="position:absolute;left:10px;bottom:8px;color:#fff;font-size:13px;font-weight:800">National Museum</span></div>
      <div style="padding:11px 12px;display:flex;align-items:center;gap:8px">${I.nav("#191A1C", 15)}<span style="font-size:13px;font-weight:800">1.4 km · 6 min</span><span class="sec" style="font-size:11px;font-weight:500">from you</span></div></div>
    <div style="display:flex;gap:8px"><span style="flex:1;background:#FBF1DF;color:#8A5A18;border-radius:999px;padding:7px 0;text-align:center;font-size:11.5px;font-weight:800">Travel ₱120</span><span style="flex:1;background:#E7F6F9;color:#0E7490;border-radius:999px;padding:7px 0;text-align:center;font-size:11.5px;font-weight:800">Food ₱600–1.1k</span></div>
  </div>`,
  "Mapped, timed<br>&amp; costed",
  "Every stop shows the travel time from where you are, a cost range, and a pin you can open in Maps.",
  "Next");
screens.OnboardingC = onb(2,
  `<div style="position:relative;width:250px">
    <div class="card" style="border-radius:18px;padding:14px">
      <div style="font-size:11px;font-weight:800;color:var(--sec);letter-spacing:.4px;margin-bottom:10px">THURSDAY</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;align-items:center;gap:10px"><span class="mono" style="font-size:10.5px;color:var(--ter);width:38px">7–4</span><div style="flex:1;height:26px;border-radius:8px;background:#E4E2DE;display:flex;align-items:center;padding:0 10px;font-size:11px;font-weight:800;color:var(--sec)">Work · blocked</div></div>
        <div style="display:flex;align-items:center;gap:10px"><span class="mono" style="font-size:10.5px;color:var(--ter);width:38px">5:30</span><div style="flex:1;height:26px;border-radius:8px;background:#E8F0FB;display:flex;align-items:center;padding:0 10px;font-size:11px;font-weight:800;color:#1E5E9E">High Street dinner</div></div>
        <div style="display:flex;align-items:center;gap:10px"><span class="mono" style="font-size:10.5px;color:var(--ter);width:38px">7:30</span><div style="flex:1;height:26px;border-radius:8px;background:#EEF0F3;display:flex;align-items:center;padding:0 10px;font-size:11px;font-weight:800;color:var(--sec)">Dessert &amp; walk</div></div>
      </div>
    </div>
  </div>`,
  "Around your<br>real life",
  "Block your work hours and commitments — Wayfare plans everything else so nothing overlaps, and nudges you before each stop.",
  "Get started");

// ---- Permission priming (location + notifications) ----
const priming = (icon, iconBg, title, body, primary, ghost, note, bgImg) => `<div class="frame" style="align-items:center;justify-content:center;padding:0 30px;text-align:center;position:relative;overflow:hidden">
  <div class="kb" style="position:absolute;inset:0;background-image:url('${bgImg}');background-size:cover;background-position:center;opacity:.5"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(236,235,232,.7),rgba(236,235,232,.94) 55%,var(--bg))"></div>
  <div style="position:relative;width:96px;height:96px;border-radius:30px;background:${iconBg};display:flex;align-items:center;justify-content:center;box-shadow:0 14px 34px rgba(20,20,20,.14);animation:springIn .7s cubic-bezier(.2,.9,.3,1.25) both">${icon}</div>
  <h1 class="h1 a-pop" style="font-size:28px;margin-top:28px;animation-delay:.15s;position:relative">${title}</h1>
  <p class="sec a-pop" style="font-size:15px;font-weight:500;line-height:1.55;margin:12px 0 0;animation-delay:.25s;max-width:300px;position:relative">${body}</p>
  <div class="a-pop" style="width:100%;margin-top:30px;animation-delay:.35s;position:relative">${cta(primary)}</div>
  <div style="height:52px;display:flex;align-items:center;justify-content:center;margin-top:6px;position:relative"><span style="font-size:15px;font-weight:700;color:var(--sec)">${ghost}</span></div>
  <p class="sec" style="font-size:12.5px;font-weight:500;margin:2px 0 0;position:relative">${note}</p>
</div>`;
screens.PermissionLocation = priming(I.pin("#3E97E5", 44), "#E7F1FB", "Find what's<br>near you", "Wayfare uses your location to show live distance and time to your next stop — and to check you in when you arrive.", "Allow location", "Not now", "You can change this anytime in Settings.", "city.jpg");
screens.PermissionNotifications = priming(I.bell("#8B7CF0", 42), "#EDE9FB", "Never miss<br>a moment", "We'll remind you 1 hour and 15 minutes before each stop, so you're never rushing to your next place.", "Turn on reminders", "Maybe later", "Only trip reminders — no spam, ever.", "bgc.jpg");

// ---- Forgot password ----
screens.ForgotPassword = `<div class="frame">
  <div style="height:170px;flex-shrink:0;position:relative;overflow:hidden;background-image:linear-gradient(180deg,rgba(0,0,0,.24),rgba(0,0,0,.58)),url('manilabay.jpg');background-size:cover;background-position:center">
    <div class="safe" style="position:absolute;top:0;left:0"></div>
    <div class="navbtn" style="position:absolute;top:56px;left:22px;width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center">${I.back()}</div>
    <div style="position:absolute;left:22px;right:22px;bottom:16px;color:#fff">
      <h1 style="font-size:29px;font-weight:800;letter-spacing:-.5px;margin:0">Reset your password</h1>
      <p style="font-size:14px;font-weight:500;color:rgba(255,255,255,.85);margin:6px 0 0">We'll send a link to set a new one.</p>
    </div>
  </div>
  <div class="pad" style="margin-top:26px"><div class="label">Email</div><div class="field">${I.mail()}<input type="email" value="klinelozada@gmail.com"></div></div>
  <div class="pad" style="margin-top:24px">${cta("Send reset link", I.mail("#fff", 18))}</div>
  <div class="pad" style="margin-top:18px"><div class="aitip" style="border-radius:18px"><div class="orb"></div><div style="font-size:13px;font-weight:500;color:var(--sec);line-height:1.4">We'll email a secure link to <b style="color:var(--ink)">reset your password</b> — it expires in 30 minutes.</div></div></div>
  <div style="flex:1"></div>
  <div class="pad" style="padding-bottom:40px;text-align:center;font-size:14px;color:var(--sec)">Remembered it? <b style="color:var(--ink)">Back to log in</b></div>
</div>`;

// ---- Home empty state ----
const methodMini = (icon, label) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:8px"><div style="width:52px;height:52px;border-radius:18px;background:var(--card);box-shadow:0 6px 16px rgba(20,20,20,.08);display:flex;align-items:center;justify-content:center">${icon}</div><span style="font-size:12px;font-weight:700;color:var(--sec)">${label}</span></div>`;
screens.HomeEmpty = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:4px;display:flex;align-items:center;gap:12px">
    <div style="width:46px;height:46px;border-radius:16px;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px">KL</div>
    <div style="flex:1"><div class="sec" style="font-size:12.5px;font-weight:600">Good morning</div><div style="font-size:19px;font-weight:800;letter-spacing:-.3px">Kline</div></div>
    <div class="navbtn" style="width:46px;height:46px;border-radius:16px;background:var(--card);display:flex;align-items:center;justify-content:center">${I.bell()}</div>
  </div>
  <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 30px;text-align:center;position:relative">
    <div class="kb" style="position:absolute;inset:0;background-image:url('manilabay.jpg');background-size:cover;background-position:center;opacity:.4"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(236,235,232,.78),rgba(236,235,232,.95))"></div>
    <div style="position:relative;width:100px;height:100px;border-radius:32px;overflow:hidden;box-shadow:0 16px 36px rgba(20,20,20,.16);animation:springIn .7s cubic-bezier(.2,.9,.3,1.25) both;background-image:url('bgc.jpg');background-size:cover;background-position:center"></div>
    <h1 class="h1 a-pop" style="font-size:26px;margin-top:24px;animation-delay:.15s;position:relative">No trips yet</h1>
    <p class="sec a-pop" style="font-size:15px;font-weight:500;line-height:1.5;margin:10px 0 0;animation-delay:.25s;max-width:290px;position:relative">Plan your first trip in a couple of minutes — from your doorstep to anywhere.</p>
    <div class="a-pop" style="display:flex;gap:16px;margin-top:26px;width:100%;max-width:300px;animation-delay:.35s;position:relative">${methodMini(`<div class="orb" style="width:26px;height:26px"></div>`, "Chat AI")}${methodMini(I.wand("#191A1C", 22), "Build")}${methodMini(I.file("#191A1C", 20), "Import")}</div>
  </div>
  <div class="pad" style="padding-bottom:16px">${cta("Plan a trip", I.spark("#fff", 18))}</div>
  ${tabbar("Home")}
</div>`;

// ---- Place search (reused: destination, must-dos, add stop, home base) ----
const placeRow = (name, area, dist, last) => `<div style="display:flex;align-items:center;gap:13px;padding:13px 0${last ? "" : ";border-bottom:1px solid var(--line)"}">
  <div style="width:42px;height:42px;border-radius:13px;background:var(--bg);display:flex;align-items:center;justify-content:center;flex-shrink:0">${I.pin("#6E635B", 19)}</div>
  <div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:700">${name}</div><div class="sec" style="font-size:12.5px;font-weight:500;margin-top:1px">${area}</div></div>
  <span class="sec mono" style="font-size:12px;font-weight:600">${dist}</span></div>`;
screens.PlaceSearch = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:4px;display:flex;align-items:center;gap:12px">
    ${I.back()}
    <div class="field" style="flex:1;height:48px;border-radius:999px">${I.search("#9B9A96", 19)}<input type="text" value="Intramuros" style="font-weight:600"><div style="width:22px;height:22px;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center">${I.close("#9B9A96", 13)}</div></div>
  </div>
  <div class="pad" style="margin-top:16px"><div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--card);border-radius:16px;box-shadow:0 3px 10px rgba(20,20,20,.05)">${I.locate("#3E97E5", 20)}<span style="font-size:14.5px;font-weight:700;color:var(--accent,#3E97E5)">Use my current location</span></div></div>
  <div class="pad" style="margin-top:18px;font-size:12px;font-weight:800;color:var(--sec);letter-spacing:.5px">RESULTS</div>
  <div class="pad" style="margin-top:4px">
    ${placeRow("Fort Santiago", "Intramuros, Manila", "5.9 km")}
    ${placeRow("Manila Cathedral", "Intramuros, Manila", "6.0 km")}
    ${placeRow("Casa Manila", "Intramuros, Manila", "6.1 km")}
    ${placeRow("San Agustin Church", "Intramuros, Manila", "6.2 km", true)}
  </div>
</div>`;

// ---- Stop editor (add / edit a stop) ----
const editField = (lab, valHtml, trail) => `<div><div class="label">${lab}</div><div class="field" style="height:56px">${valHtml}<div style="flex:1"></div>${trail || ""}</div></div>`;
screens.StopEditor = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:4px;display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:14px">${I.back()}<b style="font-size:18px;font-weight:800">Add a stop</b></div><span class="sec" style="font-size:14px;font-weight:700">Cancel</span></div>
  <div style="flex:1;overflow:hidden;padding-top:20px">
    <div class="pad" style="display:flex;flex-direction:column;gap:16px">
      ${editField("Place", `${I.pin("#191A1C", 18)}<span style="font-size:15px;font-weight:700;margin-left:10px">Fort Santiago</span>`, I.chevR("#C3C1BC", 16))}
      <div style="display:flex;gap:12px">
        <div style="flex:1">${editField("Arrive", `${I.clock("#191A1C", 18)}<span style="font-size:15px;font-weight:700;margin-left:10px">3:30 PM</span>`)}</div>
        <div style="flex:1">${editField("Stay", `<span style="font-size:15px;font-weight:700">1h 00m</span>`)}</div>
      </div>
      <div><div class="label">Category</div><div style="display:flex;flex-wrap:wrap;gap:8px">
        <span style="padding:9px 14px;border-radius:999px;background:var(--primary);color:#fff;font-size:13px;font-weight:700">Sightseeing</span>
        <span class="chipbtn" style="height:36px">Food</span><span class="chipbtn" style="height:36px">Coffee</span><span class="chipbtn" style="height:36px">Nature</span></div></div>
      <div><div class="label">Est. cost (2 pax)</div><div style="display:flex;gap:12px">
        <div class="field" style="flex:1;height:52px">${I.nav("#B45309", 17)}<input type="text" value="₱200" style="font-weight:700"></div>
        <div class="field" style="flex:1;height:52px">${I.food("#0E7490", 17)}<input type="text" value="₱0–200" style="font-weight:700"></div></div></div>
      <div><div class="label">Notes</div><div class="field" style="height:64px;align-items:flex-start;padding-top:14px"><span class="sec" style="font-size:14px;font-weight:500">Small entrance fee · allow ~1 hour</span></div></div>
    </div>
  </div>
  <div class="pad" style="padding-bottom:24px;padding-top:8px">${cta("Add to day", I.plus("#fff", 18))}</div>
</div>`;

// =====================================================================
// write files
// =====================================================================
export function wrap(name, body, P) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
${helmet(P)}
${body}
</x-dc>
</body>
</html>
`;
}
export { screens, I, cta, toggle, statRow, aiTip, chipIcon };

// Direct run: build all 9 screens in one palette (PAL env var, default Tangerine).
if (import.meta.url === `file://${process.argv[1]}`) {
  const P = PALETTES[process.env.PAL || "Neutral"];
  const order = [
    "Splash", "Onboarding", "OnboardingB", "OnboardingC", "Register",
    "Login", "ForgotPassword", "PermissionLocation", "PermissionNotifications", "Home",
    "HomeEmpty", "Main", "Proposals", "TripOverview", "Itinerary",
    "RouteMap", "Calendar", "PlaceDetail", "PlaceSearch", "StopEditor",
    "Commitments", "Notifications", "ReminderSettings", "PushBanner", "Profile",
  ];
  for (const name of order) fs.writeFileSync(path.join(DIR, `${name}.dc.html`), wrap(name, screens[name], P), "utf8");
  const W = 390, H = 844, GX = 110, GY = 150, COLS = 5;
  const pos = {};
  order.forEach((n, i) => {
    pos[n] = { x: (i % COLS) * (W + GX), y: Math.floor(i / COLS) * (H + GY) };
  });
  const canvas = {
    artboards: order.map((n) => ({ file: `${n}.dc.html`, x: pos[n].x, y: pos[n].y, w: W, h: H })),
    annotations: [
      { id: "title", x: 0, y: -150, w: 900, text: `Wayfare — full app (${P.label})\nRow 1: Splash · Onboarding · Register · Login · Home.  Row 2: Chat · Proposals · Trip Overview · Day Route · Map.  Row 3: Place Detail (check-in) · Alerts · Reminder Settings · Push · Profile.` },
    ],
    launch: { view: "canvas" },
  };
  fs.writeFileSync(path.join(DIR, "canvas.json"), JSON.stringify(canvas, null, 2) + "\n", "utf8");
  console.log(`wrote ${order.length} .dc.html + canvas.json (${P.label})`);
}
