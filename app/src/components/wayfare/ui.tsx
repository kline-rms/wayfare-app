// Wayfare UI kit — the shared building blocks every screen composes from.
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgLinear, Stop, Rect, Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Space, Gradients } from '@/constants/wayfare';
import { Fonts } from '@/constants/theme';
import { Icon, IconName } from './icon';
import { useWayfare } from './theme';

// Playful faces: Anton (giant condensed display) for the big headings, Fredoka
// (rounded) for everything else. Web loads them via global.css; native falls
// back until @expo-google-fonts/{anton,fredoka} are loaded in _layout.
const FF = (Fonts ?? {}) as { rounded?: string; heading?: string; mono?: string };

/* ---------- Typography ---------- */
type TxtVariant = 'h1' | 'h2' | 'title' | 'body' | 'sec' | 'small' | 'label' | 'mono';
const TXT: Record<TxtVariant, object> = {
  h1: { fontSize: 30, lineHeight: 31, fontWeight: '400', letterSpacing: 0.3, fontFamily: FF.heading, textTransform: 'uppercase' },
  h2: { fontSize: 23, lineHeight: 25, fontWeight: '400', letterSpacing: 0.3, fontFamily: FF.heading, textTransform: 'uppercase' },
  title: { fontSize: 17, lineHeight: 22, fontWeight: '700', fontFamily: FF.rounded },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '500', fontFamily: FF.rounded },
  sec: { fontSize: 13.5, lineHeight: 19, fontWeight: '500', fontFamily: FF.rounded },
  small: { fontSize: 12, lineHeight: 16, fontWeight: '600', fontFamily: FF.rounded },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.8, fontFamily: FF.rounded },
  mono: { fontSize: 12, lineHeight: 16, fontWeight: '600', fontVariant: ['tabular-nums'], fontFamily: FF.mono },
};

export function Txt({
  variant = 'body',
  color,
  muted,
  faint,
  style,
  ...rest
}: TextProps & { variant?: TxtVariant; color?: string; muted?: boolean; faint?: boolean }) {
  const { c } = useWayfare();
  const col = color ?? (faint ? c.ter : muted ? c.sec : c.ink);
  return <Text style={[TXT[variant], { color: col }, style]} {...rest} />;
}

/* ---------- Screen wrapper ---------- */
export function Screen({
  children,
  scroll = true,
  pad = true,
  edges = true,
  bg,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  pad?: boolean;
  edges?: boolean;
  bg?: string;
  contentStyle?: ViewStyle;
}) {
  const { c } = useWayfare();
  const insets = useSafeAreaInsets();
  const padStyle: ViewStyle = {
    paddingTop: edges ? insets.top + Space.s : 0,
    paddingHorizontal: pad ? Space.xl : 0,
    paddingBottom: insets.bottom + Space.xl,
  };
  const background = bg ?? c.bg;
  if (!scroll) {
    return <View style={[styles.flex, { backgroundColor: background }, padStyle, contentStyle]}>{children}</View>;
  }
  return (
    <View style={[styles.flex, { backgroundColor: background }]}>
      <ScrollView
        contentContainerStyle={[padStyle, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}

/* ---------- Card ---------- */
export function Card({
  children,
  style,
  onPress,
  padded = true,
}: {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padded?: boolean;
}) {
  const { c, cardShadow } = useWayfare();
  const base: ViewStyle = {
    backgroundColor: c.card,
    borderRadius: Radius.card,
    padding: padded ? Space.l : 0,
    ...cardShadow,
  };
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

/* ---------- Pill button (the black rounded CTA) ---------- */
export function PillButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  knob = false,
  full = true,
  style,
}: {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  knob?: boolean;
  full?: boolean;
  style?: ViewStyle;
}) {
  const { c, ctaShadow } = useWayfare();
  const isElevated = variant === 'primary' || variant === 'danger';
  const grad = variant === 'danger' ? Gradients.marigold : Gradients.grape;
  const fg = isElevated ? (variant === 'danger' ? '#5A3D00' : c.onPrimary) : c.ink;
  const flatBg = variant === 'secondary' ? c.card : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { alignSelf: full ? 'stretch' : 'flex-start', overflow: 'hidden', backgroundColor: isElevated ? undefined : flatBg },
        variant === 'secondary' && { borderWidth: 1, borderColor: c.line },
        isElevated && ctaShadow,
        pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
        style,
      ]}>
      {isElevated ? (
        <LinearGradient colors={[...grad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      ) : null}
      {icon && !knob ? <Icon name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.pillLabel, { color: fg }]}>{label}</Text>
      {knob ? (
        <View style={[styles.knob, { backgroundColor: '#fff' }]}>
          <Icon name={icon ?? 'arrow'} size={16} color={variant === 'danger' ? '#C47800' : c.primary} />
        </View>
      ) : null}
    </Pressable>
  );
}

/* ---------- Icon button (round / rounded-square) ---------- */
export function IconButton({
  name,
  onPress,
  size = 44,
  round = false,
  tint,
  iconColor,
  iconSize = 20,
  elevated = true,
}: {
  name: IconName;
  onPress?: () => void;
  size?: number;
  round?: boolean;
  tint?: string;
  iconColor?: string;
  iconSize?: number;
  elevated?: boolean;
}) {
  const { c, cardShadow } = useWayfare();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: round ? size / 2 : 14,
          backgroundColor: tint ?? c.card,
          alignItems: 'center',
          justifyContent: 'center',
        },
        elevated && cardShadow,
        pressed && { opacity: 0.8 },
      ]}>
      <Icon name={name} size={iconSize} color={iconColor ?? c.ink} />
    </Pressable>
  );
}

/* ---------- Category icon chip (coloured rounded square) ---------- */
export function CategoryIcon({
  name,
  color,
  size = 46,
  iconSize = 22,
}: {
  name: IconName;
  color: string;
  size?: number;
  iconSize?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.34,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={name} size={iconSize} color="#fff" />
    </View>
  );
}

/* ---------- Chip / Tag ---------- */
export function Chip({
  label,
  color,
  filled,
  small,
}: {
  label: string;
  color?: string;
  filled?: boolean;
  small?: boolean;
}) {
  // Filled = solid brand colour; otherwise a translucent "night" chip (design).
  const bg = filled ? (color ?? '#7C5CF6') : 'rgba(255,255,255,0.12)';
  const fg = filled ? '#fff' : '#fff';
  return (
    <View style={[styles.chip, { backgroundColor: bg, paddingVertical: small ? 4 : 6 }]}>
      <Text style={{ color: fg, fontSize: small ? 11 : 12.5, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

/* ---------- Status pill (ACTIVE / TODAY / DONE) — night styling ---------- */
export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'active' | 'done' | 'neutral' | 'accent' }) {
  const map = {
    active: { bg: 'rgba(47,217,138,0.24)', fg: '#8DEBBE' }, // mint
    done: { bg: 'rgba(47,217,138,0.24)', fg: '#8DEBBE' },
    accent: { bg: 'rgba(158,134,255,0.24)', fg: '#DCD0FF' }, // grape
    neutral: { bg: 'rgba(255,255,255,0.12)', fg: '#EDE9FF' },
  } as const;
  const t = map[tone];
  return (
    <View style={{ backgroundColor: t.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: t.fg, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

/* ---------- Section label ---------- */
export function SectionLabel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { c } = useWayfare();
  return (
    <Text style={[TXT.label, { color: c.sec, marginBottom: Space.s }, style]}>{String(children).toUpperCase()}</Text>
  );
}

/* ---------- Divider ---------- */
export function Divider() {
  const { c } = useWayfare();
  return <View style={{ height: 1, backgroundColor: c.line }} />;
}

/* ---------- Companion avatar (the recurring character — replaces the orb) ---------- */
export function AIOrb({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26">
      <Defs>
        <SvgLinear id="wf-av" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#9E86FF" />
          <Stop offset="1" stopColor="#6746DE" />
        </SvgLinear>
      </Defs>
      <Rect x="0" y="0" width="26" height="26" rx="8" fill="url(#wf-av)" />
      <Circle cx="13" cy="10" r="3.6" fill="#fff" />
      <Path d="M6 21 c0-3.9 3.1-7 7-7 s7 3.1 7 7" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <Circle cx="19.6" cy="7.4" r="2.1" fill="#FFB74D" />
    </Svg>
  );
}

/* ---------- AI tip card ---------- */
export function AITip({ children }: { children: ReactNode }) {
  const { c, cardShadow } = useWayfare();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: Space.m,
          backgroundColor: c.card,
          borderRadius: 22,
          padding: 14,
        },
        cardShadow,
      ]}>
      <AIOrb size={26} />
      <Text style={[TXT.sec, { color: c.sec, flex: 1 }]}>{children}</Text>
    </View>
  );
}

/* ---------- Stat row (3 metrics) ---------- */
export function StatRow({ items }: { items: [string, string][] }) {
  const { c } = useWayfare();
  return (
    <View style={{ flexDirection: 'row' }}>
      {items.map(([v, l], i) => (
        <View key={i} style={{ flex: 1 }}>
          <Text style={{ fontSize: 19, fontWeight: '800', letterSpacing: -0.4, color: c.ink }}>{v}</Text>
          <Text style={{ fontSize: 12, fontWeight: '500', color: c.sec, marginTop: 1 }}>{l}</Text>
        </View>
      ))}
    </View>
  );
}

/* ---------- Field (input row) ---------- */
export function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  trailing,
  autoCapitalize,
}: {
  icon?: IconName;
  placeholder?: string;
  value?: string;
  onChangeText?: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'default' | 'numeric';
  trailing?: ReactNode;
  autoCapitalize?: 'none' | 'sentences';
}) {
  const { c, cardShadow } = useWayfare();
  return (
    <View style={[styles.field, { backgroundColor: c.card }, cardShadow]}>
      {icon ? <Icon name={icon} size={18} color={c.ink} /> : null}
      <TextInput
        style={[styles.fieldInput, { color: c.ink }]}
        placeholder={placeholder}
        placeholderTextColor={c.ter}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {trailing}
    </View>
  );
}

/* ---------- List row ---------- */
export function ListRow({
  icon,
  iconColor,
  title,
  subtitle,
  trailing,
  onPress,
  last,
}: {
  icon?: IconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const { c } = useWayfare();
  const inner = (
    <View style={[styles.listRow, !last && { borderBottomWidth: 1, borderBottomColor: c.line }]}>
      {icon ? (
        <View style={[styles.listIcon, { backgroundColor: c.fieldBg }]}>
          <Icon name={icon} size={19} color={iconColor ?? c.ink} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[TXT.body, { color: c.ink, fontWeight: '700' }]}>{title}</Text>
        {subtitle ? <Text style={[TXT.small, { color: c.sec, marginTop: 1 }]}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      {inner}
    </Pressable>
  ) : (
    inner
  );
}

/* ---------- Loading / error state ---------- */
export function StateView({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}) {
  const { c } = useWayfare();
  return (
    <View style={[styles.flex, styles.center, { backgroundColor: c.bg }]}>
      {loading ? (
        <ActivityIndicator size="large" color={c.primary} />
      ) : (
        <>
          <Txt variant="h2">Couldn&apos;t load</Txt>
          <Txt variant="sec" muted style={{ textAlign: 'center' }}>
            {error}
          </Txt>
          {onRetry ? <PillButton label="Try again" onPress={onRetry} full={false} icon="refresh" /> : null}
        </>
      )}
    </View>
  );
}

/* ---------- Header (back + title + trailing) ---------- */
export function Header({
  title,
  onBack,
  trailing,
  large,
}: {
  title?: string;
  onBack?: () => void;
  trailing?: ReactNode;
  large?: boolean;
}) {
  const { c } = useWayfare();
  return (
    <View style={styles.headerRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.m, flex: 1 }}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.6 }}>
            <Icon name="back" size={22} color={c.ink} />
          </Pressable>
        ) : null}
        {title ? (
          <Text style={[large ? TXT.h1 : TXT.title, { color: c.ink }]} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

/* ---------- Toggle ---------- */
export function Toggle({ value, onChange }: { value: boolean; onChange?: (v: boolean) => void }) {
  const { c } = useWayfare();
  return (
    <Pressable
      onPress={() => onChange?.(!value)}
      style={{
        width: 50,
        height: 30,
        borderRadius: 15,
        padding: 3,
        backgroundColor: value ? c.a2 : c.ter,
        alignItems: value ? 'flex-end' : 'flex-start',
      }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' }} />
    </Pressable>
  );
}

/* ---------- Weather chip ---------- */
export function WeatherChip({ temp, label }: { temp: string; label: string }) {
  return (
    <View style={styles.weather}>
      <Icon name="spark" size={16} color="#F2B21A" />
      <View>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#191A1C' }}>{temp}</Text>
        <Text style={{ fontSize: 10, fontWeight: '600', color: '#9B9A96' }}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: Space.m, padding: Space.xl },
  pill: {
    minHeight: 56,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.s,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  pillLabel: { fontSize: 16, fontWeight: '700' },
  knob: {
    position: 'absolute',
    right: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: { paddingHorizontal: 14, borderRadius: 999, alignSelf: 'flex-start' },
  field: {
    minHeight: 56,
    borderRadius: Radius.field,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.m,
    paddingHorizontal: 16,
  },
  fieldInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: Space.m, paddingVertical: 13 },
  listIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  weather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.m },
});
