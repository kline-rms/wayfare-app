// "Create your own itinerary" wizard flow (skeleton form → AI generation).
// Mirrors the xlsx data model; ends in AI generation. Run: node build-create.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { wrap, PALETTES, I, cta } from "../build-dc.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const P = PALETTES.Neutral;

// ---- local components (use shared helmet classes: .frame .card .cta .field .chipbtn .label .orb .rbtn) ----
const back = () => I.back();
const topbar = (title, step, total) => `<div class="safe"></div>
  <div class="pad" style="padding-top:2px;display:flex;align-items:center;gap:14px">${back()}<b style="font-size:17px;font-weight:800">${title}</b></div>
  ${step ? `<div class="pad" style="margin-top:16px;display:flex;align-items:center;gap:10px"><div style="flex:1;height:6px;border-radius:3px;background:#DCDAD6"><div style="width:${(step / total) * 100}%;height:6px;border-radius:3px;background:var(--primary)"></div></div><span style="font-size:12px;font-weight:700;color:var(--sec)">${step} of ${total}</span></div>` : ""}`;
const h1 = (t, s) => `<div class="pad" style="margin-top:22px"><h1 class="h1" style="font-size:28px">${t}</h1>${s ? `<p class="sec" style="font-size:14.5px;font-weight:500;margin:8px 0 0">${s}</p>` : ""}</div>`;
const label = (t) => `<div class="pad" style="margin-top:22px;font-size:13px;font-weight:800;color:var(--sec);letter-spacing:.3px">${t}</div>`;
const chip = (l, on) => `<span style="padding:10px 16px;border-radius:999px;font-size:13.5px;font-weight:700;${on ? "background:var(--primary);color:#fff;box-shadow:0 6px 14px rgba(23,24,26,.22)" : "background:var(--card);color:var(--ink);box-shadow:0 3px 10px rgba(20,20,20,.06)"}">${l}</span>`;
const chipRm = (l) => `<span style="display:inline-flex;align-items:center;gap:7px;padding:9px 12px 9px 15px;border-radius:999px;background:var(--primary);color:#fff;font-size:13.5px;font-weight:700">${l}<span style="width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,.25);display:inline-flex;align-items:center;justify-content:center"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></span></span>`;
const segmented = (items, active) => `<div style="display:flex;background:#E2E0DC;border-radius:16px;padding:4px;gap:4px">${items.map((it, i) => `<div style="flex:1;text-align:center;padding:11px 0;border-radius:12px;font-size:13.5px;font-weight:700;${i === active ? "background:#fff;color:var(--ink);box-shadow:0 3px 8px rgba(0,0,0,.09)" : "color:var(--sec)"}">${it}</div>`).join("")}</div>`;
const slider = (pct, lL, rL) => `<div style="height:8px;border-radius:4px;background:#DCDAD6;position:relative;margin-top:10px"><div style="position:absolute;left:0;top:0;height:8px;width:${pct}%;border-radius:4px;background:var(--primary)"></div><div class="rbtn" style="position:absolute;left:calc(${pct}% - 13px);top:-9px;width:26px;height:26px;border-radius:50%;background:#fff;border:3px solid var(--primary)"></div></div>
  <div style="display:flex;justify-content:space-between;margin-top:12px"><span class="sec" style="font-size:12.5px;font-weight:600">${lL}</span><span class="sec" style="font-size:12.5px;font-weight:600">${rL}</span></div>`;
const stepper = (v) => `<div style="display:flex;align-items:center;gap:16px"><div class="chipbtn" style="width:40px;height:40px;border-radius:14px;padding:0;justify-content:center">${I.minus()}</div><span style="font-size:18px;font-weight:800;min-width:22px;text-align:center">${v}</span><div class="chipbtn" style="width:40px;height:40px;border-radius:14px;padding:0;justify-content:center">${I.plus()}</div></div>`;
const fieldRow = (icon, lab, value, sub) => `<div><div class="label">${lab}</div><div class="field" style="height:58px">${icon}<div style="flex:1"><div style="font-size:15px;font-weight:700">${value}</div>${sub ? `<div class="sec" style="font-size:11.5px;font-weight:500">${sub}</div>` : ""}</div></div></div>`;
const optionCard = (iconEl, iconBg, title, sub, badge) => `<div class="card" style="padding:15px;border-radius:24px;display:flex;align-items:center;gap:14px">
  <div style="width:52px;height:52px;border-radius:16px;background:${iconBg};display:flex;align-items:center;justify-content:center;flex-shrink:0">${iconEl}</div>
  <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:16px;font-weight:800">${title}</div>${badge ? `<span style="font-size:9px;font-weight:800;color:#1E8A50;background:#E7F6EE;padding:2px 7px;border-radius:999px">${badge}</span>` : ""}</div><div class="sec" style="font-size:12.5px;font-weight:500;margin-top:2px">${sub}</div></div>
  ${I.chevR("#C3C1BC", 18)}</div>`;
const aiNote = (html) => `<div class="pad"><div class="aitip" style="margin-top:18px"><div class="orb"></div><div style="font-size:13px;font-weight:500;color:var(--sec);line-height:1.4">${html}</div></div></div>`;
const mapRow = (from, to, last) => `<div style="display:flex;align-items:center;gap:12px;padding:11px 0${last ? "" : ";border-bottom:1px solid var(--line)"}">
  <div style="flex:1;font-size:13.5px;font-weight:600;color:var(--sec)">${from}</div>${I.arrow("#C3C1BC", 16)}<div style="flex:1;font-size:14px;font-weight:700;text-align:right">${to}</div>${I.checkC("#34B87E", 18)}</div>`;

const screens = {};

// 1 — choose how to start
screens.StartMethod = `<div class="frame">
  ${topbar("New trip")}
  ${h1("How do you want<br>to start?", "Three ways to build your plan — pick one.")}
  <div class="pad" style="margin-top:20px;display:flex;flex-direction:column;gap:14px">
    ${optionCard(`<div class="orb" style="width:34px;height:34px"></div>`, "var(--bg)", "Chat with Wayfare AI", "Answer a few questions, get 3 plans", "Fastest")}
    ${optionCard(I.wand("#191A1C", 24), "#EDEBFF", "Build it yourself", "Set the basics — we fill the details", "")}
    ${optionCard(I.file("#191A1C", 22), "#E7F1FB", "Import a spreadsheet", "Bring a CSV or Excel plan (web)", "")}
  </div>
  ${aiNote('However you start, AI adds timings, costs, routes & map pins at the end.')}
</div>`;

// 2 — import mapping (webapp)
screens.Import = `<div class="frame">
  ${topbar("Import plan")}
  ${h1("Import your<br>spreadsheet", "CSV or Excel — we'll map it into a trip.")}
  <div class="pad" style="margin-top:20px"><div class="card" style="padding:16px;border-radius:24px;display:flex;align-items:center;gap:14px">
    <div style="width:48px;height:48px;border-radius:14px;background:#E7F1FB;display:flex;align-items:center;justify-content:center">${I.file("#3E97E5", 22)}</div>
    <div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:700">BGC_Manila_Itinerary.xlsx</div><div class="sec" style="font-size:12.5px;font-weight:500;margin-top:2px">12 rows · 3 sheets · 48 KB</div></div>
    ${I.checkC("#34B87E", 22)}</div></div>
  ${label("WE MATCHED YOUR COLUMNS")}
  <div class="pad" style="margin-top:8px"><div class="card" style="padding:4px 16px;border-radius:24px">
    ${mapRow("Date", "Date")}
    ${mapRow("Coming From", "Origin")}
    ${mapRow("Destination / Area", "Destination")}
    ${mapRow("Detailed Plan", "Plan")}
    ${mapRow("Est. Travel (₱)", "Travel cost", true)}
  </div></div>
  ${aiNote("We'll fill any gaps — map pins, timings & cost ranges — with AI.")}
  <div style="flex:1"></div>
  <div class="pad" style="padding-bottom:24px">${cta("Import & enhance", I.wand("#fff", 18))}</div>
</div>`;

// 3 — where & when
screens.Basics = `<div class="frame">
  ${topbar("Build it yourself", 1, 4)}
  ${h1("Where to?")}
  <div class="pad" style="margin-top:22px;position:relative;display:flex;flex-direction:column;gap:14px">
    ${fieldRow(I.home("#191A1C", 20), "Coming from", "Avida Towers Verte, BGC", "Your home base")}
    ${fieldRow(I.pin("#191A1C", 20), "Destination", "Manila & Makati")}
    <div class="navbtn" style="position:absolute;left:50%;top:86px;transform:translate(-50%) rotate(90deg);width:36px;height:36px;border-radius:50%;background:var(--card);display:flex;align-items:center;justify-content:center">${I.arrow("#191A1C", 16)}</div>
  </div>
  ${label("WHEN")}
  <div class="pad" style="margin-top:8px">${segmented(["Exact dates", "Just duration"], 0)}</div>
  <div class="pad" style="margin-top:12px;display:flex;gap:12px">
    <div class="field" style="flex:1;height:56px">${I.cal("#191A1C", 18)}<div style="font-size:14.5px;font-weight:700">Aug 26</div></div>
    <div class="field" style="flex:1;height:56px">${I.cal("#191A1C", 18)}<div style="font-size:14.5px;font-weight:700">Sep 6</div></div>
  </div>
  <div class="pad" style="margin-top:18px;display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:10px">${I.users("#191A1C", 20)}<span style="font-size:15px;font-weight:700">Travelers</span></div>${stepper(2)}</div>
  <div style="flex:1"></div>
  <div class="pad" style="padding-bottom:24px">${cta("Continue")}</div>
</div>`;

// 4 — vibe
screens.Vibe = `<div class="frame">
  ${topbar("Build it yourself", 2, 4)}
  ${h1("What's the vibe?")}
  ${label("OCCASION")}
  <div class="pad" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:9px">${chip("Couple", true)}${chip("Business")}${chip("Family")}${chip("Solo")}${chip("Foodie")}${chip("Adventure")}</div>
  ${label("PACE")}
  <div class="pad">${slider(32, "Relaxed · few stops", "Packed · see it all")}</div>
  ${label("BUDGET")}
  <div class="pad" style="margin-top:10px">${segmented(["Shoestring", "Comfortable", "Luxe"], 1)}</div>
  <div class="pad" style="margin-top:10px"><span class="sec" style="font-size:12.5px;font-weight:600">Estimated in Philippine Peso (₱)</span></div>
  <div style="flex:1"></div>
  <div class="pad" style="padding-bottom:24px">${cta("Continue")}</div>
</div>`;

// 5 — interests & must-dos
screens.Interests = `<div class="frame">
  ${topbar("Build it yourself", 3, 4)}
  ${h1("Anything you love?")}
  ${label("INTERESTS")}
  <div class="pad" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:9px">${chip("Heritage", true)}${chip("Food", true)}${chip("Cafés", true)}${chip("Museums")}${chip("Views")}${chip("Waterfront")}${chip("Nightlife")}${chip("Shopping")}${chip("Markets")}</div>
  ${label("MUST-VISIT PLACES (OPTIONAL)")}
  <div class="pad" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:9px">${chipRm("Intramuros")}${chipRm("National Museum")}</div>
  <div class="pad" style="margin-top:12px"><div class="field" style="height:54px">${I.search("#C3C1BC", 19)}<span style="font-size:14.5px;font-weight:500;color:var(--ter)">Add a place you don't want to miss…</span></div></div>
  ${aiNote("We'll slot your must-dos into the best days and build the rest around them.")}
  <div style="flex:1"></div>
  <div class="pad" style="padding-bottom:24px">${cta("Continue")}</div>
</div>`;

// 6 — review
const sCell = (l, v) => `<div style="flex:1"><div style="font-size:11px;font-weight:700;color:var(--ter);letter-spacing:.3px">${l}</div><div style="font-size:14px;font-weight:700;margin-top:2px">${v}</div></div>`;
screens.Review = `<div class="frame">
  ${topbar("Build it yourself", 4, 4)}
  ${h1("Ready to generate")}
  <div class="pad" style="margin-top:20px"><div class="card" style="padding:16px;border-radius:24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <div style="flex:1;background:var(--bg);border-radius:12px;padding:9px 11px"><div style="font-size:10px;font-weight:700;color:var(--ter)">FROM</div><div style="font-size:14px;font-weight:700">BGC, Taguig</div></div>
      ${I.arrow("#C3C1BC", 18)}
      <div style="flex:1;background:#EEF5EF;border-radius:12px;padding:9px 11px"><div style="font-size:10px;font-weight:700;color:#5FB584">TO</div><div style="font-size:14px;font-weight:700;color:#1E8A50">Manila & Makati</div></div>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:12px">${sCell("DATES", "Aug 26 – Sep 6 · 12 days")}${sCell("TRAVELERS", "2 adults")}</div>
    <div style="display:flex;gap:12px;margin-bottom:14px">${sCell("PACE", "Relaxed")}${sCell("BUDGET", "Comfortable · ₱")}</div>
    <div style="border-top:1px solid var(--line);padding-top:12px"><div style="font-size:11px;font-weight:700;color:var(--ter);letter-spacing:.3px;margin-bottom:8px">INTERESTS & MUST-DOS</div>
      <div style="display:flex;flex-wrap:wrap;gap:7px"><span style="font-size:12px;font-weight:700;background:var(--bg);padding:5px 11px;border-radius:999px">Couple</span><span style="font-size:12px;font-weight:700;background:var(--bg);padding:5px 11px;border-radius:999px">Heritage</span><span style="font-size:12px;font-weight:700;background:var(--bg);padding:5px 11px;border-radius:999px">Food</span><span style="font-size:12px;font-weight:700;background:var(--bg);padding:5px 11px;border-radius:999px">Cafés</span><span style="font-size:12px;font-weight:700;background:var(--bg);padding:5px 11px;border-radius:999px">+2 places</span></div>
    </div>
  </div></div>
  ${aiNote("AI will add day themes, timings, plans, cost ranges, travel modes & map pins around your must-dos.")}
  <div style="flex:1"></div>
  <div class="pad" style="padding-bottom:24px">${cta("Generate my itinerary", I.wand("#fff", 18))}</div>
</div>`;

// 7 — generating
const genStep = (state, txt, delay) => `<div class="a-pop" style="display:flex;align-items:center;gap:12px;padding:11px 0;animation-delay:${delay}s">
  ${state === "done" ? I.checkC("#34B87E", 22) : state === "active" ? `<div class="a-spin" style="width:22px;height:22px;border-radius:50%;border:2.5px solid var(--primary);border-top-color:transparent"></div>` : `<div style="width:22px;height:22px;border-radius:50%;border:2px solid #D9D7D3"></div>`}
  <span style="font-size:14.5px;font-weight:${state === "pending" ? "500" : "700"};color:${state === "pending" ? "var(--ter)" : "var(--ink)"}">${txt}</span></div>`;
const genRing = (d) => `<div style="position:absolute;left:50%;top:50%;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;border:2px solid rgba(23,24,26,.16);animation:ring 2.6s ease-out ${d}s infinite"></div>`;
screens.Generating = `<div class="frame" style="align-items:center;justify-content:center;padding:0 30px;position:relative;overflow:hidden">
  <div style="position:relative;width:96px;height:96px;display:flex;align-items:center;justify-content:center">
    ${genRing(0)}${genRing(0.9)}${genRing(1.8)}
    <div style="width:96px;height:96px;border-radius:30px;background:var(--ink);display:flex;align-items:center;justify-content:center;box-shadow:0 16px 34px rgba(23,24,26,.28);animation:springIn .75s cubic-bezier(.2,.9,.3,1.25) both,glow 2.6s ease-in-out 1s infinite">${I.spark("#fff", 42)}</div>
  </div>
  <h1 class="h1 a-pop" style="font-size:26px;text-align:center;margin-top:28px;animation-delay:.3s">Building your<br>Manila trip</h1>
  <p class="sec a-pop" style="font-size:14px;font-weight:500;text-align:center;margin:10px 0 0;animation-delay:.4s">Hang tight — this takes a few seconds.</p>
  <div class="card a-pop" style="width:100%;padding:6px 20px;border-radius:24px;margin-top:28px;animation-delay:.5s">
    ${genStep("done", "Understanding your vibe", 0.6)}
    ${genStep("done", "Drafting 5 balanced days", 0.72)}
    ${genStep("active", "Estimating costs & travel time", 0.84)}
    ${genStep("pending", "Mapping the route & pins", 0.96)}
    ${genStep("pending", "Finding the golden hours", 1.08)}
  </div>
</div>`;

// ---- P1 gap screens ----
screens.ImportUpload = `<div class="frame">
  ${topbar("Import plan")}
  ${h1("Import your<br>spreadsheet", "Bring a plan from Excel or a CSV — we'll turn it into a trip.")}
  <div class="pad" style="margin-top:20px">
    <div style="border:2px dashed #D8D2C6;border-radius:26px;padding:34px 20px;display:flex;flex-direction:column;align-items:center;text-align:center;background:var(--card)">
      <div style="width:64px;height:64px;border-radius:20px;background:var(--bg);display:flex;align-items:center;justify-content:center;animation:drift 3s ease-in-out infinite">${I.upload("#191A1C", 26)}</div>
      <div style="font-size:16px;font-weight:800;margin-top:16px">Drop your file here</div>
      <div class="sec" style="font-size:13px;font-weight:500;margin-top:4px">CSV or Excel · up to 5 MB</div>
      <div style="margin-top:18px;height:46px;padding:0 24px;border-radius:999px;background:var(--primary);color:#fff;display:flex;align-items:center;font-size:14.5px;font-weight:700;box-shadow:0 10px 20px rgba(23,24,26,.22)">Browse files</div>
    </div>
  </div>
  ${label("OR START FROM")}
  <div class="pad" style="margin-top:8px"><div class="card" style="padding:14px 16px;border-radius:20px;display:flex;align-items:center;gap:12px"><div style="width:42px;height:42px;border-radius:13px;background:#E7F1FB;display:flex;align-items:center;justify-content:center">${I.file("#3E97E5", 20)}</div><div style="flex:1"><div style="font-size:14.5px;font-weight:700">Use the sample</div><div class="sec" style="font-size:12px;font-weight:500">BGC + Manila couple itinerary</div></div>${I.chevR("#C3C1BC", 16)}</div></div>
  ${aiNote("We read Date, Origin, Destination, Plan and cost columns — anything missing, AI fills in.")}
</div>`;

const issueRow = (txt, sub, last) => `<div style="display:flex;align-items:center;gap:12px;padding:12px 0${last ? "" : ";border-bottom:1px solid var(--line)"}">${I.alert("#D8524D", 20)}<div style="flex:1"><div style="font-size:14px;font-weight:700">${txt}</div><div class="sec" style="font-size:12px;font-weight:500;margin-top:1px">${sub}</div></div></div>`;
screens.ImportError = `<div class="frame">
  ${topbar("Import plan")}
  <div class="pad" style="margin-top:6px;display:flex;flex-direction:column;align-items:center;text-align:center">
    <div style="width:84px;height:84px;border-radius:26px;background:#FDEBEA;display:flex;align-items:center;justify-content:center;animation:springIn .6s cubic-bezier(.2,.9,.3,1.25) both">${I.alert("#D8524D", 38)}</div>
    <h1 class="h1 a-pop" style="font-size:24px;margin-top:20px;animation-delay:.15s">We couldn't read<br>that file</h1>
    <p class="sec a-pop" style="font-size:14.5px;font-weight:500;line-height:1.5;margin:10px 0 0;animation-delay:.25s;max-width:300px">A couple of rows need a fix before we can import them.</p>
  </div>
  ${label("2 ISSUES")}
  <div class="pad" style="margin-top:6px"><div class="card" style="padding:2px 16px;border-radius:20px">
    ${issueRow("Row 7 — missing a date", "Every stop needs a day to sit on.")}
    ${issueRow("‘Cost’ isn't a number", "Found “free” in 3 rows — we'll read it as ₱0.", true)}
  </div></div>
  <div style="flex:1"></div>
  <div class="pad" style="padding-bottom:24px;display:flex;gap:12px">
    <div class="chipbtn" style="flex:1;height:56px;border-radius:999px;justify-content:center;font-size:15px">Map manually</div>
    <div style="flex:1;height:56px;border-radius:999px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;gap:8px;font-size:15px;font-weight:700;box-shadow:0 12px 24px rgba(23,24,26,.24)">${I.upload("#fff", 18)} Re-upload</div>
  </div>
</div>`;

screens.GenerateError = `<div class="frame" style="align-items:center;justify-content:center;padding:0 30px;text-align:center">
  <div style="width:96px;height:96px;border-radius:30px;background:#FDEBEA;display:flex;align-items:center;justify-content:center;animation:springIn .7s cubic-bezier(.2,.9,.3,1.25) both">${I.alert("#D8524D", 42)}</div>
  <h1 class="h1 a-pop" style="font-size:26px;margin-top:26px;animation-delay:.15s">That didn't<br>go through</h1>
  <p class="sec a-pop" style="font-size:15px;font-weight:500;line-height:1.55;margin:12px 0 0;animation-delay:.25s;max-width:300px">We couldn't build your plan just now. Your answers are saved — give it another go.</p>
  <div class="a-pop" style="width:100%;margin-top:28px;animation-delay:.35s">${cta("Try again", I.refresh("#fff", 18))}</div>
  <div style="height:52px;display:flex;align-items:center;justify-content:center;margin-top:6px"><span style="font-size:15px;font-weight:700;color:var(--sec)">Edit my inputs</span></div>
</div>`;

// ---- write ----
const order = ["StartMethod", "ImportUpload", "Import", "ImportError", "Basics", "Vibe", "Interests", "Review", "Generating", "GenerateError"];
for (const n of order) fs.writeFileSync(path.join(DIR, `${n}.dc.html`), wrap(n, screens[n], P), "utf8");
const W = 390, H = 844, GX = 100, GY = 150, COLS = 5;
const canvas = {
  artboards: order.map((n, i) => ({ file: `${n}.dc.html`, x: (i % COLS) * (W + GX), y: Math.floor(i / COLS) * (H + GY), w: W, h: H, title: n })),
  annotations: [{ id: "t", x: 0, y: -130, w: 900, text: "Wayfare — Create Your Own Itinerary (skeleton form → AI generation)\nStart (AI / build / import) · Import upload → map → error · Basics · Vibe · Interests · Review · Generating → error/retry. Collects the xlsx fields; AI fills timings, plans, costs, travel modes & map pins." }],
  launch: { view: "canvas" },
};
fs.writeFileSync(path.join(DIR, "canvas.json"), JSON.stringify(canvas, null, 2) + "\n", "utf8");
console.log(`wrote ${order.length} create-flow screens + canvas.json`);
