import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { AITip, StateView, Txt } from '@/components/wayfare/ui';
import type { MapStop } from '@/components/wayfare/wayfare-map.shared';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { back } from '@/lib/nav';
import { openMaps } from '@/lib/maps';
import type { Itinerary, Place } from '@/lib/types';

async function loadPlace(name: string): Promise<Place> {
  const list = await api.listItineraries();
  const it: Itinerary = await api.getItinerary(list[0].id);
  const place = it.places.find((p) => p.name === name);
  if (!place) throw new Error('Place not found');
  return place;
}

export default function PlaceDetail() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { c, cardShadow } = useWayfare();
  const { data: place, loading, error, reload } = useAsync(() => loadPlace(name), [name]);
  const [here, setHere] = useState(false);
  if (loading || error || !place) return <StateView loading={loading} error={error} onRetry={reload} />;

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
      <Txt variant="h1" style={{ fontSize: 26 }}>
        {place.name}
      </Txt>
      <View style={styles.areaRow}>
        <Icon name="pin" size={15} color={c.sec} />
        <Txt variant="sec" muted>
          {place.area}
        </Txt>
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
        <Pressable onPress={() => openMaps(place.lat, place.lng, place.name)} style={[styles.info, { backgroundColor: c.card }, cardShadow]}>
          <Icon name="nav" size={18} color={c.ink} />
          <View>
            <Txt variant="small" faint>
              Directions
            </Txt>
            <Txt style={{ fontWeight: '700' }}>Open maps</Txt>
          </View>
        </Pressable>
      </View>

      <Txt variant="body" muted style={{ marginTop: Space.l, lineHeight: 22 }}>
        {place.why}
      </Txt>

      <View style={{ marginTop: Space.l }}>
        <AITip>
          Coordinates {place.coordinates}
          {place.coordinateSource ? ` · ${place.coordinateSource}` : ''}.
        </AITip>
      </View>

      <Pressable
        onPress={() => setHere(true)}
        style={[styles.checkBtn, { backgroundColor: c.a2, marginTop: Space.xl }]}>
        <Icon name="check" size={18} color="#06432b" />
        <Txt color="#06432b" style={{ fontWeight: '800' }}>
          {here ? 'Checked in · done' : "I'm here · check in"}
        </Txt>
      </Pressable>
    </MapFirst>
  );
}

const styles = StyleSheet.create({
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
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
