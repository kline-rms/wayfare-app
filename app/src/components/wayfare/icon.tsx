// Wayfare icon set — ported 1:1 from the design canvas SVG paths.
// Line icons render via react-native-svg. Default stroke 2, round caps/joins.
import { memo } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

type El =
  | ['p', string] // path d
  | ['c', number, number, number] // circle cx cy r
  | ['r', number, number, number, number, number?]; // rect x y w h rx

interface Def {
  sw?: number; // stroke width (default 2)
  fill?: boolean; // filled (no stroke) — uses color as fill
  el: El[];
}

const D: Record<string, Def> = {
  bell: { el: [['p', 'M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8'], ['p', 'M10.5 21a2 2 0 0 0 3 0']] },
  home: { el: [['p', 'M3 11l9-7 9 7'], ['p', 'M5 10v10h14V10'], ['p', 'M9 20v-6h6v6']] },
  compass: { el: [['c', 12, 12, 9], ['p', 'm15.5 8.5-2 5-5 2 2-5z']] },
  gear: { el: [['c', 12, 12, 3], ['p', 'M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15a1.6 1.6 0 0 0-1.5-1H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 3 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 8 4.6a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1A1.6 1.6 0 0 0 16 4.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z']] },
  checkC: { sw: 2.2, el: [['c', 12, 12, 9], ['p', 'm8.5 12 2.5 2.5 4.5-5']] },
  check: { sw: 2.6, el: [['p', 'M20 6 9 17l-5-5']] },
  globe: { el: [['c', 12, 12, 9], ['p', 'M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18']] },
  phone: { el: [['p', 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9z']] },
  wallet: { el: [['r', 3, 6, 18, 13, 3], ['p', 'M3 10h18M16 14h2']] },
  logout: { el: [['p', 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3'], ['p', 'M10 17l-5-5 5-5M5 12h11']] },
  flag: { el: [['p', 'M5 21V4h13l-2 4 2 4H5']] },
  edit: { el: [['p', 'M12 20h9'], ['p', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z']] },
  moon: { el: [['p', 'M21 12.8A8 8 0 1 1 11.2 3 6.2 6.2 0 0 0 21 12.8Z']] },
  upload: { el: [['p', 'M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4'], ['p', 'M12 15V3M7 8l5-5 5 5']] },
  file: { el: [['p', 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z'], ['p', 'M14 3v5h5']] },
  users: { el: [['c', 9, 8, 3.4], ['p', 'M3 20a6 6 0 0 1 12 0'], ['p', 'M16 5.2a3.4 3.4 0 0 1 0 5.6M21 20a6 6 0 0 0-4-5.6']] },
  wand: { el: [['p', 'M15 4V2M15 10v-2M11 6H9M21 6h-2M18 3l-1.4 1.4M18 9l-1.4-1.4M4 20l10-10']] },
  search: { el: [['c', 11, 11, 7], ['p', 'm20 20-3.2-3.2']] },
  close: { sw: 2.4, el: [['p', 'M6 6l12 12M18 6 6 18']] },
  brief: { el: [['r', 3, 7, 18, 13, 2.5], ['p', 'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18']] },
  calClock: { el: [['p', 'M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6M8 2v4M16 2v4M3 10h18'], ['c', 17.5, 17.5, 4], ['p', 'M17.5 16v1.5l1 .8']] },
  alert: { el: [['p', 'M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z'], ['p', 'M12 9v4M12 17h.01']] },
  refresh: { el: [['p', 'M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5']] },
  wine: { el: [['p', 'M8 22h8M12 15v7M6 3h12l-1 6a5 5 0 0 1-10 0z']] },
  car: { el: [['p', 'M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13'], ['p', 'M4 13h16v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z'], ['p', 'M7 16h.01M17 16h.01']] },
  walk: { el: [['c', 13, 4, 1.6], ['p', 'M11 21l2-5-3-2 1-5 3 2 2 2M9 13l1-4']] },
  music: { el: [['p', 'M9 18V5l11-2v13'], ['c', 6, 18, 3], ['c', 17, 16, 3]] },
  swap: { el: [['p', 'M16 3l4 4-4 4M20 7H8M8 21l-4-4 4-4M4 17h12']] },
  arrow: { sw: 2.2, el: [['p', 'M5 12h14'], ['p', 'm13 6 6 6-6 6']] },
  back: { sw: 2.2, el: [['p', 'm15 18-6-6 6-6']] },
  chevR: { sw: 2.4, el: [['p', 'm9 6 6 6-6 6']] },
  cal: { el: [['r', 3, 5, 18, 16, 3], ['p', 'M8 3v4M16 3v4M3 10h18']] },
  clock: { el: [['c', 12, 12, 9], ['p', 'M12 7v5l3 2']] },
  pin: { el: [['p', 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z'], ['c', 12, 10, 2.4]] },
  plus: { sw: 2.4, el: [['p', 'M12 5v14M5 12h14']] },
  minus: { sw: 2.4, el: [['p', 'M5 12h14']] },
  locate: { el: [['p', 'M12 2v3M12 19v3M2 12h3M19 12h3'], ['c', 12, 12, 4]] },
  nav: { el: [['p', 'M3 11l19-9-9 19-2-8-8-2z']] },
  dots3: { fill: true, el: [['c', 5, 12, 1.8], ['c', 12, 12, 1.8], ['c', 19, 12, 1.8]] },
  coffee: { el: [['p', 'M17 8h1a3 3 0 0 1 0 6h-1'], ['p', 'M3 8h14v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z'], ['p', 'M6 2v2M10 2v2M14 2v2']] },
  train: { el: [['r', 4, 3, 16, 14, 3], ['p', 'M4 11h16'], ['c', 8.5, 14, 1], ['c', 15.5, 14, 1], ['p', 'm7 20-1.5 2M17 20l1.5 2']] },
  temple: { el: [['p', 'M3 21h18M4 21v-9M20 21v-9M6 12v9M18 12v9M10 21v-4a2 2 0 0 1 4 0v4M2 12l10-6 10 6']] },
  food: { el: [['p', 'M4 3v7a2 2 0 0 0 2 2 2 2 0 0 0 2-2V3M6 3v18M15 3c-1.5 1-2 3-2 5s.5 3 2 3v10']] },
  star: { fill: true, el: [['p', 'm12 3 2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.9 6.6 19.4l1.2-6L3.4 9.3l6-.7z']] },
  share: { el: [['p', 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7'], ['p', 'M12 3v13M7 8l5-5 5 5']] },
  heart: { el: [['p', 'M19 14c1.5-1.6 3-3.3 3-5.5A3.5 3.5 0 0 0 12 6a3.5 3.5 0 0 0-10 2.5C2 10.7 3.5 12.4 5 14l7 7z']] },
  heart2: { fill: true, el: [['p', 'M12 21s-7-4.5-9.5-9A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z']] },
  spark: { el: [['p', 'm12 3 2 5.5L19.5 10l-5.5 2L12 17l-2-5-5.5-2L10 8.5z']] },
  send: { sw: 2.2, el: [['p', 'M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z']] },
  mail: { el: [['r', 3, 5, 18, 14, 3], ['p', 'm4 7 8 6 8-6']] },
  lock: { el: [['r', 4, 10, 16, 10, 2.5], ['p', 'M8 10V7a4 4 0 0 1 8 0v3']] },
  eye: { el: [['p', 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z'], ['c', 12, 12, 3]] },
  user: { el: [['c', 12, 8, 4], ['p', 'M4 21a8 8 0 0 1 16 0']] },
  route: { el: [['c', 6, 19, 2.5], ['c', 18, 5, 2.5], ['p', 'M8.5 19H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.5']] },
  image: { sw: 1.6, el: [['r', 3, 3, 18, 18, 3], ['c', 8.5, 8.5, 1.8], ['p', 'm21 15-5-5L5 21']] },
  peso: { el: [['p', 'M8 20V4h4.5a4 4 0 0 1 0 8H8M5 9h10M5 13h10']] },
  chevD: { sw: 2.4, el: [['p', 'm6 9 6 6 6-6']] },
};

export type IconName = keyof typeof D;

export const Icon = memo(function Icon({
  name,
  size = 22,
  color = '#191A1C',
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: any;
}) {
  const def = D[name];
  if (!def) return null;
  const stroke = def.fill ? undefined : color;
  const fill = def.fill ? color : 'none';
  const sw = def.sw ?? 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <G
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}>
        {def.el.map((e, i) => {
          if (e[0] === 'p') return <Path key={i} d={e[1]} />;
          if (e[0] === 'c') return <Circle key={i} cx={e[1]} cy={e[2]} r={e[3]} />;
          return <Rect key={i} x={e[1]} y={e[2]} width={e[3]} height={e[4]} rx={e[5]} />;
        })}
      </G>
    </Svg>
  );
});
