import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/wayfare/icon';
import { StepTop } from '@/components/wayfare/steps';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { replaceTo } from '@/lib/nav';

export default function Review() {
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  const tags = ['Couple', 'Heritage', 'Food', 'Cafés', '+2 places'];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + Space.s, paddingHorizontal: Space.xl, paddingBottom: Space.xxl }}>
        <StepTop title="Build it yourself" step={4} total={4} />
        <Txt variant="h1" style={{ marginTop: Space.xl }}>
          Ready to generate
        </Txt>

        <Card style={{ marginTop: Space.l, gap: Space.m }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.fromTo, { backgroundColor: c.bg }]}>
              <Txt variant="small" faint>
                FROM
              </Txt>
              <Txt style={{ fontWeight: '700' }}>BGC, Taguig</Txt>
            </View>
            <Icon name="arrow" size={18} color={c.ter} />
            <View style={[styles.fromTo, { backgroundColor: '#EEF5EF' }]}>
              <Txt variant="small" style={{ color: '#5FB584', fontWeight: '700' }}>
                TO
              </Txt>
              <Txt style={{ fontWeight: '700', color: '#1E8A50' }}>Manila & Makati</Txt>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: Space.m }}>
            <Cell label="DATES" value="Aug 26 – Sep 6 · 12 days" />
            <Cell label="TRAVELERS" value="2 adults" />
          </View>
          <View style={{ flexDirection: 'row', gap: Space.m }}>
            <Cell label="PACE" value="Relaxed" />
            <Cell label="BUDGET" value="Comfortable · ₱" />
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: Space.m }}>
            <Txt variant="small" faint style={{ marginBottom: 8 }}>
              INTERESTS & MUST-DOS
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {tags.map((t) => (
                <View key={t} style={[styles.tag, { backgroundColor: c.bg }]}>
                  <Txt style={{ fontSize: 12, fontWeight: '700' }}>{t}</Txt>
                </View>
              ))}
            </View>
          </View>
        </Card>

        <View style={{ marginTop: Space.xl }}>
          <PillButton label="Generate my plans" icon="spark" onPress={() => replaceTo('/create/generating')} />
        </View>
        <Txt variant="small" faint style={{ textAlign: 'center', marginTop: Space.m }}>
          AI adds timings, costs, routes & map pins.
        </Txt>
      </ScrollView>
    </View>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Txt variant="small" faint style={{ letterSpacing: 0.3 }}>
        {label}
      </Txt>
      <Txt style={{ fontWeight: '700', marginTop: 2 }}>{value}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  fromTo: { flex: 1, borderRadius: 12, padding: 11 },
  tag: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 },
});
