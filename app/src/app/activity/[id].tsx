import { useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Icon, IconName } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { AITip, Card, Chip, PillButton, StateView, Txt } from '@/components/wayfare/ui';
import { DiningGuide } from '@/components/wayfare/dining-guide';
import { currentActivity, isMeal } from '@/lib/dining';
import type { MapStop } from '@/components/wayfare/wayfare-map.shared';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { useLocation } from '@/hooks/use-location';
import { hasSplitRoles, isDestination, partyOf } from '@/lib/activity';
import { PartyAssign } from '@/components/wayfare/party-assign';
import { useEditsVersion } from '@/lib/edits';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { formatEta, haversineKm } from '@/lib/geo';
import { back, go } from '@/lib/nav';
import { openMaps } from '@/lib/maps';
import type { Activity, Day, Itinerary } from '@/lib/types';

async function loadActivity(
  itineraryId: string,
  dayId: string,
  activityId: string,
): Promise<{ it: Itinerary; day: Day; activity: Activity }> {
  const it = await api.getItinerary(itineraryId);
  for (const p of it.proposals) {
    const day = p.days.find((d) => d.id === dayId);
    const activity = day?.activities?.find((a) => a.id === activityId);
    if (day && activity) return { it, day, activity };
  }
  throw new Error('Activity not found');
}

function catStyle(category: string | undefined, c: ReturnType<typeof useWayfare>['c']): { color: string; icon: IconName } {
  const k = (category ?? '').toLowerCase();
  if (/(meal|grocery)/.test(k)) return { color: c.a1, icon: 'food' };
  if (/(travel|airport|transition|prep)/.test(k)) return { color: c.a3, icon: 'car' };
  if (/(rest|sleep|nap)/.test(k)) return { color: c.a4, icon: 'moon' };
  if (/(museum|attraction)/.test(k)) return { color: c.a3, icon: 'temple' };
  if (/(walk|park)/.test(k)) return { color: c.a2, icon: 'walk' };
  return { color: c.a2, icon: 'users' };
}

export default function ActivityDetail() {
  const { id, it: itId, day: dayId } = useLocalSearchParams<{ id: string; it: string; day: string }>();
  const { c } = useWayfare();
  const editsVersion = useEditsVersion();
  const { data, loading, error, reload } = useAsync(() => loadActivity(itId, dayId, id), [id, itId, dayId, editsVersion]);
  const loc = useLocation();
  if (loading || error || !data) return <StateView loading={loading} error={error} onRetry={reload} />;

  const { it, day, activity: a } = data;
  const cat = catStyle(a.category, c);
  const hasCoords = a.lat != null && a.lng != null;
  const goes = isDestination(a, it.homeBase);
  const km = loc.coords && goes ? haversineKm(loc.coords, { lat: a.lat!, lng: a.lng! }) : null;
  const stops: MapStop[] = hasCoords ? [{ lat: a.lat!, lng: a.lng!, label: a.where, you: goes }] : [];

  const openInMaps = () => {
    if (hasCoords) openMaps(a.lat!, a.lng!, a.where);
    else if (a.mapsUrl) Linking.openURL(a.mapsUrl);
    else Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.where)}`);
  };

  const header = (
    <View>
      <Pressable onPress={back}>
        <MapIconButton>
          <Icon name="back" size={22} color="#fff" />
        </MapIconButton>
      </Pressable>
      <Txt style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 11, letterSpacing: 0.8, marginTop: 12 }}>
        {`${day.dateLabel.toUpperCase()} · ${a.time}`}
      </Txt>
      <Txt variant="h1" style={{ color: '#fff', marginTop: 2 }} numberOfLines={2}>
        {a.activity}
      </Txt>
    </View>
  );

  return (
    <MapFirst stops={stops} character={goes && hasCoords} fit={false} sheetTop={0.42} header={header}>
      <View style={styles.whereRow}>
        <View style={[styles.catDot, { backgroundColor: cat.color }]}>
          <Icon name={cat.icon} size={14} color="#fff" />
        </View>
        <Txt variant="sec" muted style={{ flex: 1 }}>
          {a.where}
          {a.category ? ` · ${a.category}` : ''}
        </Txt>
      </View>

      {goes ? (
        <>
          {km != null ? (
            <View style={[styles.distance, { backgroundColor: c.fieldBg }]}>
              <Icon name="locate" size={15} color={c.a2} />
              <Txt variant="small" style={{ fontWeight: '700' }}>
                {formatEta(km)}
              </Txt>
            </View>
          ) : null}
          <View style={{ marginTop: Space.m, gap: Space.s }}>
            <PillButton
              label="Navigate here"
              icon="nav"
              onPress={() => go({ pathname: '/navigate', params: { lat: String(a.lat), lng: String(a.lng), label: a.where } })}
            />
            <PillButton label="Open in Google Maps" icon="share" variant="secondary" onPress={openInMaps} />
          </View>
        </>
      ) : (
        <View style={[styles.stayCard, { backgroundColor: c.fieldBg }]}>
          <Icon name="home" size={17} color={c.sec} />
          <Txt variant="sec" muted style={{ flex: 1 }}>
            Stay-put block — no travel needed.
          </Txt>
        </View>
      )}

      {a.reasoning ? (
        <View style={{ marginTop: Space.l }}>
          <AITip>{a.reasoning}</AITip>
        </View>
      ) : null}

      <View style={styles.grid}>
        {a.participants ? <Fact icon="users" label="Who" value={a.participants} /> : null}
        {a.cost != null ? <Fact icon="peso" label="Est. cost" value={a.cost ? money(a.cost, it.currency) : 'Free'} /> : null}
        {a.restNap ? <Fact icon="moon" label="Rest / nap" value={a.restNap} /> : null}
        {a.category ? <Fact icon={cat.icon} label="Category" value={a.category} /> : null}
      </View>

      {/* Split-party: assign who's on this stop (needs a party — the Companions roster). */}
      {partyOf(it).length ? (
        <PartyAssign itineraryId={it.id} activity={a} party={partyOf(it)} />
      ) : (
        <Pressable
          onPress={() => go({ pathname: '/companions', params: { it: it.id } })}
          style={[styles.addParty, { borderColor: c.line }]}>
          <Icon name="users" size={16} color={c.sec} />
          <Txt variant="small" style={{ color: c.sec, fontWeight: '700' }}>
            Add travelers to assign who&apos;s on each stop
          </Txt>
        </Pressable>
      )}

      {hasSplitRoles(a) ? (
        <Card style={{ marginTop: Space.m, gap: 8 }}>
          <Txt variant="small" faint>
            WHO&apos;S DOING WHAT
          </Txt>
          {a.momStatus ? (
            <Txt variant="body">
              <Txt style={{ color: c.a4, fontWeight: '800' }}>Mom  </Txt>
              {a.momStatus}
            </Txt>
          ) : null}
          {a.dadStatus ? (
            <Txt variant="body">
              <Txt style={{ color: c.a3, fontWeight: '800' }}>Dad  </Txt>
              {a.dadStatus}
            </Txt>
          ) : null}
        </Card>
      ) : null}

      {isMeal(a) ? (
        <View style={{ marginTop: Space.m }}>
          <DiningGuide activity={a} partySize={it.partySize} now={currentActivity(day)?.id === a.id} />
        </View>
      ) : null}
    </MapFirst>
  );
}

function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const { c, cardShadow } = useWayfare();
  return (
    <View style={[styles.fact, { backgroundColor: c.card }, cardShadow]}>
      <Icon name={icon} size={18} color={c.ink} />
      <View style={{ flex: 1 }}>
        <Txt variant="small" faint>
          {label}
        </Txt>
        <Txt style={{ fontWeight: '700', marginTop: 1 }} numberOfLines={2}>
          {value}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  whereRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  distance: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', marginTop: Space.m, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  stayCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: Space.l, padding: 15, borderRadius: 18 },
  dishRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dishNum: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  catDot: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.m, marginTop: Space.l },
  addParty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 13, marginTop: Space.m },
  fact: { width: '47%', flexGrow: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
});
