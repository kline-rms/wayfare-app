// A mosaic of real place photos, so a card that covers several destinations
// *looks* like several destinations — not one hero. Each tile falls back to its
// stock image when the place isn't linked / Places is off. Deliberately does NOT
// include "where you are" — callers pass only the destinations for the day/trip.
import { StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { PlacePhoto } from './place-photo';

export interface CollageItem {
  placeId?: string;
  fallback: ImageSourcePropType;
}

const GAP = 2;

export function PhotoCollage({ items, style, radius = 16 }: { items: CollageItem[]; style?: any; radius?: number }) {
  const list = items.slice(0, 4);

  // 0–1 places → a single photo (no mosaic).
  if (list.length <= 1) {
    return <PlacePhoto placeId={list[0]?.placeId} fallback={list[0]?.fallback} style={[{ borderRadius: radius }, style]} />;
  }

  const tile = (it: CollageItem, key: number) => (
    <PlacePhoto key={key} placeId={it.placeId} fallback={it.fallback} style={styles.tile} />
  );

  return (
    <View style={[styles.wrap, { borderRadius: radius }, style]}>
      {list.length === 2 ? (
        <View style={styles.row}>
          {tile(list[0], 0)}
          {tile(list[1], 1)}
        </View>
      ) : list.length === 3 ? (
        <View style={styles.row}>
          {tile(list[0], 0)}
          <View style={styles.col}>
            {tile(list[1], 1)}
            {tile(list[2], 2)}
          </View>
        </View>
      ) : (
        <View style={styles.col}>
          <View style={styles.row}>
            {tile(list[0], 0)}
            {tile(list[1], 1)}
          </View>
          <View style={styles.row}>
            {tile(list[2], 2)}
            {tile(list[3], 3)}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)' },
  row: { flex: 1, flexDirection: 'row', gap: GAP },
  col: { flex: 1, flexDirection: 'column', gap: GAP },
  tile: { flex: 1, width: undefined, height: undefined },
});
