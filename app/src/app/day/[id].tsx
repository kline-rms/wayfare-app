import { useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon, IconName } from '@/components/wayfare/icon';
import { useWayfare } from '@/components/wayfare/theme';
import { AITip, Card, Chip, PillButton, StateView, Txt } from '@/components/wayfare/ui';
import { UpNext } from '@/components/wayfare/up-next';
import { DiningGuide } from '@/components/wayfare/dining-guide';
import { currentActivity, isMeal } from '@/lib/dining';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import type { LineGeometry, MapStop } from '@/components/wayfare/wayfare-map.shared';
import { walkRoute } from '@/lib/route';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { img, photoForPlace } from '@/lib/images';
import { back, go } from '@/lib/nav';
import { edits, useEditsVersion } from '@/lib/edits';
import { hasSplitRoles } from '@/lib/activity';
import { openMaps } from '@/lib/maps';
import { scheduleDayReminders, supportsReminders } from '@/lib/reminders';
import type { Activity, Day, Itinerary, Place } from '@/lib/types';

// Search every itinerary/proposal for the day id (family day ids live in the
// 2nd itinerary, so a list[0]-only lookup would miss them).
async function loadDay(dayId: string): Promise<{ it: Itinerary; day: Day }> {
  const list = await api.listItineraries();
  if (!list.length) throw new Error('No itineraries');
  for (const summary of list) {
    const it = await api.getItinerary(summary.id);
    for (const p of it.proposals) {
      const day = p.days.find((d) => d.id === dayId);
      if (day) return { it, day };
    }
  }
  throw new Error('Day not found');
}

// Category → colour accent + icon for the block timeline.
function catStyle(category: string | undefined, c: ReturnType<typeof useWayfare>['c']): { color: string; icon: IconName } {
  const k = (category ?? '').toLowerCase();
  if (/(meal|grocery)/.test(k)) return { color: c.a1, icon: 'food' };
  if (/(travel|airport|transition|prep)/.test(k)) return { color: c.a3, icon: 'car' };
  if (/(rest|sleep|nap)/.test(k)) return { color: c.a4, icon: 'moon' };
  if (/(museum|attraction)/.test(k)) return { color: c.a3, icon: 'temple' };
  if (/(walk|park)/.test(k)) return { color: c.a2, icon: 'walk' };
  return { color: c.a2, icon: 'users' };
}

const PIN = ['#FFA828', '#7C5CF6', '#2FD98A']; // marigold / grape / mint, cycled

type Focus = { lng: number; lat: number; zoom?: number } | null;

// Where the map should point for a schedule block (its own coords → matched
// place → the day's anchor).
function blockFocus(it: Itinerary, day: Day, a: Activity): Focus {
  if (Number.isFinite(a.lat) && Number.isFinite(a.lng) && !(a.lat === 0 && a.lng === 0)) {
    return { lng: a.lng as number, lat: a.lat as number, zoom: 16 };
  }
  const where = (a.where ?? '').toLowerCase();
  const pl = it.places.find(
    (p) => where.includes(p.name.toLowerCase().split(' ')[0]) || where.includes(p.area.split(',')[0].trim().toLowerCase()),
  );
  if (pl && Number.isFinite(pl.lat)) return { lng: pl.lng, lat: pl.lat, zoom: 16 };
  if (day.location && Number.isFinite(day.location.lat)) return { lng: day.location.lng, lat: day.location.lat, zoom: 15.5 };
  return null;
}

function placesFor(it: Itinerary, day: Day): Place[] {
  const hay = `${day.destination} ${day.detailedPlan} ${day.location?.mapAnchor ?? ''}`.toLowerCase();
  const matches = it.places.filter((pl) => {
    const key = pl.area.split(',')[0].trim().toLowerCase();
    return hay.includes(key) || hay.includes(pl.name.toLowerCase().split(' ')[0]);
  });
  return (matches.length ? matches : it.places).slice(0, 3);
}

export default function DayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, cardShadow } = useWayfare();
  const [remindMsg, setRemindMsg] = useState<string | null>(null);
  const editsVersion = useEditsVersion();
  const { data, loading, error, reload } = useAsync(() => loadDay(id), [id, editsVersion]);
  const [route, setRoute] = useState<LineGeometry | undefined>();
  const [focus, setFocus] = useState<Focus>(null);
  const [expanded, setExpanded] = useState(true);
  const [schedView, setSchedView] = useState<'list' | 'swipe'>('list');
  const [activeBlock, setActiveBlock] = useState<number | null>(null);
  const mapStops = useMemo<MapStop[]>(() => {
    if (!data) return [];
    const base = placesFor(data.it, data.day)
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0))
      .map((p, i) => ({ lat: p.lat, lng: p.lng, label: p.name, sub: p.area, color: PIN[i % 3], you: i === 0 }));
    // user-added stops get a coral pin so they stand out
    const added = (data.day.activities ?? [])
      .filter((a) => a.added && Number.isFinite(a.lat) && Number.isFinite(a.lng) && !(a.lat === 0 && a.lng === 0))
      .map((a) => ({ lat: a.lat as number, lng: a.lng as number, label: a.activity, sub: a.where, color: '#FF4667' }));
    return [...base, ...added];
  }, [data]);

  useEffect(() => {
    let alive = true;
    if (mapStops.length > 1) walkRoute(mapStops).then((r) => alive && setRoute(r));
    else setRoute(undefined);
    return () => {
      alive = false;
    };
  }, [mapStops]);
  if (loading || error || !data) return <StateView loading={loading} error={error} onRetry={reload} />;

  const { it, day } = data;
  const places = placesFor(it, day);

  // Dining guide: every meal block, with the one happening NOW surfaced first.
  const nowAct = currentActivity(day);
  const nowMeal = nowAct && isMeal(nowAct) ? nowAct : null;
  const mealBlocks = (day.activities ?? []).filter(isMeal);
  const orderedMeals = nowMeal ? [nowMeal, ...mealBlocks.filter((m) => m.id !== nowMeal.id)] : mealBlocks;

  // Add-a-stop (insert only) + remove (user-added blocks only).
  const region = [day.destination, 'Philippines'].filter(Boolean).join(', ');
  const goAddStop = () =>
    go({
      pathname: '/add-stop',
      params: {
        it: it.id,
        day: day.id,
        label: day.dateLabel,
        dest: region,
        times: (day.activities ?? []).map((a) => a.time).filter(Boolean).join('|'),
      },
    });
  const removeStop = async (activityId: string) => {
    try {
      await api.removeActivity(it.id, activityId);
      edits.markStale(); // reactive bump → the day refetches
    } catch (e) {
      setRemindMsg((e as Error).message);
    }
  };

  // In-app "navigate": maximise the map and fit the A→B route across the day.
  const navigate = () => {
    setFocus(null);
    setActiveBlock(null);
    setExpanded(false);
  };

  const selectBlock = (i: number, a: Activity) => {
    if (activeBlock === i) {
      go({ pathname: '/activity/[id]', params: { id: a.id, it: it.id, day: day.id } });
      return;
    }
    setActiveBlock(i);
    setFocus(blockFocus(it, day, a));
  };

  const remindForDay = async () => {
    try {
      const n = await scheduleDayReminders(day);
      setRemindMsg(
        supportsReminders
          ? n
            ? `Set ${n} reminder${n === 1 ? '' : 's'} for this day.`
            : 'No upcoming blocks to remind about.'
          : 'Reminders ring on the Wayfare mobile app.',
      );
    } catch (e) {
      setRemindMsg((e as Error).message);
    }
  };

  const header = (
    <View>
      <Pressable onPress={back}>
        <MapIconButton>
          <Icon name="back" size={22} color="#fff" />
        </MapIconButton>
      </Pressable>
      <Txt style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 11, letterSpacing: 0.8, marginTop: 12 }}>
        {day.dateLabel.toUpperCase()}
      </Txt>
      <Txt variant="h1" style={{ color: '#fff', marginTop: 2 }} numberOfLines={2}>
        {day.theme}
      </Txt>
    </View>
  );

  return (
    <MapFirst
      stops={mapStops}
      route={route}
      character
      sheetTop={0.4}
      header={header}
      collapsible
      expanded={expanded}
      onExpandedChange={setExpanded}
      focus={focus}>

      <View style={styles.timeChip}>
        <Icon name="clock" size={14} color={c.sec} />
        <Txt variant="small" muted>
          {day.timeWindow}
        </Txt>
      </View>

        {/* live: next stop + distance/ETA from where you are */}
        {day.activities?.length ? (
          <View style={{ marginTop: Space.l }}>
            <UpNext activities={day.activities} homeBase={it.homeBase} />
          </View>
        ) : null}

        {/* dining guide — auto-surfaces the current meal (no check-in) */}
        {orderedMeals.length ? (
          <View style={{ marginTop: Space.l }}>
            <Txt variant="title" style={{ marginBottom: Space.s }}>
              Dining guide · {orderedMeals.length}
            </Txt>
            <View style={{ gap: Space.m }}>
              {orderedMeals.map((a) => (
                <DiningGuide key={a.id} activity={a} partySize={it.partySize} now={a.id === nowMeal?.id} />
              ))}
            </View>
          </View>
        ) : null}

        {/* route */}
        <Card style={{ marginTop: Space.l, flexDirection: 'row', alignItems: 'center', gap: Space.m }}>
          <View style={{ flex: 1 }}>
            <Txt variant="small" faint>
              FROM
            </Txt>
            <Txt style={{ fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
              {day.comingFrom}
            </Txt>
          </View>
          <Icon name="arrow" size={18} color={c.ter} />
          <View style={{ flex: 1 }}>
            <Txt variant="small" faint>
              TO
            </Txt>
            <Txt style={{ fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
              {day.destination}
            </Txt>
          </View>
        </Card>

        {/* the plan */}
        <Card style={{ marginTop: Space.m }}>
          <Txt variant="body" style={{ lineHeight: 22 }}>
            {day.detailedPlan}
          </Txt>
        </Card>

        {/* travel + cost */}
        <View style={{ flexDirection: 'row', gap: Space.m, marginTop: Space.m }}>
          <InfoCard icon="car" label="Travel" value={day.travelMode} />
          <InfoCard icon="peso" label="Travel cost" value={day.cost.travel ? money(day.cost.travel) : 'Free'} />
        </View>
        <View style={{ flexDirection: 'row', gap: Space.m, marginTop: Space.m }}>
          <InfoCard
            icon="food"
            label={`Food (${it.partySize} pax)`}
            value={
              day.cost.foodLow === day.cost.foodHigh
                ? money(day.cost.foodLow)
                : `${money(day.cost.foodLow)}–${money(day.cost.foodHigh).replace('₱', '')}`
            }
          />
          <InfoCard icon="pin" label="Anchor" value={day.location?.mapAnchor ?? day.destination} />
        </View>

        {day.notes ? (
          <View style={{ marginTop: Space.m }}>
            <AITip>{day.notes}</AITip>
          </View>
        ) : null}

        {/* block-level schedule (family / detailed itineraries) */}
        {day.activities?.length ? (
          <>
            <View style={styles.sectionHead}>
              <Txt variant="title">Schedule · {day.activities.length} blocks</Txt>
              <View style={[styles.toggle, { backgroundColor: c.fieldBg }]}>
                <Pressable
                  onPress={() => setSchedView('list')}
                  style={[styles.toggleBtn, schedView === 'list' && { backgroundColor: c.card, ...cardShadow }]}>
                  <Txt variant="small" style={{ fontWeight: '800', color: schedView === 'list' ? c.ink : c.sec }}>List</Txt>
                </Pressable>
                <Pressable
                  onPress={() => setSchedView('swipe')}
                  style={[styles.toggleBtn, schedView === 'swipe' && { backgroundColor: c.card, ...cardShadow }]}>
                  <Txt variant="small" style={{ fontWeight: '800', color: schedView === 'swipe' ? c.ink : c.sec }}>Swipe</Txt>
                </Pressable>
              </View>
            </View>

            {schedView === 'swipe' ? (
              <>
                <Txt variant="small" faint style={{ marginBottom: Space.s }}>
                  Tap a block to point the map · tap again to open
                </Txt>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: Space.s, paddingBottom: Space.s, paddingRight: Space.l }}>
                  {day.activities.map((a, i) => {
                    const cat = catStyle(a.category, c);
                    const on = activeBlock === i;
                    return (
                      <Pressable
                        key={a.id}
                        onPress={() => selectBlock(i, a)}
                        style={[styles.swipeCard, { backgroundColor: c.card, borderColor: on ? c.primary : 'transparent' }, cardShadow]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={[styles.blockDot, { backgroundColor: cat.color, marginTop: 0 }]}>
                            <Icon name={cat.icon} size={12} color="#fff" />
                          </View>
                          <Txt variant="mono" faint>{a.time}</Txt>
                        </View>
                        <Txt style={{ fontWeight: '800', fontSize: 13.5, marginTop: 6 }} numberOfLines={2}>
                          {a.activity}
                        </Txt>
                        <Txt variant="small" muted numberOfLines={1} style={{ marginTop: 2 }}>
                          {a.where}
                        </Txt>
                        {on ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                            <Txt variant="small" style={{ color: c.primary, fontWeight: '800' }}>Open block</Txt>
                            <Icon name="chevR" size={13} color={c.primary} />
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            ) : (
              <View style={{ gap: Space.s, marginTop: Space.s }}>
                {day.activities.map((a, i) => (
                  <Animated.View key={a.id} entering={FadeInDown.delay(Math.min(i, 8) * 45).duration(320)}>
                    <ActivityBlock a={a} itId={it.id} dayId={day.id} onRemove={a.added ? () => removeStop(a.id) : undefined} />
                  </Animated.View>
                ))}
              </View>
            )}
          </>
        ) : null}

        {/* add a stop — insert-only; the rest of the plan is untouched */}
        <Pressable onPress={goAddStop} style={[styles.addStop, { borderColor: c.a3 }]}>
          <Icon name="plus" size={18} color={c.a3} />
          <Txt style={{ color: c.a3, fontWeight: '800' }}>Add a stop to this day</Txt>
        </Pressable>

        {/* places */}
        {places.length ? (
          <>
            <Txt variant="title" style={{ marginTop: Space.xl, marginBottom: Space.m }}>
              Places on this day
            </Txt>
            <View style={{ gap: Space.m }}>
              {places.map((pl) => (
                <Pressable
                  key={pl.name}
                  onPress={() => go({ pathname: '/place/[name]', params: { name: pl.name } })}
                  style={({ pressed }) => [styles.placeRow, { backgroundColor: c.card }, cardShadow, pressed && { opacity: 0.85 }]}>
                  <Image source={img(photoForPlace(pl.name))} style={styles.placeThumb} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontWeight: '800' }} numberOfLines={1}>
                      {pl.name}
                    </Txt>
                    <Txt variant="small" muted numberOfLines={1} style={{ marginTop: 2 }}>
                      {pl.area}
                    </Txt>
                  </View>
                  <Icon name="chevR" size={16} color={c.ter} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <View style={{ marginTop: Space.xl, gap: Space.m }}>
          <PillButton label="Navigate route" icon="nav" onPress={navigate} />
          <PillButton
            label="Open in Maps app"
            icon="share"
            variant="secondary"
            onPress={() => (day.location ? openMaps(day.location.lat, day.location.lng, day.location.mapAnchor) : go('/map'))}
          />
          {day.activities?.length ? (
            <PillButton label="Remind me for this day" icon="calClock" variant="secondary" onPress={remindForDay} />
          ) : null}
          {remindMsg ? (
            <Txt variant="small" muted style={{ textAlign: 'center' }}>
              {remindMsg}
            </Txt>
          ) : null}
        </View>
    </MapFirst>
  );
}

function ActivityBlock({ a, itId, dayId, onRemove }: { a: Activity; itId: string; dayId: string; onRemove?: () => void }) {
  const { c, cardShadow } = useWayfare();
  const cat = catStyle(a.category, c);
  const open = () => go({ pathname: '/activity/[id]', params: { id: a.id, it: itId, day: dayId } });
  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [
        styles.block,
        { backgroundColor: c.card },
        a.added && { borderWidth: 1.5, borderColor: '#FF4667' },
        cardShadow,
        pressed && { opacity: 0.9 },
      ]}>
      <View style={styles.blockTime}>
        <Txt variant="mono" faint style={{ textAlign: 'right' }}>
          {a.time}
        </Txt>
      </View>
      <View style={[styles.blockDot, { backgroundColor: a.added ? '#FF4667' : cat.color }]}>
        <Icon name={cat.icon} size={13} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Txt style={{ fontWeight: '800', flex: 1 }} numberOfLines={2}>
            {a.activity}
          </Txt>
          {a.added ? (
            <View style={{ backgroundColor: 'rgba(255,70,103,0.22)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Txt style={{ color: '#ff9fb0', fontSize: 9, fontWeight: '800' }}>ADDED</Txt>
            </View>
          ) : null}
          {a.optional && !a.added ? <Chip label="Optional" small /> : null}
        </View>
        <Txt variant="small" muted style={{ marginTop: 1 }} numberOfLines={1}>
          {a.where}
          {a.participants ? ` · ${a.participants}` : ''}
        </Txt>

        <View style={styles.blockChips}>
          {a.category ? <Chip label={a.category} color={cat.color} filled small /> : null}
          {a.cost ? <Chip label={money(a.cost)} small /> : null}
        </View>

        {hasSplitRoles(a) ? (
          <View style={styles.statusRow}>
            {a.momStatus ? (
              <Txt variant="small" muted>
                <Txt variant="small" style={{ color: c.a4, fontWeight: '800' }}>Mom </Txt>
                {a.momStatus}
              </Txt>
            ) : null}
            {a.dadStatus ? (
              <Txt variant="small" muted>
                <Txt variant="small" style={{ color: c.a3, fontWeight: '800' }}>Dad </Txt>
                {a.dadStatus}
              </Txt>
            ) : null}
          </View>
        ) : null}

        {a.mealSuggestion ? (
          <Txt variant="small" muted style={{ marginTop: 5, lineHeight: 17 }}>
            🍽 {a.mealSuggestion}
          </Txt>
        ) : null}
        {a.restNap ? (
          <Txt variant="small" style={{ marginTop: 4, color: c.a4, fontWeight: '700' }}>
            ⏾ {a.restNap}
          </Txt>
        ) : null}
        {a.reasoning ? (
          <Txt variant="small" faint style={{ marginTop: 4, fontStyle: 'italic', lineHeight: 16 }}>
            {a.reasoning}
          </Txt>
        ) : null}
      </View>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8} style={({ pressed }) => [{ justifyContent: 'center', padding: 4 }, pressed && { opacity: 0.5 }]}>
          <Icon name="close" size={17} color="#FF4667" />
        </Pressable>
      ) : (
        <View style={{ justifyContent: 'center' }}>
          <Icon name="chevR" size={15} color={c.ter} />
        </View>
      )}
    </Pressable>
  );
}

function InfoCard({ icon, label, value }: { icon: 'car' | 'peso' | 'food' | 'pin'; label: string; value: string }) {
  const { c, cardShadow } = useWayfare();
  return (
    <View style={[styles.info, { backgroundColor: c.card }, cardShadow]}>
      <Icon name={icon} size={18} color={c.ink} />
      <View style={{ flex: 1 }}>
        <Txt variant="small" faint>
          {label}
        </Txt>
        <Txt style={{ fontWeight: '700', marginTop: 1 }} numberOfLines={1}>
          {value}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  info: { flex: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: Space.m, borderRadius: 18, padding: 12 },
  placeThumb: { width: 50, height: 50, borderRadius: 14 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Space.xl,
    marginBottom: Space.s,
  },
  toggle: { flexDirection: 'row', borderRadius: 999, padding: 3, gap: 2 },
  toggleBtn: { paddingHorizontal: 14, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  swipeCard: { width: 172, borderRadius: 16, padding: 12, borderWidth: 2 },
  addStop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Space.l,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 15,
  },
  block: { flexDirection: 'row', gap: 10, borderRadius: 18, padding: 13, alignItems: 'flex-start' },
  blockTime: { width: 58, paddingTop: 2 },
  blockDot: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  blockChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
});
