import { Image } from 'expo-image';

import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/wayfare/icon';
import { PhotoCard } from '@/components/wayfare/photo';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, PillButton, StateView, StatusPill, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { dayCount, shortRange } from '@/lib/format';
import { ImageKey, img } from '@/lib/images';
import { go } from '@/lib/nav';
import type { Itinerary } from '@/lib/types';

async function loadPrimary(): Promise<Itinerary> {
  const list = await api.listItineraries();
  if (!list.length) throw new Error('No itineraries yet');
  return api.getItinerary(list[0].id);
}

export default function HomeScreen() {
  const { c, cardShadow } = useWayfare();
  const insets = useSafeAreaInsets();
  const { data, loading, error, reload } = useAsync(loadPrimary, []);

  if (loading || error || !data) return <StateView loading={loading} error={error} onRetry={reload} />;

  const total = dayCount(data.dateRange.start, data.dateRange.end);
  const range = shortRange(data.dateRange.start, data.dateRange.end);
  const currentDay = 4;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + Space.s, paddingHorizontal: Space.xl, paddingBottom: Space.xxl }}>
        {/* header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: c.primary }]}>
            <Txt color={c.onPrimary} style={{ fontWeight: '800', fontSize: 15 }}>
              KL
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="small" muted>
              Good morning
            </Txt>
            <Txt variant="h2" style={{ fontSize: 20 }}>
              Kline
            </Txt>
          </View>
          <Pressable
            onPress={() => go('/(tabs)/alerts')}
            style={[styles.iconBtn, { backgroundColor: c.card }, cardShadow]}>
            <Icon name="bell" size={20} color={c.ink} />
            <View style={[styles.dot, { backgroundColor: c.a1, borderColor: c.card }]} />
          </Pressable>
        </View>

        <Txt variant="label" muted style={{ marginTop: Space.xl, marginBottom: Space.s }}>
          UPCOMING
        </Txt>

        {/* cinematic hero */}
        <Pressable onPress={() => go({ pathname: '/trip/[id]', params: { id: data.id } })}>
          <PhotoCard name="bgc" height={300} radius={28} scrim={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.78)']}>
            <View style={styles.heroBadge}>
              <Txt color="#fff" style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>
                DAY {currentDay} OF {total}
              </Txt>
            </View>
            <View style={styles.heroBottom}>
              <Txt color="#fff" style={{ fontSize: 27, fontWeight: '800', letterSpacing: -0.6 }}>
                BGC + Manila
              </Txt>
              <Txt color="rgba(255,255,255,0.9)" variant="sec" style={{ marginTop: 2 }}>
                from Avida, BGC · {range}
              </Txt>
              <View style={styles.heroRow}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${(currentDay / total) * 100}%` }]} />
                </View>
                <View style={styles.openBtn}>
                  <Txt color="#191A1C" style={{ fontWeight: '800', fontSize: 13 }}>
                    Open
                  </Txt>
                </View>
              </View>
            </View>
          </PhotoCard>
        </Pressable>

        {/* plan a new trip */}
        <View style={{ marginTop: Space.l }}>
          <PillButton label="Plan a new trip" icon="spark" onPress={() => go('/create')} />
        </View>

        {/* your trips */}
        <View style={styles.sectionHead}>
          <Txt variant="title">Your trips</Txt>
          <Pressable onPress={() => go('/(tabs)/trips')}>
            <Txt variant="small" muted>
              See all
            </Txt>
          </Pressable>
        </View>

        <Card padded={false} style={{ paddingHorizontal: Space.l }}>
          <TripRow
            photo="bgc"
            title="BGC + Manila"
            sub={`${range}, 2026`}
            status="ACTIVE"
            onPress={() => go({ pathname: '/trip/[id]', params: { id: data.id } })}
          />
          <View style={{ height: 1, backgroundColor: c.line }} />
          <TripRow photo="manilabay" title="Iloilo family visit" sub="Sep 4 – 6" status="UPCOMING" last />
        </Card>
      </ScrollView>
    </View>
  );
}

function TripRow({
  photo,
  title,
  sub,
  status,
  onPress,
}: {
  photo: ImageKey;
  title: string;
  sub: string;
  status: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tripRow, pressed && { opacity: 0.7 }]}>
      <Image source={img(photo)} style={styles.tripThumb} contentFit="cover" />
      <Wrap>
        <Txt style={{ fontWeight: '800' }}>{title}</Txt>
        <Txt variant="small" muted style={{ marginTop: 1 }}>
          {sub}
        </Txt>
      </Wrap>
      <StatusPill label={status} tone={status === 'ACTIVE' ? 'active' : 'neutral'} />
    </Pressable>
  );
}

function Wrap({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Space.m },
  avatar: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 11, right: 12, width: 9, height: 9, borderRadius: 5, borderWidth: 2 },
  heroBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBottom: { position: 'absolute', left: 18, right: 18, bottom: 16 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#fff' },
  openBtn: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9, backgroundColor: '#fff' },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Space.xl,
    marginBottom: Space.m,
  },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: Space.m, paddingVertical: 12 },
  tripThumb: { width: 52, height: 52, borderRadius: 14 },
});
