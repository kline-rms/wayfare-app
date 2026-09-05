// Free-form planner — describe the trip in one message and the AI extracts the
// structured request, then generates. Only a missing destination is asked back;
// everything else (dates, party, pace…) is inferred or sensibly defaulted.
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { AIOrb, Field, PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { api } from '@/lib/api';
import { back, replaceTo } from '@/lib/nav';
import { wizard } from '@/lib/wizard';
import type { GenerateRequest } from '@/lib/types';

const EXAMPLE =
  'Plan a beautiful few days around BGC for my 3 kids (11, 10, and a 2-year-old), Sept 9–14. We stay at Avida Towers Verte near Uptown Mall — keep it stroller-friendly with nap time.';

// Drop empty/zero fields so the wizard's sensible defaults fill them.
function clean(req: Partial<GenerateRequest>): Partial<GenerateRequest> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(req)) {
    if (v === '' || v == null || v === 0) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as Partial<GenerateRequest>;
}

export default function PlanScreen() {
  const { c } = useWayfare();
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Partial<GenerateRequest> | null>(null);
  const [dest, setDest] = useState('');

  const generate = async (req: Partial<GenerateRequest>) => {
    wizard.reset();
    wizard.patch(clean(req) as GenerateRequest);
    const res = await api.generate(wizard.get() as GenerateRequest);
    wizard.setResult(res);
    replaceTo('/create/proposals');
  };

  const submit = async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const { request, missing } = await api.parsePlan(prompt.trim());
      if (missing.includes('destination') && !request.destination) {
        setPending(request);
        setBusy(false); // ask only for the destination
        return;
      }
      await generate(request);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const withDestination = async () => {
    if (!pending || !dest.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await generate({ ...pending, destination: dest.trim() });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const header = (
    <Pressable onPress={back}>
      <MapIconButton>
        <Icon name="back" size={22} color="#fff" />
      </MapIconButton>
    </Pressable>
  );

  return (
    <MapFirst header={header} sheetTop={0.16}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.m }}>
        <AIOrb size={40} />
        <View style={{ flex: 1 }}>
          <Txt variant="h1" style={{ fontSize: 26 }}>
            Describe your trip
          </Txt>
          <Txt variant="sec" muted>
            One message — I&apos;ll plan the rest.
          </Txt>
        </View>
      </View>

      {!pending ? (
        <>
          <View style={[styles.box, { backgroundColor: c.fieldBg, borderColor: c.line }]}>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder={EXAMPLE}
              placeholderTextColor={c.ter}
              multiline
              editable={!busy}
              style={[styles.input, { color: c.ink }]}
            />
          </View>
          {!prompt ? (
            <Pressable onPress={() => setPrompt(EXAMPLE)} style={{ marginTop: Space.s }}>
              <Txt variant="small" style={{ color: c.primary, fontWeight: '700' }}>
                Try an example →
              </Txt>
            </Pressable>
          ) : null}
          <View style={{ marginTop: Space.l }}>
            <PillButton label={busy ? 'Planning your days…' : 'Plan it'} icon="spark" knob onPress={busy ? undefined : submit} />
          </View>
        </>
      ) : (
        <View style={{ marginTop: Space.l }}>
          <Txt variant="sec" muted>
            Got it. One thing — where should this be?
          </Txt>
          <View style={{ marginTop: Space.s }}>
            <Field icon="pin" placeholder="e.g. BGC, Taguig · Cebu · Tagaytay" value={dest} onChangeText={setDest} />
          </View>
          <View style={{ marginTop: Space.l }}>
            <PillButton label={busy ? 'Planning your days…' : 'Generate'} icon="arrow" knob onPress={busy ? undefined : withDestination} />
          </View>
        </View>
      )}

      {error ? (
        <Txt variant="sec" style={{ color: c.danger, marginTop: Space.l }}>
          {error}
        </Txt>
      ) : null}
    </MapFirst>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: Space.l, borderRadius: 18, borderWidth: 1, padding: 14, minHeight: 140 },
  input: { fontSize: 16, lineHeight: 23, minHeight: 112, textAlignVertical: 'top' },
});
