// A little figure that actually walks — swinging legs + counter-swinging arms +
// a subtle body bob, driven by Reanimated (works on web and native, ~0 weight).
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useWayfare } from './theme';

// Rotate a limb around its TOP edge (the hip / shoulder) instead of its centre.
function pivotTop(deg: number, len: number) {
  'worklet';
  return [{ translateY: len / 2 }, { rotate: `${deg}deg` }, { translateY: -len / 2 }];
}

export function AnimatedWalker({ size = 44, color }: { size?: number; color?: string }) {
  const { c } = useWayfare();
  const col = color ?? c.onPrimary;
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    t.value = withRepeat(withTiming(2 * Math.PI, { duration: 640, easing: Easing.linear }), -1, false);
  }, [t, reduced]);

  const S = size;
  const headR = 0.15 * S;
  const torsoH = 0.3 * S;
  const legW = 0.11 * S;
  const legH = 0.32 * S;
  const armW = 0.09 * S;
  const armH = 0.26 * S;

  const body = useAnimatedStyle(() => ({ transform: [{ translateY: Math.sin(t.value) * 0.04 * S }] }));
  const legL = useAnimatedStyle(() => ({ transform: pivotTop(Math.sin(t.value) * 28, legH) }));
  const legR = useAnimatedStyle(() => ({ transform: pivotTop(-Math.sin(t.value) * 28, legH) }));
  const armL = useAnimatedStyle(() => ({ transform: pivotTop(-Math.sin(t.value) * 24, armH) }));
  const armR = useAnimatedStyle(() => ({ transform: pivotTop(Math.sin(t.value) * 24, armH) }));

  const limb = (w: number, h: number) => ({ width: w, height: h, borderRadius: w / 2, backgroundColor: col });

  return (
    <Animated.View style={[{ width: S, height: S }, body]}>
      {/* arms (behind + front) */}
      <Animated.View style={[styles.arm, { top: 0.34 * S, left: 0.5 * S - armW / 2 }, limb(armW, armH), armL]} />
      <Animated.View style={[styles.arm, { top: 0.34 * S, left: 0.5 * S - armW / 2 }, limb(armW, armH), armR]} />
      {/* head */}
      <View style={[styles.abs, { top: 0.02 * S, left: 0.5 * S - headR, width: headR * 2, height: headR * 2, borderRadius: headR, backgroundColor: col }]} />
      {/* torso */}
      <View style={[styles.abs, { top: 0.32 * S, left: 0.5 * S - 0.06 * S, ...limb(0.12 * S, torsoH) }]} />
      {/* legs */}
      <Animated.View style={[styles.leg, { top: 0.6 * S, left: 0.5 * S - legW - 0.01 * S }, limb(legW, legH), legL]} />
      <Animated.View style={[styles.leg, { top: 0.6 * S, left: 0.5 * S + 0.01 * S }, limb(legW, legH), legR]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  arm: { position: 'absolute' },
  leg: { position: 'absolute' },
});
