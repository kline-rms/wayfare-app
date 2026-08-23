// Generates Wayfare.pen — the Wayfare app design as a pen.dev (.pen) document.
// Node tree format: { version, children:[ frames... ] }. Run: node build-pen.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "Wayfare.pen");

// ---- palette ----
const BG = "#FBF6F1", CARD = "#FFFFFF", INK = "#241C17", MUT = "#8C7F76";
const CORAL = "#F0563F", CORALD = "#D8402A", TINT = "#FDEBE5", BORDER = "#EFE3DA";
const ROSE = "#E0447E", ROSED = "#C13068", GOLD = "#C0842E", GOLDD = "#8F5E1C";
const CREAM = "#FFF7F2";
// Match the Claude artifact's pairing (both supported by the pen.dev editor via Google Fonts)
const DISPLAY = "Bricolage Grotesque", BODY = "Plus Jakarta Sans";

// ---- id + node helpers ----
let _n = 0;
const uid = (p) => `${p}${(_n++).toString(36).padStart(3, "0")}`;
const shadow = (y = 8, blur = 22, color = "#0000001a") => ({ type: "shadow", shadowType: "outer", color, offset: { x: 0, y }, blur });

const frame = (o = {}, children = []) => ({ type: "frame", id: uid("f"), clip: true, layout: "none", ...o, children });
const vstack = (o = {}, children = []) => frame({ layout: "vertical", ...o }, children);
const hstack = (o = {}, children = []) => frame({ layout: "horizontal", ...o }, children);
const text = (content, o = {}) => ({ type: "text", id: uid("t"), content, fontFamily: BODY, fontSize: 14, fontWeight: "normal", fill: INK, ...o });
const rect = (o = {}) => ({ type: "rectangle", id: uid("r"), width: 40, height: 40, fill: CORAL, ...o });
const ic = (icon, o = {}) => ({ type: "icon", id: uid("i"), icon, library: "lucide", width: 20, height: 20, fill: INK, ...o });
const ell = (o = {}) => ({ type: "ellipse", id: uid("e"), width: 12, height: 12, fill: CORAL, ...o });
const stroke = (fill = BORDER, thickness = 1, align = "inside") => ({ align, thickness, fill });

// button: absolutely-placed flex frame, content auto-centered
const button = (x, y, w, label, o = {}) => hstack(
  { x, y, width: w, height: o.height ?? 56, cornerRadius: o.r ?? 16, fill: o.fill ?? CORAL, layout: "horizontal", justifyContent: "center", alignItems: "center", gap: 9, effect: o.effect, stroke: o.stroke },
  [
    ...(o.icon ? [ic(o.icon, { width: 18, height: 18, fill: o.iconFill ?? CREAM })] : []),
    text(label, { fontFamily: BODY, fontSize: o.fs ?? 16, fontWeight: "700", fill: o.color ?? CREAM }),
    ...(o.iconR ? [ic(o.iconR, { width: 18, height: 18, fill: o.iconFill ?? CREAM })] : []),
  ],
);

// labeled input field
const field = (icon, value, o = {}) => hstack(
  { width: "fill_container", height: 54, cornerRadius: 14, fill: CARD, stroke: stroke(BORDER), layout: "horizontal", alignItems: "center", gap: 12, padding: 14 },
  [
    ic(icon, { width: 18, height: 18, fill: CORAL }),
    text(value, { fontSize: 15, fontWeight: "500", fill: value.startsWith("·") ? INK : INK }),
    ...(o.trail ? [frame({ width: "fill_container", height: 1, fill: "#00000000" }), ic(o.trail, { width: 18, height: 18, fill: "#B6A99F" })] : []),
  ],
);
const labeledField = (label, icon, value, o = {}) => vstack(
  { width: "fill_container", height: "fit_content", layout: "vertical", gap: 8 },
  [text(label, { fontSize: 13, fontWeight: "600", fill: MUT }), field(icon, value, o)],
);

const chip = (label, on = false) => hstack(
  { width: "fit_content", height: "fit_content", cornerRadius: 999, fill: on ? TINT : CARD, stroke: stroke(on ? CORAL : BORDER), layout: "horizontal", alignItems: "center", padding: 10 },
  [text(label, { fontSize: 12.5, fontWeight: "600", fill: on ? CORALD : "#6E635B" })],
);

const spacerV = (h) => frame({ width: "fill_container", height: h, fill: "#00000000" });
const glogo = () => frame({ width: 20, height: 20, cornerRadius: 999, fill: "#FFFFFF", stroke: stroke(BORDER), layout: "horizontal", justifyContent: "center", alignItems: "center" }, [text("G", { fontFamily: DISPLAY, fontSize: 13, fontWeight: "700", fill: "#4285F4" })]);

// =====================================================================
// SCREEN 1 — SPLASH
// =====================================================================
function splash(x, y) {
  const g = { type: "gradient", gradientType: "linear", enabled: true, rotation: 155, size: { height: 1 }, colors: [{ color: "#F0563F", position: 0 }, { color: "#C7361F", position: 1 }] };
  return frame({ x, y, width: 390, height: 844, name: "Splash", fill: g, layout: "none" }, [
    ell({ x: 210, y: -120, width: 320, height: 320, fill: "#FFD1A180" }),
    ell({ x: -110, y: 560, width: 300, height: 300, fill: "#FFFFFF1f" }),
    // brand
    frame({ x: 30, y: 150, width: 54, height: 54, cornerRadius: 16, fill: "#FFFFFF29", stroke: stroke("#FFFFFF59", 1), layout: "horizontal", justifyContent: "center", alignItems: "center" }, [ic("map-pin", { width: 28, height: 28, fill: CREAM })]),
    text("Wayfare", { x: 98, y: 162, fontFamily: DISPLAY, fontSize: 30, fontWeight: "700", fill: CREAM }),
    // headlines
    text("Tell us where\nyou are.", { x: 30, y: 320, width: 340, textGrowth: "fixed-width", fontFamily: DISPLAY, fontSize: 44, fontWeight: "700", lineHeight: 1.05, fill: CREAM }),
    text("We'll plan\nwhere you go.", { x: 30, y: 440, width: 340, textGrowth: "fixed-width", fontFamily: DISPLAY, fontSize: 44, fontWeight: "700", lineHeight: 1.05, fill: "#FFD9A6" }),
    // footer
    text("AI-built itineraries for any trip — from your doorstep to anywhere.", { x: 30, y: 700, width: 300, textGrowth: "fixed-width", fontSize: 15, fontWeight: "500", lineHeight: 1.5, fill: "#FFF7F2d9" }),
    rect({ x: 30, y: 764, width: 22, height: 6, cornerRadius: 3, fill: CREAM }),
    rect({ x: 58, y: 764, width: 6, height: 6, cornerRadius: 3, fill: "#FFF7F280" }),
    rect({ x: 70, y: 764, width: 6, height: 6, cornerRadius: 3, fill: "#FFF7F280" }),
  ]);
}

// =====================================================================
// SCREEN 2 — ONBOARDING
// =====================================================================
function onboarding(x, y) {
  return frame({ x, y, width: 390, height: 844, name: "Onboarding", fill: BG, layout: "none" }, [
    text("Skip", { x: 322, y: 100, fontSize: 15, fontWeight: "600", fill: MUT }),
    // illustration panel
    frame({ x: 24, y: 128, width: 342, height: 300, cornerRadius: 26, fill: TINT, layout: "none" }, [
      ell({ x: -30, y: -40, width: 160, height: 160, fill: "#F0563F1a" }),
      ell({ x: 210, y: 190, width: 190, height: 190, fill: "#F4A24C29" }),
      frame({ x: 46, y: 44, width: 210, height: 42, cornerRadius: 14, fill: CARD, effect: shadow(6, 16, "#c4361f14"), layout: "horizontal", alignItems: "center", padding: 12 }, [text("Where are you starting from?", { fontSize: 12, fontWeight: "600" })]),
      frame({ x: 96, y: 96, width: 200, height: 42, cornerRadius: 14, fill: CORAL, layout: "horizontal", alignItems: "center", padding: 12 }, [text("Makati to Kyoto", { fontSize: 12, fontWeight: "600", fill: CREAM })]),
      frame({ x: 46, y: 150, width: 250, height: 62, cornerRadius: 16, fill: CARD, effect: shadow(6, 16, "#c4361f14"), layout: "horizontal", alignItems: "center", gap: 12, padding: 14 }, [
        ic("map-pin", { width: 26, height: 26, fill: CORAL }),
        vstack({ width: "fit_content", height: "fit_content", gap: 2 }, [text("5-day plan ready", { fontSize: 13, fontWeight: "700" }), text("3 styles · day-by-day", { fontSize: 11, fill: MUT })]),
      ]),
    ]),
    text("Plan any trip by\njust chatting", { x: 30, y: 470, width: 340, textGrowth: "fixed-width", fontFamily: DISPLAY, fontSize: 32, fontWeight: "700", lineHeight: 1.1, fill: INK }),
    text("Business, romance, family, or a solo adventure — describe it and get a day-by-day plan built around where you're coming from.", { x: 30, y: 560, width: 330, textGrowth: "fixed-width", fontSize: 16, fontWeight: "500", lineHeight: 1.5, fill: MUT }),
    // dots + button
    rect({ x: 30, y: 770, width: 22, height: 7, cornerRadius: 4, fill: CORAL }),
    rect({ x: 58, y: 770, width: 7, height: 7, cornerRadius: 4, fill: "#E4CFC4" }),
    rect({ x: 70, y: 770, width: 7, height: 7, cornerRadius: 4, fill: "#E4CFC4" }),
    button(210, 744, 150, "Next", { iconR: "arrow-right", effect: shadow(10, 22, "#f0563f52") }),
  ]);
}

// =====================================================================
// SCREEN 3 — REGISTER
// =====================================================================
function register(x, y) {
  return frame({ x, y, width: 390, height: 844, name: "Register", fill: BG, layout: "none" }, [
    frame({ x: 24, y: 96, width: 42, height: 42, cornerRadius: 12, fill: CARD, stroke: stroke(BORDER), layout: "horizontal", justifyContent: "center", alignItems: "center" }, [ic("chevron-left", { width: 20, height: 20, fill: INK })]),
    text("Create your account", { x: 24, y: 156, fontFamily: DISPLAY, fontSize: 30, fontWeight: "700", fill: INK }),
    text("Start planning smarter trips in seconds.", { x: 24, y: 198, fontSize: 15, fontWeight: "500", fill: MUT }),
    vstack({ x: 24, y: 240, width: 342, height: "fit_content", gap: 18 }, [
      labeledField("Full name", "user", "Kline Lozada"),
      labeledField("Email", "mail", "klinelozada@gmail.com"),
      labeledField("Password", "lock", "············", { trail: "eye" }),
    ]),
    button(24, 540, 342, "Create account", { effect: shadow(10, 22, "#f0563f4d") }),
    // divider
    rect({ x: 24, y: 626, width: 150, height: 1, fill: "#EAD9CE" }),
    text("or", { x: 188, y: 618, fontSize: 13, fontWeight: "600", fill: "#B6A99F" }),
    rect({ x: 216, y: 626, width: 150, height: 1, fill: "#EAD9CE" }),
    button(24, 652, 342, "Continue with Google", { fill: CARD, color: INK, height: 54, stroke: stroke(BORDER), fs: 15 }, ),
    hstack({ x: 24, y: 784, width: 342, height: 20, layout: "horizontal", justifyContent: "center", alignItems: "center", gap: 6 }, [text("Already have an account?", { fontSize: 14, fill: MUT }), text("Log in", { fontSize: 14, fontWeight: "700", fill: CORAL })]),
    // google G overlay (button label lacks icon slot for custom logo, add small G near start)
  ]);
}

// =====================================================================
// SCREEN 4 — LOGIN
// =====================================================================
function login(x, y) {
  return frame({ x, y, width: 390, height: 844, name: "Login", fill: BG, layout: "none" }, [
    frame({ x: 24, y: 104, width: 48, height: 48, cornerRadius: 14, fill: CORAL, effect: shadow(8, 18, "#f0563f47"), layout: "horizontal", justifyContent: "center", alignItems: "center" }, [ic("map-pin", { width: 24, height: 24, fill: CREAM })]),
    text("Wayfare", { x: 84, y: 116, fontFamily: DISPLAY, fontSize: 24, fontWeight: "700", fill: INK }),
    text("Welcome back", { x: 24, y: 186, fontFamily: DISPLAY, fontSize: 34, fontWeight: "700", fill: INK }),
    text("Log in to keep planning your trips.", { x: 24, y: 232, fontSize: 15, fontWeight: "500", fill: MUT }),
    vstack({ x: 24, y: 278, width: 342, height: "fit_content", gap: 18 }, [
      labeledField("Email", "mail", "klinelozada@gmail.com"),
      labeledField("Password", "lock", "············", { trail: "eye" }),
    ]),
    text("Forgot password?", { x: 258, y: 468, fontSize: 13, fontWeight: "700", fill: CORAL }),
    button(24, 500, 342, "Log in", { effect: shadow(10, 22, "#f0563f4d") }),
    rect({ x: 24, y: 586, width: 150, height: 1, fill: "#EAD9CE" }),
    text("or", { x: 188, y: 578, fontSize: 13, fontWeight: "600", fill: "#B6A99F" }),
    rect({ x: 216, y: 586, width: 150, height: 1, fill: "#EAD9CE" }),
    button(24, 612, 342, "Continue with Google", { fill: CARD, color: INK, height: 54, stroke: stroke(BORDER), fs: 15 }),
    hstack({ x: 24, y: 784, width: 342, height: 20, layout: "horizontal", justifyContent: "center", alignItems: "center", gap: 6 }, [text("New here?", { fontSize: 14, fill: MUT }), text("Create account", { fontSize: 14, fontWeight: "700", fill: CORAL })]),
  ]);
}

// =====================================================================
// SCREEN 5 — MAIN (AI CHAT)
// =====================================================================
function chat(x, y) {
  const ai = (content, w) => hstack({ width: w, height: "fit_content", cornerRadius: 16, fill: CARD, stroke: stroke("#F0E6DD"), layout: "horizontal", alignItems: "center", padding: 12 }, [text(content, { fontSize: 14, fontWeight: "500", width: w - 26, textGrowth: "fixed-width", lineHeight: 1.4 })]);
  const me = (content) => hstack({ width: "fit_content", height: "fit_content", cornerRadius: 16, fill: CORAL, layout: "horizontal", alignItems: "center", padding: 12 }, [text(content, { fontSize: 14, fontWeight: "600", fill: CREAM })]);
  const sumCell = (label, value, o = {}) => vstack({ width: "fill_container", height: "fit_content", gap: 2 }, [text(label, { fontSize: 11, fontWeight: "600", fill: o.lc ?? "#A0938A" }), text(value, { fontSize: 14, fontWeight: "700", fill: o.vc ?? INK })]);

  return frame({ x, y, width: 390, height: 844, name: "Chat (Main)", fill: BG, layout: "none" }, [
    // header
    frame({ x: 0, y: 50, width: 390, height: 58, fill: BG, stroke: stroke("#F0E6DD", 1), layout: "horizontal", alignItems: "center", gap: 12, padding: 18 }, [
      ic("chevron-left", { width: 22, height: 22, fill: INK }),
      frame({ width: 34, height: 34, cornerRadius: 10, fill: CORAL, layout: "horizontal", justifyContent: "center", alignItems: "center" }, [ic("sparkles", { width: 18, height: 18, fill: CREAM })]),
      vstack({ width: "fill_container", height: "fit_content", gap: 1 }, [text("New trip", { fontFamily: DISPLAY, fontSize: 15, fontWeight: "700" }), text("AI trip planner", { fontSize: 11.5, fill: MUT })]),
      ic("more-vertical", { width: 18, height: 18, fill: "#6E635B" }),
    ]),
    // conversation
    vstack({ x: 16, y: 120, width: 358, height: "fit_content", gap: 8 }, [
      ai("Hi! Where are you starting from?", 250),
      hstack({ width: "fill_container", height: "fit_content", layout: "horizontal", justifyContent: "end" }, [me("Makati, Metro Manila")]),
      ai("Nice — and where to?", 200),
      hstack({ width: "fill_container", height: "fit_content", layout: "horizontal", justifyContent: "end" }, [me("Kyoto, Japan")]),
      ai("What's the occasion?", 200),
      hstack({ width: "fill_container", height: "fit_content", layout: "horizontal", gap: 7 }, [chip("Couple", true), chip("Business"), chip("Family"), chip("Solo")]),
      // trip summary card
      vstack({ width: "fill_container", height: "fit_content", cornerRadius: 18, fill: CARD, stroke: stroke("#F0E6DD"), effect: shadow(10, 26, "#c4361f12"), layout: "vertical", gap: 12, padding: 14 }, [
        hstack({ width: "fill_container", height: "fit_content", layout: "horizontal", alignItems: "center", gap: 8 }, [ic("clipboard-check", { width: 16, height: 16, fill: CORAL }), text("Trip summary", { fontFamily: DISPLAY, fontSize: 15, fontWeight: "700" })]),
        hstack({ width: "fill_container", height: "fit_content", layout: "horizontal", alignItems: "center", gap: 10 }, [
          vstack({ width: "fill_container", height: "fit_content", cornerRadius: 12, fill: BG, gap: 2, padding: 10 }, [text("FROM", { fontSize: 10, fontWeight: "700", fill: "#A0938A" }), text("Makati, MNL", { fontSize: 14, fontWeight: "700" })]),
          ic("arrow-right", { width: 18, height: 18, fill: "#C4B6AB" }),
          vstack({ width: "fill_container", height: "fit_content", cornerRadius: 12, fill: TINT, gap: 2, padding: 10 }, [text("TO", { fontSize: 10, fontWeight: "700", fill: "#D8807A" }), text("Kyoto, JP", { fontSize: 14, fontWeight: "700", fill: CORALD })]),
        ]),
        hstack({ width: "fill_container", height: "fit_content", layout: "horizontal", gap: 12 }, [sumCell("PURPOSE", "Anniversary"), sumCell("DATES", "Nov 8 – 12")]),
        hstack({ width: "fill_container", height: "fit_content", layout: "horizontal", gap: 12 }, [sumCell("TRAVELERS", "2 adults"), sumCell("BUDGET · PACE", "Mid · Relaxed")]),
        button(0, 0, "fill_container", "Generate 3 plans", { icon: "sparkles", height: 50, r: 14, effect: shadow(8, 18, "#f0563f47") }),
      ]),
    ]),
    // input bar
    frame({ x: 0, y: 770, width: 390, height: 74, fill: BG, stroke: stroke("#F0E6DD", 1), layout: "horizontal", alignItems: "center", gap: 10, padding: 16 }, [
      hstack({ width: "fill_container", height: 48, cornerRadius: 24, fill: CARD, stroke: stroke(BORDER), layout: "horizontal", alignItems: "center", padding: 16 }, [text("Message Wayfare…", { fontSize: 14, fontWeight: "500", fill: "#B6A99F" })]),
      frame({ width: 48, height: 48, cornerRadius: 24, fill: CORAL, effect: shadow(6, 16, "#f0563f52"), layout: "horizontal", justifyContent: "center", alignItems: "center" }, [ic("send", { width: 20, height: 20, fill: CREAM })]),
    ]),
  ]);
}

// =====================================================================
// SCREEN 6 — PROPOSALS
// =====================================================================
function proposals(x, y) {
  const pcard = (yy, tag, tagBg, tagC, accent, name, desc, price, meta) => frame({ x: 22, y: yy, width: 346, height: 150, cornerRadius: 20, fill: CARD, stroke: stroke("#F0E6DD"), effect: shadow(10, 26, "#c4361f0f"), layout: "none" }, [
    rect({ x: 0, y: 0, width: 5, height: 150, fill: accent }),
    hstack({ x: 16, y: 14, width: "fit_content", height: "fit_content", cornerRadius: 999, fill: tagBg, layout: "horizontal", alignItems: "center", padding: 8 }, [text(tag, { fontSize: 11, fontWeight: "700", fill: tagC })]),
    text(meta, { x: 250, y: 18, fontSize: 12, fontWeight: "600", fill: "#A0938A" }),
    text(name, { x: 16, y: 46, fontFamily: DISPLAY, fontSize: 21, fontWeight: "700" }),
    text(desc, { x: 16, y: 78, width: 314, textGrowth: "fixed-width", fontSize: 13.5, fontWeight: "500", lineHeight: 1.45, fill: MUT }),
    vstack({ x: 16, y: 118, width: "fit_content", height: "fit_content", gap: 1 }, [text("Est. total · 2 pax", { fontSize: 11, fontWeight: "600", fill: "#A0938A" }), text(price, { fontSize: 16, fontWeight: "700", fill: accent })]),
    hstack({ x: 250, y: 122, width: "fit_content", height: "fit_content", layout: "horizontal", alignItems: "center", gap: 5 }, [text("View plan", { fontSize: 13, fontWeight: "700", fill: accent }), ic("arrow-right", { width: 15, height: 15, fill: accent })]),
  ]);
  return frame({ x, y, width: 390, height: 844, name: "Proposals", fill: BG, layout: "none" }, [
    hstack({ x: 22, y: 58, width: "fit_content", height: "fit_content", layout: "horizontal", alignItems: "center", gap: 12 }, [ic("chevron-left", { width: 22, height: 22, fill: INK }), text("Your plans", { fontSize: 14, fontWeight: "600", fill: MUT })]),
    text("Kyoto · 5 days", { x: 22, y: 96, fontFamily: DISPLAY, fontSize: 30, fontWeight: "700" }),
    hstack({ x: 22, y: 140, width: "fit_content", height: "fit_content", layout: "horizontal", alignItems: "center", gap: 8 }, [ic("map-pin", { width: 15, height: 15, fill: CORAL }), text("from Makati · Anniversary · 2 travelers", { fontSize: 13, fontWeight: "600", fill: MUT })]),
    text("Pick a style — you can tweak any day after.", { x: 22, y: 170, fontSize: 13, fontWeight: "600", fill: "#A0938A" }),
    pcard(196, "BALANCED", TINT, CORALD, CORAL, "Classic Kyoto", "The essentials at an easy rhythm — Fushimi Inari, Arashiyama, Gion, and Nishiki Market.", "¥118k – 165k", "5 days · 11 stops"),
    pcard(360, "ROMANTIC", "#FBE4EE", ROSED, ROSE, "Slow & Romantic", "Late starts, a ryokan night, kaiseki dinners, and quiet temple gardens for two.", "¥146k – 210k", "5 days · 9 stops"),
    pcard(524, "FOOD & TEMPLES", "#F7ECD8", GOLDD, GOLD, "Temples & Food", "Maximize it — sunrise shrines, a Nara day trip, and a Pontocho food crawl.", "¥124k – 178k", "5 days · 13 stops"),
    button(22, 700, 346, "Regenerate with tweaks", { fill: CARD, color: INK, height: 50, r: 14, stroke: stroke(BORDER), icon: "refresh-cw", iconFill: CORAL, fs: 14.5 }),
  ]);
}

// =====================================================================
// SCREEN 7 — ITINERARY
// =====================================================================
function itinerary(x, y) {
  const pill = (label, c, bg, bd) => hstack({ width: "fit_content", height: "fit_content", cornerRadius: 8, fill: bg, stroke: stroke(bd, 1), layout: "horizontal", alignItems: "center", padding: 8 }, [text(label, { fontSize: 11.5, fontWeight: "700", fill: c })]);
  const tchip = (label) => hstack({ width: "fit_content", height: "fit_content", cornerRadius: 999, fill: BG, layout: "horizontal", alignItems: "center", padding: 8 }, [text(label, { fontSize: 11.5, fontWeight: "600", fill: "#6E635B" })]);
  const dayCard = (yy, h, day, badge, title, extra) => frame({ x: 50, y: yy, width: 320, height: h, cornerRadius: 16, fill: CARD, stroke: stroke("#F0E6DD"), effect: shadow(6, 18, "#c4361f0d"), layout: "none" }, [
    text(day, { x: 14, y: 14, fontFamily: DISPLAY, fontSize: 13, fontWeight: "700" }),
    text(badge, { x: 230, y: 15, fontSize: 11.5, fontWeight: "600", fill: MUT }),
    text(title, { x: 14, y: 36, fontFamily: BODY, fontSize: 17, fontWeight: "700" }),
    ...extra,
  ]);
  const railDot = (yy) => ell({ x: 24, y: yy, width: 13, height: 13, fill: ROSE });
  const railLine = (yy, h) => rect({ x: 29, y: yy, width: 2, height: h, fill: "#F0E0E8" });
  return frame({ x, y, width: 390, height: 844, name: "Itinerary", fill: BG, layout: "none" }, [
    // header row
    hstack({ x: 20, y: 58, width: 350, height: 24, layout: "horizontal", justifyContent: "space_between", alignItems: "center" }, [ic("chevron-left", { width: 22, height: 22, fill: INK }), hstack({ width: "fit_content", height: "fit_content", layout: "horizontal", gap: 14 }, [ic("share", { width: 21, height: 21, fill: "#6E635B" }), ic("heart", { width: 21, height: 21, fill: "#6E635B" })])]),
    // summary card
    frame({ x: 18, y: 96, width: 354, height: 150, cornerRadius: 20, fill: ROSE, layout: "none" }, [
      hstack({ x: 18, y: 16, width: "fit_content", height: "fit_content", cornerRadius: 999, fill: "#FFFFFF33", layout: "horizontal", alignItems: "center", padding: 7 }, [text("ROMANTIC", { fontSize: 11, fontWeight: "700", fill: CREAM })]),
      text("Slow & Romantic", { x: 18, y: 52, fontFamily: DISPLAY, fontSize: 27, fontWeight: "700", fill: "#FFF3F8" }),
      text("Kyoto · from Makati · Nov 8–12", { x: 18, y: 90, fontSize: 13, fontWeight: "500", fill: "#FFF3F8d9" }),
      vstack({ x: 18, y: 112, width: "fit_content", height: "fit_content", gap: 2 }, [text("Est. total", { fontSize: 11, fontWeight: "600", fill: "#FFF3F8bf" }), text("¥146k–210k", { fontFamily: DISPLAY, fontSize: 17, fontWeight: "700", fill: CREAM })]),
      vstack({ x: 150, y: 112, width: "fit_content", height: "fit_content", gap: 2 }, [text("Local travel", { fontSize: 11, fontWeight: "600", fill: "#FFF3F8bf" }), text("¥18k", { fontFamily: DISPLAY, fontSize: 17, fontWeight: "700", fill: CREAM })]),
      vstack({ x: 260, y: 112, width: "fit_content", height: "fit_content", gap: 2 }, [text("Days", { fontSize: 11, fontWeight: "600", fill: "#FFF3F8bf" }), text("5", { fontFamily: DISPLAY, fontSize: 17, fontWeight: "700", fill: CREAM })]),
    ]),
    // timeline rail
    railDot(276), railLine(289, 175),
    railDot(476), railLine(489, 130),
    railDot(626),
    // Day 1
    dayCard(270, 190, "Day 1 · Sat, Nov 8", "Arrival", "Arrive & Gion evening", [
      hstack({ x: 14, y: 64, width: "fit_content", height: "fit_content", layout: "horizontal", gap: 6 }, [tchip("Gion"), tchip("Train from KIX")]),
      text("Check in, settle, then a lantern-lit stroll along Shirakawa and dinner in Pontocho.", { x: 14, y: 98, width: 292, textGrowth: "fixed-width", fontSize: 13, fontWeight: "500", lineHeight: 1.45, fill: "#6E635B" }),
      hstack({ x: 14, y: 138, width: "fit_content", height: "fit_content", layout: "horizontal", gap: 8 }, [pill("Travel ¥3,400", "#B45309", "#FBF1DF", "#F0D9AE"), pill("Food ¥6k–11k", "#0E7490", "#E7F6F9", "#BEE6EE")]),
      hstack({ x: 14, y: 166, width: "fit_content", height: "fit_content", layout: "horizontal", alignItems: "center", gap: 5 }, [ic("map-pin", { width: 14, height: 14, fill: ROSE }), text("Gion, Kyoto · Open in Maps", { fontSize: 12.5, fontWeight: "700", fill: ROSE })]),
    ]),
    // Day 2
    dayCard(470, 145, "Day 2 · Sun, Nov 9", "Temples", "Arashiyama & bamboo", [
      hstack({ x: 14, y: 64, width: "fit_content", height: "fit_content", layout: "horizontal", gap: 6 }, [tchip("Arashiyama"), tchip("Sagano line")]),
      text("Bamboo grove at opening, Tenryu-ji garden, riverside lunch, couples' onsen after.", { x: 14, y: 98, width: 292, textGrowth: "fixed-width", fontSize: 13, fontWeight: "500", lineHeight: 1.4, fill: "#6E635B" }),
    ]),
    // Day 3 (peek)
    dayCard(620, 70, "Day 3 · Mon, Nov 10", "Ryokan", "Kaiseki & ryokan night", []),
  ]);
}

// ---- assemble canvas ----
const R1 = 0, R2 = 944;
const doc = {
  version: "2.13",
  children: [
    splash(0, R1), onboarding(490, R1), register(980, R1), login(1470, R1),
    chat(0, R2), proposals(490, R2), itinerary(980, R2),
  ],
};
fs.writeFileSync(OUT, JSON.stringify(doc, null, 2) + "\n", "utf8");
console.log(`wrote ${OUT} — ${doc.children.length} frames, ${_n} nodes`);
