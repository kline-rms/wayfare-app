// Chat with Wayfare AI — a guided conversation that fills the draft, then hands
// off to generation (the same 3-proposals result the build path produces).
// Map-first: the conversation lives in a light sheet over the live map backdrop.
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/components/wayfare/icon';
import { MapIconButton } from '@/components/wayfare/map-first';
import { WayfareMap } from '@/components/wayfare/wayfare-map';
import { useWayfare } from '@/components/wayfare/theme';
import { AIOrb, Field, PillButton, Txt } from '@/components/wayfare/ui';
import { Space } from '@/constants/wayfare';
import { api } from '@/lib/api';
import { back, replaceTo } from '@/lib/nav';
import { wizard } from '@/lib/wizard';
import type { GenerateRequest } from '@/lib/types';

const YOU = [{ lat: 14.5548, lng: 121.0509, you: true }];

type StepKey = 'origin' | 'destination' | 'partySize' | 'purpose';
const STEPS: { key: StepKey; q: string; ph: string; numeric?: boolean }[] = [
  { key: 'origin', q: "Hi, I'm Wayfare! Where are you starting from?", ph: 'e.g. Avida Verte, BGC' },
  { key: 'destination', q: 'Lovely. And where are we heading?', ph: 'e.g. Manila & Makati' },
  { key: 'partySize', q: 'How many of you are travelling?', ph: 'e.g. 4', numeric: true },
  { key: 'purpose', q: 'Last one — what is the trip for?', ph: 'e.g. Family heritage + food' },
];

interface Msg {
  role: 'ai' | 'me';
  text: string;
}

export default function Chat() {
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollView>(null);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'ai', text: STEPS[0].q }]);
  const done = step >= STEPS.length;

  useEffect(() => {
    wizard.reset();
  }, []);
  useEffect(() => {
    scroller.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const send = () => {
    const val = input.trim();
    if (!val || done) return;
    const cur = STEPS[step];
    wizard.patch({ [cur.key]: cur.numeric ? Number(val) || 1 : val } as Partial<GenerateRequest>);
    const next = step + 1;
    const replies: Msg[] = [{ role: 'me', text: val }];
    if (next < STEPS.length) replies.push({ role: 'ai', text: STEPS[next].q });
    else replies.push({ role: 'ai', text: 'Perfect — I have what I need. Ready to see 3 plans?' });
    setMessages((m) => [...m, ...replies]);
    setStep(next);
    setInput('');
  };

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.generate(wizard.get() as GenerateRequest);
      wizard.setResult(res);
      replaceTo('/create/proposals');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#17123A' }}>
      <View style={StyleSheet.absoluteFill}>
        <WayfareMap stops={YOU} character fit={false} pitch={52} style={{ flex: 1, borderRadius: 0 }} />
      </View>
      <LinearGradient
        colors={['rgba(23,18,58,0.6)', 'rgba(23,18,58,0.0)']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 180 }}
        pointerEvents="none"
      />

      {/* Floating header */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={back}>
          <MapIconButton>
            <Icon name="back" size={22} color="#fff" />
          </MapIconButton>
        </Pressable>
        <AIOrb size={30} />
        <Txt style={{ fontWeight: '800', fontSize: 16, color: '#fff' }}>Wayfare AI</Txt>
      </View>

      {/* Conversation sheet */}
      <View style={[styles.sheet, { top: '34%', backgroundColor: c.bg }]}>
        <View style={[styles.grab, { backgroundColor: c.ter }]} />
        <ScrollView
          ref={scroller}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: Space.xl, paddingTop: Space.s, paddingBottom: Space.l, gap: Space.s }}>
          {messages.map((m, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                m.role === 'ai'
                  ? { backgroundColor: c.fieldBg, alignSelf: 'flex-start', borderBottomLeftRadius: 4 }
                  : { backgroundColor: c.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
              ]}>
              <Txt style={{ color: m.role === 'ai' ? c.ink : c.onPrimary }}>{m.text}</Txt>
            </View>
          ))}
          {error ? (
            <Txt variant="sec" style={{ color: c.danger }}>
              {error}
            </Txt>
          ) : null}
        </ScrollView>

        <View style={{ paddingHorizontal: Space.xl, paddingTop: Space.s, paddingBottom: insets.bottom + Space.m, gap: Space.m }}>
          {done ? (
            <PillButton label={busy ? 'Building your plans…' : 'Generate 3 plans'} icon="spark" knob onPress={busy ? undefined : generate} />
          ) : (
            <Field
              placeholder={STEPS[step].ph}
              value={input}
              onChangeText={setInput}
              keyboardType={STEPS[step].numeric ? 'numeric' : 'default'}
              trailing={
                <Pressable onPress={send} hitSlop={8} style={({ pressed }) => [styles.sendBtn, { backgroundColor: c.primary }, pressed && { opacity: 0.8 }]}>
                  <Icon name="send" size={16} color={c.onPrimary} />
                </Pressable>
              }
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    shadowColor: '#160E3B',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, marginBottom: 6 },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10 },
  sendBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
