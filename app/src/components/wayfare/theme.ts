// Resolves the active Wayfare palette from the OS colour scheme.
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Palettes, cardShadow, ctaShadow, type Scheme, type WayfarePalette } from '@/constants/wayfare';

export interface Wayfare {
  scheme: Scheme;
  c: WayfarePalette;
  cardShadow: ReturnType<typeof cardShadow>;
  ctaShadow: ReturnType<typeof ctaShadow>;
}

export function useWayfare(): Wayfare {
  const raw = useColorScheme();
  const scheme: Scheme = raw === 'dark' ? 'dark' : 'light';
  const c = Palettes[scheme];
  return {
    scheme,
    c,
    cardShadow: cardShadow(scheme),
    ctaShadow: ctaShadow(scheme, c.primary),
  };
}
