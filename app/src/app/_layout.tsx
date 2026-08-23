import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useWayfare } from '@/components/wayfare/theme';

export default function RootLayout() {
  const { scheme } = useWayfare();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: scheme === 'dark' ? '#141110' : '#ECEBE8' },
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
          <Stack.Screen name="place/[name]" />
          <Stack.Screen name="map" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="availability" />
          <Stack.Screen name="create/index" />
          <Stack.Screen name="create/basics" />
          <Stack.Screen name="create/vibe" />
          <Stack.Screen name="create/interests" />
          <Stack.Screen name="create/review" />
          <Stack.Screen name="create/generating" />
        </Stack>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
