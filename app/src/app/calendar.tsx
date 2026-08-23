import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWayfare } from '@/components/wayfare/theme';
import { Header, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { back } from '@/lib/nav';

const DAYS = [
  ['WED', 26],
  ['THU', 27],
  ['FRI', 28],
  ['SAT', 29],
  ['SUN', 30],
  ['MON', 31],
] as const;

// Timeline scale: 7:00 (top) → 23:00. 46px per hour.
const START = 7;
const PX = 46;
const y = (h: number) => (h - START) * PX;

type Kind = 'work' | 'travel' | 'act';
const BLOCKS: { from: number; to: number; title: string; sub: string; kind: Kind }[] = [
  { from: 7, to: 16, title: 'Work', sub: '7:00 AM – 4:00 PM · blocked', kind: 'work' },
  { from: 16.25, to: 17, title: 'Home & change', sub: 'Grab · ~20 min', kind: 'travel' },
  { from: 17.5, to: 19.5, title: 'BGC High Street dinner', sub: 'Bonifacio High Street', kind: 'act' },
  { from: 19.5, to: 21, title: 'Dessert & walk', sub: 'Burgos Circle', kind: 'act' },
];

export default function CalendarScreen() {
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  const kindColor = (k: Kind) => (k === 'work' ? c.ter : k === 'travel' ? c.a1 : c.a3);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + Space.s, paddingHorizontal: Space.xl }}>
        <Header title="Schedule" onBack={back} trailing={<Txt variant="small" muted>August 2026</Txt>} />

        {/* day pips */}
        <View style={styles.pips}>
          {DAYS.map(([d, n], i) => {
            const on = i === 1;
            return (
              <View key={n} style={styles.pip}>
                <Txt variant="small" color={on ? c.ink : c.sec}>
                  {d}
                </Txt>
                <View style={[styles.pipNum, on && { backgroundColor: c.primary }]}>
                  <Txt style={{ fontWeight: '800', fontSize: 14, color: on ? c.onPrimary : c.ink }}>{n}</Txt>
                </View>
              </View>
            );
          })}
        </View>

        {/* legend */}
        <View style={styles.legend}>
          <LegendDot color={c.ter} label="Work · blocked" />
          <LegendDot color={c.a3} label="Activity" />
          <LegendDot color={c.a1} label="Travel" />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Space.xl, paddingBottom: insets.bottom + Space.xl }}>
        <View style={{ height: y(23) + 20, marginTop: 12 }}>
          {/* hour lines */}
          {Array.from({ length: 9 }, (_, i) => START + i * 2).map((h) => (
            <View key={h} style={[styles.hourLine, { top: y(h), borderColor: c.line }]}>
              <Txt variant="small" faint style={styles.hourLabel}>
                {h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
              </Txt>
            </View>
          ))}
          {/* blocks */}
          {BLOCKS.map((b, i) => {
            const col = kindColor(b.kind);
            return (
              <View
                key={i}
                style={[
                  styles.block,
                  {
                    top: y(b.from) + 2,
                    height: (b.to - b.from) * PX - 4,
                    backgroundColor: b.kind === 'work' ? c.fieldBg : col + '22',
                    borderLeftColor: col,
                  },
                ]}>
                <Txt style={{ fontWeight: '800', color: b.kind === 'work' ? c.sec : c.ink }} numberOfLines={1}>
                  {b.title}
                </Txt>
                <Txt variant="small" muted numberOfLines={1}>
                  {b.sub}
                </Txt>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const { c } = useWayfare();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Txt variant="small" color={c.sec}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  pips: { flexDirection: 'row', gap: 4, marginTop: Space.l },
  pip: { flex: 1, alignItems: 'center', gap: 5 },
  pipNum: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', gap: Space.l, marginTop: Space.m },
  hourLine: { position: 'absolute', left: 54, right: 0, height: 1, borderTopWidth: 1 },
  hourLabel: { position: 'absolute', left: -54, top: -7, width: 48 },
  block: {
    position: 'absolute',
    left: 54,
    right: 4,
    borderRadius: 12,
    borderLeftWidth: 3,
    padding: 10,
    justifyContent: 'center',
  },
});
