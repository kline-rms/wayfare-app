import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/wayfare/icon';
import { StepTop } from '@/components/wayfare/steps';
import { useWayfare } from '@/components/wayfare/theme';
import { AITip, Field, PillButton, SectionLabel, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { go } from '@/lib/nav';

const INTERESTS = ['Heritage', 'Food', 'Cafés', 'Museums', 'Views', 'Waterfront', 'Nightlife', 'Shopping', 'Markets'];

export default function Interests() {
  const { c, cardShadow } = useWayfare();
  const insets = useSafeAreaInsets();
  const [sel, setSel] = useState<Set<string>>(new Set(['Heritage', 'Food', 'Cafés']));
  const [musts, setMusts] = useState(['Intramuros', 'National Museum']);

  const toggle = (k: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + Space.s, paddingHorizontal: Space.xl, paddingBottom: Space.xxl }}>
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
          <PillButton label="Continue" icon="arrow" knob onPress={() => go('/create/review')} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: Space.s },
  chip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999 },
});
