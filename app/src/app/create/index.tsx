import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/wayfare/icon';
import { useWayfare } from '@/components/wayfare/theme';
import { AIOrb, AITip, Card, Header, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { back, go } from '@/lib/nav';

export default function StartMethod() {
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + Space.s, paddingHorizontal: Space.xl, paddingBottom: Space.xxl }}>
        <Header title="New trip" onBack={back} />
        <Txt variant="h1" style={{ marginTop: Space.l }}>
          How do you want{'\n'}to start?
        </Txt>
        <Txt variant="sec" muted style={{ marginTop: 8 }}>
          Three ways to build your plan — pick one.
        </Txt>

        <View style={{ gap: Space.m, marginTop: Space.l }}>
          <Option
            leading={<AIOrb size={34} />}
            title="Chat with Wayfare AI"
            sub="Answer a few questions, get 3 plans"
            badge="Fastest"
            onPress={() => go('/create/basics')}
          />
          <Option icon="wand" tint="#EDEBFF" title="Build it yourself" sub="Set the basics — we fill the details" onPress={() => go('/create/basics')} />
          <Option icon="file" tint="#E7F1FB" title="Import a spreadsheet" sub="Bring a CSV or Excel plan (web)" onPress={() => go('/create/basics')} />
        </View>

        <View style={{ marginTop: Space.l }}>
          <AITip>However you start, AI adds timings, costs, routes &amp; map pins at the end.</AITip>
        </View>
      </ScrollView>
    </View>
  );
}

function Option({
  icon,
  leading,
  tint,
  title,
  sub,
  badge,
  onPress,
}: {
  icon?: IconName;
  leading?: React.ReactNode;
  tint?: string;
  title: string;
  sub: string;
  badge?: string;
  onPress: () => void;
}) {
  const { c } = useWayfare();
  return (
    <Card onPress={onPress} style={styles.opt}>
      <View style={[styles.optIcon, { backgroundColor: tint ?? c.bg }]}>
        {leading ?? (icon ? <Icon name={icon} size={24} color={c.ink} /> : null)}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt style={{ fontWeight: '800', fontSize: 16 }}>{title}</Txt>
          {badge ? (
            <View style={{ backgroundColor: '#E7F6EE', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Txt style={{ color: '#1E8A50', fontSize: 9, fontWeight: '800' }}>{badge}</Txt>
            </View>
          ) : null}
        </View>
        <Txt variant="small" muted style={{ marginTop: 2 }}>
          {sub}
        </Txt>
      </View>
      <Icon name="chevR" size={18} color={c.ter} />
    </Card>
  );
}

const styles = StyleSheet.create({
  opt: { flexDirection: 'row', alignItems: 'center', gap: Space.m },
  optIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
