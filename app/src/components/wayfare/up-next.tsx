// Live "up next" card for the day timeline: shows the next place with a real
// distance/ETA from the device's location, a Navigate action, and Skip (which
// advances to the following stop — the "I'm ahead / running late" control).
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useLocation } from '@/hooks/use-location';
import { isDestination } from '@/lib/activity';
import { formatEta, haversineKm } from '@/lib/geo';
import { openMaps } from '@/lib/maps';
import type { Activity } from '@/lib/types';
import { AnimatedWalker } from './animated-walker';
import { Icon } from './icon';
import { useWayfare } from './theme';
import { Txt } from './ui';

const WALKER = 34;

// A dashed route the little traveler walks along, toward the destination pin.
function WalkStrip() {
  const { c } = useWayfare();
  const reduced = useReducedMotion();
  const w = useSharedValue(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    x.value = withRepeat(withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.ease) }), -1, false);
  }, [x, reduced]);

  const onLayout = (e: LayoutChangeEvent) => {
    w.value = e.nativeEvent.layout.width;
  };
  const walker = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(x.value, [0, 1], [0, Math.max(0, w.value - WALKER - 22)]) }] }));

  return (
    <View style={styles.strip} onLayout={onLayout}>
      <View style={[styles.route, { borderColor: 'rgba(255,255,255,0.28)' }]} />
      <Animated.View style={[styles.walker, walker]}>
        <AnimatedWalker size={WALKER} color="#fff" />
      </Animated.View>
      <View style={styles.pin}>
        <Icon name="pin" size={20} color={c.a2} />
      </View>
    </View>
  );
}

export function UpNext({ activities, homeBase }: { activities: Activity[]; homeBase?: string }) {
  const { c, cardShadow } = useWayfare();
  const stops = activities.filter((a) => isDestination(a, homeBase));
  const [i, setI] = useState(0);
  const loc = useLocation();

  if (!stops.length) return null;
  const idx = Math.min(i, stops.length - 1);
  const a = stops[idx];
  const isLast = idx >= stops.length - 1;
  const km = loc.coords ? haversineKm(loc.coords, { lat: a.lat!, lng: a.lng! }) : null;

  const distanceLine =
    km != null
      ? formatEta(km)
      : loc.status === 'denied'
        ? 'Enable location for live distance'
        : loc.status === 'unavailable'
          ? 'Location unavailable'
          : 'Locating you…';

  return (
    <View style={[styles.card, { backgroundColor: c.ink }, cardShadow]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={[styles.dot, { backgroundColor: c.a2 }]} />
        <Txt variant="small" style={{ color: c.a2, fontWeight: '800', letterSpacing: 0.6 }}>
          UP NEXT
        </Txt>
        <Txt variant="small" style={{ color: 'rgba(255,255,255,0.55)', marginLeft: 'auto' }}>
          {a.time}
        </Txt>
      </View>

      <Txt style={{ color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 8 }} numberOfLines={1}>
        {a.activity}
      </Txt>
      <Txt variant="sec" style={{ color: 'rgba(255,255,255,0.7)', marginTop: 2 }} numberOfLines={1}>
        {a.where}
      </Txt>

      <WalkStrip />

      <View style={styles.etaRow}>
        <Icon name="locate" size={15} color={c.a2} />
        <Txt variant="small" style={{ color: '#fff', fontWeight: '700' }}>
          {distanceLine}
        </Txt>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => openMaps(a.lat!, a.lng!, a.where)}
          style={({ pressed }) => [styles.navBtn, { backgroundColor: c.a2 }, pressed && { opacity: 0.9 }]}>
          <Icon name="nav" size={16} color="#fff" />
          <Txt style={{ color: '#fff', fontWeight: '800' }}>Navigate</Txt>
        </Pressable>
        {!isLast ? (
          <Pressable
            onPress={() => setI(idx + 1)}
            style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}>
            <Icon name="swap" size={15} color="rgba(255,255,255,0.85)" />
            <Txt style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700' }}>Skip</Txt>
          </Pressable>
        ) : (
          <View style={styles.skipBtn}>
            <Txt style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700' }}>Last stop</Txt>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, padding: 18, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  strip: { height: 40, marginTop: 14, justifyContent: 'center' },
  route: { position: 'absolute', left: 4, right: 26, top: 30, borderTopWidth: 2, borderStyle: 'dashed' },
  walker: { position: 'absolute', left: 2, bottom: 0 },
  pin: { position: 'absolute', right: 0, bottom: 2 },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 999 },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});
