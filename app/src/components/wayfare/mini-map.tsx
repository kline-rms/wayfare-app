// Native: a stylized map preview that opens the real map app on tap.
// (react-native-maps isn't installed; this keeps it dependency-free.)
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from './icon';
import { useWayfare } from './theme';
import { Txt } from './ui';

export function MiniMap({ q, height = 190 }: { q: string; height?: number }) {
  const { c, cardShadow } = useWayfare();
  const open = () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);
  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [{ height, borderRadius: 18, overflow: 'hidden', backgroundColor: c.fieldBg }, cardShadow, pressed && { opacity: 0.9 }]}>
      <View style={styles.pin}>
        <Icon name="pin" size={34} color={c.primary} />
      </View>
      <View style={[styles.badge, { backgroundColor: c.card }, cardShadow]}>
        <Icon name="nav" size={14} color={c.ink} />
        <Txt variant="small" style={{ fontWeight: '800' }}>
          Open map
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pin: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },
});
