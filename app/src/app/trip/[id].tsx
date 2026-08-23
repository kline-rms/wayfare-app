import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/wayfare/icon';
import { PhotoCard } from '@/components/wayfare/photo';
import { useWayfare } from '@/components/wayfare/theme';
import { IconButton, StateView, StatRow, StatusPill, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { dayCount, money, shortRange } from '@/lib/format';
import { img, photoForPlace } from '@/lib/images';
import { back, go } from '@/lib/nav';
import type { Itinerary } from '@/lib/types';

const TODAY_INDEX = 3;

export default function TripOverview() {
  const { id, proposal } = useLocalSearchParams<{ id: string; proposal?: string }>();
  const { c, cardShadow } = useWayfare();
  const insets = useSafeAreaInsets();
  const { data, loading, error, reload } = useAsync<Itinerary>(() => api.getItinerary(id), [id]);
  if (loading || error || !data) return <StateView loading={loading} error={error} onRetry={reload} />;

  const chosen = data.proposals.find((p) => p.id === proposal) ?? data.proposals[0];
  const range = shortRange(data.dateRange.start, data.dateRange.end);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Space.xxl }}>
        {/* hero */}
        <PhotoCard name="bgc" height={260} radius={0} scrim={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}>
          <View style={[styles.heroTop, { top: insets.top + 8 }]}>
            <IconButton name="back" round tint="rgba(255,255,255,0.92)" onPress={back} />
            <IconButton name="calClock" round tint="rgba(255,255,255,0.92)" onPress={() => go('/calendar')} />
          </View>
          <View style={styles.heroBottom}>
            <Txt color="rgba(255,255,255,0.85)" variant="small">
              {chosen.name} · from Avida, BGC
            </Txt>
            <Txt color="#fff" variant="h1" style={{ fontSize: 30, marginTop: 4 }}>
              BGC + Manila
            </Txt>
          </View>
        </PhotoCard>

        <View style={{ paddingHorizontal: Space.xl }}>
          {/* stat row */}
          <View style={[styles.statCard, { backgroundColor: c.card }, cardShadow]}>
            <StatRow
              items={[
                [`${dayCount(data.dateRange.start, data.dateRange.end)}`, 'days'],
                [range, 'dates'],
                [money(chosen.estTotal.high, data.currency), 'est. total'],
              ]}
            />
          </View>

          {/* proposal selector */}
          <View style={styles.selectorRow}>
            {data.proposals.map((p) => {
              const on = p.id === chosen.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => go({ pathname: '/trip/[id]', params: { id: data.id, proposal: p.id } })}
                  style={[
                    styles.selChip,
                    { backgroundColor: on ? c.primary : c.card, borderColor: c.line },
                    !on && { borderWidth: 1 },
                  ]}>
                  <Txt style={{ color: on ? c.onPrimary : c.ink, fontWeight: '700', fontSize: 12.5 }}>
                    {p.style}
                  </Txt>
                </Pressable>
              );
            })}
          </View>

          {/* day list */}
          <Txt variant="title" style={{ marginTop: Space.xl, marginBottom: Space.m }}>
            Day by day
          </Txt>
          <View style={{ gap: Space.m }}>
            {chosen.days.map((d, i) => {
              const status = i < TODAY_INDEX ? 'done' : i === TODAY_INDEX ? 'today' : 'plan';
              return (
                <Pressable
                  key={d.id}
                  onPress={() => go({ pathname: '/day/[id]', params: { id: d.id } })}
                  style={({ pressed }) => [
                    styles.dayRow,
                    { backgroundColor: c.card },
                    cardShadow,
                    pressed && { opacity: 0.85 },
                  ]}>
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
        </View>
      </ScrollView>
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
  heroBottom: { position: 'absolute', left: Space.xl, right: Space.xl, bottom: 16 },
  statCard: { borderRadius: 22, padding: Space.l, marginTop: -22 },
  selectorRow: { flexDirection: 'row', gap: Space.s, marginTop: Space.l, flexWrap: 'wrap' },
  selChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.m,
    borderRadius: 20,
    padding: 12,
  },
  dayThumb: { width: 56, height: 56, borderRadius: 16 },
});
