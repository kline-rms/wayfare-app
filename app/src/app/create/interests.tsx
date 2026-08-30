import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst } from '@/components/wayfare/map-first';
import { StepTop } from '@/components/wayfare/steps';
import { useWayfare } from '@/components/wayfare/theme';
import { AITip, Field, PillButton, SectionLabel, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { go } from '@/lib/nav';
import { wizard } from '@/lib/wizard';

const INTERESTS = ['Heritage', 'Food', 'Cafés', 'Museums', 'Views', 'Waterfront', 'Nightlife', 'Shopping', 'Markets'];

export default function Interests() {
  const { c, cardShadow } = useWayfare();
  const d = wizard.get();
  const [sel, setSel] = useState<Set<string>>(new Set(d.interests ?? ['Heritage', 'Food', 'Cafés']));
  const [musts, setMusts] = useState(d.mustDos ?? ['Intramuros', 'National Museum']);

  const cont = () => {
    wizard.patch({ interests: [...sel], mustDos: musts });
    go('/create/review');
  };

  const toggle = (k: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  return (
    <MapFirst sheetTop={0.16}>
        <StepTop title="Build it yourself" step={3} total={4} />
        <Txt variant="h1" style={{ marginTop: Space.xl }}>
          Anything you love?
        </Txt>

        <SectionLabel style={{ marginTop: Space.xl }}>Interests</SectionLabel>
        <View style={styles.chips}>
          {INTERESTS.map((k) => {
            const on = sel.has(k);
            return (
              <Pressable
                key={k}
                onPress={() => toggle(k)}
                style={[styles.chip, on ? { backgroundColor: c.primary } : { backgroundColor: c.card, ...cardShadow }]}>
                <Txt style={{ fontWeight: '700', fontSize: 13.5, color: on ? c.onPrimary : c.ink }}>{k}</Txt>
              </Pressable>
            );
          })}
        </View>

        <SectionLabel style={{ marginTop: Space.xl }}>Must-visit places (optional)</SectionLabel>
        <View style={styles.chips}>
          {musts.map((m) => (
            <View key={m} style={[styles.chip, { backgroundColor: c.a1, flexDirection: 'row', alignItems: 'center', gap: 7 }]}>
              <Txt style={{ fontWeight: '700', fontSize: 13.5, color: '#fff' }}>{m}</Txt>
              <Pressable onPress={() => setMusts((x) => x.filter((v) => v !== m))} hitSlop={6}>
                <Icon name="close" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
        </View>
        <View style={{ marginTop: Space.m }}>
          <Field icon="search" placeholder="Add a place you don't want to miss…" />
        </View>

        <View style={{ marginTop: Space.l }}>
          <AITip>We&apos;ll slot your must-dos into the best days and build the rest around them.</AITip>
        </View>

        <View style={{ marginTop: Space.xl }}>
          <PillButton label="Continue" icon="arrow" knob onPress={cont} />
        </View>
    </MapFirst>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: Space.s },
  chip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999 },
});
