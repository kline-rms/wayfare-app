import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst } from '@/components/wayfare/map-first';
import { StepTop } from '@/components/wayfare/steps';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { dayCount, shortRange } from '@/lib/format';
import { replaceTo } from '@/lib/nav';
import { wizard } from '@/lib/wizard';

const cap = (s?: string) => (s ? s[0].toUpperCase() + s.slice(1) : '');

export default function Review() {
  const { c } = useWayfare();
  const d = wizard.get();
  const tags = [d.purpose, ...(d.interests ?? []), ...(d.mustDos ?? [])].filter(Boolean) as string[];
  const days = dayCount(d.startDate!, d.endDate!);

  return (
    <MapFirst sheetTop={0.16}>
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
              <Txt style={{ fontWeight: '700' }} numberOfLines={1}>
                {d.origin}
              </Txt>
            </View>
            <Icon name="arrow" size={18} color={c.ter} />
            <View style={[styles.fromTo, { backgroundColor: 'rgba(47,217,138,0.16)' }]}>
              <Txt variant="small" style={{ color: '#8DEBBE', fontWeight: '700' }}>
                TO
              </Txt>
              <Txt style={{ fontWeight: '700', color: '#8DEBBE' }} numberOfLines={1}>
                {d.destination}
              </Txt>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: Space.m }}>
            <Cell label="DATES" value={`${shortRange(d.startDate!, d.endDate!)} · ${days} days`} />
            <Cell label="TRAVELERS" value={`${d.partySize} ${d.partySize === 1 ? 'traveler' : 'travelers'}`} />
          </View>
          <View style={{ flexDirection: 'row', gap: Space.m }}>
            <Cell label="PACE" value={cap(d.pace)} />
            <Cell label="BUDGET" value={`${cap(d.budget)} · ₱`} />
          </View>

          {tags.length ? (
            <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: Space.m }}>
              <Txt variant="small" faint style={{ marginBottom: 8 }}>
                INTERESTS &amp; MUST-DOS
              </Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                {tags.map((t) => (
                  <View key={t} style={[styles.tag, { backgroundColor: c.bg }]}>
                    <Txt style={{ fontSize: 12, fontWeight: '700' }}>{t}</Txt>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </Card>

        <View style={{ marginTop: Space.xl }}>
          <PillButton label="Generate my plans" icon="spark" onPress={() => replaceTo('/create/generating')} />
        </View>
        <Txt variant="small" faint style={{ textAlign: 'center', marginTop: Space.m }}>
          AI proposes 3 plans with timings, costs, routes &amp; map pins.
        </Txt>
    </MapFirst>
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
