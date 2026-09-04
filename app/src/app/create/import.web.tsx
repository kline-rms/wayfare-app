// Import (web) — pick a CSV/XLSX exported in our column layout and rebuild the
// itinerary from its actual rows (days, times, places, coordinates). Saving it
// runs the normal finalize crawl, so places get Place IDs + photos.
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, Chip, Field, PillButton, SectionLabel, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { api } from '@/lib/api';
import { shortRange } from '@/lib/format';
import { buildItineraryFromRows } from '@/lib/import-build';
import { parseSpreadsheet } from '@/lib/import-parse';
import { back, replaceTo } from '@/lib/nav';
import type { Itinerary } from '@/lib/types';

export default function ImportScreen() {
  const { c } = useWayfare();
  const [built, setBuilt] = useState<Itinerary | null>(null);
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setError(null);
      try {
        const rows = await parseSpreadsheet(await file.arrayBuffer());
        const guess = file.name.replace(/\.(xlsx?|csv)$/i, '').replace(/[_-]+/g, ' ').trim().slice(0, 44);
        const it = buildItineraryFromRows(rows, { title: guess });
        setFileName(file.name);
        setBuilt(it);
        setTitle(it.title);
      } catch (e) {
        setBuilt(null);
        setError((e as Error).message || 'Could not read that file — try a .csv or .xlsx export.');
      }
    };
    input.click();
  };

  const importTrip = async () => {
    if (!built) return;
    setBusy(true);
    setError(null);
    const name = title.trim() || built.title;
    const toSave: Itinerary = {
      ...built,
      title: name,
      proposals: built.proposals.map((p) => ({ ...p, name })),
    };
    try {
      const saved = await api.saveItinerary(toSave);
      replaceTo({ pathname: '/trip/[id]', params: { id: saved.id } });
    } catch (e) {
      const msg = (e as Error).message;
      // Re-importing the same file → same id → open the existing trip.
      if (/already exists/i.test(msg)) {
        replaceTo({ pathname: '/trip/[id]', params: { id: built.id } });
        return;
      }
      setError(msg);
      setBusy(false);
    }
  };

  const stops = built ? built.proposals[0].days.reduce((s, d) => s + (d.activities?.length ?? 0), 0) : 0;

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
        Bring a CSV/XLSX with Date, Time, Activity, Where and a Maps link — we rebuild the exact trip.
      </Txt>

      {!built ? (
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

      {built ? (
        <View style={{ marginTop: Space.l }}>
          <Card style={{ gap: Space.s }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s }}>
              <Txt style={{ fontWeight: '800', flex: 1 }} numberOfLines={1}>
                {fileName}
              </Txt>
              <Chip label={`${built.proposals[0].days.length} days`} color={c.a3} filled small />
              <Chip label={`${stops} stops`} color={c.a2} filled small />
            </View>
            <Txt variant="small" muted>
              {shortRange(built.dateRange.start, built.dateRange.end)} · home base {built.homeBase || '—'} · {built.places.length} places detected
            </Txt>
          </Card>

          <View style={{ marginTop: Space.l }}>
            <SectionLabel>Trip name</SectionLabel>
            <Field icon="edit" placeholder="Name this trip" value={title} onChangeText={setTitle} />
          </View>

          {/* quick peek at the first day so you can trust the parse */}
          <View style={{ marginTop: Space.l }}>
            <SectionLabel>{`Day 1 · ${built.proposals[0].days[0]?.dateLabel ?? ''}`}</SectionLabel>
            <Card style={{ gap: Space.s }}>
              {(built.proposals[0].days[0]?.activities ?? []).slice(0, 4).map((a) => (
                <View key={a.id} style={{ flexDirection: 'row', gap: Space.m }}>
                  <Txt variant="mono" faint style={{ width: 96 }} numberOfLines={1}>
                    {a.time}
                  </Txt>
                  <Txt variant="small" style={{ flex: 1 }} numberOfLines={1}>
                    {a.activity} · {a.where}
                  </Txt>
                </View>
              ))}
            </Card>
          </View>
        </View>
      ) : null}

      {error ? (
        <Txt variant="sec" style={{ color: c.danger, marginTop: Space.l }}>
          {error}
        </Txt>
      ) : null}

      {built ? (
        <View style={{ marginTop: Space.xl }}>
          <PillButton label={busy ? 'Importing…' : 'Import this trip'} icon="arrow" knob onPress={busy ? undefined : importTrip} />
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
