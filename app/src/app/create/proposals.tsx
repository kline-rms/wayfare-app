import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, PillButton, StatusPill, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { back, replaceTo } from '@/lib/nav';
import { wizard, useWizardVersion } from '@/lib/wizard';
import type { GenerateRequest } from '@/lib/types';

export default function Proposals() {
  useWizardVersion();
  const { c } = useWayfare();
  const result = wizard.getResult();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // No result (e.g. hard refresh) — send them back to start.
  useEffect(() => {
    if (!result) replaceTo('/create');
  }, [result]);
  if (!result) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const { itinerary, engine } = result;

  const choose = async (proposalId: string) => {
    setError(null);
    setBusy(proposalId);
    try {
      const expanded = await api.expandTimeline(itinerary, proposalId, wizard.get() as GenerateRequest);
      // Hand off to the edit path (Confirm) — the user reviews/edits, then saves.
      wizard.setChosen(expanded.itinerary, proposalId);
      replaceTo('/create/confirm');
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  };

  const header = (
    <Pressable onPress={back}>
      <MapIconButton>
        <Icon name="back" size={22} color="#fff" />
      </MapIconButton>
    </Pressable>
  );
  return (
    <MapFirst header={header} sheetTop={0.16}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt variant="small" faint>
            {itinerary.proposals.length} PLANS FOR {(wizard.get().destination ?? 'your trip').toUpperCase()}
          </Txt>
          <StatusPill label={engine === 'openai' ? 'WAYFARE AI' : 'DRAFT · NO KEY'} tone={engine === 'openai' ? 'active' : 'neutral'} />
        </View>
        <Txt variant="h1" style={{ marginTop: 4 }}>
          Pick a direction
        </Txt>
        <Txt variant="sec" muted style={{ marginTop: 6 }}>
          Open any plan to read it in full, then choose — we&apos;ll write the day-by-day timeline for the one you pick.
        </Txt>

        {error ? (
          <Card style={{ marginTop: Space.l, borderColor: c.danger }}>
            <Txt variant="sec" style={{ color: c.danger }}>
              {error}
            </Txt>
          </Card>
        ) : null}

        <View style={{ gap: Space.l, marginTop: Space.l }}>
          {itinerary.proposals.map((p, i) => (
            <Animated.View key={p.id} entering={FadeInDown.delay(i * 90).duration(360)}>
            <Card style={{ gap: Space.s }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Txt style={{ fontWeight: '800', fontSize: 17, flex: 1 }}>{p.name}</Txt>
                <StatusPill label={p.style.toUpperCase()} tone="accent" />
              </View>
              <Txt variant="sec" muted>
                {p.bestFor}
              </Txt>
              <View style={{ flexDirection: 'row', gap: Space.l, marginTop: 4 }}>
                <Stat value={`${p.days.length}`} label="days" />
                <Stat value={money(p.estTotal.low, itinerary.currency)} label="from" />
                <Stat value={money(p.estTotal.high, itinerary.currency).replace('₱', '')} label="to" />
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: Space.s, marginTop: 4, gap: 8 }}>
                {(expanded === p.id ? p.days : p.days.slice(0, 3)).map((d, di) => (
                  <View key={d.id} style={{ gap: 2 }}>
                    <Txt variant="small" numberOfLines={expanded === p.id ? undefined : 1}>
                      <Txt variant="small" faint>DAY {di + 1} · </Txt>
                      <Txt variant="small" style={{ fontWeight: '800' }}>{d.theme}</Txt>
                    </Txt>
                    {expanded === p.id ? (
                      <>
                        <Txt variant="small" faint>{d.timeWindow} · {d.destination}</Txt>
                        {d.detailedPlan ? (
                          <Txt variant="small" muted style={{ lineHeight: 18 }}>{d.detailedPlan}</Txt>
                        ) : null}
                      </>
                    ) : null}
                  </View>
                ))}
                <Pressable onPress={() => setExpanded(expanded === p.id ? null : p.id)} hitSlop={6}>
                  <Txt variant="small" style={{ color: c.primary, fontWeight: '800', marginTop: 2 }}>
                    {expanded === p.id ? '▲ Hide plan' : `▾ View full plan · ${p.days.length} days`}
                  </Txt>
                </Pressable>
              </View>
              <View style={{ marginTop: Space.s }}>
                {busy === p.id ? (
                  <View style={[styles.busy, { backgroundColor: c.primary }]}>
                    <ActivityIndicator color={c.onPrimary} />
                    <Txt style={{ color: c.onPrimary, fontWeight: '700' }}>Writing the timeline…</Txt>
                  </View>
                ) : (
                  <PillButton label="Use this plan" icon="arrow" knob onPress={() => choose(p.id)} />
                )}
              </View>
            </Card>
            </Animated.View>
          ))}
        </View>
    </MapFirst>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { c } = useWayfare();
  return (
    <View>
      <Txt style={{ fontWeight: '800', fontSize: 15 }}>{value}</Txt>
      <Txt variant="small" faint style={{ marginTop: 1 }}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  busy: {
    minHeight: 56,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
