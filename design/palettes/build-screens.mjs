// Renders Main, Proposals, Itinerary in all 4 palettes (3 rows × 4 cols)
// for side-by-side comparison on real screens. Run: node build-screens.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { screens, wrap, PALETTES } from "../build-dc.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SCREENS = ["Main", "Proposals", "Itinerary"];
const PALS = ["Tangerine", "Tropical", "Electric", "Sunset"];
const W = 390, H = 844, GX = 90, GY = 150;

const artboards = [];
SCREENS.forEach((s, r) => {
  PALS.forEach((p, c) => {
    const file = `${s}_${p}.dc.html`;
    fs.writeFileSync(path.join(DIR, file), wrap(s, screens[s], PALETTES[p]), "utf8");
    artboards.push({ file, x: c * (W + GX), y: r * (H + GY), w: W, h: H, title: `${s} · ${PALETTES[p].label}` });
  });
});

const canvas = {
  artboards,
  annotations: [
    { id: "t", x: 0, y: -140, w: 900, text: "Wayfare — Proposals · Itinerary · Chat, in 4 colorways\nColumns = palettes (Tangerine · Tropical · Electric · Sunset). Rows = screens. Rounder cards + colored CTAs applied. Pick a column." },
    ...PALS.map((p, c) => ({ id: `p${c}`, x: c * (W + GX), y: -40, w: W, text: PALETTES[p].label })),
  ],
  launch: { view: "canvas" },
};
fs.writeFileSync(path.join(DIR, "canvas.json"), JSON.stringify(canvas, null, 2) + "\n", "utf8");
console.log(`wrote ${artboards.length} artboards (${SCREENS.length}×${PALS.length}) + canvas.json`);
