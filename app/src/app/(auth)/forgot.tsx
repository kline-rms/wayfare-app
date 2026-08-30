import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { Field, PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { back } from '@/lib/nav';

export default function Forgot() {
  const [email, setEmail] = useState('klinelozada@gmail.com');
  const [sent, setSent] = useState(false);

  const header = (
    <Pressable onPress={back}>
      <MapIconButton>
        <Icon name="back" size={22} color="#fff" />
      </MapIconButton>
    </Pressable>
  );

  return (
    <MapFirst header={header} sheetTop={0.44}>
      <Txt variant="h1" style={{ fontSize: 28 }}>
        Reset your{'\n'}password
      </Txt>
      <Txt variant="body" muted style={{ marginTop: 7 }}>
        We&apos;ll email you a link.
      </Txt>
      <View style={{ gap: 9, marginTop: Space.m }}>
        <Field icon="mail" placeholder="you@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <PillButton label={sent ? 'Link sent ✓' : 'Send reset link'} icon={sent ? 'check' : 'arrow'} knob onPress={() => setSent(true)} />
      </View>
    </MapFirst>
  );
}
