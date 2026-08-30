// Live data client. Talks to the Fastify server (server/src/index.ts) over HTTP.
//
// Host resolution:
//   1. EXPO_PUBLIC_API_URL — explicit override (any platform).
//   2. Web — same hostname the app is served from, on the server port.
//   3. Native (Expo Go) — the Mac's LAN IP from Expo's hostUri, on the server port.
// There is deliberately NO offline fallback: if the server is unreachable the
// call rejects and screens render their error state, so a broken app ↔ server
// link is visible instead of silently masked by bundled data.
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authStore } from './auth';
import type {
  Activity,
  GenerateRequest,
  Itinerary,
  ItinerarySummary,
  PlaceCard,
  PlaceReview,
  Proposal,
  User,
} from './types';

const SERVER_PORT = 4100;

function resolveBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return override.replace(/\/$/, '');

  if (Platform.OS === 'web') {
    const host =
      typeof window !== 'undefined' && window.location?.hostname
        ? window.location.hostname
        : 'localhost';
    return `http://${host}:${SERVER_PORT}`;
  }

  // Native: derive the dev machine's LAN IP from Expo's hostUri ("192.168.x.x:8081").
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost ??
    '';
  const lanHost = hostUri.split(':')[0] || 'localhost';
  return `http://${lanHost}:${SERVER_PORT}`;
}

export const API_BASE_URL = resolveBaseUrl();

function authHeaders(): Record<string, string> {
  const token = authStore.getToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

async function getJson<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { headers: authHeaders() });
  } catch (cause) {
    throw new Error(
      `Cannot reach the itinerary server at ${API_BASE_URL}. Is it running? (npm run server)`,
      { cause },
    );
  }
  if (res.status === 401) authStore.clear();
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error((detail as { error?: string }).error ?? `Request failed (${res.status}) for ${path}`);
  }
  return (await res.json()) as T;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    throw new Error(`Cannot reach the itinerary server at ${API_BASE_URL}. Is it running?`, { cause });
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error((detail as { error?: string }).error ?? `Request failed (${res.status}) for ${path}`);
  }
  return (await res.json()) as T;
}

async function delJson<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { method: 'DELETE', headers: authHeaders() });
  } catch (cause) {
    throw new Error(`Cannot reach the itinerary server at ${API_BASE_URL}. Is it running?`, { cause });
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error((detail as { error?: string }).error ?? `Request failed (${res.status}) for ${path}`);
  }
  return (await res.json()) as T;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface GenerateResult {
  engine: 'openai' | 'stub';
  itinerary: Itinerary;
}

export const api = {
  listItineraries: (): Promise<ItinerarySummary[]> =>
    getJson<ItinerarySummary[]>('/api/itineraries'),

  getItinerary: (id: string): Promise<Itinerary> =>
    getJson<Itinerary>(`/api/itineraries/${encodeURIComponent(id)}`),

  getProposal: (itineraryId: string, proposalId: string): Promise<Proposal> =>
    getJson<Proposal>(
      `/api/itineraries/${encodeURIComponent(itineraryId)}/proposals/${encodeURIComponent(proposalId)}`,
    ),

  // Whether real AI generation is wired ("openai") or the local stub is in use.
  generateStatus: (): Promise<{ engine: 'openai' | 'stub'; model: string | null }> =>
    getJson('/api/generate/status'),

  // Step 1 — three day-level proposals from a request (not yet saved).
  generate: (request: GenerateRequest): Promise<GenerateResult> => postJson('/api/generate', request),

  // Step 2 — expand a chosen proposal into a block-level timeline.
  expandTimeline: (itinerary: Itinerary, proposalId: string, request: GenerateRequest): Promise<GenerateResult> =>
    postJson('/api/generate/timeline', { itinerary, proposalId, request }),

  // Persist a generated itinerary. Saving also kicks off the finalize place
  // crawl server-side (Place IDs are linked back within a few seconds).
  saveItinerary: (itinerary: Itinerary): Promise<Itinerary> => postJson('/api/itineraries', itinerary),

  // Add a stop to a day (insert-only; never re-plans the rest). Returns the
  // updated itinerary. Removing is limited to user-added stops server-side.
  addActivity: (itineraryId: string, dayId: string, activity: Activity): Promise<Itinerary> =>
    postJson(`/api/itineraries/${encodeURIComponent(itineraryId)}/activities`, { dayId, activity }),
  removeActivity: (itineraryId: string, activityId: string): Promise<Itinerary> =>
    delJson(`/api/itineraries/${encodeURIComponent(itineraryId)}/activities/${encodeURIComponent(activityId)}`),

  // ---- places (Google enrichment, cached; see docs/places-caching-design.md) ----
  // Cached facts + live photo URLs for one place.
  getPlaceCard: (placeId: string): Promise<PlaceCard> =>
    getJson<PlaceCard>(`/api/places/${encodeURIComponent(placeId)}/card`),
  // Live reviews (fetched fresh, never stored).
  getPlaceReviews: (placeId: string): Promise<{ reviews: PlaceReview[] }> =>
    getJson(`/api/places/${encodeURIComponent(placeId)}/reviews`),
  // Explicitly enrich a set of places (usually automatic on save; use to backfill).
  enrichPlaces: (
    places: { placeId?: string; query?: string }[],
    itineraryId?: string,
  ): Promise<{ count: number; places: PlaceCard[] }> =>
    postJson('/api/places/enrich', { itineraryId, places }),

  // ---- auth ----
  register: (email: string, password: string, displayName?: string): Promise<AuthResult> =>
    postJson('/api/auth/register', { email, password, displayName }),
  login: (email: string, password: string): Promise<AuthResult> =>
    postJson('/api/auth/login', { email, password }),
};
