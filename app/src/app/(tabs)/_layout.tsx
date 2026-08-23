import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/wayfare/icon';
import { useWayfare } from '@/components/wayfare/theme';

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'trips', label: 'Trips', icon: 'compass' },
  { name: 'alerts', label: 'Alerts', icon: 'bell' },
  { name: 'profile', label: 'Profile', icon: 'user' },
];

// Minimal shape of the props expo-router passes to a custom tabBar.
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

function WayfareTabBar({ state, navigation }: TabBarProps) {
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: c.card, borderTopColor: c.line, paddingBottom: insets.bottom + 8 },
      ]}>
      {state.routes.map((route, i) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const focused = state.index === i;
        const color = focused ? c.ink : c.ter;
        return (
          <Pressable
            key={route.key}
            style={styles.item}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}>
            <Icon name={tab.icon} size={24} color={color} />
            <Text style={[styles.label, { color, fontWeight: focused ? '800' : '600' }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <WayfareTabBar {...(props as unknown as TabBarProps)} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="trips" />
      <Tabs.Screen name="alerts" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10.5 },
});
