import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Field, PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { api } from '@/lib/api';
import { authStore } from '@/lib/auth';
import { go, replaceTo } from '@/lib/nav';

export default function Login() {
  const { c } = useWayfare();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const { token, user } = await api.login(email.trim(), pw);
      authStore.setSession(token, user);
      replaceTo('/(tabs)');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const header = (
    <Pressable onPress={() => go('/onboarding')}>
      <MapIconButton>
        <Icon name="back" size={22} color="#fff" />
      </MapIconButton>
    </Pressable>
  );

  return (
    <MapFirst header={header} sheetTop={0.4}>
      <Txt variant="h1" style={{ fontSize: 28 }}>
        Welcome back
      </Txt>
      <View style={{ gap: 9, marginTop: Space.m }}>
        <Field icon="mail" placeholder="you@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
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
        <Pressable onPress={() => go('/(auth)/forgot')} style={{ alignSelf: 'flex-end' }}>
          <Txt variant="small" muted>
            Forgot password?
          </Txt>
        </Pressable>

        {error ? (
          <Txt variant="small" style={{ color: c.danger }}>
            {error}
          </Txt>
        ) : null}

        <PillButton label={busy ? 'Logging in…' : 'Log in'} icon="arrow" knob onPress={busy ? undefined : submit} />

        <View style={styles.bottom}>
          <Txt variant="sec" muted>
            New here?{' '}
          </Txt>
          <Pressable onPress={() => go('/(auth)/register')}>
            <Txt variant="sec" style={{ fontWeight: '800', color: c.a3 }}>
              Create account
            </Txt>
          </Pressable>
        </View>
      </View>
    </MapFirst>
  );
}

const styles = StyleSheet.create({
  bottom: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Space.s },
});
