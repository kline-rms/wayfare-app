// Web map — real MapLibre GL. Renders the cinematic night basemap, an amber
// dashed route with a violet glow, numbered pins + a pulsing "you are here", and
// updates reactively as stops change (the "real-time as schedules are selected"
// behaviour). Native uses the SVG preview in wayfare-map.tsx until the dev build.
import 'maplibre-gl/dist/maplibre-gl.css';
import * as maplibregl from 'maplibre-gl';
import * as pmtiles from 'pmtiles';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import {
  buildBaseStyle,
  routeFrom,
  GRAPE,
  NIGHT,
  ROUTE_AMBER,
  ROUTE_GLOW,
  type WayfareMapProps,
} from './wayfare-map.shared';

// One-time MapLibre setup: register pmtiles:// and (crucially) point the worker
// at the copy served from public/ — under Metro the default import.meta.url
// resolution 404s, which throws the AJAXError users were seeing on map screens.
let mlRegistered = false;
function ensureMaplibre() {
  if (mlRegistered) return;
  mlRegistered = true;
  try {
    (maplibregl as any).setWorkerUrl('/maplibre-gl-worker.mjs');
  } catch {
    // older builds: no setWorkerUrl — the bundled worker fallback applies.
  }
  const protocol = new pmtiles.Protocol();
  (maplibregl as any).addProtocol('pmtiles', protocol.tile);
}

// Night-styled popup + control chrome, injected once.
function ensureMapChrome() {
  if (typeof document === 'undefined' || document.getElementById('wf-map-chrome')) return;
  const st = document.createElement('style');
  st.id = 'wf-map-chrome';
  st.textContent = `
    .wf-popup .maplibregl-popup-content{background:#2A2166;color:#fff;border-radius:14px;padding:10px 13px;box-shadow:0 14px 34px -10px rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.08)}
    .wf-popup .maplibregl-popup-tip{border-top-color:#2A2166;border-bottom-color:#2A2166}
    .wf-pop-t{font-family:'Fredoka',system-ui,sans-serif;font-weight:700;font-size:13px}
    .wf-pop-s{color:#B4ADE0;font-size:11px;margin-top:2px}
    .maplibregl-ctrl-top-right{top:118px;right:14px}
    .maplibregl-ctrl-group{background:rgba(42,33,102,.9);border-radius:14px;overflow:hidden;box-shadow:0 8px 20px -8px rgba(0,0,0,.6)}
    .maplibregl-ctrl-group button{background:transparent}
    .maplibregl-ctrl-group button+button{border-top:1px solid rgba(255,255,255,.12)}
    .maplibregl-ctrl-group button .maplibregl-ctrl-icon{filter:invert(1) hue-rotate(180deg) brightness(1.6)}
  `;
  document.head.appendChild(st);
}

function esc(s: string) {
  return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] as string));
}

export function WayfareMap({
  stops,
  routeGeometry,
  height = 280,
  pitch = 52,
  bearing = -18,
  interactive = true,
  fit = true,
  fitPadding,
  focus,
  buildings3d = true,
  youHeading,
  onReady,
  style,
}: WayfareMapProps) {
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const popupRef = useRef<any>(null);
  const youElRef = useRef<any>(null); // the rotatable inner puck for the "you" dot
  // Keep the latest props for the draw() closure without re-initialising the map.
  const dataRef = useRef({ stops, routeGeometry, fit, fitPadding, focus, pitch, bearing, youHeading });
  dataRef.current = { stops, routeGeometry, fit, fitPadding, focus, pitch, bearing, youHeading };

  function openPopup(s: { lng: number; lat: number; label?: string; sub?: string; number?: number }) {
    const map = mapRef.current;
    if (!map) return;
    if (popupRef.current) popupRef.current.remove();
    const title = s.label ?? (s.number ? `Stop ${s.number}` : 'Stop');
    const html = `<div class="wf-pop-t">${esc(title)}</div>${s.sub ? `<div class="wf-pop-s">${esc(s.sub)}</div>` : ''}`;
    popupRef.current = new (maplibregl as any).Popup({ closeButton: false, offset: 16, className: 'wf-popup' })
      .setLngLat([s.lng, s.lat])
      .setHTML(html)
      .addTo(map);
  }

  // Keep the "you" chevron pointing the true travel direction regardless of how
  // the map is turned: screen angle = heading − mapBearing. When the map is
  // heading/route-up (bearing ≠ 0) this reads as "up"; on a north-up map with a
  // known heading it points to the compass; with neither, it shows a plain dot.
  function updateYouRotation() {
    const rot = youElRef.current;
    const map = mapRef.current;
    if (!rot || !map) return;
    const b = map.getBearing ? map.getBearing() : 0;
    const h = dataRef.current.youHeading;
    const known = h != null;
    // Show the directional chevron only when there's a real facing to show: a
    // known compass heading, or a nav focus that turns the map to travel (route-up).
    const oriented = known || dataRef.current.focus?.bearing != null;
    const nav = rot.querySelector('.wf-nav') as HTMLElement | null;
    const dot = rot.querySelector('.wf-dot') as HTMLElement | null;
    if (oriented) {
      rot.style.transform = `rotate(${(known ? (h as number) : b) - b}deg)`;
      if (nav) nav.style.opacity = '1';
      if (dot) dot.style.opacity = '0';
    } else {
      if (nav) nav.style.opacity = '0';
      if (dot) dot.style.opacity = '1';
    }
  }

  function draw() {
    const map = mapRef.current;
    if (!map) return;
    const { stops, routeGeometry, fit, pitch, bearing } = dataRef.current;
    const geometry = routeGeometry ?? routeFrom(stops);
    const feature = { type: 'Feature', properties: {}, geometry } as any;

    const src = map.getSource('route');
    if (src) {
      src.setData(feature);
    } else {
      map.addSource('route', { type: 'geojson', data: feature });
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route',
        paint: { 'line-color': ROUTE_GLOW, 'line-width': 10, 'line-opacity': 0.25, 'line-blur': 6 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: { 'line-color': ROUTE_AMBER, 'line-width': 4, 'line-dasharray': [0.4, 1.8] },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });
    }

    // Rebuild markers (cheap; the set is small).
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    stops.forEach((s, i) => {
      const el = document.createElement('div');
      if (s.you) {
        // Navigation puck — a Google-style chevron on a soft halo. It points the
        // way you're heading; because the nav map turns to travel direction
        // (heading/route-up), the chevron reads "straight up" as you walk. On a
        // north-up map it rotates to the compass heading, and falls back to a dot
        // when no direction is known. Rotation is kept in sync with the map's
        // own bearing by updateYouRotation().
        el.style.cssText = 'width:46px;height:46px;position:relative';
        const rot = document.createElement('div');
        rot.style.cssText = 'position:absolute;inset:0;transition:transform .18s linear;transform-origin:50% 50%';
        rot.innerHTML =
          `<div style="position:absolute;left:50%;top:50%;width:38px;height:38px;transform:translate(-50%,-50%);border-radius:50%;background:rgba(124,92,246,.18)"></div>` +
          `<div class="wf-nav" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-52%)">` +
          `<svg width="30" height="30" viewBox="0 0 24 24"><path d="M12 2.5 L20 21 L12 16.4 L4 21 Z" fill="${GRAPE}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>` +
          `</div>` +
          `<div class="wf-dot" style="position:absolute;left:50%;top:50%;width:13px;height:13px;transform:translate(-50%,-50%);border-radius:50%;background:${GRAPE};border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5);opacity:0"></div>`;
        el.appendChild(rot);
        youElRef.current = rot;
        updateYouRotation();
      } else {
        const color = s.color ?? GRAPE;
        el.style.cssText =
          `width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);` +
          `background:${color};box-shadow:0 6px 12px -3px rgba(0,0,0,.7);border:2px solid ${NIGHT};` +
          `display:flex;align-items:center;justify-content:center`;
        const num = document.createElement('span');
        num.textContent = String(s.number ?? i + 1);
        num.style.cssText = 'transform:rotate(45deg);color:#fff;font:700 10px sans-serif';
        el.appendChild(num);
      }
      // Clickable pin → info popup + recenter.
      el.style.cursor = 'pointer';
      el.addEventListener('click', (ev: any) => {
        ev.stopPropagation();
        openPopup(s);
        map.easeTo({ center: [s.lng, s.lat], duration: 500 });
      });
      const marker = new (maplibregl as any).Marker({ element: el, anchor: s.you ? 'center' : 'bottom' })
        .setLngLat([s.lng, s.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });

    // `focus` (a selected day / block) wins over auto-fit so the map points there.
    const { focus, fitPadding } = dataRef.current;
    if (focus) {
      map.easeTo({ center: [focus.lng, focus.lat], zoom: focus.zoom ?? 16, pitch, bearing, duration: 650 });
    } else if (fit && stops.length) {
      const pad =
        typeof fitPadding === 'number'
          ? fitPadding
          : { top: 70, bottom: 60, left: 48, right: 48, ...(fitPadding ?? {}) };
      if (stops.length === 1) {
        map.easeTo({ center: [stops[0].lng, stops[0].lat], zoom: 15.5, pitch, bearing, duration: 400 });
      } else {
        const bounds = new (maplibregl as any).LngLatBounds();
        stops.forEach((s) => bounds.extend([s.lng, s.lat]));
        map.fitBounds(bounds, { padding: pad, pitch, bearing, duration: 400, maxZoom: 16.5 });
      }
    }
  }

  // Real 3D: extrude the vector basemap's building footprints (OpenMapTiles
  // `building` layer, height = render_height) and tint the map to Wayfare night.
  function addBuildings() {
    const map = mapRef.current;
    if (!map) return;
    try {
      const sources = map.getStyle()?.sources ?? {};
      const srcId = sources.openmaptiles
        ? 'openmaptiles'
        : (Object.entries(sources).find(([, s]: any) => s.type === 'vector') ?? [])[0];
      if (!srcId) return;

      // Night tint on the basemap for brand consistency.
      if (map.getLayer('background')) map.setPaintProperty('background', 'background-color', NIGHT);
      if (map.getLayer('water')) map.setPaintProperty('water', 'fill-color', '#1B1550');
      // Hide the flat 2D building fill so it doesn't z-fight the extrusions.
      if (map.getLayer('building')) map.setLayoutProperty('building', 'visibility', 'none');

      if (map.getLayer('buildings-3d')) return;
      // Insert AFTER the last flat (line/fill) layer — OpenMapTiles puts all road
      // & railway lines late in the stack, so inserting merely "before the first
      // symbol" would leave roads painting OVER the buildings. Placing the
      // extrusion above every flat layer lets buildings occlude the roads behind
      // them (camera-dependent), while label symbols after it stay on top.
      const layers = map.getStyle()?.layers ?? [];
      let insertBefore: string | undefined;
      for (let i = layers.length - 1; i >= 0; i--) {
        const t = (layers[i] as any).type;
        if ((t === 'line' || t === 'fill') && layers[i].id !== 'buildings-3d') {
          insertBefore = layers[i + 1]?.id;
          break;
        }
      }
      map.addLayer(
        {
          id: 'buildings-3d',
          type: 'fill-extrusion',
          source: srcId,
          'source-layer': 'building',
          minzoom: 13,
          paint: {
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'render_height'], 6],
              0,
              '#2A2166',
              40,
              '#3B2E80',
              120,
              '#4B3AA0',
            ],
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 15.5, ['coalesce', ['get', 'render_height'], 8]],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            // Fully opaque so buildings properly OCCLUDE the roads behind them —
            // otherwise the ground roads bleed through and look "on top".
            'fill-extrusion-opacity': 1,
          },
        },
        insertBefore,
      );
      // Respect the current camera: a flat (top-down) view keeps buildings hidden
      // so it reads as a clean 2D map; a tilted view shows them.
      if (dataRef.current.pitch <= 5) {
        map.setLayoutProperty('buildings-3d', 'visibility', 'none');
      }

      // Roads: brighten to a visible lavender so they read on the night map and
      // sit as part of the 3D scene (occluded by buildings in front of them).
      for (const l of map.getStyle()?.layers ?? []) {
        if (l.type !== 'line') continue;
        const sl = (l as any)['source-layer'] ?? '';
        if (sl !== 'transportation' && !/road|bridge|tunnel|highway|street/i.test(l.id)) continue;
        try {
          map.setPaintProperty(l.id, 'line-color', '#6C5EC0');
          map.setPaintProperty(l.id, 'line-opacity', 0.9);
        } catch {
          /* some road layers use data-driven color — skip */
        }
      }
    } catch {
      // basemap without a building layer (e.g. raster) — ignore.
    }
  }

  useEffect(() => {
    ensureMaplibre();
    ensureMapChrome();
    const el = containerRef.current as unknown as HTMLElement;
    if (!el) return;
    const first = dataRef.current.stops[0];
    const map = new (maplibregl as any).Map({
      container: el,
      style: buildBaseStyle(),
      center: first ? [first.lng, first.lat] : [121.05, 14.55],
      zoom: 15,
      pitch,
      bearing,
      interactive,
      attributionControl: false,
    });
    mapRef.current = map;
    if (interactive) {
      // showCompass adds a compass that rotates the map (drag it) and resets north.
      map.addControl(new (maplibregl as any).NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }), 'top-right');
      map.dragRotate?.enable();
      map.touchZoomRotate?.enableRotation();
    }
    // Keep the "you" chevron aligned to true north as the map turns (auto or by hand).
    map.on('rotate', updateYouRotation);
    // Tap empty map to dismiss an open pin popup (marker clicks stopPropagation).
    map.on('click', () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    });
    map.on('load', () => {
      if (buildings3d) addBuildings();
      draw();
      onReady?.();
    });
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw when the stops / route change (once the style is ready).
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.isStyleLoaded && map.isStyleLoaded()) {
      draw();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, routeGeometry]);

  // Fly to a focused point when the list selection changes; when focus clears,
  // re-fit the whole route (so "Navigate" frames A→B again).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const f = dataRef.current.focus;
      if (f) {
        // A focus can carry its own bearing (heading-up chase cam) and a screen
        // offset that pushes the centred point down, so "you" sit low with the
        // road ahead visible — i.e. the camera rides behind the pointer.
        map.easeTo({
          center: [f.lng, f.lat],
          zoom: f.zoom ?? 16,
          pitch: dataRef.current.pitch,
          bearing: f.bearing ?? dataRef.current.bearing,
          offset: f.offset ?? [0, 0],
          duration: 650,
        });
      } else {
        draw(); // no focus → re-fit all stops
      }
    };
    if (map.isStyleLoaded && map.isStyleLoaded()) apply();
    else map.once('load', apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.lng, focus?.lat, focus?.zoom, focus?.bearing, focus?.offset?.[1]]);

  // Animate the camera tilt when `pitch` changes — this is what the nav screen's
  // 2D (top-down) ↔ 3D toggle rides on. Kept separate from draw() so a tilt
  // change doesn't re-fit or re-add layers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ pitch, duration: 500 });
    // A flat top-down view should read as 2D — hide the 3D building extrusions
    // when the camera isn't tilted, and bring them back when it is.
    const setBuildingVis = () => {
      if (map.getLayer && map.getLayer('buildings-3d')) {
        map.setLayoutProperty('buildings-3d', 'visibility', pitch > 5 ? 'visible' : 'none');
      }
    };
    if (map.isStyleLoaded && map.isStyleLoaded()) setBuildingVis();
    else map.once('idle', setBuildingVis);
  }, [pitch]);

  // Spin the "you" puck's arrow to the live heading — no map redraw needed.
  useEffect(() => {
    updateYouRotation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youHeading, focus?.bearing]);

  return (
    <View style={[{ height, width: '100%', borderRadius: 22, overflow: 'hidden', backgroundColor: NIGHT, position: 'relative' }, style]}>
      <View ref={containerRef} style={{ flex: 1 }} />
    </View>
  );
}

export default WayfareMap;
