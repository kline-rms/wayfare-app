import { Redirect, Tabs } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/wayfare/icon';
import { useWayfare } from '@/components/wayfare/theme';
import { Gradients } from '@/constants/wayfare';
import { useAuth } from '@/lib/auth';

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

// Circular floating dock (app-ref-1 style): outlined circle buttons, the active
// one filled with the grape gradient. No background bar — the circles float.
function WayfareTabBar({ state, navigation }: TabBarProps) {
  const { ctaShadow } = useWayfare();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 10 }]}>
      {state.routes.map((route, i) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const focused = state.index === i;
        return (
          <Pressable
            key={route.key}
            style={({ pressed }) => pressed && { opacity: 0.85, transform: [{ scale: 0.94 }] }}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}>
            {focused ? (
              <View style={[styles.circleOn, ctaShadow]}>
                <LinearGradient
                  colors={[...Gradients.grape]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Icon name={tab.icon} size={22} color="#fff" />
              </View>
            ) : (
              <View style={[styles.circle, { borderColor: 'rgba(255,255,255,0.5)' }]}>
                <Icon name={tab.icon} size={20} color="#fff" />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthed } = useAuth();
  if (!isAuthed) return <Redirect href="/(auth)/login" />;
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  circleOn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
