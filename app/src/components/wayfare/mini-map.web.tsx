// Web mini-map. When the query is "lat,lng" we render the real cinematic
// WayfareMap (brand-consistent); for a name-only query we fall back to the
// keyless Google Maps embed.
import { View } from 'react-native';

import WayfareMap from './wayfare-map';
import { useWayfare } from './theme';

function parseCoords(q: string): { lat: number; lng: number } | null {
  const m = q.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export function MiniMap({ q, height = 190 }: { q: string; height?: number }) {
  const { c } = useWayfare();
  const coords = parseCoords(q);
  if (coords) {
    return (
      <WayfareMap
        stops={[{ lat: coords.lat, lng: coords.lng, color: '#7C5CF6' }]}
        height={height}
        interactive={false}
        fit={false}
        pitch={40}
        style={{ borderRadius: 18 }}
      />
    );
  }
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
  return (
    <View style={{ height, borderRadius: 18, overflow: 'hidden', backgroundColor: c.fieldBg }}>
      <iframe
        title="Location map"
        src={src}
        loading="lazy"
        style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
      />
    </View>
  );
}
