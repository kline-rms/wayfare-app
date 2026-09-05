// Firestore implementation of the Repo interface. Same contract as jsonRepo, so
// swapping is a one-line change in index.ts. Each Itinerary is stored as one
// document (the data is document-shaped, well under Firestore's 1MB limit) in
// the `itineraries` collection, keyed by itinerary id.
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { CachedPlace, Itinerary, ItinerarySummary } from "../../../packages/shared/src/index.ts";
import type { Repo } from "./types.ts";
import { SAMPLE_OWNER } from "./types.ts";
import { env } from "../lib/env.ts";

const COLLECTION = "itineraries";
const USERS = "users";
const PLACES = "places";

let _db: ReturnType<typeof getFirestore> | null = null;
function firestore() {
  if (!getApps().length) {
    initializeApp({
      projectId: env.firebaseProjectId,
      // With the emulator (FIRESTORE_EMULATOR_HOST) no credential is needed;
      // against real Firestore, GOOGLE_APPLICATION_CREDENTIALS is read here.
      ...(env.googleCreds ? { credential: applicationDefault() } : {}),
    });
  }
  if (!_db) {
    _db = getFirestore();
    // Optional fields (e.g. an expense with no note, a reimbursement with no
    // memberId) arrive as `undefined`; Firestore rejects those by default.
    _db.settings({ ignoreUndefinedProperties: true });
  }
  return _db;
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

export function createFirestoreRepo(): Repo {
  const col = () => firestore().collection(COLLECTION);

  const users = () => firestore().collection(USERS);

  const places = () => firestore().collection(PLACES);

  return {
    async listItineraries(ownerId: string) {
      // The user's own trips + shared samples + trips they've accepted a share to.
      const [own, shared] = await Promise.all([
        col().where("ownerId", "in", [SAMPLE_OWNER, ownerId]).get(),
        col().where("accessUserIds", "array-contains", ownerId).get(),
      ]);
      const byId = new Map<string, Itinerary>();
      for (const d of [...own.docs, ...shared.docs]) byId.set(d.id, d.data() as Itinerary);
      return [...byId.values()].map(toSummary);
    },

    async createUser(user) {
      await users().doc(user.id).set(user);
      return user;
    },

    async getUserByEmail(email) {
      const snap = await users().where("email", "==", email.toLowerCase()).limit(1).get();
      return snap.empty ? null : (snap.docs[0].data() as import("./types.ts").StoredUser);
    },

    async getUser(id) {
      const doc = await users().doc(id).get();
      return doc.exists ? (doc.data() as import("./types.ts").StoredUser) : null;
    },

    async getItinerary(id) {
      const doc = await col().doc(id).get();
      return doc.exists ? (doc.data() as Itinerary) : null;
    },

    async getProposal(itineraryId, proposalId) {
      const doc = await col().doc(itineraryId).get();
      if (!doc.exists) return null;
      const it = doc.data() as Itinerary;
      return it.proposals.find((p) => p.id === proposalId) ?? null;
    },

    async createItinerary(itinerary) {
      await col().doc(itinerary.id).set(itinerary);
      return itinerary;
    },

    async updateItinerary(id, patch) {
      const ref = col().doc(id);
      const cur = await ref.get();
      if (!cur.exists) return null;
      const updated: Itinerary = {
        ...(cur.data() as Itinerary),
        ...patch,
        id, // id is immutable
        updatedAt: patch.updatedAt ?? new Date().toISOString(),
      };
      await ref.set(updated);
      return updated;
    },

    async deleteItinerary(id) {
      const ref = col().doc(id);
      const cur = await ref.get();
      if (!cur.exists) return false;
      await ref.delete();
      return true;
    },

    async getCachedPlace(placeId) {
      const doc = await places().doc(placeId).get();
      return doc.exists ? (doc.data() as CachedPlace) : null;
    },

    async saveCachedPlace(place) {
      await places().doc(place.placeId).set(place);
      return place;
    },
  };
}
