# Changelog

All notable changes to Wayfare. Format based on [Keep a Changelog](https://keepachangelog.com/);
this project uses [Semantic Versioning](https://semver.org/).

## [2.23.0] — 2026-09-05

### Added
- **Free-form AI planner.** A "Describe your trip" entry lets you type the whole
  request in one message ("plan a BGC trip with my 3 kids 11/10/2, Sep 9–14, make
  it beautiful, we stay at Avida Verte"). New `POST /api/generate/parse` extracts a
  structured request (origin, dates, party, pace, budget, interests, constraints)
  and flags what's missing — usually just the destination, which the screen asks
  back inline — then runs the existing generate → proposals → save pipeline. New
  `create/plan.tsx` + `api.parsePlan`. Verified end-to-end (parse, ask-destination,
  full generate to proposals); 8/8 smoke.

## [2.22.1] — 2026-09-05

### Fixed
- **Found by a full E2E run (registration → navigation).** (1) The routing proxy
  now returns a straight-line fallback (200) when the upstream OSRM hiccups,
  instead of a 502 that logged a console error on the day map. (2) Place detail
  loads the trip it was opened from (was always `list[0]`), falling back to
  finding the trip that contains the place. UI walkthrough 14/14, smoke 8/8.

## [2.22.0] — 2026-09-05

### Added
- **Push notifications (pre-wired).** A settled reimbursement now sends a real
  push to the trip's other accounts (owner + accepted collaborators, not the
  settler), beyond the in-app Alerts. New: `pushTokens` on the user + `updateUser`
  in both repos, `POST/DELETE /api/push/register`, server `sendPush` (Expo push
  service), the reimburse trigger, client `lib/push` (permission + token +
  register + tap routing, init on login), `api.registerPush`. Verified end-to-end:
  register dedupes, settle notified 1 device (actor excluded); 8/8 smoke clean.
  Real phone delivery needs a dev build + APNs/FCM credentials.

## [2.21.0] — 2026-09-05

### Changed
- **Google-Maps-style walking navigation.** The navigator now turns the map to
  your travel direction (device compass, else route-up toward the path ahead), so
  you always walk "up"; the camera is tilted and rides behind you with the pointer
  low and the road ahead. The "you" marker is a Google-style **navigation chevron**
  that stays aligned to your true facing as the map rotates (and the map is
  rotatable). The 2D toggle still flattens it; trip/day maps keep a plain dot.
  Applied to web + native maps. (True compass heading-up needs a device; on web it
  falls back to route-up.)

## [2.20.1] — 2026-09-05

### Fixed
- **Places adopt Google's authoritative coordinates.** `finalize` now overwrites a
  resolved place's (and matched activity's) lat/lng with the cached Google
  location and stamps `coordinateSource: "Google Places"`, so a bad AI/import
  coordinate (e.g. a hallucinated latitude putting a BGC venue ~300 km out to sea)
  self-corrects on crawl — retroactive by re-finalizing with the gate on.

## [2.20.0] — 2026-09-05

### Added
- **Native MapLibre map (pre-wired).** `wayfare-map.tsx` now renders a real
  MapLibre map on native (`@maplibre/maplibre-react-native` v11) — dark vector
  ground, camera driven by the same `focus`/`stops` props as web, a GeoJSON route
  line, numbered pins and a directional "you" puck — replacing the static SVG
  preview. Web is unaffected (native-only import; still 8/8 smoke). Renders in a
  custom dev build (see `docs/NATIVE-BUILD.md`); 3D building extrusions are the
  next on-device step. Type-checks against the real MapLibre types.

## [2.19.1] — 2026-09-05

### Changed
- **Navigator shows more map.** The bottom "Navigating to" sheet now starts
  minimized (drag up for the steps), and the current-location pointer stays
  centred in the *visible* map — the chase-cam offset tracks the sheet's coverage
  so the dot never hides behind the panel.

## [2.19.0] — 2026-09-05

### Added
- **Native dev-build path (EAS).** `eas.json` with a dev-client `development`
  profile (+ preview/production), `expo-dev-client`, and `app.json` location +
  notification plugins so a custom dev build carries the right native permissions.
  `docs/NATIVE-BUILD.md` walks through building/installing/running it and the
  on-device follow-ons (MapLibre-native map, push). Validated here: `expo config`
  resolves all plugins and the web build is unaffected; the device build runs on
  the developer's machine (EAS + signing credentials).

## [2.18.1] — 2026-09-05

### Fixed
- **No failed photo requests when the Places gate is off.** `getPlaceCard` now
  omits photo URLs unless the gate allows resolving them, so cards fall back to
  stock immediately instead of firing a `/photo` request that 404s (ORB-blocked).

### Housekeeping
- Restored Playwright so the smoke suite runs (8/8 clean). Kept the Places gate
  **OFF** as the default (money-safe). Added the graphify DFD that v2.18.0 was
  missing — every report section now carries one.

## [2.18.0] — 2026-09-05

### Changed
- **Routing now goes through our server (self-host-ready).** New cached
  `GET /api/route/:profile` proxy with a single configurable upstream — set
  `OSRM_URL` to a self-hosted OSRM for production (default: FOSSGIS per-mode).
  Clients no longer hit third-party routing directly (`EXPO_PUBLIC_OSRM_URL` still
  bypasses for dev). Verified: drive/walk correct through the proxy, cache ~36 ms,
  navigator routes via `/api/route`.

## [2.17.0] — 2026-09-05

### Added
- **Cross-account auth.** A share link now adds the trip to the recipient's own
  account. New `POST /shared/:token/accept` records the account + the share's role
  on the trip (`access[]` / `accessUserIds[]`, idempotent, viewer→editor upgrade);
  `canRead` includes accepted accounts and a new `canWrite` limits edits to the
  owner or an accepted editor (viewers are read-only). Both repos list accepted
  trips (Firestore `array-contains`). The shared page gains "Add to my trips"
  (with role) when signed in, or a log-in prompt otherwise. Verified with two
  accounts: 403 before / 200 after, appears in the list, viewer refused, editor
  allowed, owner can revoke.

## [2.16.0] — 2026-09-05

### Added
- **Split-party assignment.** Assign which travellers/companions are on each stop
  — a parent can peel off (work) while the kids + companions continue. New
  `Activity.attendees`, a `PATCH …/activities/:id/attendees` endpoint, a
  `PartyAssign` avatar control on the activity screen (tap to peel someone off,
  saves optimistically), and a split badge with the attending names on the day
  timeline. The party pool is the Companions roster; "everyone" is the default.

## [2.15.0] — 2026-09-05

### Added
- **Row-level spreadsheet importer.** Importing a CSV/XLSX now rebuilds the trip
  from its *actual* rows — days, times, places, coordinates, meal suggestions,
  mom/dad status, cost — instead of regenerating an AI plan from the destination.
  Parses both formats (SheetJS, lazy-loaded), groups by date, pulls lat/lng from
  the Maps link, auto-detects the home base + party, and previews the parse before
  saving. Saving runs the normal finalize crawl; text-only links are located by
  the activity resolver. New: `lib/import-parse.ts`, `lib/import-build.ts`; the
  import screen now previews and saves the real trip. Verified: the 130-row family
  sheet → 10 days / 130 activities / 121 located, at $0.

## [2.14.1] — 2026-09-05

### Fixed
- **Saving a new trip now opens that trip** instead of bouncing to `/create`. The
  confirm screen reset the wizard before navigating, which cleared `chosen` and
  tripped its "no plan" guard, racing the navigation. It now navigates first and
  guards the teardown.

## [2.14.0] — 2026-09-05

### Fixed
- **Up Next colours now match the brand.** The card was drawing its background
  from `c.ink` — the light *text* token in the pinned-dark theme — so it rendered
  as a light card with light text and mint accents. Rebuilt on grape (`c.primary`)
  with a white Navigate button.
- **Places named only in a block now land in the right spot.** Finalize resolved
  only the curated catalog, so venues mentioned only in an activity's `where`
  (Manam, Wildflour, Mann Hann…) had no coordinates and defaulted to a wrong map
  point. It now resolves those too — biased by the home-base area so multi-branch
  names disambiguate — and writes placeId + lat/lng back onto the block. Family
  trip's 7 unlocated restaurants now sit correctly in BGC.

## [2.13.0] — 2026-09-05

### Added
- **Real place photos across the itineraries.** Trip day cards now show a
  **collage** of that day's destination photos (1–4 tiles) so a multi-stop day
  looks like several places; the accommodation / "where we are" is excluded. Each
  **day-timeline block** now carries the place's real photo on its time column
  (destinations only). New `PhotoCollage` component.

### Changed
- **Navigator 2D default is now genuinely flat** — the 3D building extrusions hide
  whenever the camera is level, so top-down reads as a clean 2D map; 3D brings
  them back.

### Ops
- Turned the Places gate ON and backfilled the BGC–Manila trip (14/14 linked,
  $0.748); the family trip was already cached (free). Photos now render.

## [2.12.0] — 2026-09-05

### Added
- **Chase camera + live re-routing in the navigator.** The camera now rides
  behind the pointer, turned to your direction of travel, with you sitting low so
  the road ahead is visible; the route re-anchors to your position as you move
  (~40 m), and Recenter snaps it back. `useLocation` derives heading from movement
  when the device has no compass.
- **Triangle navigation arrow.** The "you are here" marker is now a halo + a
  white-bordered triangle that rotates to your heading (a dot when heading is
  unknown), replacing the plain circle.

## [2.11.0] — 2026-09-05

### Added
- **Real walking directions.** Routing now picks the OSRM server per mode via
  FOSSGIS (`routed-foot`/`routed-car`/`routed-bike`), so **Walk returns genuine
  footpaths** (the old demo server was car-only). A self-hosted
  `EXPO_PUBLIC_OSRM_URL` still overrides all modes.
- **Directional "you are here" puck.** The map marker is now a halo + dot + a
  triangular pointer that rotates to your live compass heading (via a new
  `heading` on `useLocation`), updated without redrawing the map.

### Changed
- **Up Next card** — removed the animated walking figure; Navigate now opens the
  in-app turn-by-turn navigator, with a distance chip + ETA in place of the strip.
- **Navigator controls** — 2D top-down stays the default; the 2D/3D toggle now
  sits behind the primary "locate / where we are" button.

## [2.10.0] — 2026-09-05

### Added
- **In-app turn-by-turn navigation.** Pressing Navigate now routes inside the app
  from your live GPS position to the destination on our own map — no bounce to
  Google Maps. Real turn-by-turn steps + distance/ETA via OSRM (keyless, $0), a
  next-maneuver card, a Drive/Walk toggle, and Recenter. The camera **defaults to
  a flat top-down view**, with a one-tap **2D/3D** toggle (tilts into 3D buildings).
  "Open in Google Maps" remains as a fallback. New: `directions()` in `lib/route.ts`,
  `app/navigate.tsx`, a `pitch` camera effect on the web map, and a `style` prop on
  `Icon`. Navigate on place, activity, and day screens now opens the in-app navigator.

## [2.9.0] — 2026-09-05

### Added
- **Real Google photos, place cards & reviews (the Places UI).** Trip/day
  thumbnails and the place-detail hero now show real Google photos when a place
  is linked (silent stock fallback otherwise). Place detail gains a card
  (★ rating + count, hours, phone, website) and a **Reviews** section that fetches
  live only on tap. A one-time **"Show real photos & info"** banner on the trip
  page (visible only when Places is ON + unlinked) runs the crawl and shows the
  cost. New: `POST /api/itineraries/:id/finalize-places` (gated on-demand linker),
  `lib/places.ts` (`usePlaceCard`/`usePlaceReviews`), `PlacePhoto`, `phone` icon,
  `api.finalizePlaces`.
- Facts cache once (then free); photos bill per render (~$0.007), reviews per tap
  (~$0.005) — the billable paths stay lazy and behind the gate. Verified live:
  family trip 9/9 linked for $0.513.

## [2.8.0] — 2026-08-31

### Added
- **Google Places toggle + hard money gate.** A Settings switch (Profile →
  "Google Places API", **default OFF**) turns Places on/off anytime. Server-enforced:
  every Google call (search, details, reviews, photo) passes one `placesAllowed()`
  gate (`lib/settings.ts`); when off, no request goes out — verified "request blocked,
  no spend", $0. A **spend tracker** (calls + est $) shows in Settings and via
  `GET /api/settings`. New: `lib/settings.ts`, `GET`/`PATCH /api/settings`,
  `api.getAppSettings`/`setPlacesEnabled`.

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

[2.23.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.23.0
[2.22.1]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.22.1
[2.22.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.22.0
[2.21.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.21.0
[2.20.1]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.20.1
[2.20.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.20.0
[2.19.1]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.19.1
[2.19.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.19.0
[2.18.1]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.18.1
[2.18.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.18.0
[2.17.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.17.0
[2.16.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.16.0
[2.15.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.15.0
[2.14.1]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.14.1
[2.14.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.14.0
[2.13.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.13.0
[2.12.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.12.0
[2.11.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.11.0
[2.10.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.10.0
[2.9.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.9.0
[2.8.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.8.0
[2.7.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.7.0
[2.6.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.6.0
[2.5.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.5.0
[2.4.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.4.0
[2.3.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.3.0
[2.2.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.2.0
[2.1.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.1.0
[2.0.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.0.0
[1.0.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v1.0.0
