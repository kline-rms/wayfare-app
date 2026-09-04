// In-app turn-by-turn navigation. Routes from your live GPS position to the
// destination on our own map — no bounce to Google Maps. Default camera is the
// flat top-down view; a 2D/3D toggle tilts into building view. Routing is OSRM
// (keyless, $0); "Open in Google Maps" stays as a one-tap fallback.
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { StateView, Txt } from '@/components/wayfare/ui';
import type { MapStop } from '@/components/wayfare/wayfare-map.shared';
import { Space } from '@/constants/wayfare';
import { useLocation } from '@/hooks/use-location';
import type { LatLng } from '@/lib/geo';
import { openMaps } from '@/lib/maps';
import { back } from '@/lib/nav';
import { directions, type Directions, type NavStep, type TravelProfile } from '@/lib/route';

function fmtM(m: number): string {
  if (m < 950) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(m < 9500 ? 1 : 0)} km`;
}
function fmtMin(s: number): string {
  const min = Math.max(1, Math.round(s / 60));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

// Maneuver type -> step icon (reuses the existing icon set).
function stepIcon(step: NavStep): IconName {
  const m = step.modifier ?? '';
  if (step.type === 'arrive') return 'pin';
  if (step.type === 'depart') return 'nav';
  if (step.type === 'roundabout' || step.type === 'rotary') return 'refresh';
  if (m.includes('left')) return 'arrow';
  if (m.includes('right')) return 'arrow';
  return 'arrow';
}
function iconRotation(step: NavStep): string {
  const m = step.modifier ?? '';
  if (step.type === 'arrive') return '0deg';
  if (m.includes('sharp left')) return '-135deg';
  if (m.includes('slight left')) return '-45deg';
  if (m.includes('left')) return '-90deg';
  if (m.includes('sharp right')) return '135deg';
  if (m.includes('slight right')) return '45deg';
  if (m.includes('right')) return '90deg';
  return '0deg'; // straight / depart points up
}

const MODES: { key: TravelProfile; label: string; icon: IconName }[] = [
  { key: 'driving', label: 'Drive', icon: 'car' },
  { key: 'walking', label: 'Walk', icon: 'walk' },
];

export default function Navigate() {
  const { lat, lng, label } = useLocalSearchParams<{ lat: string; lng: string; label?: string }>();
  const { c, cardShadow } = useWayfare();
  const loc = useLocation();

  const dest = useMemo<LatLng | null>(() => {
    const dlat = Number(lat);
    const dlng = Number(lng);
    return Number.isFinite(dlat) && Number.isFinite(dlng) ? { lat: dlat, lng: dlng } : null;
  }, [lat, lng]);

  // Origin is frozen from the GPS fix at route time (and on Recenter), so a live
  // position update doesn't churn the route; Recenter re-reads the latest fix.
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [profile, setProfile] = useState<TravelProfile>('driving');
  const [dir, setDir] = useState<Directions | null>(null);
  const [routing, setRouting] = useState(false);
  const [routeErr, setRouteErr] = useState<string | null>(null);
  const [tilted, setTilted] = useState(false); // false = top-down (default)
  const [focusYou, setFocusYou] = useState(false);

  // Seed origin from the first GPS fix.
  useEffect(() => {
    if (!origin && loc.coords) setOrigin(loc.coords);
  }, [loc.coords, origin]);

  // (Re)route whenever we have both ends or the travel mode changes.
  useEffect(() => {
    if (!origin || !dest) return;
    let alive = true;
    setRouting(true);
    setRouteErr(null);
    directions(origin, dest, profile)
      .then((d) => alive && setDir(d))
      .catch((e) => alive && setRouteErr(e?.message ?? 'Could not compute a route'))
      .finally(() => alive && setRouting(false));
    return () => {
      alive = false;
    };
  }, [origin, dest, profile]);

  const recenter = () => {
    if (loc.coords) setOrigin(loc.coords); // re-route from the latest fix
    setFocusYou(true);
  };

  if (!dest) return <StateView loading={false} error="No destination was provided for navigation." onRetry={back} />;
  if (loc.status === 'denied')
    return <StateView loading={false} error="Location permission is off. Enable it to navigate from where you are." onRetry={back} />;
  if (!origin) return <StateView loading error={null} />;

  const stops: MapStop[] = [
    { lat: origin.lat, lng: origin.lng, label: 'You', you: true },
    { lat: dest.lat, lng: dest.lng, label: label ?? 'Destination', sub: dir ? `${fmtM(dir.distanceM)} · ${fmtMin(dir.durationS)}` : undefined, color: '#7C5CF6' },
  ];

  const header = (
    <View style={{ gap: Space.s }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Pressable onPress={back}>
          <MapIconButton>
            <Icon name="close" size={20} color="#fff" />
          </MapIconButton>
        </Pressable>
        {/* ETA / distance pill */}
        <View style={[styles.etaPill, { backgroundColor: c.card }, cardShadow]}>
          {routing && !dir ? (
            <ActivityIndicator size="small" color={c.primary} />
          ) : (
            <>
              <Txt style={{ fontWeight: '900', fontSize: 16 }}>{dir ? fmtMin(dir.durationS) : '—'}</Txt>
              <Txt variant="small" muted>
                {dir ? fmtM(dir.distanceM) : ''}
                {dir?.approximate ? ' · approx' : ''}
              </Txt>
            </>
          )}
        </View>
        <View style={{ gap: 8 }}>
          <Pressable onPress={() => setTilted((t) => !t)}>
            <MapIconButton>
              <Txt style={{ color: '#fff', fontWeight: '900', fontSize: 12.5 }}>{tilted ? '2D' : '3D'}</Txt>
            </MapIconButton>
          </Pressable>
          <Pressable onPress={recenter}>
            <MapIconButton>
              <Icon name="locate" size={18} color="#fff" />
            </MapIconButton>
          </Pressable>
        </View>
      </View>
    </View>
  );

  const nextStep = dir?.steps[0];

  return (
    <MapFirst
      stops={stops}
      route={dir?.geometry}
      pitch={tilted ? 55 : 0}
      fit={!focusYou}
      focus={focusYou ? { lng: origin.lng, lat: origin.lat, zoom: 16.5 } : null}
      sheetTop={0.46}
      header={header}>
      {/* Destination + next maneuver */}
      <Txt variant="small" faint>
        NAVIGATING TO
      </Txt>
      <Txt variant="h1" style={{ fontSize: 22, marginTop: 2 }} numberOfLines={2}>
        {label ?? 'Destination'}
      </Txt>

      {nextStep ? (
        <View style={[styles.nextCard, { backgroundColor: c.primary }]}>
          <View style={styles.nextIcon}>
            <Icon name={stepIcon(nextStep)} size={26} color="#fff" style={{ transform: [{ rotate: iconRotation(nextStep) }] }} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{nextStep.instruction}</Txt>
            {nextStep.distanceM > 0 ? (
              <Txt variant="small" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                in {fmtM(nextStep.distanceM)}
              </Txt>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Travel mode */}
      <View style={[styles.modeRow, { backgroundColor: c.fieldBg }]}>
        {MODES.map((m) => {
          const on = profile === m.key;
          return (
            <Pressable key={m.key} onPress={() => setProfile(m.key)} style={[styles.modeBtn, on && { backgroundColor: c.card, ...cardShadow }]}>
              <Icon name={m.icon} size={16} color={on ? c.ink : c.sec} />
              <Txt variant="small" style={{ fontWeight: '800', color: on ? c.ink : c.sec }}>
                {m.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      {dir?.approximate ? (
        <Txt variant="small" faint style={{ marginTop: Space.s }}>
          Direct-line estimate — the {profile} network wasn't available for full turn-by-turn.
        </Txt>
      ) : null}

      {/* Turn-by-turn list */}
      <Txt variant="title" style={{ marginTop: Space.l, marginBottom: Space.s }}>
        Steps
      </Txt>
      {routeErr ? (
        <Txt variant="small" muted>
          {routeErr}
        </Txt>
      ) : dir ? (
        <View style={{ gap: 2 }}>
          {dir.steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: c.fieldBg }]}>
                <Icon name={stepIcon(s)} size={16} color={c.primary} style={{ transform: [{ rotate: iconRotation(s) }] }} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontWeight: '600' }}>{s.instruction}</Txt>
                {s.distanceM > 0 ? (
                  <Txt variant="small" faint style={{ marginTop: 1 }}>
                    {fmtM(s.distanceM)}
                  </Txt>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ActivityIndicator color={c.primary} style={{ alignSelf: 'flex-start' }} />
      )}

      {/* Fallback to the platform maps app */}
      <Pressable
        onPress={() => openMaps(dest.lat, dest.lng, label)}
        style={[styles.gmaps, { borderColor: c.line }]}>
        <Icon name="share" size={16} color={c.sec} />
        <Txt variant="small" style={{ color: c.sec, fontWeight: '700' }}>
          Open in Google Maps instead
        </Txt>
      </Pressable>
    </MapFirst>
  );
}

const styles = StyleSheet.create({
  etaPill: { minWidth: 92, alignItems: 'center', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 14 },
  nextCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 16, marginTop: Space.l },
  nextIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  modeRow: { flexDirection: 'row', gap: 6, borderRadius: 16, padding: 5, marginTop: Space.l },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11, borderRadius: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  stepDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  gmaps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: Space.l,
  },
});
