// Resolves the active Wayfare palette. Wayfare is a fixed cinematic-NIGHT app
// (Map-first, Approach 2): every screen is a glass sheet over the night map, so
// the palette is pinned to `dark` regardless of the OS colour scheme.
import { Palettes, cardShadow, ctaShadow, type Scheme, type WayfarePalette } from '@/constants/wayfare';

export interface Wayfare {
  scheme: Scheme;
  c: WayfarePalette;
  cardShadow: ReturnType<typeof cardShadow>;
  ctaShadow: ReturnType<typeof ctaShadow>;
}

export function useWayfare(): Wayfare {
  const scheme: Scheme = 'dark';
  const c = Palettes[scheme];
  return {
    scheme,
    c,
    cardShadow: cardShadow(scheme),
    ctaShadow: ctaShadow(scheme, c.primary),
  };
}
