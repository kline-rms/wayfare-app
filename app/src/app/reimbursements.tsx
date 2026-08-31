// Reimbursement ledger — every receipt for a trip, filterable by period / status
// / who paid, with a running unpaid total and one-tap "settle all" (batch mark
// paid). Tap a row to see the receipt image + itemized list. Proof + signature
// come next; today's money moves outside the app (record + prove).
import { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/wayfare/icon';
import { MapFirst, MapIconButton } from '@/components/wayfare/map-first';
import { useWayfare } from '@/components/wayfare/theme';
import { Card, PillButton, StateView, StatusPill, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { useAsync } from '@/hooks/use-async';
import { api } from '@/lib/api';
import { edits, useEditsVersion } from '@/lib/edits';
import { money } from '@/lib/format';
import { back, go } from '@/lib/nav';
import type { Expense, Itinerary } from '@/lib/types';

type Period = 'week' | 'month' | 'trip' | 'all';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'trip', label: 'This trip' },
  { key: 'all', label: 'All' },
];

function daysAgo(iso: string): number {
  const d = new Date(iso + 'T00:00:00');
  return (Date.now() - d.getTime()) / 86400000;
}
function inPeriod(date: string, period: Period, range: { start: string; end: string }): boolean {
  if (period === 'all') return true;
  if (period === 'trip') return date >= range.start && date <= range.end;
  if (period === 'week') return daysAgo(date) <= 7 && daysAgo(date) >= -1;
  const now = new Date();
  return date.slice(0, 7) === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function loadLedger(itParam?: string): Promise<Itinerary> {
  const list = await api.listItineraries();
  const id = itParam ?? list.find((s) => s.id.includes('family'))?.id ?? list[0]?.id;
  if (!id) throw new Error('No trips yet');
  return api.getItinerary(id);
}

export default function Reimbursements() {
  const { it: itParam } = useLocalSearchParams<{ it?: string }>();
  const { c, cardShadow } = useWayfare();
  const editsVersion = useEditsVersion();
  const { data, loading, error, reload } = useAsync(() => loadLedger(itParam), [itParam, editsVersion]);
  const [period, setPeriod] = useState<Period>('trip');
  const [status, setStatus] = useState<'unpaid' | 'paid' | 'all'>('unpaid');
  const [payer, setPayer] = useState<string>('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const payers = useMemo(() => ['All', ...new Set((data?.expenses ?? []).map((e) => e.payer))], [data]);

  // Show the loader only until we first have data; later refetches (after an edit)
  // keep the current ledger on screen instead of flashing a spinner.
  if (!data) return <StateView loading={loading} error={error} onRetry={reload} />;

  const cur = data.currency;
  const all = data.expenses ?? [];
  const filtered = all
    .filter((e) => inPeriod(e.date, period, data.dateRange))
    .filter((e) => status === 'all' || e.status === status)
    .filter((e) => payer === 'All' || e.payer === payer)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const unpaid = filtered.filter((e) => e.status === 'unpaid');
  const unpaidTotal = unpaid.reduce((s, e) => s + e.amount, 0);

  const markPaid = async (e: Expense) => {
    await api.updateExpense(data.id, e.id, {
      status: e.status === 'paid' ? 'unpaid' : 'paid',
      paidAt: e.status === 'paid' ? undefined : new Date().toISOString(),
    });
    edits.markStale();
  };
  const remove = async (e: Expense) => {
    await api.removeExpense(data.id, e.id);
    edits.markStale();
  };
  const settleAll = async () => {
    setBusy(true);
    try {
      for (const e of unpaid) {
        await api.updateExpense(data.id, e.id, { status: 'paid', paidAt: new Date().toISOString() });
      }
      edits.markStale();
    } finally {
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
      <Txt variant="h1" style={{ color: '#fff', fontSize: 22 }} numberOfLines={1}>
        Reimbursements
      </Txt>
    </View>
  );

  return (
    <MapFirst header={header} sheetTop={0.18} collapsible>
      <Txt variant="small" faint numberOfLines={1}>
        {data.title.toUpperCase()}
      </Txt>

      {/* filters */}
      <View style={styles.filterRow}>
        {PERIODS.map((p) => (
          <FilterChip key={p.key} label={p.label} on={period === p.key} onPress={() => setPeriod(p.key)} c={c} />
        ))}
      </View>
      <View style={styles.filterRow}>
        {(['unpaid', 'paid', 'all'] as const).map((s) => (
          <FilterChip key={s} label={s[0].toUpperCase() + s.slice(1)} on={status === s} onPress={() => setStatus(s)} c={c} accent />
        ))}
      </View>
      {payers.length > 2 ? (
        <View style={styles.filterRow}>
          {payers.map((p) => (
            <FilterChip key={p} label={p} on={payer === p} onPress={() => setPayer(p)} c={c} />
          ))}
        </View>
      ) : null}

      {/* unpaid total + settle */}
      {unpaid.length ? (
        <View style={[styles.totalCard, { backgroundColor: c.card }, cardShadow]}>
          <View style={{ flex: 1 }}>
            <Txt variant="small" faint>
              UNPAID {payer !== 'All' ? `· ${payer}` : ''}
            </Txt>
            <Txt style={{ fontWeight: '800', fontSize: 22, marginTop: 2 }}>{money(unpaidTotal, cur)}</Txt>
            <Txt variant="small" muted>
              {unpaid.length} receipt{unpaid.length === 1 ? '' : 's'}
            </Txt>
          </View>
          <Pressable onPress={busy ? undefined : settleAll} style={[styles.settle, { backgroundColor: c.a2 }]}>
            <Icon name="check" size={16} color="#06432b" />
            <Txt style={{ color: '#06432b', fontWeight: '800', fontSize: 13 }}>
              {busy ? 'Settling…' : `Settle ${unpaid.length}`}
            </Txt>
          </Pressable>
        </View>
      ) : null}

      {/* list */}
      <View style={{ gap: Space.s, marginTop: Space.l }}>
        {filtered.map((e) => {
          const open = openId === e.id;
          return (
            <Card key={e.id} onPress={() => setOpenId(open ? null : e.id)} style={{ gap: open ? Space.s : 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s }}>
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontWeight: '800' }} numberOfLines={1}>
                    {e.merchant ?? 'Receipt'}
                  </Txt>
                  <Txt variant="small" muted numberOfLines={1}>
                    {e.payer} · {e.date}
                    {e.items?.length ? ` · ${e.items.length} items` : ''}
                  </Txt>
                </View>
                <Txt style={{ fontWeight: '800' }}>{money(e.amount, e.currency ?? cur)}</Txt>
                <StatusPill label={e.status === 'paid' ? 'PAID' : 'UNPAID'} tone={e.status === 'paid' ? 'active' : 'neutral'} />
              </View>

              {open ? (
                <>
                  {e.receiptUrl ? (
                    <Image source={{ uri: e.receiptUrl }} style={styles.receipt} contentFit="cover" />
                  ) : null}
                  {e.items?.length ? (
                    <View style={{ gap: 6, marginTop: 2 }}>
                      {e.items.map((item, i) => (
                        <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                          <Txt variant="small" style={{ flex: 1 }} numberOfLines={1}>
                            {item.qty && item.qty > 1 ? `${item.qty}× ` : ''}
                            {item.name}
                          </Txt>
                          {item.price != null ? (
                            <Txt variant="small" muted>
                              {money(item.price, e.currency ?? cur)}
                            </Txt>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {e.note ? (
                    <Txt variant="small" muted style={{ fontStyle: 'italic' }}>
                      {e.note}
                    </Txt>
                  ) : null}
                  <View style={{ flexDirection: 'row', gap: Space.s, marginTop: 4 }}>
                    <Pressable onPress={() => markPaid(e)} style={[styles.action, { backgroundColor: e.status === 'paid' ? c.fieldBg : c.a2 }]}>
                      <Txt style={{ fontWeight: '800', fontSize: 12.5, color: e.status === 'paid' ? c.sec : '#06432b' }}>
                        {e.status === 'paid' ? 'Mark unpaid' : 'Mark paid'}
                      </Txt>
                    </Pressable>
                    <Pressable onPress={() => remove(e)} style={[styles.action, { backgroundColor: c.fieldBg }]}>
                      <Icon name="close" size={14} color={c.danger} />
                      <Txt style={{ fontWeight: '800', fontSize: 12.5, color: c.danger }}>Remove</Txt>
                    </Pressable>
                  </View>
                </>
              ) : null}
            </Card>
          );
        })}
        {!filtered.length ? (
          <Txt variant="sec" muted style={{ textAlign: 'center', paddingVertical: Space.l }}>
            No receipts here yet. Add one below.
          </Txt>
        ) : null}
      </View>

      <View style={{ marginTop: Space.l, gap: Space.s }}>
        <PillButton
          label="Add expense"
          icon="plus"
          knob
          onPress={() =>
            go({
              pathname: '/add-expense',
              params: { it: data.id, currency: cur, payers: (data.members ?? []).map((m) => m.name).join('|') },
            })
          }
        />
        <PillButton label="Companions & sharing" icon="users" variant="secondary" onPress={() => go({ pathname: '/companions', params: { it: data.id } })} />
      </View>

      <Txt variant="small" faint style={{ textAlign: 'center', marginTop: Space.m, lineHeight: 16 }}>
        You send the money via GCash/bank; Wayfare records &amp; proves it. Proof + signature coming next.
      </Txt>
    </MapFirst>
  );
}

function FilterChip({ label, on, onPress, c, accent }: { label: string; on: boolean; onPress: () => void; c: ReturnType<typeof useWayfare>['c']; accent?: boolean }) {
  const bg = on ? (accent ? c.a3 : c.primary) : c.card;
  return (
    <Pressable onPress={onPress} style={[styles.fchip, { backgroundColor: bg }]}>
      <Txt style={{ fontWeight: '700', fontSize: 12.5, color: on ? '#fff' : c.ink }}>{label}</Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: Space.s },
  fchip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999 },
  totalCard: { flexDirection: 'row', alignItems: 'center', gap: Space.m, borderRadius: 18, padding: Space.l, marginTop: Space.l },
  settle: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11 },
  receipt: { width: '100%', height: 150, borderRadius: 12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
});
