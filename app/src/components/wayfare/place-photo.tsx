// A place thumbnail that shows the real Google photo when the place has been
// enriched (has a Place ID + a cached photo ref), and silently falls back to the
// bundled stock image otherwise — so the UI looks the same whether Places is on,
// off, or a given place simply isn't linked yet. No network cost of its own; the
// photo URL is a server proxy (key-less, bytes never stored).
import { useState } from 'react';
import { Image, type ImageStyle } from 'expo-image';
import type { ImageSourcePropType, StyleProp } from 'react-native';

import { usePlaceCard } from '@/lib/places';

export function PlacePhoto({
  placeId,
  fallback,
  style,
}: {
  placeId?: string;
  fallback: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
}) {
  const card = usePlaceCard(placeId);
  const [failed, setFailed] = useState(false);
  const uri = !failed ? card?.photoUrls?.[0] : undefined;
  return (
    <Image
      source={uri ? { uri } : fallback}
      style={style}
      contentFit="cover"
      transition={200}
      onError={() => setFailed(true)}
    />
  );
}
