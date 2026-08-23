// Repository interface — the seam that isolates storage from the API.
// Today: JSON file (jsonRepo). Later: swap in firestoreRepo with the same
// interface and nothing in the routes/app changes.

import type { Itinerary, ItinerarySummary, Proposal } from "../../../packages/shared/src/index.ts";

export interface Repo {
  listItineraries(): Promise<ItinerarySummary[]>;
  getItinerary(id: string): Promise<Itinerary | null>;
  getProposal(itineraryId: string, proposalId: string): Promise<Proposal | null>;

  // Forward-looking (used by the builder phase). JSON repo implements these
  // by rewriting the data file; Firestore repo will write documents.
  createItinerary(itinerary: Itinerary): Promise<Itinerary>;
  updateItinerary(id: string, patch: Partial<Itinerary>): Promise<Itinerary | null>;
  deleteItinerary(id: string): Promise<boolean>;
}
