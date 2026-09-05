import { Pressable, StyleSheet, View } from 'react-native';

import { ReactNode } from 'react';

import { Icon, IconName } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { AIOrb, AITip, Card, CategoryIcon, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { back, go } from '@/lib/nav';
import { wizard } from '@/lib/wizard';

function Cat({ name, color }: { name: IconName; color: string }) {
  return <CategoryIcon name={name} color={color} size={52} iconSize={24} />;
}

export default function StartMethod() {
  const { c } = useWayfare();
  const start = () => {
    wizard.reset();
    go('/create/basics');
  };
  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable onPress={back}>
        <MapIconButton>
          <Icon name="back" size={22} color="#fff" />
        </MapIconButton>
      </Pressable>
      <Txt variant="h1" style={{ color: '#fff', fontSize: 24 }}>
        New trip
      </Txt>
    </View>
  );
  return (
    <MapFirst header={header} sheetTop={0.22}>
        <Txt variant="h1">
          How do you want{'\n'}to start?
        </Txt>
        <Txt variant="sec" muted style={{ marginTop: 8 }}>
          Three ways to build your plan — pick one.
        </Txt>

        <View style={{ gap: Space.m, marginTop: Space.l }}>
          <Option
            leading={<AIOrb size={44} />}
            title="Describe your trip"
            sub="Just tell us in one message — AI plans it"
            badge="New"
            onPress={() => go('/create/plan')}
          />
          <Option
            leading={<Cat name="spark" color={c.a4} />}
            title="Chat with Wayfare AI"
            sub="Answer a few questions, get 3 plans"
            onPress={() => go('/create/chat')}
          />
          <Option leading={<Cat name="wand" color={c.a3} />} title="Build it yourself" sub="Set the basics — we fill the details" onPress={start} />
          <Option leading={<Cat name="upload" color={c.a2} />} title="Import a spreadsheet" sub="Bring a CSV or Excel plan (web)" onPress={() => go('/create/import')} />
        </View>

        <View style={{ marginTop: Space.l }}>
          <AITip>However you start, AI adds timings, costs, routes &amp; map pins at the end.</AITip>
        </View>
    </MapFirst>
  );
}

function Option({
  leading,
  title,
  sub,
  badge,
  onPress,
}: {
  leading: ReactNode;
  title: string;
  sub: string;
  badge?: string;
  onPress: () => void;
}) {
  const { c } = useWayfare();
  return (
    <Card onPress={onPress} style={styles.opt}>
      {leading}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt style={{ fontWeight: '800', fontSize: 16 }}>{title}</Txt>
          {badge ? (
            <View style={{ backgroundColor: 'rgba(47,217,138,0.24)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Txt style={{ color: '#8DEBBE', fontSize: 9, fontWeight: '800' }}>{badge}</Txt>
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
});
