import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst } from '@/components/wayfare/map-first';
import { StepTop } from '@/components/wayfare/steps';
import { useWayfare } from '@/components/wayfare/theme';
import { Field, PillButton, SectionLabel, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { go } from '@/lib/nav';
import { wizard } from '@/lib/wizard';
import { shortRange } from '@/lib/format';

export default function Basics() {
  const { c, cardShadow } = useWayfare();
  const d = wizard.get();
  const [from, setFrom] = useState(d.homeBase ?? 'Avida Towers Verte, BGC');
  const [to, setTo] = useState(d.destination ?? 'Manila & Makati');
  const [pax, setPax] = useState(d.partySize ?? 2);

  const cont = () => {
    wizard.patch({ origin: from, homeBase: from, destination: to, partySize: pax });
    go('/create/vibe');
  };

  return (
    <MapFirst sheetTop={0.16}>
        <StepTop title="Build it yourself" step={1} total={4} />
        <Txt variant="h1" style={{ marginTop: Space.xl }}>
          Where to?
        </Txt>

        <View style={{ gap: Space.m, marginTop: Space.l }}>
          <View style={{ gap: 8 }}>
            <SectionLabel>Coming from</SectionLabel>
            <Field icon="home" value={from} onChangeText={setFrom} />
          </View>
          <View style={{ gap: 8 }}>
            <SectionLabel>Destination</SectionLabel>
            <Field icon="pin" value={to} onChangeText={setTo} />
          </View>
        </View>

        <SectionLabel style={{ marginTop: Space.xl }}>When</SectionLabel>
        <View style={{ flexDirection: 'row', gap: Space.m }}>
          <DateBox label={shortRange(d.startDate!, d.endDate!)} />
        </View>

        <View style={styles.paxRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="users" size={20} color={c.ink} />
            <Txt style={{ fontWeight: '700' }}>Travelers</Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Step icon="minus" onPress={() => setPax((p) => Math.max(1, p - 1))} />
            <Txt style={{ fontWeight: '800', fontSize: 18, minWidth: 22, textAlign: 'center' }}>{pax}</Txt>
            <Step icon="plus" onPress={() => setPax((p) => p + 1)} />
          </View>
        </View>

        <View style={{ marginTop: Space.xl }}>
          <PillButton label="Continue" icon="arrow" knob onPress={cont} />
        </View>
    </MapFirst>
  );

  function DateBox({ label }: { label: string }) {
    return (
      <View style={[styles.dateBox, { backgroundColor: c.card }, cardShadow]}>
        <Icon name="cal" size={18} color={c.ink} />
        <Txt style={{ fontWeight: '700' }}>{label}</Txt>
      </View>
    );
  }

  function Step({ icon, onPress }: { icon: 'minus' | 'plus'; onPress: () => void }) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.step, { backgroundColor: c.card }, cardShadow, pressed && { opacity: 0.7 }]}>
        <Icon name={icon} size={18} color={c.ink} />
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  dateBox: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  paxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Space.l,
  },
  step: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
