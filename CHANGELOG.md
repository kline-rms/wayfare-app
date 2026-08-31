# Changelog

All notable changes to Wayfare. Format based on [Keep a Changelog](https://keepachangelog.com/);
this project uses [Semantic Versioning](https://semver.org/).

## [2.7.0] — 2026-08-31

### Added
- **Google Places cost reference.** A local interactive HTML (`app/public/places-cost.html`)
  — cost calculator + full SKU menu (what we pull vs. everything Google offers), the
  three cost buckets (facts cached-once, photos lazy/~1h reuse, reviews on-demand and
  never stored), and the recrawl rules. Built on the server's real cost model
  (`google.ts`). Opens from **Profile → "Google Places cost"**. No crawl is turned on —
  we're still at $0 spent; this is the pre-spend reference.

## [2.6.0] — 2026-08-31

### Added
- **Reimbursement proof + e-signature + notifications.** Settle a payer in a
  dedicated flow: upload the **GCash/bank transfer screenshot** as proof, capture
  the payee's **signature** (sign-pad → SVG), confirm → records a **Reimbursement**
  (proof + signature), marks the batch **paid + linked**, and posts a
  "Reimbursed ₱X to {payer}" event to **Alerts** (the in-app notification). Alerts
  is now driven by real reimbursement events. **Void** a reimbursement reverts its
  expenses to unpaid.
- New: `Signature` / `Reimbursement` types + `Itinerary.reimbursements` +
  `Expense.reimbursementId`; `POST /api/itineraries/:id/reimburse` +
  `DELETE …/reimbursements/:rid`; `SignaturePad` component + `settle.tsx`;
  `api.reimburse` / `voidReimbursement`.

### Fixed
- Firestore now uses `ignoreUndefinedProperties` — optional fields (no note, no
  memberId, no proof) no longer 500 the write.

## [2.5.0] — 2026-08-31

### Added
- **Sharing & companions (dynamic).** A **"Who else should know this trip?"** roster —
  add anyone with any relation and role (viewer / editor), then hand them a **share
  link**. Links resolve to a **read-only shared trip view** (public; the token embeds
  the itinerary id so it resolves without a scan). Nothing is hardcoded to
  "sister-in-law" — expense **payers** now come from this roster too.
- New: `Member` / `Share` types + `Itinerary.members` / `shares`; member CRUD +
  share create/delete + public `GET /api/shared/:token`; `companions.tsx` +
  `shared/[token].tsx`; `api.addMember`/`updateMember`/`removeMember`/`createShare`/
  `removeShare`/`getShared`; entries from the trip header + Reimbursements.

## [2.4.0] — 2026-08-31

### Added
- **Reimbursement ledger + receipt OCR.** Snap/upload a receipt → **vision OCR**
  (gpt-4o-mini) reads merchant / date / itemized lines / total → review → it lands
  in the trip's **expense ledger**. Filter by **period** (week / month / trip / all),
  **status** (unpaid / paid / all), and **payer**; running **unpaid total**; **"Settle N"**
  batch mark-paid; expand a row to see the **receipt image + itemized list**; mark
  paid / remove. Entry from Profile → Reimbursements. Money moves outside the app
  (GCash/bank) — Wayfare records & proves it; proof + signature come next.
- New: `POST /api/receipts/parse`, `POST`/`PATCH`/`DELETE /api/itineraries/:id/expenses`;
  `chatVisionJson`; `Itinerary.expenses` + `Expense`/`ExpenseItem` types;
  `add-expense.tsx` + `reimbursements.tsx`; `api.parseReceipt`/`addExpense`/`updateExpense`/`removeExpense`.

### Changed
- `useAsync`-backed screens (Day, Reimbursements) keep the current data during a
  refetch instead of flashing a full-screen spinner after an edit.

## [2.3.0] — 2026-08-31

### Added
- **Add-a-stop.** Insert a place into a specific day (e.g. Star City on Sat Sep 12):
  search → geocode (Nominatim) → pick time / type / cost. It's **insert-only** — the
  rest of the plan is never re-sorted or re-generated. Added stops get a coral map
  pin + **ADDED** badge + an **×** to remove (undo); the form **flags** a time that
  overlaps an existing block. Non-destructive guarantees are enforced server-side:
  originals can't be removed and shared samples keep their `ownerId`.
- New endpoints `POST` / `DELETE /api/itineraries/:id/activities`; `lib/geocode.ts`,
  reactive `lib/edits.ts`, `api.addActivity` / `removeActivity`; additive
  `Activity.added` flag (shared + app types).

## [2.2.0] — 2026-08-31

### Added
- **Time-and-place-aware dining guide.** Dining stops now surface order
  **suggestions** automatically: the block's time names the meal (Breakfast /
  Brunch / Lunch / Merienda / Dinner), and the meal happening **now** (on today's
  trip day, by the real clock) gets a **● NOW** badge and floats to the top. Cards
  show "Suggestions for N people · order what you like", the dish list, and the
  note "Just a guide — nothing's fixed." Appears on the Day page (a "Dining guide"
  section), Activity detail, and Place detail. New `lib/dining.ts` +
  `components/wayfare/dining-guide.tsx`.

### Removed
- The manual **"I'm here · check in"** confirmation on Place detail — presence at a
  dining stop is now inferred from time + place instead of a button tap.

## [2.1.0] — 2026-08-31

### Added
- **Home itinerary switcher.** Home now shows a swipeable row of *all* your trips
  ("Your trips · N"); selecting one makes it the active trip and the map re-routes
  and re-pins to it while the LIVE chip / title / progress / "Next" follow. Tapping
  the active card (or "Open this trip") opens the full itinerary. Home previously
  showed only the primary trip.

### Changed
- Home loads all itineraries up-front so switching between them is instant.

## [2.0.0] — 2026-08-31

The **Map-first 3D redesign**: the app is now a fixed cinematic-night experience where
every screen is a glass sheet over a live, interactive 3D map — matching Approach 2 of
`design/app-preview.html`, lane by lane.

### Added
- **Real 3D map.** Keyless OpenFreeMap dark vector basemap with Google-style **3D
  building extrusions**, camera tilt, **compass rotation**, zoom controls, and
  clickable pins that open an info popup.
- **In-app navigation.** The route map gained a stops list, weather chip, and an
  immersive **nav mode** (turn card + GPS tiles + "End · I'm here").
- **Collapsible night sheet** (`MapFirst`) with a draggable handle and map focus/fit.
- **Brand kit** (`design/brand-kit.html`) — story, mission/vision, values, logo, full
  color + type systems, voice, and UI language.
- **Optimized e2e harness** (`app/e2e/smoke.mjs`, `npm run e2e`) — one Playwright
  session walks the whole app, capturing per-screen errors + screenshots.
- **route-W logo** component and gradient category tiles.
- `app/scripts/copy-maplibre-worker.mjs` (wired to install/start hooks).

### Changed
- **Pinned the app to the night theme**; dark palette aligned 1:1 to the design tokens.
- Night-styled chips/status pills; night glass fields; every screen restructured
  map-first (auth, tabs, create, propose/edit, live trip, settings).
- Trip Overview and Day rebuilt (title + date, summary strip, list/swipe day toggle,
  schedule slider, navigate). The 3D companion now lives on the **Generating** screen.
- Roads brightened and reordered so **buildings occlude roads behind them** by camera.

### Fixed
- **MapLibre "AJAX error" on map screens.** Under Metro the worker URL 404'd (and
  threw `AJAXError`); the worker is now copied into `public/` and set via
  `setWorkerUrl`. Vector tiles render correctly.
- Removed the on-map walking mannequin (the requested 3D is the *map*, not a character).
- Several light-on-dark color bugs (invisible create-flow icon tiles, light chips).

## [1.0.0] — 2026-08-24

Initial Wayfare app.

### Added
- ~22-screen navigable app on bundled data with a warm-neutral light + Nightfall dark
  design, the AI orb, and hand-ported SVG icons.
- Fastify read API, shared TypeScript types, and the design canvas.
- Installable Android APK (arm64-v8a) under `releases/`.

[2.7.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.7.0
[2.6.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.6.0
[2.5.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.5.0
[2.4.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.4.0
[2.3.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.3.0
[2.2.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.2.0
[2.1.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.1.0
[2.0.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.0.0
[1.0.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v1.0.0
