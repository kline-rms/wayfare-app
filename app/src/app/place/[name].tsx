import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/wayfare/icon';
import { PhotoCard } from '@/components/wayfare/photo';
import { useWayfare } from '@/components/wayfare/theme';
import { AITip, IconButton, StateView, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { photoForPlace } from '@/lib/images';
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
  const insets = useSafeAreaInsets();
  const { data: place, loading, error, reload } = useAsync(() => loadPlace(name), [name]);
  const [here, setHere] = useState(false);
  if (loading || error || !place) return <StateView loading={loading} error={error} onRetry={reload} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <PhotoCard name={photoForPlace(place.name)} height={280} radius={0} scrim={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)']}>
          <View style={[styles.heroTop, { top: insets.top + 8 }]}>
            <IconButton name="back" round tint="rgba(255,255,255,0.92)" onPress={back} />
            <IconButton name="heart" round tint="rgba(255,255,255,0.92)" />
          </View>
        </PhotoCard>

        <View style={{ paddingHorizontal: Space.xl, paddingTop: Space.l }}>
          <Txt variant="h1" style={{ fontSize: 26 }}>
            {place.name}
          </Txt>
          <View style={styles.areaRow}>
            <Icon name="pin" size={15} color={c.sec} />
            <Txt variant="sec" muted>
              {place.area}
            </Txt>
          </View>

          {/* info cards */}
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
              onPress={() => openMaps(place.lat, place.lng, place.name)}
              style={[styles.info, { backgroundColor: c.card }, cardShadow]}>
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
        </View>
      </ScrollView>

      {/* check-in bar */}
      <View style={[styles.dock, { paddingBottom: insets.bottom + Space.m }]}>
        <View style={[styles.dockCard, { backgroundColor: c.card }, cardShadow]}>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontWeight: '800' }}>{here ? "You're here" : `Arriving at ${place.name.split(' ')[0]}`}</Txt>
            <Txt variant="small" muted>
              {here ? 'Stop marked complete.' : 'Confirm when you arrive.'}
            </Txt>
          </View>
          <Pressable
            onPress={() => setHere(true)}
            style={[styles.checkBtn, { backgroundColor: here ? c.a2 : c.primary }]}>
            <Icon name="check" size={18} color="#fff" />
            <Txt color="#fff" style={{ fontWeight: '700' }}>
              {here ? 'Done' : "I'm here"}
            </Txt>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroTop: {
    position: 'absolute',
    left: Space.xl,
    right: Space.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  info: { flex: 1, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dock: { position: 'absolute', left: Space.l, right: Space.l, bottom: 0 },
  dockCard: {
    borderRadius: 28,
    padding: 12,
    paddingLeft: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.m,
  },
  checkBtn: {
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 22,
  },
});
