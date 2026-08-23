import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PhotoCard } from '@/components/wayfare/photo';
import { useWayfare } from '@/components/wayfare/theme';
import { AITip, Field, IconButton, PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { go, replaceTo } from '@/lib/nav';

export default function Register() {
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PhotoCard name="museum" height={230} radius={0} scrim={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.62)']}>
        <View style={[styles.headTop, { top: insets.top + 8 }]}>
          <IconButton name="back" round tint="rgba(255,255,255,0.92)" onPress={() => go('/onboarding')} />
        </View>
        <View style={styles.headBottom}>
          <Txt color="#fff" variant="h1" style={{ fontSize: 30 }}>
            Create account
          </Txt>
          <Txt color="rgba(255,255,255,0.85)" variant="body" style={{ marginTop: 6 }}>
            Start planning in under a minute.
          </Txt>
        </View>
      </PhotoCard>

      <View style={{ paddingHorizontal: Space.xl, paddingTop: Space.xl, gap: Space.l }}>
        <Labeled label="Full name">
          <Field icon="user" placeholder="Kline Lozada" value={name} onChangeText={setName} />
        </Labeled>
        <Labeled label="Email">
          <Field icon="mail" placeholder="you@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </Labeled>
        <Labeled label="Password">
          <Field icon="lock" placeholder="At least 8 characters" value={pw} onChangeText={setPw} secureTextEntry />
        </Labeled>

        <AITip>
          We&apos;ll use your home base to plan door-to-door routes — you can change it anytime.
        </AITip>

        <PillButton label="Create account" icon="arrow" knob onPress={() => replaceTo('/(tabs)')} />

        <View style={styles.bottom}>
          <Txt variant="sec" muted>
            Already have one?{' '}
          </Txt>
          <Pressable onPress={() => go('/(auth)/login')}>
            <Txt variant="sec" style={{ fontWeight: '800' }}>
              Log in
            </Txt>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  const { c } = useWayfare();
  return (
    <View style={{ gap: 8 }}>
      <Txt variant="label" color={c.sec}>
        {label.toUpperCase()}
      </Txt>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  headTop: { position: 'absolute', left: Space.xl },
  headBottom: { position: 'absolute', left: Space.xl, right: Space.xl, bottom: 18 },
  bottom: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
