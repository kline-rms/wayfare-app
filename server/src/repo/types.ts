// Repository interface — the seam that isolates storage from the API.
// Today: JSON file (jsonRepo) or Firestore (firestoreRepo) with the same shape.

import type { CachedPlace, Itinerary, ItinerarySummary, Proposal } from "../../../packages/shared/src/index.ts";

/** Internal user record (includes the password hash — never sent to clients). */
export interface StoredUser {
  id: string;
  email: string;
  displayName?: string;
  passwordHash: string;
  createdAt: string;
  /** Expo push tokens for this account's devices (deduped). */
  pushTokens?: string[];
}

/** Itineraries owned by "sample" are shared demo trips visible to everyone. */
export const SAMPLE_OWNER = "sample";

export interface Repo {
  /** Summaries the given user may see: their own trips plus shared samples. */
  listItineraries(ownerId: string): Promise<ItinerarySummary[]>;
  getItinerary(id: string): Promise<Itinerary | null>;
  getProposal(itineraryId: string, proposalId: string): Promise<Proposal | null>;

  createItinerary(itinerary: Itinerary): Promise<Itinerary>;
  updateItinerary(id: string, patch: Partial<Itinerary>): Promise<Itinerary | null>;
  deleteItinerary(id: string): Promise<boolean>;

  // Users (auth).
  createUser(user: StoredUser): Promise<StoredUser>;
  getUserByEmail(email: string): Promise<StoredUser | null>;
  getUser(id: string): Promise<StoredUser | null>;
  updateUser(id: string, patch: Partial<StoredUser>): Promise<StoredUser | null>;

  // Places cache — shared across all users/itineraries, keyed by Google Place ID.
  getCachedPlace(placeId: string): Promise<CachedPlace | null>;
  saveCachedPlace(place: CachedPlace): Promise<CachedPlace>;
}
