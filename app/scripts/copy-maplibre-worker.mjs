// Copies MapLibre GL's worker chunks into public/ so Metro serves them at a
// stable URL. Under Metro/expo-web, MapLibre's default import.meta.url worker
// resolution 404s (throwing an AJAXError on every map screen). We point
// maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs') at these copies instead.
//
// Run automatically before `web`/`start`; re-run after bumping maplibre-gl.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'node_modules', 'maplibre-gl', 'dist');
const pub = join(root, 'public');
mkdirSync(pub, { recursive: true });

for (const f of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  try {
    copyFileSync(join(dist, f), join(pub, f));
    console.log('copied', f, '→ public/');
  } catch (e) {
    console.warn('skip', f, '-', e.message);
  }
}
