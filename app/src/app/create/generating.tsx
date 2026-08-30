import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { MannequinCanvas } from '@/components/wayfare/character-3d';
import { Icon } from '@/components/wayfare/icon';
import { useWayfare } from '@/components/wayfare/theme';
import { PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { api } from '@/lib/api';
import { back, replaceTo } from '@/lib/nav';
import { wizard } from '@/lib/wizard';
import type { GenerateRequest } from '@/lib/types';

const STEPS = ['Reading your must-dos', 'Routing the days', 'Pricing food & travel', 'Balancing 3 proposals'];
const NIGHT = '#17123A';

export default function Generating() {
  const { c } = useWayfare();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();
    (async () => {
      try {
        const result = await api.generate(wizard.get() as GenerateRequest);
        const wait = Math.max(0, 1800 - (Date.now() - started));
        setTimeout(() => {
          if (cancelled) return;
          wizard.setResult(result);
          replaceTo('/create/proposals');
        }, wait);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.root}>
        <Txt variant="h2" style={{ textAlign: 'center', color: '#fff' }}>
          Couldn&apos;t generate
        </Txt>
        <Txt variant="sec" muted style={{ textAlign: 'center', marginTop: 8 }}>
          {error}
        </Txt>
        <View style={{ marginTop: 24, gap: 12, alignSelf: 'stretch', paddingHorizontal: Space.xl }}>
          <PillButton label="Try again" icon="refresh" onPress={() => replaceTo('/create/generating')} />
          <PillButton label="Back" variant="secondary" onPress={back} />
        </View>
      </View>
    );
  }

  const dest = wizard.get().destination ?? 'trip';
  return (
    <View style={styles.root}>
      {/* decorative amber route on the night grid */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 222 478" preserveAspectRatio="xMidYMid slice">
        <Path
          d="M40 420 C 90 330,180 350,130 240 S 60 120,180 60"
          fill="none"
          stroke="#FFA828"
          strokeWidth={4}
          strokeDasharray="2 12"
          strokeLinecap="round"
          opacity={0.7}
        />
      </Svg>

      <View style={{ alignItems: 'center', zIndex: 2 }}>
        <MannequinCanvas size={150} />
        <Txt variant="h1" style={{ textAlign: 'center', color: '#fff', marginTop: 4 }}>
          Routing your{'\n'}
          {dest}
        </Txt>
        <Txt variant="sec" muted style={{ textAlign: 'center', marginTop: 8 }}>
          Balancing 3 proposals…
        </Txt>

        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <Animated.View key={s} entering={FadeInDown.delay(200 + i * 380).duration(400)} style={styles.step}>
              <Icon name="checkC" size={20} color={c.a2} />
              <Txt variant="body" muted>
                {s}
              </Txt>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.xl, backgroundColor: NIGHT },
  steps: { marginTop: 26, gap: 14, alignSelf: 'stretch' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center' },
});
