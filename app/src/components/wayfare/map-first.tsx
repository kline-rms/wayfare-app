// Map-first scaffold — the shared layout for every screen: a full-bleed map
// backdrop (dark, cinematic), an optional floating header over it, and a rounded
// sheet that holds the screen's content (existing UI kit renders inside it).
// Screens pass their stops (for the route + pins) or none (a default Manila view).
//
// When `collapsible` is set the sheet has two snap states: tapping the map
// maximises it (list slides down), tapping the grab handle brings the list back.
import { ReactNode, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import WayfareMap from './wayfare-map';
import { useWayfare } from './theme';
import type { LineGeometry, MapStop } from './wayfare-map.shared';

export function MapFirst({
  stops = [],
  route,
  character = false,
  header,
  children,
  sheetTop = 0.46,
  pitch = 52,
  interactiveMap = false,
  dockGap = false,
  fit,
  focus,
  youHeading,
  collapsible = false,
  collapsedTop = 0.86,
  expanded: expandedProp,
  onExpandedChange,
}: {
  stops?: MapStop[];
  route?: LineGeometry;
  character?: boolean;
  header?: ReactNode;
  children: ReactNode;
  /** Fraction of the screen the map fills before the sheet starts (0–1). */
  sheetTop?: number;
  pitch?: number;
  /** Live heading (deg) for the "you" puck pointer; passthrough to the map. */
  youHeading?: number | null;
  interactiveMap?: boolean;
  /** Add bottom room for the circular tab dock (tab screens). */
  dockGap?: boolean;
  /** Override auto-fit (defaults to true when there are 2+ stops). */
  fit?: boolean;
  /** Fly the map to a selected point (day / block) instead of fitting all pins. */
  focus?: { lng: number; lat: number; zoom?: number; bearing?: number; offset?: [number, number] } | null;
  /** Let the sheet collapse (tap map to maximise, tap handle to restore). */
  collapsible?: boolean;
  /** Sheet position when collapsed (0–1). */
  collapsedTop?: number;
  /** Controlled expanded state (omit for internal state). */
  expanded?: boolean;
  onExpandedChange?: (v: boolean) => void;
}) {
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();

  const topExpanded = winH * sheetTop;
  const topCollapsed = winH * collapsedTop;
  const [uncontrolled, setUncontrolled] = useState(true);
  const expanded = expandedProp ?? uncontrolled;
  const setExpanded = (v: boolean) => {
    onExpandedChange?.(v);
    if (expandedProp === undefined) setUncontrolled(v);
  };

  const top = useSharedValue(topExpanded);
  useEffect(() => {
    top.value = withTiming(collapsible && !expanded ? topCollapsed : topExpanded, { duration: 320 });
  }, [expanded, topExpanded, topCollapsed, collapsible, top]);
  const sheetAnim = useAnimatedStyle(() => ({ top: top.value }));

  // Keep pins clear of the sheet while it's up.
  const fitPadding = {
    top: insets.top + 72,
    bottom: Math.min(winH * (1 - sheetTop) + 24, winH * 0.5),
    left: 44,
    right: 44,
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#17123A' }}>
      {/* map backdrop */}
      <View style={StyleSheet.absoluteFill}>
        <WayfareMap
          stops={stops}
          routeGeometry={route}
          character={character}
          interactive
          fit={fit ?? stops.length > 1}
          fitPadding={fitPadding}
          focus={focus}
          pitch={pitch}
          youHeading={youHeading}
          style={{ flex: 1, borderRadius: 0 }}
        />
      </View>

      {/* top scrim for header legibility */}
      <LinearGradient
        colors={['rgba(23,18,58,0.6)', 'rgba(23,18,58,0.0)']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 180 }}
        pointerEvents="none"
      />
      {/* floating header */}
      {header ? (
        <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, zIndex: 5 }}>{header}</View>
      ) : null}

      {/* content sheet */}
      <Animated.View style={[styles.sheet, { backgroundColor: c.bg }, sheetAnim]}>
        <Pressable
          onPress={collapsible ? () => setExpanded(!expanded) : undefined}
          hitSlop={16}
          style={{ paddingVertical: 8, alignItems: 'center' }}>
          <View style={styles.grab} />
        </Pressable>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + (dockGap ? 96 : 28) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/** A round glass control for the floating header (back, bell, etc.) over the map. */
export function MapIconButton({ children }: { children: ReactNode }) {
  return <View style={styles.glassBtn}>{children}</View>;
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -8 },
    elevation: 12,
  },
  grab: { width: 42, height: 5, borderRadius: 3, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.3)' },
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(36,28,86,0.85)',
  },
});
