import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PhotoCard } from '@/components/wayfare/photo';
import { useWayfare } from '@/components/wayfare/theme';
import { PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { ImageKey } from '@/lib/images';
import { replaceTo } from '@/lib/nav';

const SLIDES: { photo: ImageKey; title: string; body: string }[] = [
  {
    photo: 'bgc',
    title: 'Door to door,\nnot city to city',
    body: 'Tell us where you start — Avida, BGC — and every plan routes you to Old Manila and back with real travel times.',
  },
  {
    photo: 'museum',
    title: 'We recommend\nthe places',
    body: 'Three curated proposals with real stops, honest ₱ cost ranges, and a reason behind every pick.',
  },
  {
    photo: 'cathedral',
    title: 'Never miss\na moment',
    body: 'Gentle reminders 1 hour and 15 minutes before each stop — so you savour it, not rush it.',
  },
];

export default function Onboarding() {
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top + Space.s }]}>
      <View style={styles.top}>
        <Pressable onPress={() => replaceTo('/(auth)/register')}>
          <Txt variant="body" muted>
            Skip
          </Txt>
        </Pressable>
      </View>

      <Animated.View key={i} entering={FadeIn.duration(350)} style={{ flex: 1 }}>
        <PhotoCard name={slide.photo} height={340} radius={26} scrim={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.45)']} />
        <Txt variant="h1" style={{ fontSize: 32, lineHeight: 37, marginTop: Space.xl }}>
          {slide.title}
        </Txt>
        <Txt variant="body" muted style={{ marginTop: Space.m, fontSize: 16, lineHeight: 24 }}>
          {slide.body}
        </Txt>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Space.l }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, k) => (
            <View
              key={k}
              style={[
                styles.dot,
                { backgroundColor: k === i ? c.ink : c.ter, width: k === i ? 20 : 6 },
              ]}
            />
          ))}
        </View>
        <PillButton
          label={last ? 'Create account' : 'Next'}
          icon="arrow"
          knob
          full={false}
          style={{ minWidth: last ? 190 : 150 }}
          onPress={() => (last ? replaceTo('/(auth)/register') : setI(i + 1))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: Space.xl },
  top: { alignItems: 'flex-end', paddingVertical: Space.s },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Space.l },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
});
