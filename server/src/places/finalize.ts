// Finalize crawl: when an itinerary is saved, enrich every place it names
// (deduped against the shared cache) and link the resolved Google Place IDs back
// onto the itinerary's places + activities. Runs in the BACKGROUND from the save
// route so the save returns immediately; the app sees placeIds on its next read.
//
// Cheap by construction: enrichPlace only calls Google for cache misses / stale
// entries, and only the priciest call (Text Search) is ever made — once, per
// place, globally. See docs/places-caching-design.md.
import type { Itinerary } from "../../../packages/shared/src/index.ts";
import type { Repo } from "../repo/types.ts";
import { enrichPlace } from "./service.ts";

/** Case/space-insensitive key so "The Mind Museum" matches activity `where` text. */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export async function finalizeItineraryPlaces(itinerary: Itinerary, repo: Repo): Promise<Itinerary> {
  // Curated catalog is the source of truth for what to crawl.
  const catalog = itinerary.places ?? [];
  if (!catalog.length) return itinerary;

  // Resolve each unique place once; build a name -> placeId map.
  const byName = new Map<string, string>();
  for (const p of catalog) {
    const query = [p.name, p.area].filter(Boolean).join(", ");
    const cached = await enrichPlace({ placeId: p.placeId, query }, repo, itinerary.id);
    if (cached.source === "google") byName.set(norm(p.name), cached.placeId);
  }

  // Link placeIds back onto the catalog + any block-level activities.
  const places = catalog.map((p) => {
    const id = byName.get(norm(p.name));
    return id ? { ...p, placeId: id } : p;
  });
  const proposals = itinerary.proposals.map((prop) => ({
    ...prop,
    days: prop.days.map((d) =>
      d.activities
        ? {
            ...d,
            activities: d.activities.map((a) => {
              const id = a.placeId ?? byName.get(norm(a.where));
              return id ? { ...a, placeId: id } : a;
            }),
          }
        : d,
    ),
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
