// Photo helpers — bundled asset image + optional cinematic gradient scrim.
import { Image, ImageStyle } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { img, ImageKey } from '@/lib/images';

export function Photo({
  name,
  style,
  radius = 0,
}: {
  name: ImageKey;
  style?: StyleProp<ImageStyle>;
  radius?: number;
}) {
  return (
    <Image
      source={img(name)}
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius }, style]}
      contentFit="cover"
      transition={200}
    />
  );
}

// A photo tile with a bottom-up dark scrim and children laid over it.
export function PhotoCard({
  name,
  height,
  radius = 28,
  children,
  scrim = ['rgba(0,0,0,0)', 'rgba(0,0,0,0.72)'],
  style,
}: {
  name: ImageKey;
  height: number;
  radius?: number;
  children?: ReactNode;
  scrim?: [string, string, ...string[]];
  style?: ViewStyle;
}) {
  return (
    <View style={[{ height, borderRadius: radius, overflow: 'hidden' }, style]}>
      <Photo name={name} />
      <LinearGradient colors={scrim} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}
