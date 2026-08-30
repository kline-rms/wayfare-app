# Changelog

All notable changes to Wayfare. Format based on [Keep a Changelog](https://keepachangelog.com/);
this project uses [Semantic Versioning](https://semver.org/).

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

[2.0.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v2.0.0
[1.0.0]: https://github.com/kline-rms/wayfare-app/releases/tag/v1.0.0
