import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MapFirst } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { AIOrb, Chip, PillButton, StateView, StatusPill, Txt } from '@/components/wayfare/ui';
import type { LineGeometry, MapStop } from '@/components/wayfare/wayfare-map.shared';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { dayCount } from '@/lib/format';
import { go } from '@/lib/nav';
import { walkRoute } from '@/lib/route';
import type { Itinerary } from '@/lib/types';

const PIN = ['#FFA828', '#7C5CF6', '#2FD98A'];

async function loadPrimary(): Promise<Itinerary> {
  const list = await api.listItineraries();
  if (!list.length) throw new Error('No itineraries yet');
  return api.getItinerary(list[0].id);
}

export default function HomeScreen() {
  const { c } = useWayfare();
  const { data, loading, error, reload } = useAsync(loadPrimary, []);
  const [route, setRoute] = useState<LineGeometry | undefined>();
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

  const total = dayCount(data.dateRange.start, data.dateRange.end);
  const currentDay = Math.min(4, total);
  const next = mapStops.find((s) => !s.you)?.label ?? data.places[0]?.name ?? 'your next stop';

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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <StatusPill label={`● LIVE · DAY ${currentDay}`} tone="active" />
        <Chip label="AI PLAN" color={c.a1} filled small />
      </View>

      <Txt style={{ fontWeight: '800', fontSize: 16, marginTop: 9 }}>{data.title}</Txt>

      <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
        <View style={{ height: '100%', width: `${(currentDay / total) * 100}%`, borderRadius: 999, backgroundColor: c.a1 }} />
      </View>

      <Txt variant="small" muted style={{ marginTop: 8 }}>
        Next: {next} · 0.4 km · 6 min · ☀ 31°
      </Txt>

      <View style={{ marginTop: Space.l }}>
        <PillButton label="Plan a new trip" icon="spark" knob onPress={() => go('/create')} />
      </View>

      <View style={{ marginTop: Space.l, gap: Space.s }}>
        <PillButton
          label="Open this trip"
          icon="arrow"
          variant="secondary"
          onPress={() => go({ pathname: '/trip/[id]', params: { id: data.id } })}
        />
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
  track: { height: 8, borderRadius: 999, marginTop: 9, overflow: 'hidden' },
});
