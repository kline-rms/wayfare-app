// Add a stop to a specific day — INSERT ONLY. Nothing else in the plan changes;
// if the chosen time overlaps an existing block we flag it, but you decide.
import { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Field, PillButton, SectionLabel, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { api } from '@/lib/api';
import { parseClock } from '@/lib/dining';
import { edits } from '@/lib/edits';
import { geocode } from '@/lib/geocode';
import { back } from '@/lib/nav';
import type { Activity } from '@/lib/types';

const SLOTS = ['9:00 AM', '11:00 AM', '12:30 PM', '3:00 PM', '6:30 PM', '8:30 PM'];
const CATS = ['Attraction', 'Food', 'Sights', 'Leisure', 'Shopping'];

export default function AddStop() {
  const { it, day, label, dest, times } = useLocalSearchParams<{
    it: string;
    day: string;
    label?: string;
    dest?: string;
    times?: string;
  }>();
  const { c, cardShadow } = useWayfare();
  const [name, setName] = useState('');
  const [time, setTime] = useState('3:00 PM');
  const [cat, setCat] = useState('Attraction');
  const [cost, setCost] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Conflict check against the day's existing block times (passed from the day).
  const conflict = useMemo(() => {
    const h = parseClock(time);
    if (h == null || !times) return null;
    for (const t of times.split('|')) {
      const eh = parseClock(t);
      if (eh != null && Math.abs(eh - h) < 1) return t;
    }
    return null;
  }, [time, times]);

  const save = async () => {
    if (!name.trim()) {
      setError('Give the place a name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const hit = await geocode(name.trim(), dest); // best-effort coords
      const activity: Activity = {
        id: `add-${day}-${Date.now()}`,
        time: time.trim(),
        activity: name.trim(),
        where: hit?.label?.split(',').slice(0, 2).join(', ') ?? name.trim(),
        category: cat,
        cost: cost ? Number(cost) : undefined,
        lat: hit?.lat,
        lng: hit?.lng,
        added: true,
      };
      await api.addActivity(it, day, activity);
      edits.markStale();
      back();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable onPress={back}>
        <MapIconButton>
          <Icon name="back" size={22} color="#fff" />
        </MapIconButton>
      </Pressable>
      <Txt variant="h1" style={{ color: '#fff', fontSize: 22 }}>
        Add a stop
      </Txt>
    </View>
  );

  return (
    <MapFirst header={header} sheetTop={0.22}>
      <Txt variant="small" faint>
        {label ? label.toUpperCase() : 'THIS DAY'} · inserted without changing the rest
      </Txt>

      <SectionLabel style={{ marginTop: Space.l }}>Place</SectionLabel>
      <Field icon="pin" placeholder="e.g. Star City" value={name} onChangeText={setName} />

      <SectionLabel style={{ marginTop: Space.l }}>Time</SectionLabel>
      <View style={styles.chips}>
        {SLOTS.map((s) => {
          const on = s === time;
          return (
            <Pressable
              key={s}
              onPress={() => setTime(s)}
              style={[styles.chip, on ? { backgroundColor: c.primary } : { backgroundColor: c.card, ...cardShadow }]}>
              <Txt style={{ fontWeight: '700', fontSize: 13, color: on ? c.onPrimary : c.ink }}>{s}</Txt>
            </Pressable>
          );
        })}
      </View>
      <View style={{ marginTop: Space.s }}>
        <Field icon="clock" placeholder="or type a time (e.g. 2:15 PM)" value={time} onChangeText={setTime} />
      </View>
      {conflict ? (
        <View style={[styles.warn, { backgroundColor: c.a1 + '22' }]}>
          <Icon name="alert" size={16} color={c.a1} />
          <Txt variant="small" style={{ color: c.a1, flex: 1, fontWeight: '600' }}>
            Overlaps a block at {conflict}. You can still add it — nothing else moves.
          </Txt>
        </View>
      ) : null}

      <SectionLabel style={{ marginTop: Space.l }}>Type</SectionLabel>
      <View style={styles.chips}>
        {CATS.map((k) => {
          const on = k === cat;
          return (
            <Pressable
              key={k}
              onPress={() => setCat(k)}
              style={[styles.chip, on ? { backgroundColor: c.a3 } : { backgroundColor: c.card, ...cardShadow }]}>
              <Txt style={{ fontWeight: '700', fontSize: 13, color: on ? '#fff' : c.ink }}>{k}</Txt>
            </Pressable>
          );
        })}
      </View>

      <SectionLabel style={{ marginTop: Space.l }}>Est. cost (optional)</SectionLabel>
      <Field icon="peso" placeholder="e.g. 900" value={cost} onChangeText={setCost} keyboardType="numeric" />

      {error ? (
        <Txt variant="small" style={{ color: c.danger, marginTop: Space.m }}>
          {error}
        </Txt>
      ) : null}

      <View style={{ marginTop: Space.xl }}>
        <PillButton label={busy ? 'Adding…' : 'Add to this day'} icon="plus" knob onPress={busy ? undefined : save} />
      </View>
    </MapFirst>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: Space.s },
  chip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999 },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 11, marginTop: Space.s },
});
