import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/wayfare/icon';
import { useWayfare } from '@/components/wayfare/theme';
import { AITip, Card, Header, PillButton, StateView, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { img, photoForPlace } from '@/lib/images';
import { back, go } from '@/lib/nav';
import { openMaps } from '@/lib/maps';
import type { Day, Itinerary, Place } from '@/lib/types';

async function loadDay(dayId: string): Promise<{ it: Itinerary; day: Day }> {
  const list = await api.listItineraries();
  if (!list.length) throw new Error('No itineraries');
  const it = await api.getItinerary(list[0].id);
  for (const p of it.proposals) {
    const day = p.days.find((d) => d.id === dayId);
    if (day) return { it, day };
  }
  throw new Error('Day not found');
}

function placesFor(it: Itinerary, day: Day): Place[] {
  const hay = `${day.destination} ${day.detailedPlan} ${day.location?.mapAnchor ?? ''}`.toLowerCase();
  const matches = it.places.filter((pl) => {
    const key = pl.area.split(',')[0].trim().toLowerCase();
    return hay.includes(key) || hay.includes(pl.name.toLowerCase().split(' ')[0]);
  });
  return (matches.length ? matches : it.places).slice(0, 3);
}

export default function DayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, cardShadow } = useWayfare();
  const insets = useSafeAreaInsets();
  const { data, loading, error, reload } = useAsync(() => loadDay(id), [id]);
  if (loading || error || !data) return <StateView loading={loading} error={error} onRetry={reload} />;

  const { it, day } = data;
  const places = placesFor(it, day);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + Space.s, paddingHorizontal: Space.xl, paddingBottom: Space.xxl }}>
        <Header onBack={back} />
        <Txt variant="small" faint style={{ marginTop: Space.s }}>
          {day.dateLabel.toUpperCase()}
        </Txt>
        <Txt variant="h1" style={{ marginTop: 4 }}>
          {day.theme}
        </Txt>
        <View style={styles.timeChip}>
          <Icon name="clock" size={14} color={c.sec} />
          <Txt variant="small" muted>
            {day.timeWindow}
          </Txt>
        </View>

        {/* route */}
        <Card style={{ marginTop: Space.l, flexDirection: 'row', alignItems: 'center', gap: Space.m }}>
          <View style={{ flex: 1 }}>
            <Txt variant="small" faint>
              FROM
            </Txt>
            <Txt style={{ fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
              {day.comingFrom}
            </Txt>
          </View>
          <Icon name="arrow" size={18} color={c.ter} />
          <View style={{ flex: 1 }}>
            <Txt variant="small" faint>
              TO
            </Txt>
            <Txt style={{ fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
              {day.destination}
            </Txt>
          </View>
        </Card>

        {/* the plan */}
        <Card style={{ marginTop: Space.m }}>
          <Txt variant="body" style={{ lineHeight: 22 }}>
            {day.detailedPlan}
          </Txt>
        </Card>

        {/* travel + cost */}
        <View style={{ flexDirection: 'row', gap: Space.m, marginTop: Space.m }}>
          <InfoCard icon="car" label="Travel" value={day.travelMode} />
          <InfoCard icon="peso" label="Travel cost" value={day.cost.travel ? money(day.cost.travel) : 'Free'} />
        </View>
        <View style={{ flexDirection: 'row', gap: Space.m, marginTop: Space.m }}>
          <InfoCard
            icon="food"
            label="Food (2 pax)"
            value={`${money(day.cost.foodLow)}–${money(day.cost.foodHigh).replace('₱', '')}`}
          />
          <InfoCard icon="pin" label="Anchor" value={day.location?.mapAnchor ?? day.destination} />
        </View>

        {day.notes ? (
          <View style={{ marginTop: Space.m }}>
            <AITip>{day.notes}</AITip>
          </View>
        ) : null}

        {/* places */}
        {places.length ? (
          <>
            <Txt variant="title" style={{ marginTop: Space.xl, marginBottom: Space.m }}>
              Places on this day
            </Txt>
            <View style={{ gap: Space.m }}>
              {places.map((pl) => (
                <Pressable
                  key={pl.name}
                  onPress={() => go({ pathname: '/place/[name]', params: { name: pl.name } })}
                  style={({ pressed }) => [styles.placeRow, { backgroundColor: c.card }, cardShadow, pressed && { opacity: 0.85 }]}>
                  <Image source={img(photoForPlace(pl.name))} style={styles.placeThumb} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontWeight: '800' }} numberOfLines={1}>
                      {pl.name}
                    </Txt>
                    <Txt variant="small" muted numberOfLines={1} style={{ marginTop: 2 }}>
                      {pl.area}
                    </Txt>
                  </View>
                  <Icon name="chevR" size={16} color={c.ter} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <View style={{ marginTop: Space.xl }}>
          <PillButton
            label="Open route map"
            icon="nav"
            onPress={() => (day.location ? openMaps(day.location.lat, day.location.lng, day.location.mapAnchor) : go('/map'))}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoCard({ icon, label, value }: { icon: 'car' | 'peso' | 'food' | 'pin'; label: string; value: string }) {
  const { c, cardShadow } = useWayfare();
  return (
    <View style={[styles.info, { backgroundColor: c.card }, cardShadow]}>
      <Icon name={icon} size={18} color={c.ink} />
      <View style={{ flex: 1 }}>
        <Txt variant="small" faint>
          {label}
        </Txt>
        <Txt style={{ fontWeight: '700', marginTop: 1 }} numberOfLines={1}>
          {value}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  info: { flex: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: Space.m, borderRadius: 18, padding: 12 },
  placeThumb: { width: 50, height: 50, borderRadius: 14 },
});
