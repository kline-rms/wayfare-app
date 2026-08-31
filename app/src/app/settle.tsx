// Settle a payer in one go: review the unpaid batch, attach a transfer-proof
// screenshot, capture the payee's signature, confirm → records the reimbursement,
// marks the batch paid, and posts it to Alerts (the in-app notification).
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { SignaturePad } from '@/components/wayfare/signature-pad';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, PillButton, SectionLabel, StateView, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { edits, useEditsVersion } from '@/lib/edits';
import { money } from '@/lib/format';
import { back } from '@/lib/nav';
import type { Itinerary } from '@/lib/types';

function downscale(dataUrl: string, max = 900, quality = 0.6): Promise<string> {
  if (typeof document === 'undefined') return Promise.resolve(dataUrl);
  return new Promise((resolve) => {
    const img = new (window as any).Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function Settle() {
  const { it: itParam, payer = 'All', currency = 'PHP' } = useLocalSearchParams<{ it: string; payer?: string; currency?: string }>();
  const { c, cardShadow } = useWayfare();
  const editsVersion = useEditsVersion();
  const { data, loading, error, reload } = useAsync<Itinerary>(() => api.getItinerary(itParam), [itParam, editsVersion]);
  const [proof, setProof] = useState<string | null>(null);
  const [sig, setSig] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!data) return <StateView loading={loading} error={error} onRetry={reload} />;

  const batch = (data.expenses ?? []).filter((e) => e.status === 'unpaid' && (payer === 'All' || e.payer === payer));
  const total = batch.reduce((s, e) => s + e.amount, 0);

  const pickProof = () => {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => setProof(await downscale(String(reader.result)));
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const confirm = async () => {
    if (!batch.length) {
      setErr('Nothing unpaid to settle.');
      return;
    }
    if (!sig) {
      setErr(`${payer === 'All' ? 'The payee' : payer} needs to sign to authorise.`);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api.reimburse(data.id, {
        to: payer === 'All' ? 'Companions' : payer,
        expenseIds: batch.map((e) => e.id),
        proofUrl: proof ?? undefined,
        signature: { by: payer === 'All' ? 'Companions' : payer, at: new Date().toISOString(), image: sig },
      });
      edits.markStale();
      back();
    } catch (e) {
      setErr((e as Error).message);
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
        Reimburse {payer === 'All' ? '' : payer}
      </Txt>
    </View>
  );

  return (
    <MapFirst header={header} sheetTop={0.18}>
      <View style={[styles.total, { backgroundColor: c.card }, cardShadow]}>
        <View style={{ flex: 1 }}>
          <Txt variant="small" faint>
            SETTLING {payer === 'All' ? 'ALL' : payer.toUpperCase()}
          </Txt>
          <Txt style={{ fontWeight: '800', fontSize: 24, marginTop: 2 }}>{money(total, currency)}</Txt>
          <Txt variant="small" muted>
            {batch.length} receipt{batch.length === 1 ? '' : 's'}
          </Txt>
        </View>
      </View>

      <SectionLabel style={{ marginTop: Space.l }}>Transfer proof</SectionLabel>
      {proof ? (
        <View style={styles.proofWrap}>
          <Image source={{ uri: proof }} style={styles.proof} contentFit="cover" />
          <Pressable onPress={pickProof} style={styles.reProof}>
            <Txt variant="small" style={{ color: '#fff', fontWeight: '800' }}>Replace</Txt>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={pickProof} style={[styles.drop, { borderColor: c.a3 }]}>
          <Icon name="upload" size={22} color={c.a3} />
          <Txt style={{ fontWeight: '800', marginTop: 6 }}>Upload your GCash/bank screenshot</Txt>
          <Txt variant="small" muted style={{ marginTop: 2 }}>
            Proof that the transfer was sent
          </Txt>
        </Pressable>
      )}

      <SectionLabel style={{ marginTop: Space.l }}>
        {payer === 'All' ? 'Payee' : payer} authorises this reimbursement
      </SectionLabel>
      <SignaturePad onChange={setSig} />

      {err ? (
        <Txt variant="small" style={{ color: c.danger, marginTop: Space.m }}>
          {err}
        </Txt>
      ) : null}

      <View style={{ marginTop: Space.xl }}>
        <PillButton
          label={busy ? 'Recording…' : `Confirm · reimburse ${money(total, currency)}`}
          icon="check"
          knob
          onPress={busy ? undefined : confirm}
        />
      </View>
      <Txt variant="small" faint style={{ textAlign: 'center', marginTop: Space.m, lineHeight: 16 }}>
        Marks the batch paid, stores the proof + signature, and notifies them in Alerts.
      </Txt>
    </MapFirst>
  );
}

const styles = StyleSheet.create({
  total: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: Space.l, marginTop: Space.s },
  drop: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,92,246,0.06)' },
  proofWrap: { borderRadius: 14, overflow: 'hidden', position: 'relative', marginTop: Space.s },
  proof: { width: '100%', height: 170 },
  reProof: { position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(20,15,45,0.85)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
});
