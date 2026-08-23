// Wayfare design tokens — ported 1:1 from the approved design canvas.
// Light = "Neutral" (warm grey bg, white cards, near-black pill CTAs).
// Dark  = "Nightfall" (warm near-black, orange primary).
// The accent hues (orange / green / blue / violet) carry category meaning and
// stay constant across themes.

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
    bg: '#ECEBE8',
    card: '#FFFFFF',
    ink: '#191A1C',
    sec: '#9B9A96',
    ter: '#C3C1BC',
    line: '#EEEDEA',
    primary: '#17181A',
    onPrimary: '#FFFFFF',
    a1: '#F26B2A',
    a2: '#34B87E',
    a3: '#3E97E5',
    a4: '#8B7CF0',
    danger: '#E5484D',
    fieldBg: '#F4F3F1',
  },
  dark: {
    bg: '#141110',
    card: '#1E1A17',
    ink: '#F4EEE5',
    sec: '#A99C8C',
    ter: '#8B7F70',
    line: '#2C2622',
    primary: '#FF6A3D',
    onPrimary: '#FFFFFF',
    a1: '#F2B36B',
    a2: '#34B87E',
    a3: '#6AA6FF',
    a4: '#E0447E',
    danger: '#FF6B6B',
    fieldBg: '#241F1B',
  },
};

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

// Soft elevation used on white cards in the design (0 8px 22px rgba(20,20,20,.06)).
export function cardShadow(scheme: Scheme) {
  return scheme === 'dark'
    ? {
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }
    : {
        shadowColor: '#141414',
        shadowOpacity: 0.06,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
      };
}

export function ctaShadow(scheme: Scheme, primary: string) {
  return {
    shadowColor: scheme === 'dark' ? primary : '#17181A',
    shadowOpacity: scheme === 'dark' ? 0.5 : 0.26,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  };
}
