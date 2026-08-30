// Wayfare design tokens — the locked "Playful Adventure" direction (from
// docs app-preview.html + design/direction-playful.html).
// Light = lavender bg, white cards, grape-violet primary.
// Dark  = "Night" (deep grape/indigo, grape primary).
// The palette is consolidated to THREE hues + shades: grape (primary/culture),
// marigold (food/warmth/warnings), mint (success/nature). a1=marigold, a2=mint,
// a3=grape, a4=grape-light — so the accent roles still map cleanly.

export type Scheme = 'light' | 'dark';

export interface WayfarePalette {
  bg: string; // screen background
  card: string; // surface / card
  ink: string; // primary text
  sec: string; // secondary text
  ter: string; // tertiary / faint text, disabled
  line: string; // hairline separators
  primary: string; // primary CTA fill (pill buttons)
  onPrimary: string; // text/icon on primary
  a1: string; // accent — orange (food / travel warmth)
  a2: string; // accent — green (done / nature)
  a3: string; // accent — blue (culture / info)
  a4: string; // accent — violet (nightlife / romance)
  danger: string;
  fieldBg: string; // input / inset field background
}

export const Palettes: Record<Scheme, WayfarePalette> = {
  light: {
    bg: '#ECE6FF', // lavender
    card: '#FFFFFF',
    ink: '#2C2550', // grape-ink
    sec: '#726B99',
    ter: '#B9AEE6',
    line: '#E4DCFB',
    primary: '#7C5CF6', // grape
    onPrimary: '#FFFFFF',
    a1: '#FFA828', // marigold — food / warmth
    a2: '#2FD98A', // mint — done / nature / success
    a3: '#7C5CF6', // grape — culture / info
    a4: '#9E86FF', // grape-light — nightlife / romance
    danger: '#E0662A', // deep amber (palette-consistent; swap to a red if you want a true error hue)
    fieldBg: '#F1ECFF',
  },
  dark: {
    // Aligned 1:1 with the app-preview.html Map-first design tokens:
    // bg = --night-card (the glass sheet surface), map backdrop = --night #17123A.
    bg: '#2A2166', // night-card — the sheet
    card: '#332B77', // subtle lift for cards over the sheet (≈ rgba(255,255,255,.06))
    ink: '#EDE9FF', // night-ink
    sec: '#B4ADE0', // night-sub
    ter: '#6B61A8',
    line: '#3E3480',
    primary: '#7C5CF6', // grape
    onPrimary: '#FFFFFF',
    a1: '#FFA828', // marigold
    a2: '#2FD98A', // mint
    a3: '#9E86FF', // grape-hi
    a4: '#B8A6FF', // grape-lighter
    danger: '#FF6B6B',
    fieldBg: '#2E2664', // glass field
  },
};

/** Primary CTA gradient (grape). Feed to expo-linear-gradient `colors`. */
export const Gradients = {
  grape: ['#7C5CF6', '#9E86FF'] as const,
  marigold: ['#FFD877', '#FF9F1C'] as const,
  mint: ['#8DEBBE', '#22C47C'] as const,
  night: ['#2A2166', '#17123A'] as const,
};

/** Font families. Display = Anton (giant headlines), body = Fredoka (rounded UI). */
export const Type = {
  display: 'Anton',
  body: 'Fredoka',
} as const;

// Category → accent role. Used for the coloured icon chips.
export const CategoryColor = {
  coffee: 'a1',
  food: 'a1',
  culture: 'a3',
  museum: 'a3',
  nature: 'a2',
  done: 'a2',
  nightlife: 'a4',
  romance: 'a4',
  travel: 'a1',
} as const;

export const Radius = {
  chip: 999,
  field: 16,
  card: 24,
  cardLg: 28,
  hero: 30,
  pill: 999,
} as const;

export const Space = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 22,
  xxl: 32,
} as const;

// Soft violet elevation used on the playful cards.
export function cardShadow(scheme: Scheme) {
  return scheme === 'dark'
    ? {
        shadowColor: '#000',
        shadowOpacity: 0.45,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }
    : {
        shadowColor: '#3A2680', // grape-tinted shadow
        shadowOpacity: 0.14,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 10 },
        elevation: 3,
      };
}

// CTA glow tinted by the primary (grape) so buttons pop off the page.
export function ctaShadow(scheme: Scheme, primary: string) {
  return {
    shadowColor: primary,
    shadowOpacity: scheme === 'dark' ? 0.5 : 0.32,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  };
}
