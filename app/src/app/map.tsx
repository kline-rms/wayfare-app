import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Icon } from '@/components/wayfare/icon';
import { useWayfare } from '@/components/wayfare/theme';
import { IconButton, PillButton, StateView, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { back } from '@/lib/nav';
import { openMaps } from '@/lib/maps';
import type { Itinerary } from '@/lib/types';

async function loadPrimary(): Promise<Itinerary> {
  const list = await api.listItineraries();
  return api.getItinerary(list[0].id);
}

export default function MapScreen() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string; label?: string }>();
  const { c, scheme } = useWayfare();
  const insets = useSafeAreaInsets();
  const { data, loading, error, reload } = useAsync(loadPrimary, []);
  if (loading || error || !data) return <StateView loading={loading} error={error} onRetry={reload} />;

  // Use the day that has a location as the "next stop"; default to first place.
  const nextPlace = data.places[0];
  const lat = params.lat ? Number(params.lat) : nextPlace.lat;
  const lng = params.lng ? Number(params.lng) : nextPlace.lng;
  const label = params.label ?? nextPlace.name;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* stylised map canvas */}
      <View style={[styles.canvas, { backgroundColor: scheme === 'dark' ? '#20201d' : '#DFE4E1' }]}>
        <MapArt tint={c.a2} road={scheme === 'dark' ? '#33322d' : '#EDEFEC'} />
        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <IconButton name="back" round onPress={back} />
          <View style={[styles.searchPill, { backgroundColor: c.card }]}>
            <Icon name="search" size={18} color={c.sec} />
            <Txt style={{ fontWeight: '700' }} numberOfLines={1}>
              BGC → Old Manila route
            </Txt>
          </View>
        </View>
        <View style={[styles.locate, { top: insets.top + 74 }]}>
          <IconButton name="locate" round onPress={() => openMaps(lat, lng, label)} />
        </View>
      </View>

      {/* bottom sheet */}
      <View style={[styles.sheet, { backgroundColor: c.bg, paddingBottom: insets.bottom + Space.l }]}>
        <View style={[styles.grabber, { backgroundColor: c.ter }]} />
        <View style={styles.nextRow}>
          <View style={[styles.pinChip, { backgroundColor: c.a3 }]}>
            <Icon name="pin" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontWeight: '800' }}>Next: {label}</Txt>
            <Txt variant="small" muted>
              {nextPlace.area}
            </Txt>
          </View>
        </View>
        <PillButton label="Start navigation" icon="nav" onPress={() => openMaps(lat, lng, label)} />
      </View>
    </View>
  );
}

function MapArt({ tint, road }: { tint: string; road: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill}>
      {/* roads */}
      <Path d="M -20 120 C 120 80, 200 260, 400 220" stroke={road} strokeWidth={22} fill="none" />
      <Path d="M 60 -20 C 90 200, 260 300, 320 560" stroke={road} strokeWidth={18} fill="none" />
      <Line x1={0} y1={340} x2={420} y2={300} stroke={road} strokeWidth={14} />
      {/* route */}
      <Path d="M 96 452 C 160 380, 240 300, 300 170" stroke={tint} strokeWidth={5} strokeDasharray="2 10" strokeLinecap="round" fill="none" />
      {/* current location */}
      <Circle cx={96} cy={452} r={30} fill={tint} opacity={0.16} />
      <Circle cx={96} cy={452} r={9} fill="#1A73E8" stroke="#fff" strokeWidth={3} />
      {/* destination */}
      <Circle cx={300} cy={168} r={9} fill="#EA4335" stroke="#fff" strokeWidth={3} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1, overflow: 'hidden' },
  topBar: { position: 'absolute', left: Space.l, right: Space.l, flexDirection: 'row', gap: Space.s, alignItems: 'center' },
  searchPill: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  locate: { position: 'absolute', right: Space.l },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -22,
    paddingHorizontal: Space.xl,
    paddingTop: 14,
    gap: Space.m,
  },
  grabber: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 6 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: Space.m },
  pinChip: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
