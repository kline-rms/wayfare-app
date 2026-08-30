import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, ListRow, SectionLabel, Toggle, Txt } from '@/components/wayfare/ui';
import { Gradients } from '@/constants/wayfare';
import { Space } from '@/constants/wayfare';
import { authStore, useAuth } from '@/lib/auth';
import { go, replaceTo } from '@/lib/nav';

export default function ProfileScreen() {
  const { c } = useWayfare();
  const { user } = useAuth();
  const [stayLate, setStayLate] = useState(false);

  const chev = <Icon name="chevR" size={16} color={c.ter} />;
  const name = user?.displayName || user?.email?.split('@')[0] || 'Traveler';
  const initials = name.slice(0, 2).toUpperCase();

  const signOut = () => {
    authStore.clear();
    replaceTo('/(auth)/login');
  };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Txt variant="h1" style={{ color: '#fff', flex: 1 }}>
        Profile
      </Txt>
      <Pressable>
        <MapIconButton>
          <Icon name="edit" size={19} color="#fff" />
        </MapIconButton>
      </Pressable>
    </View>
  );

  return (
    <MapFirst header={header} sheetTop={0.24} dockGap collapsible>
      <View style={{ alignItems: 'center', paddingBottom: Space.m }}>
        <LinearGradient colors={Gradients.grape} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bigAvatar}>
          <Txt color="#fff" style={{ fontSize: 24, fontWeight: '800' }}>
            {initials}
          </Txt>
        </LinearGradient>
        <Txt variant="h2" style={{ marginTop: Space.s }}>
          {name}
        </Txt>
        <Txt variant="sec" muted>
          1,245 km travelled
        </Txt>
      </View>

      <View style={styles.statRow}>
        <Stat emoji="🔥" label="417d" tint={c.a1} />
        <Stat emoji="⭐" label="9 trips" tint={c.a2} />
        <Stat emoji="🚶" label="1,245 km" tint={c.a3} />
      </View>

      <SectionLabel style={{ marginTop: Space.xl }}>Trip preferences</SectionLabel>
      <Card padded={false} style={{ paddingHorizontal: Space.l }}>
        <ListRow icon="wallet" title="Currency" subtitle="Philippine Peso (₱)" trailing={chev} />
        <ListRow icon="calClock" title="Availability & work blocks" subtitle="Mon–Fri · 7 AM – 4 PM" trailing={chev} onPress={() => go('/availability')} />
        <ListRow icon="bell" title="Reminders" subtitle="1 hour and 15 min before" trailing={chev} onPress={() => go('/reminders')} />
        <ListRow icon="moon" title="Stay up late" subtitle="Allow plans past 11 PM" trailing={<Toggle value={stayLate} onChange={setStayLate} />} last />
      </Card>

      <SectionLabel style={{ marginTop: Space.xl }}>Account</SectionLabel>
      <Card padded={false} style={{ paddingHorizontal: Space.l }}>
        <ListRow icon="user" title="Personal details" trailing={chev} />
        <ListRow icon="globe" title="Language & region" subtitle="English · Philippines" trailing={chev} />
        <ListRow icon="flag" title="Replay intro" trailing={chev} onPress={() => go('/onboarding')} />
        <ListRow icon="logout" iconColor={c.danger} title="Sign out" trailing={chev} onPress={signOut} last />
      </Card>

      <Txt variant="small" faint style={{ textAlign: 'center', marginTop: Space.xl }}>
        Wayfare · v1.0.0
      </Txt>
    </MapFirst>
  );
}

function Stat({ emoji, label, tint }: { emoji: string; label: string; tint: string }) {
  return (
    <View style={{ backgroundColor: tint + '2E', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 }}>
      <Txt style={{ color: tint, fontWeight: '800', fontSize: 11.5 }}>
        {emoji} {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  bigAvatar: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  statRow: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: Space.s },
});
