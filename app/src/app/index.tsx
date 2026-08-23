import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/wayfare/icon';
import { useWayfare } from '@/components/wayfare/theme';
import { PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { go } from '@/lib/nav';

export default function SplashScreen() {
  const { c } = useWayfare();

  // Give the brand a beat, then drop into the app. Users can still reach the
  // intro / sign-in from Profile.
  useEffect(() => {
    const t = setTimeout(() => go('/(tabs)'), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.center}>
        <View style={[styles.mark, { backgroundColor: c.primary }]}>
          <Icon name="route" size={40} color={c.onPrimary} />
        </View>
        <Txt variant="h1" style={{ fontSize: 40, marginTop: Space.l }}>
          Wayfare
        </Txt>
        <Txt variant="sec" muted style={{ marginTop: 6 }}>
          Plans that feel human.
        </Txt>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.footer}>
        <PillButton label="Get started" icon="arrow" knob onPress={() => go('/onboarding')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.xl },
  center: { alignItems: 'center' },
  mark: { width: 92, height: 92, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', left: Space.xl, right: Space.xl, bottom: 48 },
});
