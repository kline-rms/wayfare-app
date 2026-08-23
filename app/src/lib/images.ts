// Static image registry — Metro requires literal require() calls, so map keys → assets.
// Photos are the real BGC / Manila set from the design canvas.
import type { ImageSourcePropType } from 'react-native';

export const Images = {
  bgc: require('@/assets/images/wayfare/bgc.jpg'),
  cathedral: require('@/assets/images/wayfare/cathedral.jpg'),
  city: require('@/assets/images/wayfare/city.jpg'),
  fortsantiago: require('@/assets/images/wayfare/fortsantiago.jpg'),
  manilabay: require('@/assets/images/wayfare/manilabay.jpg'),
  museum: require('@/assets/images/wayfare/museum.jpg'),
  dinner: require('@/assets/images/wayfare/dinner.jpg'),
  rooftop: require('@/assets/images/wayfare/rooftop.jpg'),
  pastry: require('@/assets/images/wayfare/pastry.jpg'),
  coffee: require('@/assets/images/wayfare/coffee.jpg'),
  icecream: require('@/assets/images/wayfare/icecream.jpg'),
  playground: require('@/assets/images/wayfare/playground.jpg'),
  sciencemuseum: require('@/assets/images/wayfare/sciencemuseum.jpg'),
} as const;

export type ImageKey = keyof typeof Images;

export function img(key: ImageKey): ImageSourcePropType {
  return Images[key];
}

// Maps a place / area name to a representative photo.
export function photoForPlace(name: string): ImageKey {
  const n = name.toLowerCase();
  if (n.includes('museum') && n.includes('science')) return 'sciencemuseum';
  if (n.includes('museum') || n.includes('gallery')) return 'museum';
  if (n.includes('cathedral') || n.includes('church')) return 'cathedral';
  if (n.includes('fort') || n.includes('intramuros') || n.includes('santiago')) return 'fortsantiago';
  if (n.includes('bay') || n.includes('roxas') || n.includes('iloilo')) return 'manilabay';
  if (n.includes('coffee') || n.includes('café') || n.includes('cafe')) return 'coffee';
  if (n.includes('rooftop') || n.includes('sky') || n.includes('bar')) return 'rooftop';
  if (n.includes('dinner') || n.includes('osteria') || n.includes('restaurant')) return 'dinner';
  if (n.includes('dessert') || n.includes('pastr') || n.includes('bakery')) return 'pastry';
  if (n.includes('makati') || n.includes('salcedo') || n.includes('poblacion')) return 'city';
  return 'bgc';
}
