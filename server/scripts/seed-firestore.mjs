// Pushes the itineraries in server/data/itineraries.json into Firestore.
// Idempotent (upsert by id). Requires the same env as the server:
//   FIREBASE_PROJECT_ID + (GOOGLE_APPLICATION_CREDENTIALS or FIRESTORE_EMULATOR_HOST)
// Run: node scripts/seed-firestore.mjs
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = join(__dirname, "..", ".env");
if (existsSync(ENV_FILE) && typeof process.loadEnvFile === "function") process.loadEnvFile(ENV_FILE);

const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("FIREBASE_PROJECT_ID is not set. Configure server/.env first.");
  process.exit(1);
}

const DATA = join(__dirname, "..", "data", "itineraries.json");
const { itineraries } = JSON.parse(readFileSync(DATA, "utf8"));

initializeApp({
  projectId,
  ...(process.env.GOOGLE_APPLICATION_CREDENTIALS ? { credential: applicationDefault() } : {}),
});
const db = getFirestore();

let n = 0;
for (const it of itineraries) {
  await db.collection("itineraries").doc(it.id).set(it);
  n++;
  console.log(`  upserted ${it.id} (${it.proposals.length} proposals)`);
}
console.log(`Seeded ${n} itineraries to Firestore (project: ${projectId}${process.env.FIRESTORE_EMULATOR_HOST ? ", emulator" : ""}).`);
process.exit(0);
