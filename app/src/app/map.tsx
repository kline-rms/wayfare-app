import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/wayfare/icon';
import WayfareMap from '@/components/wayfare/wayfare-map';
import type { LineGeometry, MapStop } from '@/components/wayfare/wayfare-map.shared';
import { IconButton, StateView, StatusPill, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { back } from '@/lib/nav';
import { openMaps } from '@/lib/maps';
import { haversineKm } from '@/lib/geo';
import { walkRoute } from '@/lib/route';
import type { Itinerary } from '@/lib/types';

const PIN = ['#FFA828', '#7C5CF6', '#2FD98A']; // marigold / grape / mint, cycled

async function loadPrimary(): Promise<Itinerary> {
  const list = await api.listItineraries();
  return api.getItinerary(list[0].id);
}

type Params = { lat?: string; lng?: string; label?: string };

function buildStops(data: Itinerary, params: Params): MapStop[] {
  if (params.lat && params.lng) {
    return [{ lat: Number(params.lat), lng: Number(params.lng), label: params.label, you: true }];
  }
  return data.places
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0))
    .map((p, i) => ({ lat: p.lat, lng: p.lng, label: p.name, sub: p.area, color: PIN[i % 3], you: i === 0 }));
}

function routeKm(stops: MapStop[]): number {
  let km = 0;
  for (let i = 1; i < stops.length; i++) km += haversineKm(stops[i - 1], stops[i]);
  return km;
}

export default function MapScreen() {
  const params = useLocalSearchParams<Params>();
  const insets = useSafeAreaInsets();
  const { data, loading, error, reload } = useAsync(loadPrimary, []);
  const [route, setRoute] = useState<LineGeometry | undefined>();
  const [navigating, setNavigating] = useState(false);

  const stops = useMemo(() => (data ? buildStops(data, params) : []), [data, params.lat, params.lng, params.label]);

  useEffect(() => {
    let alive = true;
    if (stops.length > 1) walkRoute(stops).then((r) => alive && setRoute(r));
    else setRoute(undefined);
    return () => {
      alive = false;
    };
  }, [stops]);

  if (loading || error || !data) return <StateView loading={loading} error={error} onRetry={reload} />;

  const next = params.lat
    ? { name: params.label ?? 'Destination', area: '', lat: Number(params.lat), lng: Number(params.lng) }
    : data.places[0];
  const focus = stops[0] ?? { lat: next.lat, lng: next.lng, label: next.name };
  const km = routeKm(stops);
  const mins = Math.max(1, Math.round((km / 4.6) * 60)); // ~4.6 km/h walking
  const arrive = new Date(Date.now() + mins * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const external = () => openMaps(focus.lat, focus.lng, focus.label ?? next.name);

  return (
    <View style={{ flex: 1, backgroundColor: '#17123A' }}>
      <WayfareMap stops={stops} routeGeometry={route} pitch={navigating ? 62 : 52} style={styles.map} />

      {/* top overlay */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <IconButton name="back" round tint="rgba(36,28,86,0.9)" iconColor="#fff" onPress={navigating ? () => setNavigating(false) : back} />
        {!navigating ? (
          <View style={styles.searchPill}>
            <Icon name="search" size={18} color="#B4ADE0" />
            <Txt style={{ fontWeight: '700', color: '#fff' }} numberOfLines={1}>
              {data.title}
            </Txt>
          </View>
        ) : (
          <View style={styles.turnCard}>
            <Txt style={{ fontFamily: undefined, fontWeight: '800', fontSize: 22, color: '#FFA828' }}>
              {km > 0.15 ? `${(km).toFixed(1)}km` : `${Math.round(km * 1000)}m`}
            </Txt>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '800', color: '#fff' }} numberOfLines={1}>
                Head to {next.name}
              </Txt>
              <Txt variant="small" style={{ color: '#B4ADE0' }} numberOfLines={1}>
                {stops.length > 1 ? `${stops.length - 1} stops after this` : next.area || 'on your route'}
              </Txt>
            </View>
          </View>
        )}
        {!navigating ? (
          <IconButton name="locate" round tint="rgba(36,28,86,0.9)" iconColor="#fff" onPress={external} />
        ) : null}
      </View>

      {/* bottom sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Space.l }]}>
        <View style={styles.grabber} />

        {navigating ? (
          <>
            <View style={styles.gps}>
              <Gps b={km >= 1 ? `${km.toFixed(1)}` : `${Math.round(km * 1000)}`} s={km >= 1 ? 'km away' : 'm away'} />
              <Gps b={`${mins}`} s="min walk" />
              <Gps b={arrive} s="arrive" />
            </View>
            <Pressable onPress={() => setNavigating(false)} style={[styles.navBtn, { backgroundColor: '#FF4667' }]}>
              <Txt style={{ color: '#fff', fontWeight: '800' }}>End · I&apos;m here</Txt>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.sumRow}>
              <Txt style={{ fontWeight: '800', color: '#fff' }}>
                {stops.length > 1 ? `${stops.length} stops today` : `Next: ${next.name}`}
              </Txt>
              <StatusPill label="☀ 31° CLEAR" tone="active" />
            </View>
            {stops.length > 1 ? (
              <Txt variant="small" style={{ color: '#B4ADE0' }}>
                {km.toFixed(1)} km · ~{mins} min walking
              </Txt>
            ) : null}

            <View style={{ gap: 10, marginTop: 4 }}>
              {stops.slice(0, 3).map((s, i) => (
                <View key={i} style={styles.stopRow}>
                  <View style={[styles.dot, { backgroundColor: s.color ?? '#7C5CF6' }]} />
                  <Txt style={{ flex: 1, fontWeight: '700', color: '#fff' }} numberOfLines={1}>
                    {s.label ?? `Stop ${i + 1}`}
                  </Txt>
                  <Txt variant="small" style={{ color: '#8479B8' }} numberOfLines={1}>
                    {s.sub ?? ''}
                  </Txt>
                </View>
              ))}
            </View>

            <Pressable onPress={() => setNavigating(true)} style={[styles.navBtn, { backgroundColor: '#2FD98A' }]}>
              <Icon name="nav" size={18} color="#06432b" />
              <Txt style={{ color: '#06432b', fontWeight: '800' }}>Start navigation</Txt>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function Gps({ b, s }: { b: string; s: string }) {
  return (
    <View style={styles.gpsTile}>
      <Txt style={{ fontWeight: '800', fontSize: 18, color: '#fff' }}>{b}</Txt>
      <Txt variant="small" style={{ color: '#B4ADE0' }}>
        {s}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, borderRadius: 0 },
  topBar: { position: 'absolute', left: Space.l, right: Space.l, flexDirection: 'row', gap: Space.s, alignItems: 'center' },
  searchPill: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(36,28,86,0.9)',
  },
  turnCard: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(40,30,90,0.92)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2A2166',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: Space.xl,
    paddingTop: 14,
    gap: Space.m,
  },
  grabber: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 6, backgroundColor: 'rgba(255,255,255,0.3)' },
  sumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.s },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  gps: { flexDirection: 'row', gap: 8 },
  gpsTile: { flex: 1, backgroundColor: '#332B77', borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  navBtn: { height: 52, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
