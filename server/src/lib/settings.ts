// Runtime app settings — the money gate for Google Places lives here.
//
// `placesEnabled` starts from PLACES_ENABLED (default OFF) and can be flipped at
// runtime from the app's Settings. EVERY Google-Places call is gated on it (see
// google.ts `placesAllowed`), so nothing can spend while it's off. It's in-memory
// on purpose: a restart returns to the safe default rather than silently staying on.
import { env } from "./env.ts";

let placesEnabled = env.placesEnabledDefault;

// Running estimate of what we've spent this process, for visibility in Settings.
const spend = { calls: 0, estUsd: 0 };

export function getPlacesEnabled(): boolean {
  return placesEnabled;
}
export function setPlacesEnabled(v: boolean): boolean {
  placesEnabled = !!v;
  console.log(`[places] gate ${placesEnabled ? "ON" : "OFF"}`);
  return placesEnabled;
}
export function trackSpend(usd: number): void {
  spend.calls += 1;
  spend.estUsd = Math.round((spend.estUsd + usd) * 1e5) / 1e5;
}
export function getSpend(): { calls: number; estUsd: number } {
  return { ...spend };
}
