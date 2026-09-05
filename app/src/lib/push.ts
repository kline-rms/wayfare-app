// Client push: request permission, get the device's Expo token, register it with
// the server, and route a tapped notification to the right screen. A real token
// only comes from a custom dev build, so this no-ops gracefully on web / Expo Go.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from './api';
import { go } from './nav';

// Show a banner (and list entry) while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let registered = false;
let responseSub: { remove: () => void } | undefined;

/** Route a tapped notification: to its trip if it carries one, else Alerts. */
function wireTapRouting() {
  if (responseSub) return;
  responseSub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const data = resp.notification.request.content.data as { itineraryId?: string } | undefined;
    if (data?.itineraryId) go({ pathname: '/trip/[id]', params: { id: data.itineraryId } });
    else go('/(tabs)/alerts');
  });
}

/** Register this device for push (idempotent). Native + a real device only. */
export async function registerForPush(): Promise<void> {
  if (registered || Platform.OS === 'web' || !Device.isDevice) return;
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
    if (token) {
      await api.registerPush(token);
      registered = true;
      wireTapRouting();
    }
  } catch {
    /* best-effort — never block app start */
  }
}
