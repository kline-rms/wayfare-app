// Opens a coordinate in the platform maps app (falls back to Google Maps web).
import { Linking, Platform } from 'react-native';

export function openMaps(lat: number, lng: number, label?: string) {
  const q = label ? encodeURIComponent(label) : `${lat},${lng}`;
  const url = Platform.select({
    ios: `maps://?ll=${lat},${lng}&q=${q}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${q})`,
    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  });
  Linking.openURL(url).catch(() => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  });
}

export function mapsEmbedUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
