// Add an expense from a receipt: upload a photo, OCR reads the merchant / date /
// items / total, you review, then it lands in the trip's reimbursement ledger.
// Web-first (uses a file input + canvas downscale); the map keeps the night look.
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Field, PillButton, SectionLabel, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { api } from '@/lib/api';
import { edits } from '@/lib/edits';
import { back } from '@/lib/nav';
import type { Expense, ExpenseItem } from '@/lib/types';

const DEFAULT_PAYERS = ['Me', 'Sister-in-law', 'Nanny', 'Friend'];
const todayISO = () => new Date().toISOString().slice(0, 10);

// Shrink a photo so the OCR payload + stored thumbnail stay small.
function downscale(dataUrl: string, max = 720, quality = 0.6): Promise<string> {
  if (typeof document === 'undefined') return Promise.resolve(dataUrl);
  return new Promise((resolve) => {
    const img = new (window as any).Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function AddExpense() {
  const { it, dayId, currency = 'PHP', payers } = useLocalSearchParams<{ it: string; dayId?: string; currency?: string; payers?: string }>();
  const { c, cardShadow } = useWayfare();
  // Payers come from the trip's Companions roster (dynamic), not a hardcoded list.
  const payerList = payers ? payers.split('|').filter(Boolean) : DEFAULT_PAYERS;
  const [receipt, setReceipt] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(todayISO());
  const [payer, setPayer] = useState(payerList[0] ?? 'Me');
  const [total, setTotal] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => {
    if (typeof document === 'undefined') {
      setError('Uploading a receipt is available on the web app.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const small = await downscale(String(reader.result));
        setReceipt(small);
        setError(null);
        setParsing(true);
        try {
          const p = await api.parseReceipt(small);
          if (p.merchant) setMerchant(p.merchant);
          if (p.date) setDate(p.date);
          if (typeof p.total === 'number' && p.total > 0) setTotal(String(p.total));
          if (p.items?.length) setItems(p.items);
        } catch (e) {
          setError(`Couldn't read the receipt — enter it by hand. (${(e as Error).message})`);
        } finally {
          setParsing(false);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const itemsTotal = items.reduce((s, i) => s + (i.price ?? 0) * (i.qty ?? 1), 0);
  const amount = Number(total) || itemsTotal;

  const save = async () => {
    if (!amount) {
      setError('Enter a total (or add items).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const expense: Expense = {
        id: `exp-${Date.now()}`,
        date,
        dayId,
        payer,
        merchant: merchant.trim() || undefined,
        amount,
        currency,
        items: items.length ? items : undefined,
        receiptUrl: receipt ?? undefined,
        note: note.trim() || undefined,
        status: 'unpaid',
      };
      await api.addExpense(it, expense);
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
        Add expense
      </Txt>
    </View>
  );

  return (
    <MapFirst header={header} sheetTop={0.18}>
      {receipt ? (
        <View style={styles.receiptWrap}>
          <Image source={{ uri: receipt }} style={styles.receipt} contentFit="cover" />
          <Pressable onPress={pick} style={styles.reReceipt}>
            <Txt variant="small" style={{ color: '#fff', fontWeight: '800' }}>Replace</Txt>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={pick} style={[styles.drop, { borderColor: c.a3 }]}>
          <Icon name="image" size={26} color={c.a3} />
          <Txt style={{ fontWeight: '800', marginTop: 8 }}>Snap or upload the receipt</Txt>
          <Txt variant="small" muted style={{ marginTop: 2 }}>
            We&apos;ll read the items &amp; total automatically
          </Txt>
        </Pressable>
      )}

      {parsing ? (
        <View style={[styles.reading, { backgroundColor: c.a3 + '22' }]}>
          <Icon name="spark" size={16} color={c.a3} />
          <Txt variant="small" style={{ color: c.a3, fontWeight: '700' }}>Reading the receipt…</Txt>
        </View>
      ) : null}

      <SectionLabel style={{ marginTop: Space.l }}>Who paid</SectionLabel>
      <View style={styles.chips}>
        {payerList.map((p) => {
          const on = p === payer;
          return (
            <Pressable
              key={p}
              onPress={() => setPayer(p)}
              style={[styles.chip, on ? { backgroundColor: c.primary } : { backgroundColor: c.card, ...cardShadow }]}>
              <Txt style={{ fontWeight: '700', fontSize: 13, color: on ? c.onPrimary : c.ink }}>{p}</Txt>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: Space.m, marginTop: Space.l }}>
        <View style={{ flex: 1.4 }}>
          <SectionLabel>Merchant</SectionLabel>
          <Field icon="pin" placeholder="e.g. Denny's" value={merchant} onChangeText={setMerchant} />
        </View>
        <View style={{ flex: 1 }}>
          <SectionLabel>Total ({currency})</SectionLabel>
          <Field icon="peso" placeholder="0" value={total} onChangeText={setTotal} keyboardType="numeric" />
        </View>
      </View>

      <SectionLabel style={{ marginTop: Space.l }}>Date</SectionLabel>
      <Field icon="cal" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />

      {items.length ? (
        <>
          <SectionLabel style={{ marginTop: Space.l }}>Itemized ({items.length})</SectionLabel>
          <View style={{ gap: 8 }}>
            {items.map((item, i) => (
              <View key={i} style={[styles.itemRow, { backgroundColor: c.card }, cardShadow]}>
                <Txt style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>
                  {item.qty && item.qty > 1 ? `${item.qty}× ` : ''}
                  {item.name}
                </Txt>
                <Txt variant="small" muted>
                  {item.price != null ? `${currency === 'PHP' ? '₱' : ''}${item.price}` : '—'}
                </Txt>
                <Pressable onPress={() => setItems((arr) => arr.filter((_, j) => j !== i))} hitSlop={6}>
                  <Icon name="close" size={15} color={c.danger} />
                </Pressable>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <SectionLabel style={{ marginTop: Space.l }}>Note (optional)</SectionLabel>
      <Field icon="edit" placeholder="e.g. Kids' lunch while Mom & Dad were out" value={note} onChangeText={setNote} />

      {error ? (
        <Txt variant="small" style={{ color: c.danger, marginTop: Space.m }}>
          {error}
        </Txt>
      ) : null}

      <View style={{ marginTop: Space.xl }}>
        <PillButton label={busy ? 'Saving…' : 'Add to ledger'} icon="plus" knob onPress={busy ? undefined : save} />
      </View>
    </MapFirst>
  );
}

const styles = StyleSheet.create({
  drop: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,92,246,0.06)',
  },
  receiptWrap: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  receipt: { width: '100%', height: 180 },
  reReceipt: { position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(20,15,45,0.85)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  reading: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 11, marginTop: Space.m },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: Space.s },
  chip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
});
