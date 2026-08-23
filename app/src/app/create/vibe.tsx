import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StepTop } from '@/components/wayfare/steps';
import { useWayfare } from '@/components/wayfare/theme';
import { PillButton, SectionLabel, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { go } from '@/lib/nav';

const OCCASIONS = ['Couple', 'Business', 'Family', 'Solo', 'Foodie', 'Adventure'];
const BUDGET = ['Shoestring', 'Comfortable', 'Luxe'];

export default function Vibe() {
  const { c, scheme, cardShadow } = useWayfare();
  const insets = useSafeAreaInsets();
  const [occ, setOcc] = useState('Couple');
  const [budget, setBudget] = useState(1);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + Space.s, paddingHorizontal: Space.xl, paddingBottom: Space.xxl }}>
        <StepTop title="Build it yourself" step={2} total={4} />
        <Txt variant="h1" style={{ marginTop: Space.xl }}>
          What&apos;s the vibe?
        </Txt>

        <SectionLabel style={{ marginTop: Space.xl }}>Occasion</SectionLabel>
        <View style={styles.chips}>
          {OCCASIONS.map((o) => {
            const on = o === occ;
            return (
              <Pressable
                key={o}
                onPress={() => setOcc(o)}
                style={[styles.chip, on ? { backgroundColor: c.primary } : { backgroundColor: c.card, ...cardShadow }]}>
                <Txt style={{ fontWeight: '700', fontSize: 13.5, color: on ? c.onPrimary : c.ink }}>{o}</Txt>
              </Pressable>
            );
          })}
        </View>

        <SectionLabel style={{ marginTop: Space.xl }}>Pace</SectionLabel>
        <View style={[styles.track, { backgroundColor: c.ter }]}>
          <View style={[styles.trackFill, { backgroundColor: c.primary, width: '34%' }]} />
          <View style={[styles.knob, { borderColor: c.primary, left: '34%' }]} />
        </View>
        <View style={styles.trackLabels}>
          <Txt variant="small" muted>
            Relaxed · few stops
          </Txt>
          <Txt variant="small" muted>
            Packed · see it all
          </Txt>
        </View>

        <SectionLabel style={{ marginTop: Space.xl }}>Budget</SectionLabel>
        <View style={[styles.segmented, { backgroundColor: scheme === 'dark' ? c.fieldBg : '#E2E0DC' }]}>
          {BUDGET.map((b, i) => {
            const on = i === budget;
            return (
              <Pressable key={b} onPress={() => setBudget(i)} style={[styles.seg, on && { backgroundColor: c.card }]}>
                <Txt style={{ fontWeight: '700', fontSize: 13.5, color: on ? c.ink : c.sec }}>{b}</Txt>
              </Pressable>
            );
          })}
        </View>
        <Txt variant="small" muted style={{ marginTop: 10 }}>
          Estimated in Philippine Peso (₱)
        </Txt>

        <View style={{ marginTop: Space.xl }}>
          <PillButton label="Continue" icon="arrow" knob onPress={() => go('/create/interests')} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: Space.s },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  track: { height: 8, borderRadius: 4, marginTop: Space.m, justifyContent: 'center' },
  trackFill: { height: 8, borderRadius: 4 },
  knob: { position: 'absolute', width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', borderWidth: 3, marginLeft: -13 },
  trackLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  segmented: { flexDirection: 'row', borderRadius: 16, padding: 4, gap: 4, marginTop: Space.s },
  seg: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 12 },
});
