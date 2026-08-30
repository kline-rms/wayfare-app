// Native map (iOS / Android). A real MapLibre native map needs the
// maplibre-react-native module + a custom dev build (Stage 4). Until then this
// renders a faithful static preview from the same stops: the night ground, the
// amber dashed route and the coloured pins, positioned by normalising lat/lng.
import { View, Text } from 'react-native';
import Svg, { Rect, Path, Circle, Line } from 'react-native-svg';

import { GRAPE, NIGHT, ROUTE_AMBER, type WayfareMapProps } from './wayfare-map.shared';

export function WayfareMap({ stops, height = 280, style }: WayfareMapProps) {
  const W = 340;
  const H = height;
  const pad = 34;
  const lats = stops.map((s) => s.lat);
  const lngs = stops.map((s) => s.lng);
  const minLa = lats.length ? Math.min(...lats) : 0;
  const maxLa = lats.length ? Math.max(...lats) : 1;
  const minLn = lngs.length ? Math.min(...lngs) : 0;
  const maxLn = lngs.length ? Math.max(...lngs) : 1;
  const spanLa = maxLa - minLa || 1;
  const spanLn = maxLn - minLn || 1;
  const px = (s: { lng: number }) => pad + ((s.lng - minLn) / spanLn) * (W - 2 * pad);
  const py = (s: { lat: number }) => H - pad - ((s.lat - minLa) / spanLa) * (H - 2 * pad);
  const pts = stops.map((s) => [px(s), py(s)] as const);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

  return (
    <View style={[{ height, borderRadius: 22, overflow: 'hidden', backgroundColor: NIGHT }, style]}>
      <Svg width="100%" height={height} viewBox={`0 0 ${W} ${H}`}>
        <Rect width={W} height={H} fill={NIGHT} />
        {/* faint street grid */}
        {[0.25, 0.5, 0.75].map((t) => (
          <Line key={`h${t}`} x1={0} y1={H * t} x2={W} y2={H * t - 12} stroke="#241A55" strokeWidth={8} />
        ))}
        {[0.3, 0.6, 0.85].map((t) => (
          <Line key={`v${t}`} x1={W * t} y1={0} x2={W * t - 12} y2={H} stroke="#241A55" strokeWidth={8} />
        ))}
        {pts.length > 1 ? (
          <Path d={d} stroke={ROUTE_AMBER} strokeWidth={4} strokeDasharray="2 10" strokeLinecap="round" fill="none" />
        ) : null}
        {pts.map((p, i) =>
          stops[i].you ? (
            <Circle key={i} cx={p[0]} cy={p[1]} r={10} fill={GRAPE} opacity={0.9} />
          ) : (
            <Circle key={i} cx={p[0]} cy={p[1]} r={7} fill={stops[i].color ?? GRAPE} stroke={NIGHT} strokeWidth={2} />
          ),
        )}
      </Svg>
      <Text style={{ position: 'absolute', bottom: 8, left: 12, color: '#A69FD6', fontSize: 9, fontWeight: '600' }}>
        Live map on the device build
      </Text>
    </View>
  );
}

export default WayfareMap;
