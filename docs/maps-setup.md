# Maps & keys — setup

**TL;DR: the map needs no API key to work.** It renders today with a keyless
basemap. Keys only buy you (a) a nicer *cinematic vector* basemap and (b) Google
place **photos/reviews** — two optional upgrades, added independently.

Here is every key the whole system can use, where each goes, and why.

| What | Key needed? | Where it goes | Purpose |
|---|---|---|---|
| **Map basemap** (MapLibre) | **No** (default) | — | Renders keyless (OSM raster, darkened) |
| Cinematic *vector* basemap | **No** with Protomaps self-host / **Yes** with MapTiler | `app/.env.local` → `EXPO_PUBLIC_MAP_STYLE_URL` | The true dark vector look |
| **Walking routes** (OSRM) | **No** | `app/.env.local` → `EXPO_PUBLIC_OSRM_URL` (optional self-host) | Route lines + ETA |
| **Place photos + reviews** | **Yes** (Google) | `server/.env` → `GOOGLE_MAPS_API_KEY` | Enrichment (NOT the map) |
| AI generation | already set | `server/.env` → `OPENAI_API_KEY` | 3 proposals |

Two rules that matter:
- **`EXPO_PUBLIC_*` values are public** — they ship inside the app bundle. Only put
  restrictable, non-secret values there (a MapTiler key is OK *if domain-restricted*;
  a Google key is **never** OK there — it lives server-side only).
- **`server/.env` is secret** and gitignored. The Google key goes here.

---

## 1) The map basemap

### Default (do nothing) — keyless
Out of the box the map uses OpenStreetMap raster tiles, darkened to our night
palette. No key, no account, renders immediately. Good for dev.

### Upgrade to the cinematic vector look — pick ONE:

**Option A — Protomaps, self-hosted ($0 forever, no key)** ← our chosen path
You only need to host **one file** (the `.pmtiles`). The Wayfare dark **vector
style is already bundled** in the app (`src/components/wayfare/protomaps-dark.ts`,
generated from Protomaps' official v4 "dark" theme + our night tint), and
`buildBaseStyle()` builds the style around your file automatically.

1. Get a `.pmtiles` extract for your area (much smaller than the planet):
   ```
   npm i -g pmtiles
   # from a planet/region build (https://maps.protomaps.com/builds/), clip to Metro Manila:
   pmtiles extract <planet-or-region>.pmtiles wayfare-manila.pmtiles \
     --bbox=120.98,14.48,121.10,14.60
   ```
2. Host that one file on any static host (S3/R2/Cloudflare/your own server) over
   HTTPS with CORS enabled, e.g. `https://yourhost.com/wayfare-manila.pmtiles`.
3. In `app/.env.local`:
   ```
   EXPO_PUBLIC_PMTILES_URL=https://yourhost.com/wayfare-manila.pmtiles
   ```
   Restart `npm run web` → the cinematic vector map renders. No key, no separate
   style hosting. (The app registers the `pmtiles://` protocol itself.)

_Regenerate the bundled style_ (e.g. to re-tint) — from `app/`:
```
npm i --no-save protomaps-themes-base
node -e "const t=require('protomaps-themes-base');const L=t.layers('protomaps','dark');for(const x of L){if(x.id==='background')x.paint={...x.paint,'background-color':'#17123A'};if(x.id==='earth')x.paint={...x.paint,'fill-color':'#17123A'};if(x.id==='water')x.paint={...x.paint,'fill-color':'#1B1550'};}require('fs').writeFileSync('src/components/wayfare/protomaps-dark.ts',\"/* eslint-disable */\nexport const PROTOMAPS_GLYPHS='https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf';\nexport const PROTOMAPS_SPRITE='https://protomaps.github.io/basemaps-assets/sprites/v4/dark';\nexport const PROTOMAPS_DARK_LAYERS:any[]=\"+JSON.stringify(L)+';\n')"
```

**Option B — MapTiler (fastest, free tier, needs a key)**
1. Sign up at <https://www.maptiler.com/> → **Account → Keys** → copy your key.
2. **Restrict it**: in the MapTiler dashboard, add your domain(s) (and
   `localhost` for dev) to the key's allowed origins.
3. In `app/.env.local`:
   ```
   EXPO_PUBLIC_MAP_STYLE_URL=https://api.maptiler.com/maps/streets-v2-dark/style.json?key=YOUR_MAPTILER_KEY
   ```
   (Any of their dark styles work; `streets-v2-dark` is a good start.)

Either way: set the var, restart `npm run web`, and the map swaps from the keyless
stand-in to the vector style — no code change.

---

## 2) Walking routes (OSRM) — no key
Routes + ETAs use the free public OSRM demo server by default. For production
reliability, run your own OSRM and set:
```
EXPO_PUBLIC_OSRM_URL=https://your-osrm-host
```

---

## 3) Place photos + reviews (Google) — the only real key
This is a **separate feature** from the map — it fetches venue **photos, reviews,
hours, ratings** on finalize (cached; see `docs/places-caching-design.md`). The map
does not use it.

1. Google Cloud Console → create/select a project → **APIs & Services → Library →
   enable "Places API (New)"**.
2. **APIs & Services → Credentials → Create credentials → API key.**
3. **Restrict the key** (important): Application restriction = your server's IP;
   API restriction = **Places API (New)** only.
4. Put it in **`server/.env`** (already scaffolded, currently empty):
   ```
   GOOGLE_MAPS_API_KEY=your-key-here
   ```
5. Restart the server. `GET /health` should then show `"places":"google"` (it says
   `"stub"` while the key is empty).

Cost: roughly $0 at early scale (free tier + dedupe); see the places-caching doc.

---

## Where things live
- **`app/.env.local`** (gitignored) — `EXPO_PUBLIC_MAP_STYLE_URL`, `EXPO_PUBLIC_OSRM_URL`.
  Template: `app/.env.example`.
- **`server/.env`** (gitignored, secret) — `GOOGLE_MAPS_API_KEY`, `OPENAI_API_KEY`,
  Firebase, `AUTH_SECRET`. Template: `server/.env.example`.

After editing `app/.env.local`, restart Expo (`npm run web`). After editing
`server/.env`, restart the server.
