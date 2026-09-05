# Wayfare — Native Dev Build (iOS / Android)

Wayfare runs on web today (`npm run web`). To run it as a real native app — with
device GPS, the native map, and push notifications — you build a **custom dev
client** with EAS. Expo Go can't be used because the app needs native modules
(MapLibre native, notifications) that aren't in Expo Go.

This is the keystone step: once you have a dev build installed, `npm start` serves
JS to it just like Expo Go, and everything we've built runs natively.

Everything in `app/eas.json` and `app/app.json` is already configured (dev-client
profile, location + notification permissions). What's below runs on **your**
machine (it needs your Expo account + Apple/Google credentials, which can't be
provisioned from the repo).

---

## 1. One-time setup

```bash
npm i -g eas-cli          # the EAS build CLI
cd app
eas login                 # your Expo account
eas build:configure       # links this project to EAS (writes projectId to app.json)
```

## 2. Build a development client

Pick a target. The **iOS Simulator** build needs no Apple account; a **device**
build (iOS or Android) needs credentials (EAS can generate Android ones for you;
iOS needs an Apple Developer account).

```bash
# iOS Simulator (fastest, no Apple account)
eas build --profile development --platform ios

# Android device/emulator (EAS manages the keystore)
eas build --profile development --platform android

# iOS device (needs an Apple Developer account)
eas build --profile development --platform ios
```

EAS returns a URL / QR when the build finishes (~10–20 min in the cloud). Install
it: drag the `.app` onto a booted simulator, or scan the QR on a device.

> Prefer a local build? `npx expo prebuild` then `npx expo run:ios` /
> `run:android` with Xcode / Android Studio installed. EAS cloud builds avoid
> needing the native toolchains locally.

## 3. Run the app in the dev build

```bash
cd app
npm start                 # Metro dev server
```

Open the installed **Wayfare (dev)** app and it connects to Metro — same workflow
as Expo Go, but with native modules. Point it at the API with
`EXPO_PUBLIC_API_URL=http://<your-mac-LAN-ip>:4100` (a phone can't reach
`localhost`).

**What works immediately in the dev build:** device GPS + heading (real
turn-by-turn from where you actually are), the whole itinerary UI, the importer,
split-party, cross-account, expenses/receipt OCR — all of it, natively.

---

## 4. Follow-ons unlocked by the dev build

These need the dev build to iterate/verify on a device, so they come **after** you
have one installed:

### 4a. Native MapLibre map (replaces the static preview)
`src/components/wayfare/wayfare-map.tsx` is currently a static SVG preview. To make
native match web's live 3D map:

```bash
cd app
npx expo install @maplibre/maplibre-react-native
```
Add its config plugin to `app.json` `plugins`, rebuild the dev client (native
module = new build), then wire `wayfare-map.tsx` to render `MapView` +
`FillExtrusionLayer` from the same `stops` / `routeGeometry` the web map uses
(`wayfare-map.shared.ts` already holds the shared props + style URL).

### 4b. Push notifications
`expo-notifications` is already installed + configured. On the dev build:
- register for a push token (`getExpoPushTokenAsync`) after permission,
- send the token to the server (new endpoint) so the reimbursement/alert flows can
  push instead of only showing in-app Alerts,
- for production, add APNs (iOS) + FCM (Android) credentials via `eas credentials`.

---

## Troubleshooting

- **"Metro can't be reached"** on a device → set `EXPO_PUBLIC_API_URL` and make
  sure the phone is on the same Wi-Fi; use the Mac's LAN IP, not `localhost`.
- **Build fails on credentials** → `eas credentials` to (re)generate; Android can
  be fully managed by EAS, iOS needs an Apple Developer account.
- **Added a native module but it "isn't found"** → native modules require a **new
  dev build**; a JS reload isn't enough.
- **Env for a self-hosted OSRM** → set `OSRM_URL` on the server (see v2.18.0); the
  app routes through `/api/route` and needs no change.
