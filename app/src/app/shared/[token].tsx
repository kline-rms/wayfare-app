// Opening a share link — a read-only view of someone else's trip, resolved by
// token (public, no login needed). Editors get the same view for now; full
// cross-account editing arrives with real per-account auth.
import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, StateView, StatusPill, Txt } from '@/components/wayfare/ui';
import type { MapStop } from '@/components/wayfare/wayfare-map.shared';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { dayCount, shortRange } from '@/lib/format';
import { back } from '@/lib/nav';

const PIN = ['#FFA828', '#7C5CF6', '#2FD98A'];

export default function SharedTrip() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { c, cardShadow } = useWayfare();
  const { data, loading, error, reload } = useAsync(() => api.getShared(token), [token]);

  const stops = useMemo<MapStop[]>(() => {
    if (!data) return [];
    return data.itinerary.places
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0))
      .slice(0, 8)
      .map((p, i) => ({ lat: p.lat, lng: p.lng, label: p.name, sub: p.area, color: PIN[i % 3], you: i === 0 }));
  }, [data]);

  if (!data) return <StateView loading={loading} error={error} onRetry={reload} />;
  const it = data.itinerary;
  const chosen = it.proposals[0];

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <Pressable onPress={back}>
        <MapIconButton>
          <Icon name="back" size={22} color="#fff" />
        </MapIconButton>
      </Pressable>
      <View style={{ flex: 1 }}>
        <Txt color="#fff" variant="h1" style={{ fontSize: 23 }} numberOfLines={2}>
          {it.title}
        </Txt>
        <Txt color="rgba(255,255,255,0.85)" variant="small" style={{ marginTop: 3 }}>
          Shared with you · {data.role === 'editor' ? 'can edit' : 'view only'}
        </Txt>
      </View>
    </View>
  );

  return (
    <MapFirst stops={stops} sheetTop={0.42} header={header} collapsible>
      <View style={[styles.banner, { backgroundColor: c.a3 + '22' }]}>
        <Icon name="share" size={15} color={c.a3} />
        <Txt variant="small" style={{ color: c.a3, flex: 1, fontWeight: '600' }}>
          You&apos;re viewing a shared trip. Nothing here changes your own trips.
        </Txt>
      </View>

      <View style={[styles.summary, { backgroundColor: c.fieldBg }]}>
        <Cell value={`${dayCount(it.dateRange.start, it.dateRange.end)}`} label="days" c={c} />
        <View style={[styles.div, { backgroundColor: c.line }]} />
        <Cell value={shortRange(it.dateRange.start, it.dateRange.end)} label="dates" c={c} />
        <View style={[styles.div, { backgroundColor: c.line }]} />
        <Cell value={`${it.partySize}`} label="travellers" c={c} />
      </View>

      <Txt variant="title" style={{ marginTop: Space.xl, marginBottom: Space.s }}>
        Day by day
      </Txt>
      <View style={{ gap: Space.s }}>
        {chosen.days.map((d, i) => (
          <Card key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Space.m }}>
            <View style={{ flex: 1 }}>
              <Txt variant="small" faint>
                DAY {i + 1} · {d.dateLabel.toUpperCase()}
              </Txt>
              <Txt style={{ fontWeight: '800', marginTop: 2 }} numberOfLines={1}>
                {d.theme}
              </Txt>
              <Txt variant="small" muted numberOfLines={1} style={{ marginTop: 1 }}>
                {d.timeWindow} · {d.destination}
              </Txt>
            </View>
          </Card>
        ))}
      </View>

      {it.members?.length ? (
        <>
          <Txt variant="title" style={{ marginTop: Space.xl, marginBottom: Space.s }}>
            Who&apos;s on this trip
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {it.members.map((m) => (
              <StatusPill key={m.id} label={`${m.name}${m.relation ? ` · ${m.relation}` : ''}`} tone="accent" />
            ))}
          </View>
        </>
      ) : null}
    </MapFirst>
  );
}

function Cell({ value, label, c }: { value: string; label: string; c: ReturnType<typeof useWayfare>['c'] }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Txt style={{ fontWeight: '800', fontSize: 14, color: c.ink }} numberOfLines={1}>
        {value}
      </Txt>
      <Txt variant="small" faint style={{ marginTop: 1 }}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 11 },
  summary: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingVertical: 12, marginTop: Space.m },
  div: { width: 1, height: 26 },
});
