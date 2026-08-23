import Fastify from "fastify";
import cors from "@fastify/cors";
import { createJsonRepo } from "./repo/jsonRepo.ts";
import { registerItineraryRoutes } from "./routes/itineraries.ts";

const PORT = Number(process.env.PORT ?? 4100);
const HOST = process.env.HOST ?? "0.0.0.0"; // 0.0.0.0 so a phone on the LAN can reach it

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

// Swap createJsonRepo() for createFirestoreRepo() later — no other changes.
const repo = createJsonRepo();

app.get("/health", async () => ({ ok: true, service: "itinerary-server" }));
registerItineraryRoutes(app, repo);

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`Itinerary server ready on http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
