import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/wayfare/icon';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, Header, ListRow, PillButton, SectionLabel, Toggle, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { back } from '@/lib/nav';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Availability() {
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  const [workDays, setWorkDays] = useState([true, true, true, true, true, false, false]);
  const [workOn, setWorkOn] = useState(true);
  const [stayLate, setStayLate] = useState(false);

  const chev = <Icon name="chevR" size={16} color={c.ter} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + Space.s, paddingHorizontal: Space.xl, paddingBottom: Space.xxl }}>
        <Header title="Availability" onBack={back} />
        <Txt variant="sec" muted style={{ marginTop: Space.m }}>
          Tell us when you&apos;re busy — Wayfare plans around it and never double-books your time.
        </Txt>

        <SectionLabel style={{ marginTop: Space.xl }}>Recurring</SectionLabel>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.m }}>
            <View style={[styles.iconChip, { backgroundColor: c.bg }]}>
              <Icon name="brief" size={20} color={c.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '800' }}>Work</Txt>
              <Txt variant="small" muted>
                7:00 AM – 4:00 PM
              </Txt>
            </View>
            <Toggle value={workOn} onChange={setWorkOn} />
          </View>
          <View style={styles.dayRow}>
            {WEEK.map((d, i) => {
              const on = workDays[i];
              return (
                <Pressable
                  key={i}
                  onPress={() => setWorkDays((w) => w.map((v, k) => (k === i ? !v : v)))}
                  style={[styles.dayCell, { backgroundColor: on ? c.primary : c.bg }]}>
                  <Txt style={{ fontWeight: '800', fontSize: 12.5, color: on ? c.onPrimary : c.ter }}>{d}</Txt>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <SectionLabel style={{ marginTop: Space.xl }}>This trip</SectionLabel>
        <Card padded={false} style={{ paddingHorizontal: Space.l }}>
          <ListRow icon="calClock" title="Family dinner" subtitle="Fri, Sep 4 · 7:00 PM" trailing={<Txt variant="small" muted>Edit</Txt>} />
          <ListRow icon="plus" title="Add an engagement" last />
        </Card>

        <SectionLabel style={{ marginTop: Space.xl }}>Planning window</SectionLabel>
        <Card padded={false} style={{ paddingHorizontal: Space.l }}>
          <ListRow icon="clock" title="Weekday activities" subtitle="5:00 PM – 11:00 PM" trailing={chev} />
          <ListRow
            icon="moon"
            title="Stay up late"
            subtitle="Allow plans past 11:00 PM"
            trailing={<Toggle value={stayLate} onChange={setStayLate} />}
            last
          />
        </Card>

        <View style={{ marginTop: Space.xl }}>
          <PillButton label="Save availability" icon="check" onPress={back} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  iconChip: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dayRow: { flexDirection: 'row', gap: 6, marginTop: Space.m },
  dayCell: { flex: 1, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
