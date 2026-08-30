// Places enrichment service — the "one-time crawl on finalize, shared by
// everyone" logic. Sits between the routes and the Google client + repo cache.
//
// Compliance (see docs/places-caching-design.md):
//   - Place ID .................. stored indefinitely
//   - facts + rating aggregate .. stored, refreshed on a 30-day TTL
//   - photo REFERENCES .......... stored (pointers, not bytes)
//   - photo images .............. served live (resolvePlacePhoto), never stored
//   - review text ............... served live (getPlaceReviews), never stored
import type { CachedPlace, PlaceCard, PlaceReview } from "../../../packages/shared/src/index.ts";
import type { Repo } from "../repo/types.ts";
import { searchPlaceId, fetchDetails, fetchReviews, resolvePhotoUri } from "./google.ts";

/** Facts stay "fresh" for 30 days, then the next access triggers a cheap refresh. */
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function isFresh(place: CachedPlace): boolean {
  return Date.now() - Date.parse(place.fetchedAt) < TTL_MS;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "place";
}

/** Offline/no-key fallback so the pipeline works in dev (mirrors the OpenAI stub). */
function stubPlace(query: string, itineraryId?: string): CachedPlace {
  return {
    placeId: `stub:${slug(query)}`,
    name: query,
    address: "",
    location: { lat: 0, lng: 0 },
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    types: [],
    source: "stub",
    fetchedAt: new Date().toISOString(),
    photoRefs: [],
    refItineraries: itineraryId ? [itineraryId] : [],
  };
}

function addRef(place: CachedPlace, itineraryId?: string): CachedPlace {
  if (!itineraryId || place.refItineraries.includes(itineraryId)) return place;
  return { ...place, refItineraries: [...place.refItineraries, itineraryId] };
}

export interface EnrichInput {
  /** Preferred: a known Google Place ID (skips the paid Text Search). */
  placeId?: string;
  /** Fallback: a venue name to resolve, e.g. "Manam BGC High Street". */
  query?: string;
}

/**
 * Ensure a place is in the shared cache and fresh, then return it.
 * Cache hit + fresh   -> free (records the itinerary reference).
 * Cache miss          -> 1x Text Search (if only a name) + 1x Details, then store.
 * Stale (> TTL)       -> 1x Details refresh (reuses the stored Place ID).
 */
export async function enrichPlace(input: EnrichInput, repo: Repo, itineraryId?: string): Promise<CachedPlace> {
  // Resolve to a Place ID (prefer the one we're given; else search once).
  let placeId = input.placeId ?? null;
  if (!placeId && input.query) placeId = await searchPlaceId(input.query);

  // No key / not found -> stub so the flow still completes offline.
  if (!placeId) {
    const stub = stubPlace(input.query ?? "Unknown place", itineraryId);
    return repo.saveCachedPlace(stub);
  }

  const existing = await repo.getCachedPlace(placeId);
  if (existing && isFresh(existing)) {
    const bumped = addRef(existing, itineraryId);
    return bumped === existing ? existing : repo.saveCachedPlace(bumped);
  }

  // Miss or stale -> fetch details (no reviews) and (re)store the compliant fields.
  const d = await fetchDetails(placeId);
  if (!d) {
    // Fetch failed: keep any stale copy rather than lose data; else stub it.
    if (existing) return existing;
    return repo.saveCachedPlace(stubPlace(input.query ?? placeId, itineraryId));
  }

  const merged: CachedPlace = {
    ...d,
    source: "google",
    fetchedAt: new Date().toISOString(),
    ownedImageUrl: existing?.ownedImageUrl, // preserve any curated hero image
    refItineraries: addRef(existing ?? { refItineraries: [] } as CachedPlace, itineraryId).refItineraries,
  };
  return repo.saveCachedPlace(merged);
}

/** Shape the cached record into the app-facing card (facts + live photo URLs). */
export async function getPlaceCard(placeId: string, repo: Repo, originBase: string): Promise<PlaceCard | null> {
  const p = await repo.getCachedPlace(placeId);
  if (!p) return null;
  const photoUrls = (p.photoRefs ?? []).map(
    (ref) => `${originBase}/api/places/${encodeURIComponent(placeId)}/photo?ref=${encodeURIComponent(ref)}&w=800`,
  );
  return {
    placeId: p.placeId,
    name: p.name,
    address: p.address,
    location: p.location,
    googleMapsUrl: p.googleMapsUrl,
    types: p.types,
    rating: p.rating,
    ratingCount: p.ratingCount,
    priceLevel: p.priceLevel,
    hours: p.hours,
    phone: p.phone,
    website: p.website,
    photoUrls,
    ownedImageUrl: p.ownedImageUrl,
    fresh: isFresh(p),
  };
}

/** Live reviews for a cached place — fetched on demand, never stored. */
export async function getPlaceReviews(placeId: string, repo: Repo): Promise<PlaceReview[]> {
  const p = await repo.getCachedPlace(placeId);
  if (!p || p.source !== "google") return [];
  return fetchReviews(placeId);
}

/**
 * Resolve one cached photo reference to a short-lived, key-less image URL.
 * Validates the reference belongs to the cached place (so the proxy can't be
 * used to fetch arbitrary photos on our key).
 */
export async function resolvePlacePhoto(
  placeId: string,
  ref: string,
  maxWidthPx: number,
  repo: Repo,
): Promise<string | null> {
  const p = await repo.getCachedPlace(placeId);
  if (!p || !(p.photoRefs ?? []).includes(ref)) return null;
  return resolvePhotoUri(ref, maxWidthPx);
}
