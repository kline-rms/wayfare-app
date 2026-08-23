import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PhotoCard } from '@/components/wayfare/photo';
import { useWayfare } from '@/components/wayfare/theme';
import { Chip, Header, StateView, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { dayCount, moneyRange, shortRange } from '@/lib/format';
import { ImageKey } from '@/lib/images';
import { back, go } from '@/lib/nav';
import type { Itinerary, Proposal } from '@/lib/types';

const PHOTOS: { img: ImageKey; accent: 'a1' | 'a3' | 'a4' }[] = [
  { img: 'bgc', accent: 'a3' },
  { img: 'city', accent: 'a4' },
  { img: 'museum', accent: 'a1' },
];

export default function ProposalsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  const { data, loading, error, reload } = useAsync<Itinerary>(() => api.getItinerary(id), [id]);
  if (loading || error || !data) return <StateView loading={loading} error={error} onRetry={reload} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + Space.s, paddingHorizontal: Space.xl, paddingBottom: Space.xxl }}>
        <Header onBack={back} />
        <Txt variant="h1" style={{ marginTop: Space.m }}>
          BGC + Manila · {dayCount(data.dateRange.start, data.dateRange.end)} days
        </Txt>
        <Txt variant="sec" muted style={{ marginTop: 6 }}>
          from Avida, BGC · couple trip · {data.partySize} people
        </Txt>

        <View style={{ gap: Space.l, marginTop: Space.l }}>
          {data.proposals.map((p, i) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              index={i}
              currency={data.currency}
              onPress={() => go({ pathname: '/trip/[id]', params: { id: data.id, proposal: p.id } })}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ProposalCard({
  proposal,
  index,
  currency,
  onPress,
}: {
  proposal: Proposal;
  index: number;
  currency: string;
  onPress: () => void;
}) {
  const { c, cardShadow } = useWayfare();
  const meta = PHOTOS[index] ?? PHOTOS[0];
  const accent = c[meta.accent];
  const start = proposal.days[0]?.date ?? '';
  const end = proposal.days[proposal.days.length - 1]?.date ?? '';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.92 }]}>
      <View style={[{ borderRadius: 26, backgroundColor: c.card, overflow: 'hidden' }, cardShadow]}>
        <PhotoCard name={meta.img} height={132} radius={0} scrim={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)']}>
          <View style={{ position: 'absolute', top: 12, left: 12 }}>
            <Chip label={proposal.style.toUpperCase()} filled color={accent} small />
          </View>
        </PhotoCard>
        <View style={{ padding: Space.l }}>
          <Txt variant="h2" style={{ fontSize: 20 }}>
            {proposal.name}
          </Txt>
          <Txt variant="sec" muted style={{ marginTop: 4 }}>
            {proposal.bestFor}
          </Txt>
          <View style={styles.metaRow}>
            <Txt variant="small" muted>
              {proposal.days.length} days · {shortRange(start, end)}
            </Txt>
            <Txt variant="small" style={{ color: accent, fontWeight: '800' }}>
              {moneyRange(proposal.estTotal.low, proposal.estTotal.high, currency)}
            </Txt>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Space.m },
});
