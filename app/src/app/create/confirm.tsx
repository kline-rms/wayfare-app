// Confirm timeline — the edit hub. Reached after picking a proposal (its timeline
// is already expanded). Review the day-by-day plan, jump to editors, then save.
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, PillButton, SectionLabel, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { back, go, replaceTo } from '@/lib/nav';
import { useWizardVersion, wizard } from '@/lib/wizard';

export default function Confirm() {
  useWizardVersion();
  const { c } = useWayfare();
  const chosen = wizard.getChosen();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chosen) replaceTo('/create');
  }, [chosen]);
  if (!chosen) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const { itinerary, proposalId } = chosen;
  const proposal = itinerary.proposals.find((p) => p.id === proposalId) ?? itinerary.proposals[0];

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const saved = await api.saveItinerary(itinerary);
      wizard.reset();
      replaceTo({ pathname: '/trip/[id]', params: { id: saved.id, proposal: proposalId } });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
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
    <MapFirst header={header} sheetTop={0.2}>
        <Txt variant="small" faint>
          REVIEW &amp; CONFIRM
        </Txt>
        <Txt variant="h1" style={{ marginTop: 4 }}>
          Your trip,{'\n'}in order
        </Txt>
        <Txt variant="sec" muted style={{ marginTop: 6 }}>
          Tweak anything, then save. AI has timed, priced and routed it.
        </Txt>

        <View style={{ flexDirection: 'row', gap: Space.m, marginTop: Space.l }}>
          <PillButton label="Edit activities" icon="wand" variant="secondary" full={false} onPress={() => go('/create/customize')} />
          <PillButton label="Places" icon="pin" variant="secondary" full={false} onPress={() => go('/create/recommended')} />
        </View>

        {proposal.days.map((d, di) => (
          <View key={d.id} style={{ marginTop: Space.l }}>
            <SectionLabel>{`Day ${di + 1} · ${d.theme}`}</SectionLabel>
            <Card style={{ gap: Space.s }}>
              {(d.activities ?? []).length ? (
                d.activities!.map((a) => (
                  <View key={a.id} style={{ flexDirection: 'row', gap: Space.m }}>
                    <Txt variant="mono" faint style={{ width: 64 }}>
                      {a.time}
                    </Txt>
                    <View style={{ flex: 1 }}>
                      <Txt style={{ fontWeight: '800' }} numberOfLines={1}>
                        {a.activity}
                      </Txt>
                      <Txt variant="small" muted numberOfLines={1}>
                        {a.where}
                        {a.cost ? ` · ${money(a.cost)}` : ''}
                      </Txt>
                    </View>
                  </View>
                ))
              ) : (
                <Txt variant="sec" muted style={{ lineHeight: 20 }}>
                  {d.detailedPlan || d.timeWindow}
                </Txt>
              )}
            </Card>
          </View>
        ))}

        {error ? (
          <Txt variant="sec" style={{ color: c.danger, marginTop: Space.l }}>
            {error}
          </Txt>
        ) : null}

        <View style={{ marginTop: Space.xl }}>
          <PillButton label={busy ? 'Saving…' : 'Save this trip'} icon="arrow" knob onPress={busy ? undefined : save} />
        </View>
    </MapFirst>
  );
}
