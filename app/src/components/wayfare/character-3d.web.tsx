// The Wayfare 3D character (Xbot mannequin) via @react-three/fiber — the same
// proven path as globe-3d.web. The GLB is served from Expo's public/ dir.
//   • Place3D        — a 3D place (grape platform + colour buildings) with the
//                      mannequin walking on it (replaces the old globe).
//   • MannequinCanvas — just the walking mannequin on a transparent canvas, for
//                      the "character on the map" overlay.
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

const MODEL_URL = '/models/Xbot.glb';

function Character3D({ anim = 'walk' }: { anim?: string }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL);
  // Clone (skeleton-aware) so multiple instances don't fight over one object.
  const scene = useMemo(() => skeletonClone(gltf.scene) as THREE.Object3D, [gltf]);
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);

  useEffect(() => {
    scene.traverse((o: any) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.frustumCulled = false;
      }
    });
  }, [scene]);

  useEffect(() => {
    const want = anim.toLowerCase();
    const clips = gltf.animations;
    const clip =
      clips.find((c) => c.name.toLowerCase() === want) ??
      clips.find((c) => c.name.toLowerCase().includes(want)) ??
      clips[0];
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.reset().play();
    return () => {
      action.stop();
    };
  }, [gltf, mixer, anim]);

  useFrame((_, dt) => mixer.update(dt));
  return <primitive object={scene} />;
}

function Place() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[2.6, 48]} />
        <meshStandardMaterial color="#6746DE" roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[-1.15, 0.5, -0.6]} castShadow>
        <boxGeometry args={[0.5, 1.0, 0.5]} />
        <meshStandardMaterial color="#FFA828" />
      </mesh>
      <mesh position={[1.05, 0.7, -0.85]} castShadow>
        <boxGeometry args={[0.45, 1.4, 0.45]} />
        <meshStandardMaterial color="#2FD98A" />
      </mesh>
      <mesh position={[0.25, 0.35, -1.35]} castShadow>
        <boxGeometry args={[0.4, 0.7, 0.4]} />
        <meshStandardMaterial color="#9E86FF" />
      </mesh>
    </group>
  );
}

export function Place3D({ size = 220 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas
        shadows
        camera={{ position: [2.4, 2.0, 3.6], fov: 38 }}
        onCreated={({ camera }) => camera.lookAt(0, 0.7, 0)}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}>
        <hemisphereLight args={[0xd9ccff, 0x33235a, 1.0]} />
        <directionalLight position={[3, 7, 5]} intensity={2.2} castShadow />
        <Suspense fallback={null}>
          <Place />
          <Character3D anim="walk" />
        </Suspense>
      </Canvas>
    </div>
  );
}

// ── City chase scene ──────────────────────────────────────────────────────
// Low-poly street of buildings that scrolls toward the camera while the
// mannequin walks in place — so from a driving-app "back POV" the character
// reads as moving through a 3D city. Blends the mannequin into the buildings
// until the map's own vector extrusions are hosted.
const BUILDING_COLORS = ['#4B3AA0', '#5C46C4', '#3A2E80', '#6746DE', '#FFA828', '#2FD98A', '#9E86FF'];
const STREET = { rows: 9, step: 3.2, sides: [-3.4, -2.3, 2.3, 3.4] };

function buildingSpecs() {
  // Deterministic pseudo-random so the street is stable across renders.
  const out: { x: number; z: number; h: number; w: number; color: string }[] = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let r = 0; r < STREET.rows; r++) {
    for (const x of STREET.sides) {
      const h = 1.4 + rnd() * 3.2;
      const w = 0.8 + rnd() * 0.5;
      const color = BUILDING_COLORS[Math.floor(rnd() * BUILDING_COLORS.length)];
      out.push({ x: x + (rnd() - 0.5) * 0.3, z: r * STREET.step, h, w, color });
    }
  }
  return out;
}

function ScrollingCity() {
  const specs = useMemo(buildingSpecs, []);
  const groupRef = useRef<THREE.Group>(null);
  const period = STREET.rows * STREET.step;
  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    g.position.z -= dt * 2.6;
    if (g.position.z <= -STREET.step) g.position.z += STREET.step; // seamless loop
  });
  return (
    <group ref={groupRef}>
      {/* road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, period / 2]} receiveShadow>
        <planeGeometry args={[3.4, period + STREET.step]} />
        <meshStandardMaterial color="#221A52" roughness={1} />
      </mesh>
      {specs.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow>
          <boxGeometry args={[b.w, b.h, b.w]} />
          <meshStandardMaterial color={b.color} roughness={0.7} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

/** The mannequin walking through the scrolling city, seen from a chase camera. */
export function CityCanvas({ size = 220, anim = 'walk' }: { size?: number; anim?: string }) {
  return (
    <div style={{ width: size, height: size, pointerEvents: 'none' }}>
      <Canvas
        shadows
        camera={{ position: [0, 2.3, -4.4], fov: 42 }}
        onCreated={({ camera }) => camera.lookAt(0, 1.1, 4)}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}>
        <hemisphereLight args={[0xd9ccff, 0x2a1f5c, 1.05]} />
        <directionalLight position={[3, 8, -4]} intensity={2.1} castShadow />
        <Suspense fallback={null}>
          <ScrollingCity />
          <Character3D anim={anim} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export function MannequinCanvas({ size = 84, anim = 'walk' }: { size?: number; anim?: string }) {
  return (
    <div style={{ width: size, height: size * 1.4, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 1.25, 3.6], fov: 32 }}
        onCreated={({ camera }) => camera.lookAt(0, 0.95, 0)}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}>
        <hemisphereLight args={[0xffffff, 0x333355, 1.1]} />
        <directionalLight position={[2, 5, 4]} intensity={2} />
        <Suspense fallback={null}>
          <Character3D anim={anim} />
        </Suspense>
      </Canvas>
    </div>
  );
}
