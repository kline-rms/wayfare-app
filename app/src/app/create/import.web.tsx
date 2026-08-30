// Import (web) — pick a CSV, preview the detected columns + row count, then hand
// the trip to the generator. (Full server-side row import is a later endpoint.)
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, Chip, Field, PillButton, SectionLabel, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { api } from '@/lib/api';
import { back, replaceTo } from '@/lib/nav';
import { wizard } from '@/lib/wizard';
import type { GenerateRequest } from '@/lib/types';

interface Parsed {
  name: string;
  rows: number;
  headers: string[];
}

export default function ImportScreen() {
  const { c } = useWayfare();
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [dest, setDest] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        const headers = (lines[0] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
        setParsed({ name: file.name, rows: Math.max(0, lines.length - 1), headers });
      } catch {
        setError('Could not read that file — a .csv works best.');
      }
    };
    input.click();
  };

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      wizard.reset();
      wizard.patch({ origin: 'Imported plan', destination: dest.trim() || 'My trip' });
      const res = await api.generate(wizard.get() as GenerateRequest);
      wizard.setResult(res);
      replaceTo('/create/proposals');
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
    <MapFirst header={header} sheetTop={0.2}>
        <Txt variant="h1">
          Import{'\n'}your plan
        </Txt>
        <Txt variant="sec" muted style={{ marginTop: 6 }}>
          Bring a CSV of places and times — we&apos;ll map the columns and route it.
        </Txt>

        {!parsed ? (
          <Pressable onPress={pick} style={styles.drop}>
            <Icon name="upload" size={26} color={c.a3} />
            <Txt style={{ fontWeight: '800', marginTop: 8 }}>Drop your file here</Txt>
            <Txt variant="small" muted style={{ marginTop: 2 }}>
              .csv · .xlsx · tap to browse
            </Txt>
          </Pressable>
        ) : (
          <View style={{ marginTop: Space.l }}>
            <PillButton label="Choose a different file" icon="upload" variant="secondary" onPress={pick} />
          </View>
        )}

        {parsed ? (
          <View style={{ marginTop: Space.l }}>
            <Card style={{ gap: Space.s }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s }}>
                <Txt style={{ fontWeight: '800', flex: 1 }} numberOfLines={1}>
                  {parsed.name}
                </Txt>
                <Chip label={`${parsed.rows} rows`} color={c.a2} filled small />
              </View>
              <SectionLabel>Detected columns</SectionLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {parsed.headers.length ? (
                  parsed.headers.map((h) => <Chip key={h} label={h} small />)
                ) : (
                  <Txt variant="small" muted>No header row found.</Txt>
                )}
              </View>
            </Card>

            <View style={{ marginTop: Space.l }}>
              <SectionLabel>Where is this trip?</SectionLabel>
              <Field icon="pin" placeholder="e.g. Manila & Makati" value={dest} onChangeText={setDest} />
            </View>
          </View>
        ) : null}

        {error ? (
          <Txt variant="sec" style={{ color: c.danger, marginTop: Space.l }}>
            {error}
          </Txt>
        ) : null}

        {parsed ? (
          <View style={{ marginTop: Space.xl }}>
            <PillButton label={busy ? 'Building your plans…' : 'Import & generate'} icon="arrow" knob onPress={busy ? undefined : generate} />
          </View>
        ) : null}
    </MapFirst>
  );
}

const styles = StyleSheet.create({
  drop: {
    marginTop: Space.l,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#9E86FF',
    borderRadius: 16,
    paddingVertical: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,92,246,0.06)',
  },
});
