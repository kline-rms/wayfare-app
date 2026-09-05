// Split-party control: tap travellers/companions to set who's on a stop. Saving
// the whole party clears the override (everyone together); a subset records the
// split. Optimistic — updates locally, persists, and marks edits stale so the
// day/trip refetch the new attendance.
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { useWayfare } from '@/components/wayfare/theme';
import { SectionLabel, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { api } from '@/lib/api';
import { edits } from '@/lib/edits';
import type { Activity, Member } from '@/lib/types';

const initials = (n: string) =>
  n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

export function PartyAssign({ itineraryId, activity, party }: { itineraryId: string; activity: Activity; party: Member[] }) {
  const { c, cardShadow } = useWayfare();
  const everyone = party.map((m) => m.id);
  const initial = activity.attendees && activity.attendees.length ? activity.attendees.filter((id) => everyone.includes(id)) : everyone;
  const [ids, setIds] = useState<string[]>(initial.length ? initial : everyone);
  const [saving, setSaving] = useState(false);

  const persist = async (next: string[]) => {
    setSaving(true);
    try {
      // Whole party ⇒ clear the override so it reads as "everyone".
      await api.setAttendees(itineraryId, activity.id, next.length === party.length ? [] : next);
      edits.markStale();
    } catch {
      /* keep the optimistic state; a later refetch reconciles */
    } finally {
      setSaving(false);
    }
  };

  const toggle = (mid: string) => {
    const next = ids.includes(mid) ? ids.filter((x) => x !== mid) : [...ids, mid];
    if (next.length === 0) return; // always at least one person on a stop
    setIds(next);
    persist(next);
  };
  const setAll = () => {
    setIds(everyone);
    persist(everyone);
  };

  const split = ids.length < party.length;

  return (
    <View style={[styles.card, { backgroundColor: c.card }, cardShadow]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <SectionLabel>Who&apos;s on this stop</SectionLabel>
        {saving ? <ActivityIndicator size="small" color={c.primary} style={{ marginLeft: 'auto' }} /> : null}
        {!saving && split ? (
          <Pressable onPress={setAll} style={{ marginLeft: 'auto' }}>
            <Txt variant="small" style={{ color: c.primary, fontWeight: '800' }}>
              Everyone
            </Txt>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.row}>
        {party.map((m) => {
          const on = ids.includes(m.id);
          return (
            <Pressable key={m.id} onPress={() => toggle(m.id)} style={styles.person}>
              <View style={[styles.avatar, { backgroundColor: on ? m.color ?? c.primary : c.fieldBg, opacity: on ? 1 : 0.6 }]}>
                <Txt style={{ color: on ? '#fff' : c.sec, fontWeight: '800', fontSize: 14 }}>{initials(m.name)}</Txt>
                {on ? (
                  <View style={[styles.check, { backgroundColor: c.a2 }]}>
                    <Icon name="check" size={9} color="#fff" />
                  </View>
                ) : null}
              </View>
              <Txt variant="small" style={{ color: on ? c.ink : c.sec, fontWeight: on ? '700' : '400', marginTop: 4 }} numberOfLines={1}>
                {m.name.split(/\s+/)[0]}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      <Txt variant="small" faint style={{ marginTop: Space.s }}>
        {split
          ? `Split here — ${party.filter((m) => ids.includes(m.id)).map((m) => m.name.split(/\s+/)[0]).join(', ')} only.`
          : 'Whole party together. Tap a person to peel them off this stop.'}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 16, marginTop: Space.m },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.m, marginTop: Space.s },
  person: { alignItems: 'center', width: 62 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  check: { position: 'absolute', right: -2, bottom: -2, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
