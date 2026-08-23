import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/wayfare/icon';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, Header, IconButton, ListRow, SectionLabel, Toggle, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { go, replaceTo } from '@/lib/nav';

export default function ProfileScreen() {
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  const [stayLate, setStayLate] = useState(false);

  const chev = <Icon name="chevR" size={16} color={c.ter} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + Space.s, paddingHorizontal: Space.xl, paddingBottom: Space.xxl }}>
        <Header title="Profile" large trailing={<IconButton name="edit" iconSize={19} />} />

        {/* identity card */}
        <Card style={{ marginTop: Space.l, alignItems: 'center', paddingVertical: Space.xl }}>
          <View style={[styles.bigAvatar, { backgroundColor: c.primary }]}>
            <Txt color={c.onPrimary} style={{ fontSize: 26, fontWeight: '800' }}>
              KL
            </Txt>
          </View>
          <Txt variant="h2" style={{ marginTop: Space.m }}>
            Kline Lozada
          </Txt>
          <Txt variant="sec" muted>
            klinelozada@gmail.com
          </Txt>
        </Card>

        <SectionLabel style={{ marginTop: Space.xl }}>Trip preferences</SectionLabel>
        <Card padded={false} style={{ paddingHorizontal: Space.l }}>
          <ListRow icon="wallet" title="Currency" subtitle="Philippine Peso (₱)" trailing={chev} />
          <ListRow icon="calClock" title="Availability & work blocks" subtitle="Mon–Fri · 7 AM – 4 PM" trailing={chev} onPress={() => go('/availability')} />
          <ListRow icon="bell" title="Reminders" subtitle="1 hour and 15 min before" trailing={chev} />
          <ListRow icon="moon" title="Stay up late" subtitle="Allow plans past 11 PM" trailing={<Toggle value={stayLate} onChange={setStayLate} />} last />
        </Card>

        <SectionLabel style={{ marginTop: Space.xl }}>Account</SectionLabel>
        <Card padded={false} style={{ paddingHorizontal: Space.l }}>
          <ListRow icon="user" title="Personal details" trailing={chev} />
          <ListRow icon="globe" title="Language & region" subtitle="English · Philippines" trailing={chev} />
          <ListRow icon="flag" title="Replay intro" trailing={chev} onPress={() => go('/onboarding')} />
          <ListRow
            icon="logout"
            iconColor={c.danger}
            title="Sign out"
            trailing={chev}
            onPress={() => replaceTo('/(auth)/login')}
            last
          />
        </Card>

        <Txt variant="small" faint style={{ textAlign: 'center', marginTop: Space.xl }}>
          Wayfare · v1.0.0
        </Txt>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bigAvatar: { width: 80, height: 80, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
