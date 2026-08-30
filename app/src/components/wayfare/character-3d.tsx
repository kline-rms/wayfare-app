// Native fallbacks. Real device 3D (three.js via expo-gl) lands with the custom
// dev build; for now Place3D is a tasteful static stand-in and the on-map
// mannequin overlay is web-only (the native map is the SVG preview anyway).
import { StyleSheet, View } from 'react-native';

import { Icon } from './icon';
import { useWayfare } from './theme';

export function Place3D({ size = 220 }: { size?: number }) {
  const { c } = useWayfare();
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.platform,
          { width: size * 0.78, height: size * 0.5, borderRadius: size * 0.16, backgroundColor: c.primary },
        ]}>
        <Icon name="walk" size={size * 0.3} color="#fff" />
      </View>
    </View>
  );
}

export function MannequinCanvas(_props: { size?: number; anim?: string }) {
  return null;
}

export function CityCanvas(_props: { size?: number; anim?: string }) {
  return null;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  platform: { alignItems: 'center', justifyContent: 'center', transform: [{ perspective: 600 }, { rotateX: '52deg' }] },
});
