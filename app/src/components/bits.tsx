import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Semantic } from '@/constants/app-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Scheme = 'light' | 'dark';
function useScheme(): Scheme {
  const s = useColorScheme();
  return s === 'unspecified' ? 'light' : (s as Scheme);
}

/** A small rounded label. Pass a color for tinted variants. */
export function Chip({ label, color }: { label: string; color?: string }) {
  const scheme = useScheme();
  const tint = color ?? (scheme === 'dark' ? '#3A3D42' : '#EEF0F3');
  const textColor = color ? '#ffffff' : undefined;
  return (
    <View style={[styles.chip, { backgroundColor: tint }]}>
      <ThemedText type="small" style={[styles.chipText, textColor ? { color: textColor } : null]}>
        {label}
      </ThemedText>
    </View>
  );
}

/** Labeled cost value, e.g. Travel ₱700. */
export function CostPill({ label, value, kind }: { label: string; value: string; kind: 'travel' | 'food' }) {
  const scheme = useScheme();
  const c = Semantic[kind][scheme];
  return (
    <View style={[styles.costPill, { borderColor: c }]}>
      <ThemedText type="small" style={[styles.costLabel, { color: c }]}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color: c }}>
        {value}
      </ThemedText>
    </View>
  );
}

export function ScreenState({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry?: () => void }) {
  return (
    <ThemedView style={styles.center}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <ThemedText type="subtitle" style={styles.errTitle}>
            Couldn’t load
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.errText}>
            {error}
          </ThemedText>
          {onRetry ? (
            <ThemedText type="link" onPress={onRetry} style={styles.retry}>
              Tap to retry
            </ThemedText>
          ) : null}
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
  },
  chipText: { fontWeight: '600' },
  costPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 8,
    borderWidth: 1,
  },
  costLabel: { fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.two },
  errTitle: { textAlign: 'center' },
  errText: { textAlign: 'center' },
  retry: { textDecorationLine: 'underline' },
});
