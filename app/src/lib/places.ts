// Client-side Google Places data — thin, reactive layer over the server's
// cached cards + on-demand reviews. Nothing here spends money on its own: cards
// are only fetched for places that already carry a Place ID (linked by the
// server's finalize crawl, which is itself gated), and reviews load only when
// the user explicitly asks. See server/src/routes/places.ts.
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { api } from './api';
import type { PlaceCard, PlaceReview } from './types';

// placeId -> card. A stored `null` means "fetched, none available" so we don't
// retry a known miss. Shared across every component that names the same place.
const cards = new Map<string, PlaceCard | null>();
const inflight = new Set<string>();
let version = 0;
const listeners = new Set<() => void>();
const emit = () => {
  version += 1;
  listeners.forEach((l) => l());
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

async function ensureCard(placeId: string) {
  if (cards.has(placeId) || inflight.has(placeId)) return;
  inflight.add(placeId);
  try {
    cards.set(placeId, await api.getPlaceCard(placeId));
  } catch {
    cards.set(placeId, null); // uncached / not found — fall back to stock
  } finally {
    inflight.delete(placeId);
    emit();
  }
}

/** Live Google card for a place, or null until loaded / if none. Loads once. */
export function usePlaceCard(placeId?: string): PlaceCard | null {
  useSyncExternalStore(subscribe, () => version, () => version);
  useEffect(() => {
    if (placeId) ensureCard(placeId);
  }, [placeId]);
  return placeId ? cards.get(placeId) ?? null : null;
}

/** Reviews are billed per fetch, so they load only on an explicit `load()`. */
export function usePlaceReviews(placeId?: string) {
  const [reviews, setReviews] = useState<PlaceReview[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await api.getPlaceReviews(placeId);
      setReviews(r.reviews ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load reviews');
    } finally {
      setLoading(false);
    }
  }, [placeId]);
  return { reviews, loading, error, load };
}
