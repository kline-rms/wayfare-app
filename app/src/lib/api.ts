// Offline data client. The app ships with a bundled dummy itinerary so it runs
// with no server and no database — everything below reads from local JSON.
// (Swap these bodies for `fetch()` calls when a backend is wired up.)
import type { Itinerary, ItinerarySummary, Proposal } from './types';
import raw from './data/itineraries.json';

const DB: Itinerary[] = (raw as { itineraries: Itinerary[] }).itineraries;

// Simulate a tiny async hop so loading states still render naturally.
function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function summarize(it: Itinerary): ItinerarySummary {
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

export const API_BASE_URL = 'offline://bundled';

export const api = {
  listItineraries: (): Promise<ItinerarySummary[]> => delay(DB.map(summarize)),

  getItinerary: (id: string): Promise<Itinerary> => {
    const it = DB.find((x) => x.id === id) ?? DB[0];
    if (!it) return Promise.reject(new Error('No itineraries bundled'));
    return delay(it);
  },

  getProposal: (itineraryId: string, proposalId: string): Promise<Proposal> => {
    const it = DB.find((x) => x.id === itineraryId) ?? DB[0];
    const p = it?.proposals.find((x) => x.id === proposalId);
    if (!p) return Promise.reject(new Error('Proposal not found'));
    return delay(p);
  },
};
