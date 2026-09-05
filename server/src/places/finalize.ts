// Finalize crawl: when an itinerary is saved, enrich every place it names
// (deduped against the shared cache) and link the resolved Google Place IDs back
// onto the itinerary's places + activities. Runs in the BACKGROUND from the save
// route so the save returns immediately; the app sees placeIds on its next read.
//
// Cheap by construction: enrichPlace only calls Google for cache misses / stale
// entries, and only the priciest call (Text Search) is ever made — once, per
// place, globally. See docs/places-caching-design.md.
import type { Activity, CachedPlace, Itinerary } from "../../../packages/shared/src/index.ts";
import type { Repo } from "../repo/types.ts";
import { enrichPlace } from "./service.ts";

/** Case/space-insensitive key so "The Mind Museum" matches activity `where` text. */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function hasCoords(a: { lat?: number; lng?: number }): boolean {
  return Number.isFinite(a.lat) && Number.isFinite(a.lng) && !(a.lat === 0 && a.lng === 0);
}

export async function finalizeItineraryPlaces(itinerary: Itinerary, repo: Repo): Promise<Itinerary> {
  const catalog = itinerary.places ?? [];

  // Location context so ambiguous, multi-branch venues resolve to the right one
  // ("Manam" alone can hit a branch in another city — or Manam Island). Bias with
  // the home base's area (everything after the venue name).
  const region = (itinerary.homeBase ?? "")
    .split(",")
    .slice(1)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
  const homeFirst = (itinerary.homeBase ?? "").split(",")[0].trim().toLowerCase();
  const isHome = (where: string) => !!homeFirst && where.toLowerCase().includes(homeFirst);

  // 1) Resolve the curated catalog once → name -> cached place (with coords).
  const byName = new Map<string, CachedPlace>();
  for (const p of catalog) {
    const query = [p.name, p.area].filter(Boolean).join(", ");
    const cached = await enrichPlace({ placeId: p.placeId, query }, repo, itinerary.id);
    if (cached.source === "google") byName.set(norm(p.name), cached);
  }

  // 2) Resolve activity destinations that AREN'T in the catalog and have no
  //    coordinates yet (e.g. dining spots named only in a block's `where`).
  //    Each distinct place is searched once, then reused across matching blocks.
  const byWhere = new Map<string, CachedPlace>();
  for (const prop of itinerary.proposals) {
    for (const d of prop.days) {
      for (const a of d.activities ?? []) {
        const where = a.where ?? "";
        if (!where || isHome(where) || a.placeId || hasCoords(a)) continue;
        const key = norm(where);
        if (byName.has(key) || byWhere.has(key)) continue;
        const cached = await enrichPlace({ query: [where, region].filter(Boolean).join(", ") }, repo, itinerary.id);
        if (cached.source === "google") byWhere.set(key, cached);
      }
    }
  }

  // Link placeIds back onto the catalog AND adopt Google's authoritative
  // coordinates. Google is the source of truth for a resolved place, so this
  // self-corrects a bad AI/import lat/lng (e.g. a hallucinated latitude that put
  // a BGC venue 300 km out to sea) the moment the place is crawled.
  const places = catalog.map((p) => {
    const c = byName.get(norm(p.name));
    if (!c) return p;
    return {
      ...p,
      placeId: c.placeId,
      lat: c.location.lat,
      lng: c.location.lng,
      coordinates: `${c.location.lat}, ${c.location.lng}`,
      coordinateSource: "Google Places",
    };
  });

  // Link placeId AND Google coordinates onto activities (from catalog match or
  // the activity-only resolution) — the resolved place's coords override any
  // wrong lat/lng so map + list agree.
  const linkActivity = (a: Activity): Activity => {
    const c = byName.get(norm(a.where)) ?? byWhere.get(norm(a.where));
    if (!c) return a;
    return { ...a, placeId: a.placeId ?? c.placeId, lat: c.location.lat, lng: c.location.lng };
  };
  const proposals = itinerary.proposals.map((prop) => ({
    ...prop,
    days: prop.days.map((d) => (d.activities ? { ...d, activities: d.activities.map(linkActivity) } : d)),
  }));

  return { ...itinerary, places, proposals };
}

/**
 * Fire-and-forget wrapper for the save route: enrich in the background and patch
 * the stored itinerary with placeIds when done. Never throws into the request.
 */
export function finalizeInBackground(itinerary: Itinerary, repo: Repo, log?: { info: Function; warn: Function }): void {
  finalizeItineraryPlaces(itinerary, repo)
    .then(async (patched) => {
      // Only write if the crawl actually linked something.
      const linked = patched.places.filter((p) => p.placeId).length;
      if (linked > 0) {
        await repo.updateItinerary(itinerary.id, { places: patched.places, proposals: patched.proposals });
        log?.info(`[finalize] linked ${linked}/${patched.places.length} places for ${itinerary.id}`);
      }
    })
    .catch((err) => log?.warn(`[finalize] enrichment failed for ${itinerary.id}: ${err?.message ?? err}`));
}
