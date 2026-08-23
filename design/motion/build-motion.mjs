// Interactions & motion: cinematic confirmations/success + calendar week view + block popup.
// CSS keyframes (defined in shared helmet) play live in the artifact. Run: node build-motion.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { wrap, PALETTES, I } from "../build-dc.mjs";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const P = PALETTES.Neutral;
const screens = {};

// ===== 1. Cinematic success (not a boring check) =====
const rings = [0, 0.8, 1.6].map((d) => `<div style="position:absolute;left:50%;top:50%;width:110px;height:110px;margin:-55px 0 0 -55px;border-radius:50%;border:2px solid rgba(255,255,255,.45);animation:ring 2.4s ease-out ${d}s infinite"></div>`).join("");
const sparks = [[-62, 0, "16px"], [66, 0.5, "-14px"], [-42, 1.0, "22px"], [52, 1.4, "-18px"], [-8, 0.3, "10px"], [26, 1.7, "-8px"], [80, 0.9, "8px"], [-78, 1.2, "-10px"]]
  .map(([x, d, dx]) => `<div style="position:absolute;left:calc(50% + ${x}px);top:50%;margin-top:-4px;width:8px;height:8px;border-radius:2px;background:#fff;opacity:0;animation:floatUp 2.6s ease-out ${d}s infinite;--dx:${dx}"></div>`).join("");
screens.SuccessCinematic = `<div class="frame" style="background:linear-gradient(160deg,#23252E 0%,#0D0E12 100%);position:relative;overflow:hidden">
  <div style="flex:1;position:relative">
    <div style="position:absolute;left:50%;top:44%;width:0;height:0">
      ${rings}
      ${sparks}
      <div style="position:absolute;left:50%;top:50%;margin:-54px 0 0 -54px;width:108px;height:108px;border-radius:34px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 24px 60px rgba(0,0,0,.5);animation:springIn .75s cubic-bezier(.2,.9,.3,1.25) both,glow 2.6s ease-in-out 1s infinite">${I.route("#17181A", 48)}</div>
    </div>
  </div>
  <div style="padding:0 30px 46px;text-align:center">
    <div class="a-pop" style="animation-delay:.55s"><h1 style="font-size:30px;font-weight:800;color:#fff;letter-spacing:-.7px;margin:0;line-height:1.08">Your itinerary<br>is ready</h1>
      <p style="font-size:15px;font-weight:500;color:rgba(255,255,255,.72);margin:12px 0 0;line-height:1.5">5 balanced days · 3 stops today — all mapped with timings, costs &amp; routes.</p></div>
    <div class="a-pop" style="animation-delay:.8s;margin-top:26px"><div style="height:58px;border-radius:999px;background:#fff;color:#17181A;display:flex;align-items:center;justify-content:center;gap:9px;font-size:16px;font-weight:800;box-shadow:0 14px 30px rgba(0,0,0,.35)">See your plan ${I.arrow("#17181A", 18)}</div></div>
  </div>
</div>`;

// ===== 2. Confirmation sheet (cinematic slide-up) =====
screens.ConfirmCancel = `<div class="frame" style="position:relative;justify-content:flex-end">
  <div class="a-fade" style="position:absolute;inset:0;background:rgba(15,15,18,.55);backdrop-filter:blur(2px)"></div>
  <div style="position:absolute;top:120px;left:22px;right:22px;opacity:.5"><div class="card" style="border-radius:24px;overflow:hidden;padding:0"><div style="height:96px;background-image:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.5)),url('museum.jpg');background-size:cover;background-position:center"></div></div></div>
  <div class="a-sheet" style="position:relative;background:var(--card);border-radius:32px 32px 0 0;padding:12px 22px 30px;box-shadow:0 -12px 40px rgba(0,0,0,.2)">
    <div style="width:44px;height:5px;border-radius:3px;background:#E0DDD8;margin:0 auto 20px"></div>
    <div class="a-drift" style="width:62px;height:62px;border-radius:20px;background:#FDEBEA;display:flex;align-items:center;justify-content:center;margin-bottom:16px">${I.close("#E5484D", 28)}</div>
    <h2 style="font-size:22px;font-weight:800;letter-spacing:-.4px;margin:0">Cancel the next stop?</h2>
    <p class="sec" style="font-size:14.5px;font-weight:500;line-height:1.5;margin:10px 0 0">You'll get <b style="color:var(--ink)">~1h 20m</b> back to stay longer at Casa Manila. We'll reflow the rest of today automatically.</p>
    <div style="display:flex;gap:12px;margin-top:22px">
      <div style="flex:1;height:56px;border-radius:999px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:15.5px;font-weight:800">Keep it</div>
      <div style="flex:1;height:56px;border-radius:999px;background:#E5484D;color:#fff;display:flex;align-items:center;justify-content:center;font-size:15.5px;font-weight:800;box-shadow:0 12px 24px rgba(229,72,77,.35)">Cancel stop</div>
    </div>
  </div>
</div>`;

// ===== calendar helpers =====
const dayPip = (d, n, on) => `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1"><span style="font-size:11px;font-weight:700;color:${on ? "#fff" : "var(--sec)"}">${d}</span><div style="width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;${on ? "background:var(--primary);color:#fff" : "color:var(--ink)"}">${n}</div></div>`;
const segToggle = (a) => `<div style="display:flex;background:#E2E0DC;border-radius:999px;padding:4px;gap:4px;width:150px">${["Day", "Week"].map((t, i) => `<div style="flex:1;text-align:center;padding:8px 0;border-radius:999px;font-size:13px;font-weight:700;${i === a ? "background:#fff;color:var(--ink);box-shadow:0 3px 8px rgba(0,0,0,.09)" : "color:var(--sec)"}">${t}</div>`).join("")}</div>`;

// day grid block
const HR = 34, T0 = 6;
const yy = (h) => (h - T0) * HR;
const dblock = (t1, t2, title, sub, kind, cls = "") => {
  const c = kind === "work" ? { bg: "#E4E2DE", bar: "#B7B5B0", tx: "var(--sec)" } : kind === "travel" ? { bg: "#FBF1DF", bar: "#E0A94E", tx: "#8A5A18" } : { bg: "#E8F0FB", bar: "#3E97E5", tx: "#1E5E9E" };
  return `<div class="${cls}" style="position:absolute;left:56px;right:12px;top:${yy(t1)}px;height:${yy(t2) - yy(t1)}px;background:${c.bg};border-radius:12px;padding:8px 10px 8px 12px;overflow:hidden">
    <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${c.bar}"></div>
    <div style="font-size:13px;font-weight:800;color:${c.tx}">${title}</div><div style="font-size:11px;font-weight:600;color:${c.tx};opacity:.8;margin-top:1px">${sub}</div></div>`;
};
const hourlines = Array.from({ length: 9 }, (_, i) => T0 + i * 2).map((h) => `<div style="position:absolute;left:0;right:12px;top:${yy(h)}px;height:1px;background:var(--line)"></div><div style="position:absolute;left:14px;top:${yy(h) - 7}px;font-size:11px;font-weight:600;color:var(--ter)">${h > 12 ? h - 12 : h} ${h >= 12 ? "PM" : "AM"}</div>`).join("");

// ===== 3. Calendar — Week (Sun–Sat) view =====
const H2 = 26, WT0 = 7;
const wy = (h) => (h - WT0) * H2;
const cols = 7, gut = 30, cw = (390 - 24 - gut) / cols; // grid is inset 12px each side (inner width 366)
const wblock = (col, t1, t2, kind) => {
  const bg = kind === "work" ? "#DCDAD6" : kind === "travel" ? "#F3DFB6" : "#CFE0F5";
  return `<div style="position:absolute;left:${gut + col * cw + 2}px;width:${cw - 4}px;top:${wy(t1)}px;height:${wy(t2) - wy(t1)}px;background:${bg};border-radius:6px"></div>`;
};
const weekCols = ["S", "M", "T", "W", "T", "F", "S"].map((d, i) => `<div style="position:absolute;left:${gut + i * cw}px;width:${cw}px;top:0;text-align:center;font-size:11px;font-weight:800;color:${i === 4 ? "var(--ink)" : "var(--sec)"}">${d}<div style="font-size:12px;font-weight:700;color:var(--ter);margin-top:2px">${23 + i}</div></div>`).join("");
let weekBlocks = "";
for (let c = 1; c <= 5; c++) weekBlocks += wblock(c, 7, 16, "work"); // Mon–Fri work
weekBlocks += wblock(1, 17.5, 20, "act") + wblock(2, 18, 20.5, "act") + wblock(3, 17.5, 19, "act") + wblock(4, 18.5, 21, "act") + wblock(5, 18, 21, "act");
weekBlocks += wblock(0, 10, 16, "act") + wblock(6, 9, 18, "act"); // weekend all-day-ish
const wlines = Array.from({ length: 8 }, (_, i) => WT0 + i * 2).map((h) => `<div style="position:absolute;left:${gut}px;right:4px;top:${wy(h)}px;height:1px;background:var(--line)"></div><div style="position:absolute;left:2px;top:${wy(h) - 6}px;font-size:9.5px;font-weight:600;color:var(--ter)">${h > 12 ? h - 12 : h}${h >= 12 ? "p" : "a"}</div>`).join("");
screens.CalendarWeek = `<div class="frame">
  <div class="safe"></div>
  <div class="pad" style="padding-top:2px;display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:14px">${I.back()}<b style="font-size:18px;font-weight:800">Schedule</b></div>${segToggle(1)}</div>
  <div class="pad" style="margin-top:14px;display:flex;gap:14px">
    <div style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:#B7B5B0"></span><span class="sec" style="font-size:11.5px;font-weight:600">Work</span></div>
    <div style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:#3E97E5"></span><span class="sec" style="font-size:11.5px;font-weight:600">Activity</span></div>
    <div class="sec" style="font-size:11.5px;font-weight:600">Aug 23–29, 2026</div>
  </div>
  <div style="position:relative;height:34px;margin:14px 12px 0">${weekCols}</div>
  <div style="flex:1;overflow:hidden;position:relative;margin:6px 12px 0">
    ${wlines}${weekBlocks}
  </div>
</div>`;

// ===== 4. Calendar — day view with block-tap popup =====
screens.CalendarPopup = `<div class="frame" style="position:relative">
  <div class="safe"></div>
  <div class="pad" style="padding-top:2px;display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:14px">${I.back()}<b style="font-size:18px;font-weight:800">Schedule</b></div>${segToggle(0)}</div>
  <div class="pad" style="margin-top:16px;display:flex;gap:4px">${dayPip("WED", 26)}${dayPip("THU", 27, true)}${dayPip("FRI", 28)}${dayPip("SAT", 29)}${dayPip("SUN", 30)}${dayPip("MON", 31)}</div>
  <div style="flex:1;overflow:hidden;margin-top:14px;position:relative">
    ${hourlines}
    ${dblock(7, 16, "Work", "7:00 AM – 4:00 PM · blocked", "work")}
    ${dblock(16.25, 17, "Home & change", "Grab · ~20 min", "travel")}
    ${dblock(17.5, 19.5, "BGC High Street dinner", "tap for details", "act", "tapped")}
    ${dblock(19.5, 21, "Dessert & walk", "Burgos Circle", "act")}
    <div style="position:absolute;left:52px;right:8px;top:${yy(17.5) - 3}px;height:${yy(19.5) - yy(17.5) + 6}px;border-radius:15px;border:2.5px solid var(--primary);pointer-events:none"></div>
  </div>
  <!-- popup -->
  <div class="a-fade" style="position:absolute;inset:0;background:rgba(15,15,18,.5)"></div>
  <div class="a-pop" style="position:absolute;left:20px;right:20px;top:210px;background:var(--card);border-radius:26px;padding:18px;box-shadow:0 24px 50px rgba(0,0,0,.28)">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:46px;height:46px;border-radius:14px;background:#E8F0FB;display:flex;align-items:center;justify-content:center">${I.food("#3E97E5", 22)}</div>
      <div style="flex:1"><div style="font-size:17px;font-weight:800">BGC High Street dinner</div><div class="sec" style="font-size:12.5px;font-weight:600;margin-top:2px">Thu, Aug 27 · 5:30 – 7:30 PM</div></div>
    </div>
    <div style="display:flex;align-items:center;gap:7px;margin-top:14px">${I.pin("#9B9A96", 15)}<span class="sec" style="font-size:13px;font-weight:600">Bonifacio High Street, Taguig</span></div>
    <div style="margin-top:12px;display:flex;flex-direction:column;gap:2px">
      <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid var(--line)"><span style="font-size:12px;font-weight:700;color:var(--ter);width:66px">5:30 PM</span><span style="font-size:13.5px;font-weight:600">Dinner — casual Italian</span></div>
      <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid var(--line)"><span style="font-size:12px;font-weight:700;color:var(--ter);width:66px">6:45 PM</span><span style="font-size:13.5px;font-weight:600">Dessert &amp; coffee</span></div>
    </div>
    <div style="display:flex;gap:12px;margin-top:16px">
      <div style="flex:1;height:50px;border-radius:999px;background:var(--bg);display:flex;align-items:center;justify-content:center;gap:7px;font-size:14.5px;font-weight:800">${I.edit("#191A1C", 17)} Edit</div>
      <div style="flex:1;height:50px;border-radius:999px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;gap:7px;font-size:14.5px;font-weight:800">${I.nav("#fff", 16)} Route</div>
    </div>
  </div>
</div>`;

// ---- write ----
const order = ["SuccessCinematic", "ConfirmCancel", "CalendarPopup", "CalendarWeek"];
for (const n of order) fs.writeFileSync(path.join(DIR, `${n}.dc.html`), wrap(n, screens[n], P), "utf8");
const W = 390, H = 844, GX = 100;
const canvas = {
  artboards: order.map((n, i) => ({ file: `${n}.dc.html`, x: i * (W + GX), y: 0, w: W, h: H, title: n })),
  annotations: [{ id: "t", x: 0, y: -130, w: 900, text: "Wayfare — Interactions & Motion\nCinematic success (animated rings + spark burst, not a plain check) · confirm-before-decision sheet · calendar Day↔Week views · tap a block → schedule popup. Open each artboard to see the animation play." }],
  launch: { view: "canvas" },
};
fs.writeFileSync(path.join(DIR, "canvas.json"), JSON.stringify(canvas, null, 2) + "\n", "utf8");
console.log(`wrote ${order.length} motion screens + canvas.json`);
