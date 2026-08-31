// Loads server/.env (if present) and exposes generation config.
// The OpenAI key lives ONLY here, server-side — it is never sent to the app.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = join(__dirname, "..", "..", ".env");

// Node 21+ can load a dotenv file natively; guard so a missing file is fine.
if (existsSync(ENV_FILE) && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(ENV_FILE);
  } catch {
    /* ignore malformed .env */
  }
}

export const env = {
  // Secret for signing session tokens. Falls back to a dev constant (warns).
  authSecret: process.env.AUTH_SECRET || "dev-insecure-secret-change-me",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  // gpt-4o-mini is cheap + capable; override with OPENAI_MODEL.
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  get hasOpenAI() {
    return this.openaiApiKey.length > 0;
  },

  // Firestore: use it when a project id is set AND we have either a service
  // account (GOOGLE_APPLICATION_CREDENTIALS) or the local emulator running.
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? "",
  googleCreds: process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "",
  firestoreEmulator: process.env.FIRESTORE_EMULATOR_HOST ?? "",
  get hasFirebase() {
    return this.firebaseProjectId.length > 0 && (this.googleCreds.length > 0 || this.firestoreEmulator.length > 0);
  },

  // Google Places API (New) key — used ONLY server-side for the finalize-time
  // place crawl and live photo/review fetches. Never sent to the app.
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  get hasGoogleMaps() {
    return this.googleMapsApiKey.length > 0;
  },
  // The Places gate's initial state. Default OFF so no request can spend until
  // it's explicitly turned on in Settings. Set PLACES_ENABLED=1 to default on.
  placesEnabledDefault: process.env.PLACES_ENABLED === "1",
};
