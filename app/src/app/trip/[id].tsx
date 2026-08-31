import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, StateView, StatusPill, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { dayCount, money, shortRange } from '@/lib/format';
import { img, photoForPlace } from '@/lib/images';
import { back, go } from '@/lib/nav';
import { walkRoute } from '@/lib/route';
import type { LineGeometry, MapStop } from '@/components/wayfare/wayfare-map.shared';
import type { Day, Itinerary } from '@/lib/types';

const TODAY_ISO = new Date().toISOString().slice(0, 10);
const PIN = ['#FFA828', '#7C5CF6', '#2FD98A'];

type Focus = { lng: number; lat: number; zoom?: number } | null;

// Where the map should point for a given day (its own coords, else its place).
function dayFocus(it: Itinerary, day: Day): Focus {
  if (day.location && Number.isFinite(day.location.lat) && !(day.location.lat === 0 && day.location.lng === 0)) {
    return { lng: day.location.lng, lat: day.location.lat, zoom: 15.5 };
  }
  const anchor = (day.location?.mapAnchor ?? day.destination ?? '').toLowerCase();
  const pl = it.places.find((p) => anchor.includes(p.area.split(',')[0].trim().toLowerCase()));
  return pl && Number.isFinite(pl.lat) ? { lng: pl.lng, lat: pl.lat, zoom: 15.5 } : null;
}

export default function TripOverview() {
  const { id, proposal } = useLocalSearchParams<{ id: string; proposal?: string }>();
  const { c, cardShadow } = useWayfare();
  const { data, loading, error, reload } = useAsync<Itinerary>(() => api.getItinerary(id), [id]);
  const [route, setRoute] = useState<LineGeometry | undefined>();
  const [dayView, setDayView] = useState<'list' | 'slider'>('list');
  const [active, setActive] = useState<number | null>(null);
  const [focus, setFocus] = useState<Focus>(null);

  const mapStops = useMemo<MapStop[]>(() => {
    if (!data) return [];
    return data.places
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0))
      .slice(0, 8)
      .map((p, i) => ({ lat: p.lat, lng: p.lng, label: p.name, sub: p.area, color: PIN[i % 3], you: i === 0 }));
  }, [data]);

  useEffect(() => {
    let alive = true;
    if (mapStops.length > 1) walkRoute(mapStops).then((r) => alive && setRoute(r));
    else setRoute(undefined);
    return () => {
      alive = false;
    };
  }, [mapStops]);

  if (loading || error || !data) return <StateView loading={loading} error={error} onRetry={reload} />;

  const chosen = data.proposals.find((p) => p.id === proposal) ?? data.proposals[0];
  const range = shortRange(data.dateRange.start, data.dateRange.end);

  const selectDay = (i: number, day: Day) => {
    if (active === i) {
      go({ pathname: '/day/[id]', params: { id: day.id } });
      return;
    }
    setActive(i);
    setFocus(dayFocus(data, day));
  };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <Pressable onPress={back}>
        <MapIconButton>
          <Icon name="back" size={22} color="#fff" />
        </MapIconButton>
      </Pressable>
      <View style={{ flex: 1 }}>
        <Txt color="#fff" variant="h1" style={{ fontSize: 25 }} numberOfLines={2}>
          {data.title}
        </Txt>
        <Txt color="rgba(255,255,255,0.85)" variant="small" style={{ marginTop: 3 }}>
          {chosen.name} · {range}
        </Txt>
      </View>
      <Pressable onPress={() => go({ pathname: '/companions', params: { it: data.id } })}>
        <MapIconButton>
          <Icon name="users" size={20} color="#fff" />
        </MapIconButton>
      </Pressable>
      <Pressable onPress={() => go('/calendar')}>
        <MapIconButton>
          <Icon name="calClock" size={20} color="#fff" />
        </MapIconButton>
      </Pressable>
    </View>
  );

  return (
    <MapFirst stops={mapStops} route={route} sheetTop={0.42} header={header} collapsible focus={focus}>
      {/* proposal selector */}
      <View style={styles.selectorRow}>
        {data.proposals.map((p) => {
          const on = p.id === chosen.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => go({ pathname: '/trip/[id]', params: { id: data.id, proposal: p.id } })}
              style={[styles.selChip, { backgroundColor: on ? c.primary : c.card, borderColor: c.line }, !on && { borderWidth: 1 }]}>
              <Txt style={{ color: on ? c.onPrimary : c.ink, fontWeight: '700', fontSize: 12.5 }}>{p.style}</Txt>
            </Pressable>
          );
        })}
      </View>

      {/* day-by-day header + list/slider toggle */}
      <View style={styles.sectionHead}>
        <Txt variant="title">Day by day</Txt>
        <View style={[styles.toggle, { backgroundColor: c.fieldBg }]}>
          <Pressable
            onPress={() => setDayView('list')}
            style={[styles.toggleBtn, dayView === 'list' && { backgroundColor: c.card, ...cardShadow }]}>
            <Txt variant="small" style={{ fontWeight: '800', color: dayView === 'list' ? c.ink : c.sec }}>List</Txt>
          </Pressable>
          <Pressable
            onPress={() => setDayView('slider')}
            style={[styles.toggleBtn, dayView === 'slider' && { backgroundColor: c.card, ...cardShadow }]}>
            <Txt variant="small" style={{ fontWeight: '800', color: dayView === 'slider' ? c.ink : c.sec }}>Swipe</Txt>
          </Pressable>
        </View>
      </View>

      {/* summary strip — full-width tab sitting on top of the day section */}
      <View style={[styles.summary, { backgroundColor: c.fieldBg }]}>
        <SummaryCell value={`${dayCount(data.dateRange.start, data.dateRange.end)}`} label="days" c={c} />
        <View style={[styles.sumDiv, { backgroundColor: c.line }]} />
        <SummaryCell value={range} label="dates" c={c} />
        <View style={[styles.sumDiv, { backgroundColor: c.line }]} />
        <SummaryCell value={money(chosen.estTotal.high, data.currency)} label="est. total" c={c} />
      </View>

      {dayView === 'slider' ? (
        <>
          <Txt variant="small" faint style={{ marginTop: Space.s }}>
            Tap a day to point the map · tap again to open
          </Txt>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: Space.s, paddingVertical: Space.s, paddingRight: Space.l }}>
            {chosen.days.map((d, i) => {
              const on = active === i;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => selectDay(i, d)}
                  style={[styles.slideCard, { backgroundColor: c.card, borderColor: on ? c.primary : 'transparent' }, cardShadow]}>
                  <Image source={img(photoForPlace(`${d.destination} ${d.theme}`))} style={styles.slideThumb} contentFit="cover" />
                  <Txt variant="small" faint style={{ marginTop: 8 }}>
                    DAY {i + 1}
                  </Txt>
                  <Txt style={{ fontWeight: '800', fontSize: 13.5, marginTop: 1 }} numberOfLines={1}>
                    {d.theme}
                  </Txt>
                  <Txt variant="small" muted numberOfLines={1} style={{ marginTop: 1 }}>
                    {d.dateLabel}
                  </Txt>
                  {on ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <Txt variant="small" style={{ color: c.primary, fontWeight: '800' }}>Open day</Txt>
                      <Icon name="chevR" size={13} color={c.primary} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : (
        <View style={{ gap: Space.m, marginTop: Space.m }}>
          {chosen.days.map((d, i) => {
            const status = d.date < TODAY_ISO ? 'done' : d.date === TODAY_ISO ? 'today' : 'plan';
            return (
              <Pressable
                key={d.id}
                onPress={() => go({ pathname: '/day/[id]', params: { id: d.id } })}
                style={({ pressed }) => [styles.dayRow, { backgroundColor: c.card }, cardShadow, pressed && { opacity: 0.85 }]}>
                <Image source={img(photoForPlace(`${d.destination} ${d.theme}`))} style={styles.dayThumb} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Txt variant="small" faint>
                    DAY {i + 1} · {d.dateLabel.toUpperCase()}
                  </Txt>
                  <Txt style={{ fontWeight: '800', marginTop: 2 }} numberOfLines={1}>
                    {d.theme}
                  </Txt>
                  <Txt variant="small" muted style={{ marginTop: 2 }}>
                    {d.timeWindow} · {d.destination}
                  </Txt>
                </View>
                {status === 'done' ? (
                  <Icon name="checkC" size={22} color={c.a2} />
                ) : status === 'today' ? (
                  <StatusPill label="TODAY" tone="active" />
                ) : (
                  <Icon name="chevR" size={16} color={c.ter} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {data.diningGuide?.length ? (
        <>
          <Txt variant="title" style={{ marginTop: Space.xl, marginBottom: Space.m }}>
            Dining guide
          </Txt>
          <View style={{ gap: Space.m }}>
            {data.diningGuide.map((r) => (
              <Card key={r.restaurant} onPress={r.mapsUrl ? () => Linking.openURL(r.mapsUrl!) : undefined}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s }}>
                  <Txt style={{ fontWeight: '800', flex: 1 }} numberOfLines={1}>
                    {r.restaurant}
                  </Txt>
                  {r.budget ? <StatusPill label={r.budget} tone="neutral" /> : null}
                </View>
                {r.whenWho ? (
                  <Txt variant="small" faint style={{ marginTop: 3 }}>
                    {r.whenWho}
                  </Txt>
                ) : null}
                {r.recommendedOrder ? (
                  <Txt variant="sec" muted style={{ marginTop: 6, lineHeight: 19 }}>
                    {r.recommendedOrder}
                  </Txt>
                ) : null}
              </Card>
            ))}
          </View>
        </>
      ) : null}

      {data.groceryPlan?.length ? (
        <>
          <Txt variant="title" style={{ marginTop: Space.xl, marginBottom: Space.m }}>
            Grocery plan
          </Txt>
          <View style={{ gap: Space.m }}>
            {data.groceryPlan.map((g, i) => (
              <Card key={`${g.store}-${i}`}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s }}>
                  <Txt style={{ fontWeight: '800', flex: 1 }} numberOfLines={1}>
                    {g.store}
                  </Txt>
                  {g.budget ? <StatusPill label={g.budget} tone="neutral" /> : null}
                </View>
                <Txt variant="small" faint style={{ marginTop: 3 }}>
                  {[g.when, g.purpose].filter(Boolean).join(' · ')}
                </Txt>
                {g.basket ? (
                  <Txt variant="sec" muted style={{ marginTop: 6, lineHeight: 19 }}>
                    {g.basket}
                  </Txt>
                ) : null}
              </Card>
            ))}
          </View>
        </>
      ) : null}
    </MapFirst>
  );
}

function SummaryCell({ value, label, c }: { value: string; label: string; c: ReturnType<typeof useWayfare>['c'] }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Txt style={{ fontWeight: '800', fontSize: 14, color: c.ink }} numberOfLines={1}>
        {value}
      </Txt>
      <Txt variant="small" faint style={{ marginTop: 1 }}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  selectorRow: { flexDirection: 'row', gap: Space.s, marginTop: Space.s, flexWrap: 'wrap' },
  selChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Space.xl, marginBottom: Space.s },
  toggle: { flexDirection: 'row', borderRadius: 999, padding: 3, gap: 2 },
  toggleBtn: { paddingHorizontal: 14, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: Space.s,
  },
  sumDiv: { width: 1, height: 26 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: Space.m, borderRadius: 20, padding: 12 },
  dayThumb: { width: 56, height: 56, borderRadius: 16 },
  slideCard: { width: 150, borderRadius: 18, padding: 10, borderWidth: 2 },
  slideThumb: { width: '100%', height: 78, borderRadius: 12 },
});
