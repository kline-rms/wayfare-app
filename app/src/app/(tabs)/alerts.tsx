import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MapFirst } from '@/components/wayfare/map-first';
import { AIOrb, Card, CategoryIcon, StateView, Txt } from '@/components/wayfare/ui';
import { Icon } from '@/components/wayfare/icon';
import { useWayfare } from '@/components/wayfare/theme';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { useEditsVersion } from '@/lib/edits';
import { money } from '@/lib/format';
import { go } from '@/lib/nav';
import type { Itinerary, Reimbursement } from '@/lib/types';

// Real notifications: reimbursement events across the user's trips.
async function loadEvents(): Promise<{ r: Reimbursement; it: Itinerary }[]> {
  const list = await api.listItineraries();
  const its = await Promise.all(list.map((s) => api.getItinerary(s.id)));
  return its
    .flatMap((it) => (it.reimbursements ?? []).map((r) => ({ r, it })))
    .sort((a, b) => (a.r.createdAt < b.r.createdAt ? 1 : -1));
}

export default function AlertsScreen() {
  const { c } = useWayfare();
  const editsVersion = useEditsVersion();
  const { data: events, loading, error, reload } = useAsync(loadEvents, [editsVersion]);

  const header = (
    <Txt variant="h1" style={{ color: '#fff' }}>
      Alerts
    </Txt>
  );

  if (!events) {
    return (
      <MapFirst header={header} sheetTop={0.32} dockGap>
        <StateView loading={loading} error={error} onRetry={reload} />
      </MapFirst>
    );
  }

  return (
    <MapFirst header={header} sheetTop={0.32} dockGap collapsible>
      {events.length ? (
        <>
          <Txt variant="label" muted style={{ marginBottom: Space.s }}>
            REIMBURSEMENTS
          </Txt>
          <Card padded={false} style={{ paddingHorizontal: Space.l }}>
            {events.map(({ r, it }, i) => (
              <View key={r.id}>
                <Row
                  leading={
                    <View style={[styles.chip, { backgroundColor: 'rgba(47,217,138,0.20)' }]}>
                      <Icon name="check" size={20} color={c.a2} />
                    </View>
                  }
                  title={`Reimbursed ${money(r.amount, r.currency)} to ${r.to}`}
                  body={`${it.title} · ${r.expenseIds.length} receipt${r.expenseIds.length === 1 ? '' : 's'}${r.signature ? ' · signed' : ''}`}
                  time={r.createdAt.slice(5, 10)}
                  onPress={() => go({ pathname: '/reimbursements', params: { it: it.id } })}
                  last={i === events.length - 1}
                />
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <Txt variant="label" muted style={{ marginTop: events.length ? Space.xl : 0, marginBottom: Space.s }}>
        TODAY
      </Txt>
      <Card padded={false} style={{ paddingHorizontal: Space.l }}>
        <Row
          leading={<CategoryIcon name="temple" color={c.a3} size={40} iconSize={20} />}
          title="Leave in 1 hour — Manila Cathedral"
          body="Arrive 2:00 PM · ~6 min walk across Intramuros."
          time="now"
        />
        <Divider />
        <Row leading={<AIOrb size={40} />} title="Tip: Fort Santiago is best near sunset" body="You're ahead of schedule — save it for later." time="12m" last />
      </Card>
    </MapFirst>
  );
}

function Divider() {
  const { c } = useWayfare();
  return <View style={{ height: 1, backgroundColor: c.line }} />;
}

function Row({
  leading,
  title,
  body,
  time,
  onPress,
  last,
}: {
  leading: ReactNode;
  title: string;
  body: string;
  time: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const { c } = useWayfare();
  const inner = (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      {leading}
      <View style={{ flex: 1 }}>
        <Txt style={{ fontWeight: '700' }} numberOfLines={2}>
          {title}
        </Txt>
        <Txt variant="small" muted style={{ marginTop: 2 }} numberOfLines={2}>
          {body}
        </Txt>
      </View>
      <Txt variant="small" faint>
        {time}
      </Txt>
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      {inner}
    </Pressable>
  ) : (
    inner
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.m, paddingVertical: 14 },
  chip: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
