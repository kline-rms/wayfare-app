import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { AIOrb, CategoryIcon, Chip, PillButton, StateView, StatusPill, Txt } from '@/components/wayfare/ui';
import type { LineGeometry, MapStop } from '@/components/wayfare/wayfare-map.shared';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { dayCount, shortRange } from '@/lib/format';
import { go } from '@/lib/nav';
import { walkRoute } from '@/lib/route';
import type { Itinerary } from '@/lib/types';

const PIN = ['#FFA828', '#7C5CF6', '#2FD98A'];

// Load every itinerary up-front so switching between them is instant.
async function loadAll(): Promise<Itinerary[]> {
  const list = await api.listItineraries();
  if (!list.length) throw new Error('No itineraries yet');
  return Promise.all(list.map((s) => api.getItinerary(s.id)));
}

export default function HomeScreen() {
  const { c, cardShadow } = useWayfare();
  const { data: trips, loading, error, reload } = useAsync(loadAll, []);
  const [idx, setIdx] = useState(0);
  const [route, setRoute] = useState<LineGeometry | undefined>();

  const active = trips?.[Math.min(idx, (trips?.length ?? 1) - 1)];
  const mapStops = useMemo<MapStop[]>(() => {
    if (!active) return [];
    return active.places
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0))
      .slice(0, 8)
      .map((p, i) => ({ lat: p.lat, lng: p.lng, label: p.name, sub: p.area, color: PIN[i % 3], you: i === 0 }));
  }, [active]);

  useEffect(() => {
    let alive = true;
    if (mapStops.length > 1) walkRoute(mapStops).then((r) => alive && setRoute(r));
    else setRoute(undefined);
    return () => {
      alive = false;
    };
  }, [mapStops]);

  if (loading || error || !trips || !active) return <StateView loading={loading} error={error} onRetry={reload} />;

  const total = dayCount(active.dateRange.start, active.dateRange.end);
  const currentDay = Math.min(4, total);
  const next = mapStops.find((s) => !s.you)?.label ?? active.places[0]?.name ?? 'your next stop';
  const open = () => go({ pathname: '/trip/[id]', params: { id: active.id } });

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={styles.greetCard}>
        <Txt variant="label" style={{ color: c.a3 }}>
          GOOD MORNING
        </Txt>
        <Txt style={{ color: '#fff', fontWeight: '800', fontSize: 15, marginTop: 1 }}>Kline</Txt>
      </View>
      <AIOrb size={40} />
    </View>
  );

  return (
    <MapFirst stops={mapStops} route={route} header={header} sheetTop={0.46} dockGap collapsible>
      {/* itinerary switcher — swipe to see your other trips; the map follows */}
      <View style={styles.switchHead}>
        <Txt variant="label" style={{ color: c.a3 }}>
          YOUR TRIPS · {trips.length}
        </Txt>
        {trips.length > 1 ? (
          <Txt variant="small" faint>
            swipe →
          </Txt>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: Space.s, paddingBottom: Space.s, paddingRight: Space.l }}>
        {trips.map((t, i) => {
          const on = i === idx;
          return (
            <Pressable
              key={t.id}
              onPress={() => (on ? open() : setIdx(i))}
              style={[styles.tripCard, { backgroundColor: c.card, borderColor: on ? c.primary : 'transparent' }, cardShadow]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CategoryIcon name="route" color={PIN[i % 3]} size={34} iconSize={16} />
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontWeight: '800', fontSize: 13 }} numberOfLines={1}>
                    {t.title}
                  </Txt>
                  <Txt variant="small" muted numberOfLines={1} style={{ marginTop: 1 }}>
                    {shortRange(t.dateRange.start, t.dateRange.end)} · {t.partySize} pax
                  </Txt>
                </View>
              </View>
              {on ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  <Txt variant="small" style={{ color: c.primary, fontWeight: '800' }}>Open trip</Txt>
                  <Icon name="chevR" size={13} color={c.primary} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* the active trip */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: Space.m }}>
        <StatusPill label={`● LIVE · DAY ${currentDay}`} tone="active" />
        <Chip label="AI PLAN" color={c.a1} filled small />
      </View>

      <Txt style={{ fontWeight: '800', fontSize: 16, marginTop: 9 }}>{active.title}</Txt>

      <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
        <View style={{ height: '100%', width: `${(currentDay / total) * 100}%`, borderRadius: 999, backgroundColor: c.a1 }} />
      </View>

      <Txt variant="small" muted style={{ marginTop: 8 }}>
        Next: {next} · 0.4 km · 6 min · ☀ 31°
      </Txt>

      <View style={{ marginTop: Space.l, gap: Space.s }}>
        <PillButton label="Open this trip" icon="arrow" knob onPress={open} />
        <PillButton label="Plan a new trip" icon="spark" variant="secondary" onPress={() => go('/create')} />
      </View>
    </MapFirst>
  );
}

const styles = StyleSheet.create({
  greetCard: {
    flex: 1,
    backgroundColor: 'rgba(40,30,90,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  switchHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Space.s },
  tripCard: { width: 210, borderRadius: 16, padding: 12, borderWidth: 2 },
  track: { height: 8, borderRadius: 999, marginTop: 9, overflow: 'hidden' },
});
