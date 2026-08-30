import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { MapFirst } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { replaceTo } from '@/lib/nav';

const SLIDES: { title: string; body: string }[] = [
  {
    title: 'Door to door,\nnot city to city',
    body: 'Tell us where you start — Avida, BGC — and every plan routes you to Old Manila and back with real travel times.',
  },
  {
    title: 'We recommend\nthe places',
    body: 'Three curated proposals with real stops, honest ₱ cost ranges, and a reason behind every pick.',
  },
  {
    title: 'Never miss\na moment',
    body: 'Gentle reminders 1 hour and 15 minutes before each stop — so you savour it, not rush it.',
  },
];

export default function Onboarding() {
  const { c } = useWayfare();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  const header = (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
      <Pressable onPress={() => replaceTo('/(auth)/register')} hitSlop={8}>
        <Txt variant="body" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '700' }}>
          Skip
        </Txt>
      </Pressable>
    </View>
  );

  return (
    <MapFirst header={header} sheetTop={0.44}>
      <Animated.View key={i} entering={FadeIn.duration(350)}>
        <Txt variant="h1" style={{ fontSize: 32, lineHeight: 37 }}>
          {slide.title}
        </Txt>
        <Txt variant="body" muted style={{ marginTop: Space.m, fontSize: 16, lineHeight: 24 }}>
          {slide.body}
        </Txt>
      </Animated.View>

      <View style={styles.dots}>
        {SLIDES.map((_, k) => (
          <View key={k} style={[styles.dot, { backgroundColor: k === i ? c.a3 : 'rgba(255,255,255,0.22)', width: k === i ? 20 : 6 }]} />
        ))}
      </View>
      <PillButton
        label={last ? 'Create account' : 'Continue'}
        icon="arrow"
        knob
        onPress={() => (last ? replaceTo('/(auth)/register') : setI(i + 1))}
        style={{ marginTop: Space.l }}
      />
    </MapFirst>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Space.l },
  dot: { height: 6, borderRadius: 3 },
});
