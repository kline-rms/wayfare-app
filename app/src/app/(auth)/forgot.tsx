import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PhotoCard } from '@/components/wayfare/photo';
import { useWayfare } from '@/components/wayfare/theme';
import { AITip, Field, IconButton, PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { back } from '@/lib/nav';

export default function Forgot() {
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('klinelozada@gmail.com');
  const [sent, setSent] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PhotoCard name="manilabay" height={200} radius={0} scrim={['rgba(0,0,0,0.24)', 'rgba(0,0,0,0.58)']}>
        <View style={[styles.headTop, { top: insets.top + 8 }]}>
          <IconButton name="back" round tint="rgba(255,255,255,0.92)" onPress={back} />
        </View>
        <View style={styles.headBottom}>
          <Txt color="#fff" variant="h1" style={{ fontSize: 28 }}>
            Reset your password
          </Txt>
          <Txt color="rgba(255,255,255,0.85)" variant="body" style={{ marginTop: 6 }}>
            We&apos;ll send a link to set a new one.
          </Txt>
        </View>
      </PhotoCard>

      <View style={{ paddingHorizontal: Space.xl, paddingTop: Space.xl, gap: Space.l }}>
        <View style={{ gap: 8 }}>
          <Txt variant="label" color={c.sec}>
            EMAIL
          </Txt>
          <Field icon="mail" placeholder="you@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <PillButton
          label={sent ? 'Link sent ✓' : 'Send reset link'}
          icon={sent ? 'check' : 'mail'}
          onPress={() => setSent(true)}
        />

        <AITip>
          We&apos;ll email a secure link to <Txt style={{ fontWeight: '700' }}>reset your password</Txt> — it expires in 30 minutes.
        </AITip>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headTop: { position: 'absolute', left: Space.xl },
  headBottom: { position: 'absolute', left: Space.xl, right: Space.xl, bottom: 16 },
});
