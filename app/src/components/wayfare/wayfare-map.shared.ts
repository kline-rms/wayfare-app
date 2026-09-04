// Shared contract for the Wayfare map (web = real MapLibre, native = SVG preview
// until the maplibre-react-native dev build). See memory: maps-places-architecture.
import { PROTOMAPS_DARK_LAYERS, PROTOMAPS_GLYPHS, PROTOMAPS_SPRITE } from './protomaps-dark';

export interface MapStop {
  lat: number;
  lng: number;
  label?: string;
  /** Secondary line shown in the pin's info popup (area, time, etc.). */
  sub?: string;
  /** Pin hex color (grape / marigold / mint). Defaults to grape. */
  color?: string;
  /** Render as the pulsing "you are here" dot instead of a numbered pin. */
  you?: boolean;
  /** Number shown in the pin (defaults to its index + 1). */
  number?: number;
}

export interface LineGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface WayfareMapProps {
  stops: MapStop[];
  /** Real walking geometry (from OSRM); falls back to straight segments. */
  routeGeometry?: LineGeometry;
  height?: number;
  pitch?: number;
  bearing?: number;
  interactive?: boolean;
  /** Auto-fit the camera to the stops. */
  fit?: boolean;
  /**
   * Camera padding when fitting — keeps pins clear of an overlapping sheet.
   * A number pads all sides; the object form pads sides independently (px).
   */
  fitPadding?: number | { top?: number; bottom?: number; left?: number; right?: number };
  /**
   * Fly the camera to one point (a selected day / schedule block). When set it
   * takes over from `fit` so the map "points" where the list selection is.
   */
  focus?: { lng: number; lat: number; zoom?: number } | null;
  /** Render 3D building extrusions (only shows with a vector basemap). */
  buildings3d?: boolean;
  /**
   * Compass heading (deg, 0 = north) for the "you are here" puck's direction
   * pointer. null/undefined hides the pointer (just the dot). Updates live
   * without redrawing the map.
   */
  youHeading?: number | null;
  /** Render the 3D walking mannequin at the "you are here" stop (web only). */
  character?: boolean;
  onReady?: () => void;
  style?: object;
}

export const ROUTE_AMBER = '#FFA828';
export const ROUTE_GLOW = '#7C5CF6';
export const GRAPE = '#7C5CF6';
export const NIGHT = '#17123A';

// Keyless, $0 vector basemap with real building geometry (OpenMapTiles schema)
// → enables Google-Maps-style 3D building extrusions. Dark out of the box.
export const OPENFREEMAP_DARK = 'https://tiles.openfreemap.org/styles/dark';

/**
 * Cinematic base style, in priority order:
 *   1. EXPO_PUBLIC_MAP_STYLE_URL — an explicit full style URL (MapTiler, etc.).
 *   2. EXPO_PUBLIC_PMTILES_URL — a self-hosted Protomaps .pmtiles (dark vector).
 *   3. EXPO_PUBLIC_MAP_RASTER=1 — the keyless OSM raster (flat, no 3D) fallback.
 *   4. Default → OpenFreeMap dark VECTOR tiles (keyless) so buildings can be
 *      extruded into real 3D. Vector needs the MapLibre worker (see setWorkerUrl).
 */
export function buildBaseStyle(): any {
  const url = process.env.EXPO_PUBLIC_MAP_STYLE_URL;
  if (url) return url;

  const pmtiles = process.env.EXPO_PUBLIC_PMTILES_URL;
  if (pmtiles) {
    return {
      version: 8,
      glyphs: PROTOMAPS_GLYPHS,
      sprite: PROTOMAPS_SPRITE,
      sources: {
        protomaps: { type: 'vector', url: `pmtiles://${pmtiles}`, attribution: '© OpenStreetMap · Protomaps' },
      },
      layers: PROTOMAPS_DARK_LAYERS,
    };
  }

  if (process.env.EXPO_PUBLIC_MAP_RASTER === '1') {
    return {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap',
        },
      },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': NIGHT } },
        {
          id: 'osm',
          type: 'raster',
          source: 'osm',
          paint: { 'raster-brightness-max': 0.4, 'raster-saturation': -0.6, 'raster-hue-rotate': 236, 'raster-opacity': 0.82 },
        },
      ],
    };
  }

  return OPENFREEMAP_DARK;
}

export function routeFrom(stops: MapStop[]): LineGeometry {
  return { type: 'LineString', coordinates: stops.map((s) => [s.lng, s.lat]) };
}
