// Native map (iOS / Android) — the real MapLibre map, matching the web map's
// dark vector ground, amber route and coloured pins + a directional "you" puck.
// Renders only in a custom dev build (see docs/NATIVE-BUILD.md); Expo Go can't
// load the native module. Web uses wayfare-map.web.tsx instead.
//
// NOTE: written against @maplibre/maplibre-react-native v11 and verified to
// bundle, but the on-device render is confirmed once you run a dev build. The 3D
// building extrusions the web map draws are the documented next step here (they
// need the basemap's vector source id, best pinned against a running map).
import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Camera, GeoJSONSource, Layer, Map, Marker } from '@maplibre/maplibre-react-native';

import { GRAPE, NIGHT, OPENFREEMAP_DARK, ROUTE_AMBER, routeFrom, type WayfareMapProps } from './wayfare-map.shared';

function styleUrl(): string {
  return process.env.EXPO_PUBLIC_MAP_STYLE_URL || OPENFREEMAP_DARK;
}

/** Navigation puck — a halo + Google-style chevron (the map is heading/route-up,
 * so the chevron reads "up" = travel direction), or a dot when there's no facing. */
function YouPuck({ oriented }: { oriented: boolean }) {
  return (
    <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(124,92,246,0.18)' }} />
      {oriented ? (
        <Svg width={30} height={30} viewBox="0 0 24 24" style={{ position: 'absolute' }}>
          <Path d="M12 2.5 L20 21 L12 16.4 L4 21 Z" fill={GRAPE} stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
        </Svg>
      ) : (
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: GRAPE, borderWidth: 2.5, borderColor: '#fff' }} />
      )}
    </View>
  );
}

function Pin({ n, color }: { n: number; color?: string }) {
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        borderBottomLeftRadius: 2,
        backgroundColor: color ?? GRAPE,
        borderWidth: 2,
        borderColor: NIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '45deg' }],
      }}>
      <View style={{ transform: [{ rotate: '-45deg' }] }}>
        <View />
      </View>
    </View>
  );
}

export function WayfareMap({
  stops,
  routeGeometry,
  height = 280,
  pitch = 52,
  bearing = -18,
  focus,
  youHeading,
  style,
}: WayfareMapProps) {
  const geometry = routeGeometry ?? routeFrom(stops);
  const routeShape = useMemo(() => ({ type: 'Feature', properties: {}, geometry }) as any, [geometry]);

  const first = stops.find((s) => s.you) ?? stops[0];
  const center: [number, number] = focus
    ? [focus.lng, focus.lat]
    : first
      ? [first.lng, first.lat]
      : [121.05, 14.55];
  const zoom = focus?.zoom ?? (stops.length > 1 ? 14 : 15);
  const camBearing = focus?.bearing ?? bearing;

  return (
    <View style={[{ height, borderRadius: 22, overflow: 'hidden', backgroundColor: NIGHT }, style]}>
      <Map mapStyle={styleUrl()} style={{ flex: 1 }}>
        {/* Declarative camera — follows focus/heading changes as props update. */}
        <Camera center={center} zoom={zoom} pitch={pitch} bearing={camBearing} duration={600} />

        {geometry.coordinates.length > 1 ? (
          <GeoJSONSource id="wf-route" data={routeShape}>
            <Layer
              id="wf-route-glow"
              type="line"
              style={{ lineColor: GRAPE, lineWidth: 9, lineOpacity: 0.35, lineCap: 'round', lineJoin: 'round' }}
            />
            <Layer
              id="wf-route-line"
              type="line"
              style={{ lineColor: ROUTE_AMBER, lineWidth: 4, lineDasharray: [2, 2], lineCap: 'round', lineJoin: 'round' }}
            />
          </GeoJSONSource>
        ) : null}

        {stops.map((s, i) => (
          <Marker key={`${s.lat},${s.lng},${i}`} id={`wf-stop-${i}`} lngLat={[s.lng, s.lat]} anchor={s.you ? 'center' : 'bottom'}>
            {s.you ? <YouPuck oriented={youHeading != null || focus?.bearing != null} /> : <Pin n={s.number ?? i + 1} color={s.color} />}
          </Marker>
        ))}
      </Map>
    </View>
  );
}

export default WayfareMap;
