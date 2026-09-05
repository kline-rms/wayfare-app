// JSON-file implementation of the Repo interface.
// Reads server/data/itineraries.json; writes back on mutations.
// Document-shaped so a Firestore port is mechanical.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { CachedPlace, Itinerary, ItinerarySummary, Proposal } from "../../../packages/shared/src/index.ts";
import type { Repo, StoredUser } from "./types.ts";
import { SAMPLE_OWNER } from "./types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "..", "..", "data", "itineraries.json");

interface DbShape {
  itineraries: Itinerary[];
  users?: StoredUser[];
  places?: CachedPlace[];
}

async function load(): Promise<Required<DbShape>> {
  const raw = await readFile(DATA_FILE, "utf8");
  const db = JSON.parse(raw) as DbShape;
  return { itineraries: db.itineraries ?? [], users: db.users ?? [], places: db.places ?? [] };
}

async function save(db: DbShape): Promise<void> {
  await writeFile(DATA_FILE, JSON.stringify(db, null, 2) + "\n", "utf8");
}

function toSummary(it: Itinerary): ItinerarySummary {
  return {
    id: it.id,
    title: it.title,
    subtitle: it.subtitle,
    dateRange: it.dateRange,
    partySize: it.partySize,
    currency: it.currency,
    proposalCount: it.proposals.length,
  };
}

export function createJsonRepo(): Repo {
  return {
    async listItineraries(ownerId: string) {
      const db = await load();
      return db.itineraries
        .filter(
          (it) =>
            it.ownerId === SAMPLE_OWNER ||
            it.ownerId === ownerId ||
            (it.accessUserIds ?? []).includes(ownerId),
        )
        .map(toSummary);
    },

    async createUser(user) {
      const db = await load();
      db.users.push(user);
      await save(db);
      return user;
    },

    async getUserByEmail(email) {
      const db = await load();
      return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
    },

    async getUser(id) {
      const db = await load();
      return db.users.find((u) => u.id === id) ?? null;
    },

    async updateUser(id, patch) {
      const db = await load();
      const u = db.users.find((x) => x.id === id);
      if (!u) return null;
      Object.assign(u, patch, { id: u.id });
      await save(db);
      return u;
    },

    async getItinerary(id) {
      const db = await load();
      return db.itineraries.find((it) => it.id === id) ?? null;
    },

    async getProposal(itineraryId, proposalId) {
      const db = await load();
      const it = db.itineraries.find((x) => x.id === itineraryId);
      if (!it) return null;
      return it.proposals.find((p) => p.id === proposalId) ?? null;
    },

    async createItinerary(itinerary) {
      const db = await load();
      db.itineraries.push(itinerary);
      await save(db);
      return itinerary;
    },

    async updateItinerary(id, patch) {
      const db = await load();
      const idx = db.itineraries.findIndex((it) => it.id === id);
      if (idx === -1) return null;
      const updated: Itinerary = {
        ...db.itineraries[idx],
        ...patch,
        id, // id is immutable
        updatedAt: patch.updatedAt ?? db.itineraries[idx].updatedAt,
      };
      db.itineraries[idx] = updated;
      await save(db);
      return updated;
    },

    async deleteItinerary(id) {
      const db = await load();
      const before = db.itineraries.length;
      db.itineraries = db.itineraries.filter((it) => it.id !== id);
      if (db.itineraries.length === before) return false;
      await save(db);
      return true;
    },

    async getCachedPlace(placeId) {
      const db = await load();
      return db.places.find((p) => p.placeId === placeId) ?? null;
    },

    async saveCachedPlace(place) {
      const db = await load();
      const idx = db.places.findIndex((p) => p.placeId === place.placeId);
      if (idx === -1) db.places.push(place);
      else db.places[idx] = place;
      await save(db);
      return place;
    },
  };
}
