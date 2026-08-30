// Customize activities — edit the picked plan before saving: remove a block or
// reorder within a day. Every change patches the itinerary held in the wizard.
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, PillButton, SectionLabel, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { money } from '@/lib/format';
import { back } from '@/lib/nav';
import { useWizardVersion, wizard } from '@/lib/wizard';
import type { Activity, Itinerary } from '@/lib/types';

function editDay(
  it: Itinerary,
  proposalId: string,
  dayId: string,
  fn: (acts: Activity[]) => Activity[],
): Itinerary {
  return {
    ...it,
    proposals: it.proposals.map((p) =>
      p.id !== proposalId
        ? p
        : { ...p, days: p.days.map((d) => (d.id !== dayId ? d : { ...d, activities: fn(d.activities ?? []) })) },
    ),
  };
}

export default function Customize() {
  useWizardVersion();
  const { c } = useWayfare();
  const chosen = wizard.getChosen();

  useEffect(() => {
    if (!chosen) back();
  }, [chosen]);
  if (!chosen) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const { itinerary, proposalId } = chosen;
  const proposal = itinerary.proposals.find((p) => p.id === proposalId) ?? itinerary.proposals[0];
  const days = proposal.days.filter((d) => (d.activities ?? []).length);

  const remove = (dayId: string, id: string) =>
    wizard.patchChosen(editDay(itinerary, proposalId, dayId, (a) => a.filter((x) => x.id !== id)));

  const move = (dayId: string, i: number, dir: -1 | 1) =>
    wizard.patchChosen(
      editDay(itinerary, proposalId, dayId, (a) => {
        const j = i + dir;
        if (j < 0 || j >= a.length) return a;
        const next = a.slice();
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      }),
    );

  const header = (
    <Pressable onPress={back}>
      <MapIconButton>
        <Icon name="back" size={22} color="#fff" />
      </MapIconButton>
    </Pressable>
  );
  return (
    <MapFirst header={header} sheetTop={0.2}>
        <Txt variant="h1">
          Keep it,{'\n'}or swap
        </Txt>
        <Txt variant="sec" muted style={{ marginTop: 6 }}>
          Remove a block or reorder your day. Changes save when you confirm.
        </Txt>

        {days.map((d, di) => (
          <View key={d.id} style={{ marginTop: Space.l }}>
            <SectionLabel>{`Day ${di + 1} · ${d.theme}`}</SectionLabel>
            <View style={{ gap: Space.s }}>
              {d.activities!.map((a, i) => (
                <Card key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Space.m }}>
                  <View style={{ flex: 1 }}>
                    <Txt variant="small" faint>
                      {a.time}
                    </Txt>
                    <Txt style={{ fontWeight: '800' }} numberOfLines={1}>
                      {a.activity}
                    </Txt>
                    <Txt variant="small" muted numberOfLines={1}>
                      {a.where}
                      {a.cost ? ` · ${money(a.cost)}` : ''}
                    </Txt>
                  </View>
                  <View style={{ gap: 4 }}>
                    <Pressable onPress={() => move(d.id, i, -1)} hitSlop={6} style={({ pressed }) => pressed && { opacity: 0.5 }}>
                      <Txt style={{ color: c.sec, fontWeight: '800', fontSize: 15 }}>↑</Txt>
                    </Pressable>
                    <Pressable onPress={() => move(d.id, i, 1)} hitSlop={6} style={({ pressed }) => pressed && { opacity: 0.5 }}>
                      <Txt style={{ color: c.sec, fontWeight: '800', fontSize: 15 }}>↓</Txt>
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={() => remove(d.id, a.id)}
                    hitSlop={6}
                    style={({ pressed }) => [{ padding: 4 }, pressed && { opacity: 0.5 }]}>
                    <Icon name="close" size={18} color={c.danger} />
                  </Pressable>
                </Card>
              ))}
            </View>
          </View>
        ))}

        <View style={{ marginTop: Space.xl }}>
          <PillButton label="Done editing" icon="arrow" knob onPress={back} />
        </View>
    </MapFirst>
  );
}
