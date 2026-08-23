import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/wayfare/icon';
import { PhotoCard } from '@/components/wayfare/photo';
import { useWayfare } from '@/components/wayfare/theme';
import { Field, IconButton, PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { go, replaceTo } from '@/lib/nav';

export default function Login() {
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('klinelozada@gmail.com');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PhotoCard name="bgc" height={230} radius={0} scrim={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.6)']}>
        <View style={[styles.headTop, { top: insets.top + 8 }]}>
          <IconButton name="back" round tint="rgba(255,255,255,0.92)" onPress={() => go('/onboarding')} />
        </View>
        <View style={styles.headBottom}>
          <Txt color="#fff" variant="h1" style={{ fontSize: 30 }}>
            Welcome back
          </Txt>
          <Txt color="rgba(255,255,255,0.85)" variant="body" style={{ marginTop: 6 }}>
            Log in to pick up your trip.
          </Txt>
        </View>
      </PhotoCard>

      <View style={{ paddingHorizontal: Space.xl, paddingTop: Space.xl, gap: Space.l }}>
        <Labeled label="Email">
          <Field icon="mail" placeholder="you@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </Labeled>
        <Labeled label="Password">
          <Field
            icon="lock"
            placeholder="••••••••"
            value={pw}
            onChangeText={setPw}
            secureTextEntry={!show}
            trailing={
              <Pressable onPress={() => setShow((s) => !s)} hitSlop={8}>
                <Icon name="eye" size={18} color={c.ter} />
              </Pressable>
            }
          />
        </Labeled>
        <Pressable onPress={() => go('/(auth)/forgot')} style={{ alignSelf: 'flex-end' }}>
          <Txt variant="small" muted>
            Forgot password?
          </Txt>
        </Pressable>

        <PillButton label="Log in" icon="arrow" knob onPress={() => replaceTo('/(tabs)')} />

        <View style={styles.orRow}>
          <View style={[styles.line, { backgroundColor: c.line }]} />
          <Txt variant="small" faint>
            or
          </Txt>
          <View style={[styles.line, { backgroundColor: c.line }]} />
        </View>

        <PillButton label="Continue with Google" variant="secondary" onPress={() => replaceTo('/(tabs)')} />

        <View style={styles.bottom}>
          <Txt variant="sec" muted>
            New here?{' '}
          </Txt>
          <Pressable onPress={() => go('/(auth)/register')}>
            <Txt variant="sec" style={{ fontWeight: '800' }}>
              Create account
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
  orRow: { flexDirection: 'row', alignItems: 'center', gap: Space.m },
  line: { flex: 1, height: 1 },
  bottom: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
