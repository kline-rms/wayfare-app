import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { DiningGuide } from '@/components/wayfare/dining-guide';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { PlacePhoto } from '@/components/wayfare/place-photo';
import { useWayfare } from '@/components/wayfare/theme';
import { AITip, StateView, Txt } from '@/components/wayfare/ui';
import type { MapStop } from '@/components/wayfare/wayfare-map.shared';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { currentActivity, isMeal } from '@/lib/dining';
import { img, photoForPlace } from '@/lib/images';
import { back, go } from '@/lib/nav';
import { openMaps } from '@/lib/maps';
import { usePlaceCard, usePlaceReviews } from '@/lib/places';
import type { Activity, Itinerary, Place } from '@/lib/types';

const norm = (s: string) => s.toLowerCase().split(/[,(]/)[0].trim();
function samePlace(where: string, name: string) {
  const a = norm(where);
  const b = norm(name);
  return a.includes(b) || b.includes(a);
}

interface PlaceData {
  place: Place;
  meal: Activity | null;
  partySize: number;
  now: boolean;
}

async function loadPlace(name: string, itId?: string): Promise<PlaceData> {
  // Load the trip we came from; if none was passed, find the trip that actually
  // contains this place (so we never show the wrong trip's copy or "not found").
  let it: Itinerary;
  if (itId) {
    it = await api.getItinerary(itId);
  } else {
    const list = await api.listItineraries();
    let found: Itinerary | null = null;
    for (const s of list) {
      const cand = await api.getItinerary(s.id);
      if (cand.places.some((p) => p.name === name)) {
        found = cand;
        break;
      }
    }
    it = found ?? (await api.getItinerary(list[0].id));
  }
  const place = it.places.find((p) => p.name === name);
  if (!place) throw new Error('Place not found');
  // Find a dining block at this place; prefer the one happening right now.
  let meal: Activity | null = null;
  let now = false;
  for (const p of it.proposals) {
    for (const d of p.days) {
      const cur = currentActivity(d);
      for (const a of d.activities ?? []) {
        if (!isMeal(a) || !samePlace(a.where, place.name)) continue;
        if (!meal) meal = a;
        if (cur?.id === a.id) {
          meal = a;
          now = true;
        }
      }
    }
  }
  return { place, meal, partySize: it.partySize, now };
}

export default function PlaceDetail() {
  const { name, it: itId } = useLocalSearchParams<{ name: string; it?: string }>();
  const { c, cardShadow } = useWayfare();
  const { data, loading, error, reload } = useAsync(() => loadPlace(name, itId), [name, itId]);
  const placeId = data?.place.placeId;
  const card = usePlaceCard(placeId);
  const reviews = usePlaceReviews(placeId);
  if (loading || error || !data) return <StateView loading={loading} error={error} onRetry={reload} />;
  const { place, meal, partySize, now } = data;

  const valid = Number.isFinite(place.lat) && Number.isFinite(place.lng) && !(place.lat === 0 && place.lng === 0);
  const stops: MapStop[] = valid ? [{ lat: place.lat, lng: place.lng, label: place.name, color: '#7C5CF6' }] : [];

  const header = (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Pressable onPress={back}>
        <MapIconButton>
          <Icon name="back" size={22} color="#fff" />
        </MapIconButton>
      </Pressable>
      <Pressable>
        <MapIconButton>
          <Icon name="heart" size={20} color="#fff" />
        </MapIconButton>
      </Pressable>
    </View>
  );

  return (
    <MapFirst stops={stops} fit={false} sheetTop={0.4} pitch={40} header={header}>
      {/* Real Google photo — shown only when this place has been enriched.
          Un-enriched places look exactly as before (no stock hero here). */}
      {card?.photoUrls?.length ? (
        <View style={[styles.hero, cardShadow]}>
          <PlacePhoto placeId={placeId} fallback={img(photoForPlace(place.name))} style={styles.heroImg} />
        </View>
      ) : null}

      <Txt variant="h1" style={{ fontSize: 26 }}>
        {place.name}
      </Txt>
      <View style={styles.areaRow}>
        <Icon name="pin" size={15} color={c.sec} />
        <Txt variant="sec" muted>
          {place.area}
        </Txt>
        {card?.rating ? (
          <>
            <Txt variant="sec" muted>
              ·
            </Txt>
            <Txt variant="sec" style={{ color: '#FFA828', fontWeight: '800' }}>
              ★ {card.rating.toFixed(1)}
            </Txt>
            {card.ratingCount ? (
              <Txt variant="small" faint>
                ({card.ratingCount.toLocaleString()})
              </Txt>
            ) : null}
          </>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: Space.m, marginTop: Space.l }}>
        <View style={[styles.info, { backgroundColor: c.card }, cardShadow]}>
          <Icon name="peso" size={18} color={c.ink} />
          <View>
            <Txt variant="small" faint>
              Entry
            </Txt>
            <Txt style={{ fontWeight: '700' }}>Free</Txt>
          </View>
        </View>
        <Pressable
          onPress={() => go({ pathname: '/navigate', params: { lat: String(place.lat), lng: String(place.lng), label: place.name } })}
          style={[styles.info, { backgroundColor: c.card }, cardShadow]}>
          <Icon name="nav" size={18} color={c.ink} />
          <View>
            <Txt variant="small" faint>
              Directions
            </Txt>
            <Txt style={{ fontWeight: '700' }}>Navigate</Txt>
          </View>
        </Pressable>
      </View>

      <Txt variant="body" muted style={{ marginTop: Space.l, lineHeight: 22 }}>
        {place.why}
      </Txt>

      {/* Google facts (hours / phone / website) — present once enriched. */}
      {card && (card.hours?.length || card.phone || card.website) ? (
        <View style={[styles.facts, { backgroundColor: c.card }, cardShadow]}>
          {card.hours?.length ? (
            <View style={styles.factRow}>
              <Icon name="clock" size={16} color={c.sec} />
              <Txt variant="small" muted style={{ flex: 1 }}>
                {card.hours[0]}
              </Txt>
            </View>
          ) : null}
          {card.phone ? (
            <Pressable style={styles.factRow} onPress={() => Linking.openURL(`tel:${card.phone}`)}>
              <Icon name="phone" size={16} color={c.sec} />
              <Txt variant="small" style={{ flex: 1, color: c.ink }}>
                {card.phone}
              </Txt>
            </Pressable>
          ) : null}
          {card.website ? (
            <Pressable style={styles.factRow} onPress={() => Linking.openURL(card.website!)}>
              <Icon name="globe" size={16} color={c.sec} />
              <Txt variant="small" numberOfLines={1} style={{ flex: 1, color: c.primary }}>
                {card.website.replace(/^https?:\/\/(www\.)?/, '')}
              </Txt>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Dining guide — appears automatically for dining stops; no check-in.
          Highlights as NOW when you're here at its mealtime. */}
      {meal ? (
        <View style={{ marginTop: Space.l }}>
          <DiningGuide activity={meal} partySize={partySize} now={now} />
        </View>
      ) : (
        <View style={{ marginTop: Space.l }}>
          <AITip>
            Coordinates {place.coordinates}
            {place.coordinateSource ? ` · ${place.coordinateSource}` : ''}.
          </AITip>
        </View>
      )}

      {/* Reviews — fetched live only on tap (billed per fetch, never stored). */}
      {placeId ? (
        <View style={{ marginTop: Space.l }}>
          <View style={styles.reviewHead}>
            <Txt variant="h2" style={{ fontSize: 18 }}>
              Reviews
            </Txt>
            <Txt variant="small" faint>
              Google · live
            </Txt>
          </View>
          {reviews.reviews == null ? (
            <Pressable
              onPress={reviews.load}
              disabled={reviews.loading}
              style={[styles.reviewBtn, { backgroundColor: c.card }, cardShadow]}>
              {reviews.loading ? (
                <ActivityIndicator color={c.primary} />
              ) : (
                <>
                  <Icon name="star" size={16} color={c.primary} />
                  <Txt style={{ fontWeight: '700', color: c.ink }}>Show recent reviews</Txt>
                </>
              )}
            </Pressable>
          ) : reviews.reviews.length === 0 ? (
            <Txt variant="small" muted>
              {reviews.error ?? 'No reviews available for this place.'}
            </Txt>
          ) : (
            <View style={{ gap: Space.m }}>
              {reviews.reviews.map((r, i) => (
                <View key={i} style={[styles.review, { backgroundColor: c.card }, cardShadow]}>
                  <View style={styles.reviewTop}>
                    <Txt style={{ fontWeight: '800' }} numberOfLines={1}>
                      {r.author ?? 'Guest'}
                    </Txt>
                    {r.rating ? (
                      <Txt variant="small" style={{ color: '#FFA828', fontWeight: '800' }}>
                        ★ {r.rating}
                      </Txt>
                    ) : null}
                  </View>
                  {r.text ? (
                    <Txt variant="small" muted style={{ marginTop: 4, lineHeight: 19 }} numberOfLines={5}>
                      {r.text}
                    </Txt>
                  ) : null}
                  {r.relativeTime ? (
                    <Txt variant="small" faint style={{ marginTop: 6 }}>
                      {r.relativeTime}
                    </Txt>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}
    </MapFirst>
  );
}

const styles = StyleSheet.create({
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  hero: { borderRadius: 20, overflow: 'hidden', marginBottom: Space.l },
  heroImg: { width: '100%', height: 190 },
  facts: { borderRadius: 16, padding: 14, marginTop: Space.l, gap: 12 },
  factRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Space.m },
  reviewBtn: { minHeight: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  review: { borderRadius: 16, padding: 14 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  info: { flex: 1, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkBtn: {
    minHeight: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 22,
  },
});
