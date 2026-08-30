// Native fallback for the 3D globe (three.js runs on web for now; native 3D via
// expo-gl comes when we build the mobile targets). A tasteful static stand-in.
import { StyleSheet, View } from 'react-native';

import { Icon } from './icon';
import { useWayfare } from './theme';

export function Globe3D({ size = 220 }: { size?: number }) {
  const { c } = useWayfare();
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.orb, { width: size * 0.8, height: size * 0.8, borderRadius: size * 0.4, backgroundColor: c.card, borderColor: c.line }]}>
        <Icon name="globe" size={size * 0.42} color={c.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  orb: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
