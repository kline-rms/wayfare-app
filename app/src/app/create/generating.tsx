import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AIOrb, Txt } from '@/components/wayfare/ui';
import { Icon } from '@/components/wayfare/icon';
import { useWayfare } from '@/components/wayfare/theme';
import { Space } from '@/constants/wayfare';
import { api } from '@/lib/api';
import { replaceTo } from '@/lib/nav';

const STEPS = [
  'Reading your must-dos',
  'Routing BGC → Old Manila',
  'Pricing food & travel in ₱',
  'Balancing 3 proposals',
];

export default function Generating() {
  const { c } = useWayfare();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.25, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    let done = false;
    // Kick off the (future) real generation; for now route to the 3 proposals.
    (async () => {
      try {
        const list = await api.listItineraries();
        setTimeout(() => {
          if (!done && list[0]) replaceTo({ pathname: '/proposal/[id]', params: { id: list[0].id } });
        }, 2600);
      } catch {
        setTimeout(() => !done && replaceTo('/(tabs)'), 2600);
      }
    })();
    return () => {
      done = true;
    };
  }, [pulse]);

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.center}>
        <Animated.View style={[styles.orbHalo, { backgroundColor: c.a2 + '22' }, orbStyle]} />
        <AIOrb size={72} />
      </View>
      <Txt variant="h1" style={{ textAlign: 'center', marginTop: 28 }}>
        Building your{'\n'}Manila trip
      </Txt>

      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <Animated.View key={s} entering={FadeInDown.delay(300 + i * 500).duration(400)} style={styles.step}>
            <Icon name="checkC" size={20} color={c.a2} />
            <Txt variant="body" muted>
              {s}
            </Txt>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.xl },
  center: { alignItems: 'center', justifyContent: 'center' },
  orbHalo: { position: 'absolute', width: 120, height: 120, borderRadius: 60 },
  steps: { marginTop: 36, gap: 14, alignSelf: 'stretch', paddingHorizontal: Space.l },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center' },
});
