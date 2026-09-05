// Minimal Google Places API (New) client — zero-dependency, native fetch.
// Reached only when env.hasGoogleMaps is true. Cost control lives in the FIELD
// MASKS below: Google bills by the most expensive field tier you request, so we
// ask for the cheap "resolve id" fields during search and the fuller (but still
// no-reviews) set at enrich time. Reviews (the Enterprise+Atmosphere tier) are
// requested ONLY by the live reviews call, never during the cached crawl.
//
// See docs/places-caching-design.md for the SKU/cost breakdown.
import type { PlaceReview } from "../../../packages/shared/src/index.ts";
import { env } from "../lib/env.ts";
import { getPlacesEnabled, trackSpend } from "../lib/settings.ts";

const BASE = "https://places.googleapis.com/v1";

// THE GATE. Every Google-Places call passes through this. A request only goes out
// when there's a key AND the runtime toggle is ON — otherwise we never touch the
// network (no spend). Gated attempts are logged so we can see they were blocked.
export function placesAllowed(): boolean {
  if (!env.hasGoogleMaps) return false;
  if (!getPlacesEnabled()) {
    console.log("[places] gate OFF — request blocked (no spend)");
    return false;
  }
  return true;
}

// ~USD per 1,000 requests, approximate (verify on the live pricing page —
// Google restructured to per-SKU billing + a monthly free allotment in 2025).
const SKU_COST: Record<string, number> = {
  searchText: 32 / 1000, // Text Search (resolve name -> place id)
  details: 25 / 1000, // Place Details (facts + rating + photo refs, no reviews)
  reviews: 5 / 1000, // marginal bump for the atmosphere/reviews field
  photo: 7 / 1000, // Place Photo media
};

function logCost(sku: keyof typeof SKU_COST, n = 1) {
  const cost = (SKU_COST[sku] ?? 0) * n;
  trackSpend(cost);
  console.log(`[places] ${sku} x${n}  ≈ $${cost.toFixed(5)}`);
}

/** Raw details we keep (compliant fields only — no review text, no photo bytes). */
export interface GoogleDetails {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  googleMapsUrl: string;
  types: string[];
  rating?: number;
  ratingCount?: number;
  priceLevel?: number;
  phone?: string;
  website?: string;
  hours?: string[];
  photoRefs?: string[];
}

const PRICE_LEVEL: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

/** Text Search — resolve a free-text venue name to a Google Place ID (cheap mask). */
export async function searchPlaceId(query: string): Promise<string | null> {
  if (!placesAllowed() || !query.trim()) return null;
  try {
    const res = await fetch(`${BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Goog-Api-Key": env.googleMapsApiKey,
        "X-Goog-FieldMask": "places.id,places.displayName",
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
    });
    if (!res.ok) {
      console.warn(`[places] searchText failed (${res.status})`);
      return null;
    }
    logCost("searchText");
    const data = (await res.json()) as { places?: { id?: string }[] };
    return data.places?.[0]?.id ?? null;
  } catch (err) {
    console.warn("[places] searchText network error", err);
    return null;
  }
}

/** Place Details with the enrichment field mask (facts + aggregate + photo refs). */
export async function fetchDetails(placeId: string): Promise<GoogleDetails | null> {
  if (!placesAllowed()) return null;
  // NB: this mask deliberately EXCLUDES `reviews` to stay off the priciest tier.
  const mask = [
    "id",
    "displayName",
    "formattedAddress",
    "location",
    "googleMapsUri",
    "types",
    "rating",
    "userRatingCount",
    "priceLevel",
    "internationalPhoneNumber",
    "websiteUri",
    "regularOpeningHours.weekdayDescriptions",
    "photos",
  ].join(",");
  try {
    const res = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": env.googleMapsApiKey,
        "X-Goog-FieldMask": mask,
      },
    });
    if (!res.ok) {
      console.warn(`[places] details failed (${res.status})`);
      return null;
    }
    logCost("details");
    const d = (await res.json()) as any;
    return {
      placeId: d.id ?? placeId,
      name: d.displayName?.text ?? "",
      address: d.formattedAddress ?? "",
      location: { lat: d.location?.latitude ?? 0, lng: d.location?.longitude ?? 0 },
      googleMapsUrl: d.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      types: d.types ?? [],
      rating: d.rating,
      ratingCount: d.userRatingCount,
      priceLevel: d.priceLevel != null ? PRICE_LEVEL[d.priceLevel] : undefined,
      phone: d.internationalPhoneNumber,
      website: d.websiteUri,
      hours: d.regularOpeningHours?.weekdayDescriptions,
      // Photo resource NAMES only (pointers) — never the bytes.
      photoRefs: (d.photos ?? []).map((p: any) => p.name).filter(Boolean),
    };
  } catch (err) {
    console.warn("[places] details network error", err);
    return null;
  }
}

/** Live reviews — fetched on demand, NEVER stored (ToS). Up to 5 from Google. */
export async function fetchReviews(placeId: string): Promise<PlaceReview[]> {
  if (!placesAllowed()) return [];
  try {
    const res = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": env.googleMapsApiKey,
        "X-Goog-FieldMask": "reviews",
      },
    });
    if (!res.ok) return [];
    logCost("reviews");
    const d = (await res.json()) as any;
    return (d.reviews ?? []).map((r: any) => ({
      author: r.authorAttribution?.displayName,
      rating: r.rating,
      text: r.text?.text,
      relativeTime: r.relativePublishTimeDescription,
    }));
  } catch (err) {
    console.warn("[places] reviews network error", err);
    return [];
  }
}

/**
 * Resolve a photo *reference* to a short-lived, key-less googleusercontent URL.
 * `skipHttpRedirect=true` returns JSON { photoUri } instead of the bytes, so the
 * server never proxies image data and the API key never reaches the client — we
 * simply 302 the browser to the returned photoUri. Nothing is stored.
 */
export async function resolvePhotoUri(photoName: string, maxWidthPx = 800): Promise<string | null> {
  if (!placesAllowed()) return null;
  try {
    const url =
      `${BASE}/${photoName}/media?maxWidthPx=${maxWidthPx}` +
      `&skipHttpRedirect=true&key=${env.googleMapsApiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    logCost("photo");
    const data = (await res.json()) as { photoUri?: string };
    return data.photoUri ?? null;
  } catch (err) {
    console.warn("[places] photo network error", err);
    return null;
  }
}
