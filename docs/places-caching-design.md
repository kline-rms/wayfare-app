# Places enrichment & caching — design

How Wayfare gets **accurate** place data (photos, reviews, hours, ratings) from
Google **cheaply and compliantly**: one crawl per place, shared across every
user and itinerary, refreshed on a light TTL. Photos and reviews are served
live (never stored); everything else is cached.

> Status: server layer stubbed & wired (Aug 2025). Set `GOOGLE_MAPS_API_KEY` to
> switch from the offline stub to real Google data. The MapLibre + Protomaps map
> build is tracked separately.

---

## Why this shape

- **Accuracy first.** Google is the most accurate POI source (hours, ratings,
  "is it still open"). That's also *why we don't cache it forever* — stale data
  is wrong data. A 30-day TTL keeps facts correct.
- **Cheap.** The priciest call (Text Search) runs **once per place, globally**.
  Field masks keep us off the reviews tier during the crawl. Finalize-only.
- **Compliant.** Google's terms forbid storing photo bytes and review text.
  We store only what's allowed and serve the rest live.

## What we store vs. serve live

| Data | Source | Storage | Rule |
|---|---|---|---|
| `placeId` | Google | **forever** | Explicitly allowed; the join key |
| name, address, location, hours, price level, phone, website | Google | **30-day TTL** | Facts — cache short-term, refresh on access |
| rating value + count | Google | **30-day TTL** | Aggregate, storable short-term |
| photo **references** | Google | **30-day TTL** | Pointers, not bytes |
| photo **images** | Google | **served live** | Bytes never stored → proxy resolves a key-less URL |
| review **text** | Google | **served live** | Never stored (ToS) |
| owned hero image (optional) | Wikimedia/CC | **forever** | If we want permanent imagery for landmarks |

## Firestore / JSON shape (`places/{placeId}`)

Defined as `CachedPlace` in `packages/shared/src/types.ts`:

```
placeId          "ChIJ…"                 // forever
name, address, location {lat,lng}, googleMapsUrl
types[]                                  // categories
rating, ratingCount, priceLevel
phone, website, hours[]
photoRefs[]      "places/…/photos/…"     // pointers, not bytes
ownedImageUrl?                           // optional CC image (safe to keep)
source           "google" | "stub"
fetchedAt        <ISO>                   // drives the 30-day TTL
refItineraries[]                         // never evict while non-empty
```

The place cache is **shared** (not per-user): keyed only by `placeId`, so the
first itinerary to include a place pays; all others read it for free. Each
itinerary that uses it is recorded in `refItineraries`.

## The finalize crawl

`POST /api/places/enrich` — body `{ itineraryId?, places: [{ placeId | query }] }`

For each place (`enrichPlace` in `server/src/places/service.ts`):

1. Resolve a Place ID (use the given one; else **1× Text Search**).
2. Look up `places/{placeId}`:
   - **fresh hit** → free; just record the itinerary reference.
   - **miss** → **1× Place Details** (facts + rating + photo refs, *no reviews*), store.
   - **stale (>30d)** → **1× Details refresh** (reuses the stored Place ID — no new search).
3. Photos/reviews are **not** fetched here — they load live on the detail screen.

## Read paths

- `GET /api/places/:placeId/card` → cached facts + photo-proxy URLs (`PlaceCard`).
- `GET /api/places/:placeId/photo?ref=…&w=800` → resolves the reference to a
  short-lived, key-less `googleusercontent` URL server-side and **302-redirects**
  (no bytes stored, key stays server-side). Unauthenticated but ref-validated.
- `GET /api/places/:placeId/reviews` → **live** top reviews, never stored.

## Cost model (Google Places API — New)

Field masks are the #1 lever — Google bills by the most expensive field tier
requested. Approximate (verify current pricing; Google moved to per-SKU billing
+ a monthly free allotment in 2025):

| Call | ~/1,000 | When |
|---|---|---|
| Text Search (resolve id) | ~$32 | once per place, ever |
| Place Details (facts + rating + photo refs, **no reviews**) | ~$20–25 | crawl / 30-day refresh |
| Reviews (atmosphere bump) | marginal | live, on the detail screen |
| Place Photo | ~$7 | live, per photo shown |

**~$0.08–0.10 per *new* place**, so a ~30-place itinerary ≈ **$2.50–3.00 the
first time it introduces those places** — and **$0** for every later itinerary
that reuses them, or while inside the monthly free tier. Cost scales with how
often places are *viewed* (photos/reviews), not with user count.

Optimizations, all implemented or enforced here:

- Global dedupe by Place ID (`refItineraries`).
- Cheap search mask (`id,displayName`) vs. full details mask (no `reviews`).
- Finalize-only crawl (no enrichment while editing).
- Photo cap via `?w=` clamp; fetch only the refs the UI shows.
- 30-day TTL refresh only for places that get reused.

## Config & security

- `GOOGLE_MAPS_API_KEY` lives **only** in `server/.env` (gitignored), read in
  `server/src/lib/env.ts`. Never sent to the app.
- Restrict the key in Google Cloud console: **Places API (New) only**, plus an
  IP allow-list for the server. Rotate if exposed.
- No key → `enrichPlace` returns a **stub** place so dev works offline;
  `/health` reports `places: "stub"` vs `"google"`.
- The photo proxy only resolves references that belong to a cached place, so it
  can't be used to spend the key on arbitrary photos.

## Alternatives if we want to *own* photos/reviews

Google won't let us keep their photos/reviews permanently. If that becomes a
requirement:

- **Photos:** Wikimedia Commons (CC, storable — great for landmarks) into
  `ownedImageUrl`; or Foursquare (photos + tips, more cache-friendly).
- **Reviews/tips:** Foursquare tips, or our own review system. Review text is
  the single most-restricted data type across every provider.

A **Foursquare-primary + Google-for-precision** split is the path if permanent,
owned photos/reviews outrank Google's accuracy edge.
