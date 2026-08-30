// Local reminders for a day's activities. Uses expo-notifications (SDK 57 API).
// Notifications fire on the native app (iOS/Android); web can't schedule OS
// alarms, so scheduling is a no-op there and the UI says so.
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { Day } from './types';

// Show a banner even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const supportsReminders = Platform.OS !== 'web';

// ---- editable lead-time offsets (minutes before each activity) ----
export const OFFSET_PRESETS = [60, 15, 5] as const;
let offsets = new Set<number>([60, 15]); // default: 1 hour + 15 min
let version = 0;
const listeners = new Set<() => void>();
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

export const reminderOffsets = {
  has: (m: number) => offsets.has(m),
  list: () => [...offsets].sort((a, b) => b - a),
  toggle: (m: number) => {
    offsets.has(m) ? offsets.delete(m) : offsets.add(m);
    emit();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useReminderVersion(): number {
  return useSyncExternalStore(reminderOffsets.subscribe, () => version, () => version);
}

export function labelFor(m: number): string {
  return m >= 60 ? `${m / 60} hour${m === 60 ? '' : 's'} before` : `${m} min before`;
}

// ---- time parsing ----
/** Parse an activity's start ("8:00–9:00 AM", "6:25 PM", "10:00 PM onward") to a Date on `dateISO`. */
export function parseStart(dateISO: string, time: string): Date | null {
  const mer = (time.match(/(AM|PM)/i)?.[1] ?? '').toUpperCase();
  const startTok = time.split('–')[0];
  const hm = startTok.match(/(\d{1,2})(?::(\d{2}))?/);
  if (!hm) return null;
  let h = Number(hm[1]);
  const min = hm[2] ? Number(hm[2]) : 0;
  if (mer === 'PM' && h < 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  const d = new Date(`${dateISO}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(h, min, 0, 0);
  return d;
}

export async function ensurePermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return status === 'granted';
}

/** Schedule reminders for every activity in a day, at each enabled offset.
 * Returns the number of notifications scheduled. */
export async function scheduleDayReminders(day: Day): Promise<number> {
  if (!supportsReminders) return 0;
  if (!(await ensurePermission())) throw new Error('Notifications permission was denied.');

  const offsetsList = reminderOffsets.list();
  let scheduled = 0;
  for (const a of day.activities ?? []) {
    const start = parseStart(day.date, a.time);
    if (!start) continue;
    for (const off of offsetsList) {
      const when = new Date(start.getTime() - off * 60_000);
      if (when.getTime() <= Date.now()) continue; // don't schedule in the past
      await Notifications.scheduleNotificationAsync({
        content: { title: `${a.activity} — in ${labelFor(off).replace(' before', '')}`, body: `${a.time} · ${a.where}` },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
      });
      scheduled++;
    }
  }
  return scheduled;
}

export async function cancelAllReminders(): Promise<void> {
  if (!supportsReminders) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
