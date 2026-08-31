// A sign-here pad — draw with finger/mouse; emits the strokes as an SVG data URL
// (works on web + native via PanResponder). Used to authorise a reimbursement.
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useWayfare } from './theme';
import { Txt } from './ui';

export function SignaturePad({ onChange, height = 168 }: { onChange: (dataUrl: string) => void; height?: number }) {
  const { c } = useWayfare();
  const [paths, setPaths] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const width = useRef(320);

  // Emit continuously as the pad changes (web mouse-up / native release can be
  // unreliable, so we don't rely on it to produce the signature).
  useEffect(() => {
    const all = current ? [...paths, current] : paths;
    if (!all.length) return onChange('');
    const strokes = all
      .map((d) => `<path d='${d}' fill='none' stroke='%23EDE9FF' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'/>`)
      .join('');
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' width='${Math.round(width.current)}' height='${height}' ` +
      `viewBox='0 0 ${Math.round(width.current)} ${height}'>${strokes}</svg>`;
    onChange(`data:image/svg+xml,${svg}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths, current]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          setCurrent(`M${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
        },
        onPanResponderMove: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          setCurrent((prev) => `${prev} L${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
        },
        onPanResponderRelease: () => {
          setCurrent((cur) => {
            if (cur) setPaths((p) => [...p, cur]);
            return '';
          });
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const clear = () => {
    setPaths([]);
    setCurrent('');
    onChange('');
  };

  return (
    <View>
      <View
        onLayout={(e) => (width.current = e.nativeEvent.layout.width)}
        {...responder.panHandlers}
        style={[styles.pad, { height, borderColor: c.line, backgroundColor: c.card }]}>
        <Svg width="100%" height={height} pointerEvents="none">
          {paths.map((d, i) => (
            <Path key={i} d={d} fill="none" stroke={c.ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {current ? <Path d={current} fill="none" stroke={c.ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" /> : null}
        </Svg>
        {!paths.length && !current ? (
          <View style={styles.hint} pointerEvents="none">
            <Txt variant="small" faint>
              Sign here
            </Txt>
          </View>
        ) : null}
      </View>
      <Pressable onPress={clear} hitSlop={6} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
        <Txt variant="small" style={{ color: c.a3, fontWeight: '700' }}>
          Clear
        </Txt>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { borderRadius: 14, borderWidth: 1.5, overflow: 'hidden' },
  hint: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' } as any,
});
