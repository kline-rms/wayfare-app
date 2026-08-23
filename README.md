# Wayfare

**Plans that feel human.** Wayfare is an AI-assisted travel-itinerary app that builds
coherent, door-to-door day plans — with real travel times, honest peso cost ranges,
and a reason behind every stop. The flagship plan is a **12-day couple's trip across
BGC + Manila** (Aug 26 – Sep 6, 2026), built from a real spreadsheet.

<p align="center"><em>React Native (Expo) mobile app · Fastify API · shared TypeScript types</em></p>

---

## 📲 Install the Android app

Grab the latest installable APK — no dev server, no database, runs fully offline on
bundled dummy data:

> **[⬇️ Download Wayfare v1.0.0 (APK)](https://github.com/kline-rms/wayfare-app/releases/latest)**

Also committed in-repo at [`releases/`](./releases). To install: download on your
Android phone, open it, and allow *"Install from unknown sources"* when prompted.

---

## ✨ What's inside

Wayfare is a complete, navigable app — **~22 screens**, all wired to bundled data.

| Area | Screens |
| --- | --- |
| **Entry & auth** | Splash · Onboarding (3 slides) · Login · Register · Forgot password |
| **Main tabs** | Home (cinematic hero) · Trips · Alerts · Profile |
| **Planning** | Proposals (3 plans) · Trip Overview · Day itinerary · Place detail (arrival check-in) · Route map · Calendar / schedule · Availability (work blocks) |
| **Create flow** | Start method · Basics · Vibe · Interests · Review · Generating (cinematic) |

**Design language.** A warm-neutral palette (light) with a Nightfall dark theme,
fully rounded pill CTAs, soft rounded cards (no side-accent bars), category-coloured
icon chips, and a signature green **AI orb**. Every icon is a hand-ported SVG; photos
are the real BGC / Manila set, bundled as native assets.

**Coherent, real itineraries.** The plan isn't random — it starts from a home base
(Avida Towers Verte, BGC), respects a Mon–Fri 7 AM–4 PM work block, routes BGC → Old
Manila and back, and carries per-day travel modes, ₱ cost ranges, notes, and map pins.

---

## 🧱 Monorepo layout

```
wayfare-app/
├── app/          Expo / React Native mobile app (expo-router)
│   └── src/
│       ├── app/            file-based routes (screens)
│       ├── components/wayfare/   design system (icons, UI kit, theme, photo)
│       ├── constants/wayfare.ts  palette + tokens
│       └── lib/            api (offline), data, images, format, maps, nav
├── server/       Fastify API (read endpoints; optional — the app ships offline)
│   ├── src/
│   └── data/itineraries.json     source of truth (also bundled into the app)
├── packages/shared/   shared TypeScript types
├── design/       design canvas: generators (.mjs) + artboards + photos
└── docs/         source spreadsheet + flow docs
```

---

## 🚀 Getting started

### Prerequisites
- **Node 20+**
- For the app: the **Expo** toolchain (installed via `npx`)
- For a native Android build: **JDK 17** and the **Android SDK** (platform 36, build-tools 35/36)

### Run the mobile app

```bash
cd app
npm install
npm run start        # Expo dev server — press `a` (Android), `i` (iOS), or scan the QR
```

The app runs **with no backend**: `app/src/lib/api.ts` reads the bundled
`app/src/lib/data/itineraries.json`. Swap those function bodies for `fetch()` calls
to point at the live server later.

### Run the API (optional)

```bash
cd server
npm install
npm run dev          # Fastify on http://localhost:4100
```

Endpoints:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/itineraries` | List itinerary summaries |
| `GET` | `/api/itineraries/:id` | Full itinerary (proposals + days) |
| `GET` | `/api/itineraries/:id/proposals/:proposalId` | A single proposal |

---

## 🤖 Build the Android APK yourself

The app uses Expo's Continuous Native Generation — the `android/` project is generated,
not committed.

```bash
cd app
export JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null || echo /opt/homebrew/opt/openjdk@17)"
export ANDROID_HOME="$HOME/Library/Android/sdk"

npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
# → app/android/app/build/outputs/apk/release/app-release.apk
```

The release APK bundles the JS and all assets, so it installs and runs standalone.

---

## 🗺️ Data model

```
Itinerary
 ├─ dateRange, partySize, currency, homeBase, assumptions, disclaimer
 ├─ proposals: Proposal[]        (3 alternative week-shapes)
 │   └─ days: Day[]              (date, theme, timeWindow, comingFrom→destination,
 │                                detailedPlan, travelMode, cost{travel,food}, notes, location)
 └─ places: Place[]             (name, area, lat/lng, googleMapsUrl, why)
```

Document-shaped so it can migrate to Firestore later with no reshaping. Types live in
[`packages/shared`](./packages/shared) and are mirrored in `app/src/lib/types.ts`.

---

## 🧭 Tech stack

- **Mobile:** Expo SDK 57 · React Native 0.86 · expo-router · Reanimated · react-native-svg · expo-image · expo-linear-gradient
- **API:** Fastify (Node, native TypeScript) · JSON repo (Firestore-ready interface)
- **Language:** TypeScript throughout

---

## 🛣️ Roadmap

- [ ] Write endpoints — `POST /api/itineraries`, CSV/XLSX import, ChatGPT-backed generate
- [ ] Real auth + per-account sync (Firestore)
- [ ] Live GPS distance-to-next-stop + real Google Maps embed
- [ ] Push reminders (1 hour + 15 min before each stop)
- [ ] Branded app icon & splash

---

## Branches

- **`main`** — stable, releasable.
- **`staging`** — integration branch for in-progress work.

---

<p align="center"><sub>Built with Claude Code.</sub></p>
