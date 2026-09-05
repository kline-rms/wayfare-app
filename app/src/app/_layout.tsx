import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useWayfare } from '@/components/wayfare/theme';
import { authStore } from '@/lib/auth';
import { registerForPush } from '@/lib/push';

export default function RootLayout() {
  const { scheme } = useWayfare();
  // Register this device for push once signed in (and on any later sign-in).
  useEffect(() => {
    if (authStore.isAuthed()) registerForPush();
    return authStore.subscribe(() => {
      if (authStore.isAuthed()) registerForPush();
    });
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: scheme === 'dark' ? '#140F33' : '#ECE6FF' },
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" />
          <Stack.Screen name="(auth)/forgot" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="trip/[id]" />
          <Stack.Screen name="proposal/[id]" />
          <Stack.Screen name="day/[id]" />
          <Stack.Screen name="activity/[id]" />
          <Stack.Screen name="place/[name]" />
          <Stack.Screen name="map" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="availability" />
          <Stack.Screen name="reminders" />
          <Stack.Screen name="create/index" />
          <Stack.Screen name="create/basics" />
          <Stack.Screen name="create/vibe" />
          <Stack.Screen name="create/interests" />
          <Stack.Screen name="create/review" />
          <Stack.Screen name="create/generating" />
          <Stack.Screen name="create/proposals" />
          <Stack.Screen name="create/chat" />
          <Stack.Screen name="create/import" />
          <Stack.Screen name="create/customize" />
          <Stack.Screen name="create/recommended" />
          <Stack.Screen name="create/swap" />
          <Stack.Screen name="create/confirm" />
        </Stack>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
