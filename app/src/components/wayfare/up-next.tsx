// Live "up next" card for the day timeline: the next place with a real
// distance/ETA from the device's location, an in-app Navigate action, and Skip
// (advance to the following stop — the "I'm ahead / running late" control).
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useLocation } from '@/hooks/use-location';
import { isDestination } from '@/lib/activity';
import { formatDistance, formatEta, haversineKm } from '@/lib/geo';
import { go } from '@/lib/nav';
import type { Activity } from '@/lib/types';
import { Icon } from './icon';
import { useWayfare } from './theme';
import { Txt } from './ui';

export function UpNext({ activities, homeBase }: { activities: Activity[]; homeBase?: string }) {
  const { c, cardShadow } = useWayfare();
  const stops = activities.filter((a) => isDestination(a, homeBase));
  const [i, setI] = useState(0);
  const loc = useLocation();

  if (!stops.length) return null;
  const idx = Math.min(i, stops.length - 1);
  const a = stops[idx];
  const isLast = idx >= stops.length - 1;
  const km = loc.coords ? haversineKm(loc.coords, { lat: a.lat!, lng: a.lng! }) : null;

  const etaLine =
    km != null
      ? formatEta(km)
      : loc.status === 'denied'
        ? 'Enable location for live distance'
        : loc.status === 'unavailable'
          ? 'Location unavailable'
          : 'Locating you…';

  const navigate = () =>
    go({ pathname: '/navigate', params: { lat: String(a.lat), lng: String(a.lng), label: a.where } });

  return (
    <View style={[styles.card, { backgroundColor: c.ink }, cardShadow]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={[styles.dot, { backgroundColor: c.a2 }]} />
        <Txt variant="small" style={{ color: c.a2, fontWeight: '800', letterSpacing: 0.6 }}>
          UP NEXT
        </Txt>
        <Txt variant="small" style={{ color: 'rgba(255,255,255,0.55)', marginLeft: 'auto' }}>
          {a.time}
        </Txt>
      </View>

      <Txt style={{ color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 10 }} numberOfLines={1}>
        {a.activity}
      </Txt>
      <Txt variant="sec" style={{ color: 'rgba(255,255,255,0.7)', marginTop: 2 }} numberOfLines={1}>
        {a.where}
      </Txt>

      {/* Distance + ETA from where you are (no more walking figure). */}
      <View style={styles.etaRow}>
        <View style={[styles.etaChip, { backgroundColor: 'rgba(255,255,255,0.10)' }]}>
          <Icon name="locate" size={14} color={c.a2} />
          <Txt style={{ color: '#fff', fontWeight: '800' }}>{km != null ? formatDistance(km) : '—'}</Txt>
        </View>
        <Txt variant="small" style={{ color: 'rgba(255,255,255,0.8)', flex: 1 }} numberOfLines={1}>
          {etaLine}
        </Txt>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={navigate}
          style={({ pressed }) => [styles.navBtn, { backgroundColor: c.a2 }, pressed && { opacity: 0.9 }]}>
          <Icon name="nav" size={16} color="#fff" />
          <Txt style={{ color: '#fff', fontWeight: '800' }}>Navigate</Txt>
        </Pressable>
        {!isLast ? (
          <Pressable onPress={() => setI(idx + 1)} style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}>
            <Icon name="swap" size={15} color="rgba(255,255,255,0.85)" />
            <Txt style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700' }}>Skip</Txt>
          </Pressable>
        ) : (
          <View style={styles.skipBtn}>
            <Txt style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700' }}>Last stop</Txt>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, padding: 18, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  etaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 11, borderRadius: 999 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 999 },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});
