import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';

import { Logo } from '@/components/wayfare/logo';
import { Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { authStore } from '@/lib/auth';
import { go, replaceTo } from '@/lib/nav';

const NIGHT = '#17123A';

// Subtle grape grid + amber dashed route — the app-preview "gridbg" splash.
function Backdrop() {
  const cols = [30, 70, 110, 150, 190];
  const rows = [80, 160, 240, 320, 400, 480, 560, 640];
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 222 720" preserveAspectRatio="xMidYMid slice">
      {cols.map((x) => (
        <Line key={`c${x}`} x1={x} y1={0} x2={x + 40} y2={720} stroke="rgba(124,92,246,0.12)" strokeWidth={1} />
      ))}
      {rows.map((y) => (
        <Line key={`r${y}`} x1={0} y1={y} x2={222} y2={y - 16} stroke="rgba(124,92,246,0.09)" strokeWidth={1} />
      ))}
      <Path
        d="M30 640 C 70 520,180 540,130 380 S 60 190,180 90"
        fill="none"
        stroke="#FFA828"
        strokeWidth={4}
        strokeDasharray="2 12"
        strokeLinecap="round"
        opacity={0.75}
      />
    </Svg>
  );
}

export default function SplashScreen() {
  useEffect(() => {
    const t = setTimeout(() => replaceTo(authStore.isAuthed() ? '/(tabs)' : '/(auth)/login'), 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.root}>
      <Backdrop />
      <Animated.View entering={FadeIn.duration(500)} style={styles.center}>
        <Logo size={92} />
        <Txt variant="h1" style={{ fontSize: 34, marginTop: 18, color: '#fff' }}>
          Wayfare
        </Txt>
        <Txt variant="body" style={{ marginTop: 6, color: '#B4ADE0' }}>
          Every trip, on one map.
        </Txt>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.footer}>
        <Pressable onPress={() => go('/onboarding')} style={styles.getBtn}>
          <Txt style={{ color: '#7C5CF6', fontWeight: '800', fontSize: 15 }}>Get started</Txt>
          <View style={styles.knob}>
            <Txt style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>→</Txt>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.xl, backgroundColor: NIGHT },
  center: { alignItems: 'center', zIndex: 2 },
  footer: { position: 'absolute', left: Space.xl, right: Space.xl, bottom: 48, zIndex: 2 },
  getBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  knob: {
    position: 'absolute',
    right: 6,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
