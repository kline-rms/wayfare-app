import Fastify from "fastify";
import cors from "@fastify/cors";
import { createJsonRepo } from "./repo/jsonRepo.ts";
import { registerItineraryRoutes } from "./routes/itineraries.ts";
import { registerGenerateRoutes } from "./routes/generate.ts";
import { registerAuthRoutes } from "./routes/auth.ts";
import { registerPlaceRoutes } from "./routes/places.ts";
import { registerExpenseRoutes } from "./routes/expenses.ts";
import { registerMemberRoutes } from "./routes/members.ts";
import { registerSettingsRoutes } from "./routes/settings.ts";
import { registerRouteRoutes } from "./routes/route.ts";
import { env } from "./lib/env.ts";

const PORT = Number(process.env.PORT ?? 4100);
const HOST = process.env.HOST ?? "0.0.0.0"; // 0.0.0.0 so a phone on the LAN can reach it

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

// Storage: Firestore when configured (project id + creds/emulator), else JSON file.
const repo = env.hasFirebase ? (await import("./repo/firestoreRepo.ts")).createFirestoreRepo() : createJsonRepo();
app.log.info(`storage: ${env.hasFirebase ? "firestore" : "json-file"}`);

app.get("/", async () => ({
  ok: true,
  service: "itinerary-server",
  hint: "This is the API. Try GET /health, or the /api/* routes (used by the app).",
}));
app.get("/health", async () => ({
  ok: true,
  service: "itinerary-server",
  generator: env.hasOpenAI ? "openai" : "stub",
  storage: env.hasFirebase ? "firestore" : "json",
  places: env.hasGoogleMaps ? "google" : "stub",
}));
registerAuthRoutes(app, repo);
registerItineraryRoutes(app, repo);
registerGenerateRoutes(app);
registerPlaceRoutes(app, repo);
registerExpenseRoutes(app, repo);
registerMemberRoutes(app, repo);
registerSettingsRoutes(app);
registerRouteRoutes(app);

if (env.authSecret === "dev-insecure-secret-change-me") {
  app.log.warn("AUTH_SECRET is unset — using an insecure dev secret. Set AUTH_SECRET in server/.env.");
}

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`Itinerary server ready on http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
