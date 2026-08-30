import { Pressable, StyleSheet, View } from 'react-native';

import { MapFirst } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, CategoryIcon, StateView, StatusPill, Txt } from '@/components/wayfare/ui';
import { Icon } from '@/components/wayfare/icon';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { dayCount, shortRange } from '@/lib/format';
import { go } from '@/lib/nav';
import type { ItinerarySummary } from '@/lib/types';

export default function TripsScreen() {
  const { data, loading, error, reload } = useAsync(() => api.listItineraries(), []);
  if (loading || error || !data) return <StateView loading={loading} error={error} onRetry={reload} />;

  const header = (
    <Txt variant="h1" style={{ color: '#fff' }}>
      Your trips
    </Txt>
  );
  return (
    <MapFirst header={header} sheetTop={0.34} dockGap collapsible>
      <Txt variant="sec" muted>
        {data.length} on the map
      </Txt>
      <View style={{ marginTop: Space.m, gap: Space.s }}>
        {data.map((t, i) => (
          <TripCard key={t.id} t={t} active={i === 0} />
        ))}
      </View>
    </MapFirst>
  );
}

function TripCard({ t, active }: { t: ItinerarySummary; active: boolean }) {
  const { c } = useWayfare();
  const total = dayCount(t.dateRange.start, t.dateRange.end);
  const range = shortRange(t.dateRange.start, t.dateRange.end);
  return (
    <Pressable onPress={() => go({ pathname: '/trip/[id]', params: { id: t.id } })}>
      <Card style={styles.row}>
        <CategoryIcon name="route" color={c.a3} size={42} iconSize={20} />
        <View style={{ flex: 1 }}>
          <Txt style={{ fontWeight: '800' }} numberOfLines={1}>
            {t.title}
          </Txt>
          <Txt variant="small" muted style={{ marginTop: 1 }}>
            {t.proposalCount} {t.proposalCount === 1 ? 'plan' : 'plans'} · {t.partySize} pax · {range} · {total}d
          </Txt>
        </View>
        {active ? <StatusPill label="GO" tone="active" /> : <Icon name="chevR" size={16} color={c.ter} />}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.m },
});
