import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PhotoCard } from '@/components/wayfare/photo';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, StateView, StatusPill, Txt } from '@/components/wayfare/ui';
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

export default function TripsScreen() {
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  const { data, loading, error, reload } = useAsync(loadPrimary, []);
  if (loading || error || !data) return <StateView loading={loading} error={error} onRetry={reload} />;

  const total = dayCount(data.dateRange.start, data.dateRange.end);
  const range = shortRange(data.dateRange.start, data.dateRange.end);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + Space.s, paddingHorizontal: Space.xl, paddingBottom: Space.xxl }}>
        <Txt variant="h1">Your trips</Txt>
        <Txt variant="sec" muted style={{ marginTop: 4 }}>
          {data.proposals.length} plans · {data.partySize} travelers
        </Txt>

        {/* active — feature card */}
        <Pressable
          onPress={() => go({ pathname: '/trip/[id]', params: { id: data.id } })}
          style={{ marginTop: Space.l }}>
          <PhotoCard name="bgc" height={190} radius={26} scrim={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.7)']}>
            <View style={styles.featureBottom}>
              <StatusPill label="ACTIVE" tone="active" />
              <Txt color="#fff" style={{ fontSize: 22, fontWeight: '800', marginTop: 8 }}>
                BGC + Manila
              </Txt>
              <Txt color="rgba(255,255,255,0.9)" variant="sec">
                {range} · {total} days
              </Txt>
            </View>
          </PhotoCard>
        </Pressable>

        {/* upcoming / past */}
        <Txt variant="label" muted style={{ marginTop: Space.xl, marginBottom: Space.s }}>
          UPCOMING
        </Txt>
        <Card padded={false} style={{ paddingHorizontal: Space.l }}>
          <Row photo="manilabay" title="Iloilo family visit" sub="Sep 4 – 6, 2026" status="UPCOMING" />
        </Card>

        <Txt variant="label" muted style={{ marginTop: Space.xl, marginBottom: Space.s }}>
          PAST
        </Txt>
        <Card padded={false} style={{ paddingHorizontal: Space.l }}>
          <Row photo="city" title="Cebu food run" sub="Feb 2026" status="DONE" />
          <View style={{ height: 1, backgroundColor: c.line }} />
          <Row photo="rooftop" title="Makati staycation" sub="Dec 2025" status="DONE" last />
        </Card>
      </ScrollView>
    </View>
  );
}

function Row({
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <Image source={img(photo)} style={styles.thumb} contentFit="cover" />
      <View style={{ flex: 1 }}>
        <Txt style={{ fontWeight: '800' }}>{title}</Txt>
        <Txt variant="small" muted style={{ marginTop: 1 }}>
          {sub}
        </Txt>
      </View>
      <StatusPill label={status} tone={status === 'DONE' ? 'neutral' : status === 'UPCOMING' ? 'neutral' : 'active'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  featureBottom: { position: 'absolute', left: 18, right: 18, bottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.m, paddingVertical: 12 },
  thumb: { width: 52, height: 52, borderRadius: 14 },
});
