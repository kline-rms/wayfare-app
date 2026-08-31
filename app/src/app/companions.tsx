// Companions — the dynamic "who else should know this trip?" roster. Add anyone
// (any relation, any role), then hand them a share link. Expense payers and (later)
// split-party assignments all draw from this one list, so nothing is hardcoded.
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Field, PillButton, SectionLabel, StateView, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { edits, useEditsVersion } from '@/lib/edits';
import { back } from '@/lib/nav';
import type { Itinerary, Member } from '@/lib/types';

const RELATIONS = ['Family', 'Partner', 'Sister-in-law', 'Nanny', 'Grandparent', 'Friend'];
const TINTS = ['#7C5CF6', '#FFA828', '#2FD98A', '#46B4F0', '#FF4667', '#9E86FF'];
const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

function shareUrl(token: string): string {
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://wayfare.app';
  return `${origin}/shared/${token}`;
}

async function loadTrip(itParam?: string): Promise<Itinerary> {
  const list = await api.listItineraries();
  const id = itParam ?? list.find((s) => s.id.includes('family'))?.id ?? list[0]?.id;
  if (!id) throw new Error('No trips yet');
  return api.getItinerary(id);
}

export default function Companions() {
  const { it: itParam } = useLocalSearchParams<{ it?: string }>();
  const { c, cardShadow } = useWayfare();
  const editsVersion = useEditsVersion();
  const { data, loading, error, reload } = useAsync(() => loadTrip(itParam), [itParam, editsVersion]);

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Family');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [busy, setBusy] = useState(false);
  const [linkFor, setLinkFor] = useState<Record<string, string>>({}); // memberId → url

  if (!data) return <StateView loading={loading} error={error} onRetry={reload} />;
  const members = data.members ?? [];

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const member: Member = {
        id: `mem-${Date.now()}`,
        name: name.trim(),
        relation,
        role,
        color: TINTS[members.length % TINTS.length],
      };
      await api.addMember(data.id, member);
      edits.markStale();
      setName('');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (m: Member) => {
    await api.removeMember(data.id, m.id);
    edits.markStale();
  };

  const shareWith = async (m: Member) => {
    try {
      const { share } = await api.createShare(data.id, { role: m.role === 'editor' ? 'editor' : 'viewer', memberId: m.id, label: m.name });
      const url = shareUrl(share.token);
      setLinkFor((prev) => ({ ...prev, [m.id]: url }));
      if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    } catch {
      /* ignore */
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
        Companions
      </Txt>
    </View>
  );

  return (
    <MapFirst header={header} sheetTop={0.2} collapsible>
      <Txt variant="h1">Who else should{'\n'}know this trip?</Txt>
      <Txt variant="sec" muted style={{ marginTop: 6 }}>
        Add anyone — family, a friend, the nanny — and hand them a link. Not just one role.
      </Txt>

      {/* roster */}
      <View style={{ gap: Space.s, marginTop: Space.l }}>
        {members.map((m) => (
          <View key={m.id} style={[styles.row, { backgroundColor: c.card }, cardShadow]}>
            <View style={[styles.avatar, { backgroundColor: m.color ?? c.primary }]}>
              <Txt style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{initials(m.name)}</Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '800' }} numberOfLines={1}>
                {m.name}
              </Txt>
              <Txt variant="small" muted numberOfLines={1}>
                {[m.relation, m.role === 'editor' ? 'can edit' : 'can view'].filter(Boolean).join(' · ')}
              </Txt>
              {linkFor[m.id] ? (
                <Txt variant="small" style={{ color: c.a2, marginTop: 3 }} numberOfLines={1}>
                  ✓ Link copied · {linkFor[m.id]}
                </Txt>
              ) : null}
            </View>
            <Pressable onPress={() => shareWith(m)} style={[styles.shareBtn, { backgroundColor: c.primary }]}>
              <Icon name="share" size={14} color="#fff" />
              <Txt style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>Link</Txt>
            </Pressable>
            <Pressable onPress={() => remove(m)} hitSlop={6} style={{ padding: 4 }}>
              <Icon name="close" size={16} color={c.danger} />
            </Pressable>
          </View>
        ))}
        {!members.length ? (
          <Txt variant="sec" muted style={{ textAlign: 'center', paddingVertical: Space.m }}>
            No one added yet.
          </Txt>
        ) : null}
      </View>

      {/* add form */}
      <SectionLabel style={{ marginTop: Space.xl }}>Add someone</SectionLabel>
      <Field icon="user" placeholder="Their name" value={name} onChangeText={setName} />
      <View style={styles.chips}>
        {RELATIONS.map((r) => (
          <Pressable
            key={r}
            onPress={() => setRelation(r)}
            style={[styles.chip, r === relation ? { backgroundColor: c.a3 } : { backgroundColor: c.card, ...cardShadow }]}>
            <Txt style={{ fontWeight: '700', fontSize: 12.5, color: r === relation ? '#fff' : c.ink }}>{r}</Txt>
          </Pressable>
        ))}
      </View>
      <View style={{ marginTop: Space.m }}>
        <Field icon="edit" placeholder="or a custom relation…" value={relation} onChangeText={setRelation} />
      </View>
      <SectionLabel style={{ marginTop: Space.l }}>Access</SectionLabel>
      <View style={styles.chips}>
        {(['viewer', 'editor'] as const).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRole(r)}
            style={[styles.chip, r === role ? { backgroundColor: c.primary } : { backgroundColor: c.card, ...cardShadow }]}>
            <Txt style={{ fontWeight: '700', fontSize: 12.5, color: r === role ? c.onPrimary : c.ink }}>
              {r === 'viewer' ? 'Can view' : 'Can edit'}
            </Txt>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: Space.xl }}>
        <PillButton label={busy ? 'Adding…' : 'Add companion'} icon="plus" knob onPress={busy ? undefined : add} />
      </View>

      <Txt variant="small" faint style={{ textAlign: 'center', marginTop: Space.m, lineHeight: 16 }}>
        A link lets them open the trip. Editors can add stops &amp; expenses; viewers just follow along.
      </Txt>
    </MapFirst>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.m, borderRadius: 16, padding: 12 },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Space.s },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999 },
});
