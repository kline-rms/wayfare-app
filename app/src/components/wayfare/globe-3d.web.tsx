// A stylized 3D globe (three.js via react-three-fiber) — a dotted sphere that
// slowly spins with a pulsing destination marker. Web build; native uses the
// fallback in globe-3d.tsx. No textures/assets → fully self-contained.
import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useWayfare } from './theme';

function latLngToVec3(lat: number, lng: number, r: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return [-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}

function Marker({ lat, lng, color }: { lat: number; lng: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const pos = latLngToVec3(lat, lng, 1.02);
  useFrame((s) => {
    const k = 1 + Math.sin(s.clock.elapsedTime * 3) * 0.3;
    ref.current?.scale.setScalar(k);
  });
  return (
    <mesh ref={ref} position={pos}>
      <sphereGeometry args={[0.045, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function DottedGlobe({ sphere, dots, marker }: { sphere: string; dots: string; marker: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.18;
  });

  const positions = useMemo(() => {
    const N = 900;
    const arr = new Float32Array(N * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = golden * i;
      arr[i * 3] = Math.cos(t) * r;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = Math.sin(t) * r;
    }
    return arr;
  }, []);

  return (
    <group ref={group} rotation={[0.35, 0, 0.1]}>
      <mesh>
        <sphereGeometry args={[0.985, 48, 48]} />
        <meshStandardMaterial color={sphere} roughness={0.85} metalness={0.15} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.022} color={dots} sizeAttenuation transparent opacity={0.9} />
      </points>
      {/* Manila-ish marker; the map-centric phase will drive this from the trip. */}
      <Marker lat={14.55} lng={121.05} color={marker} />
    </group>
  );
}

export function Globe3D({ size = 220 }: { size?: number }) {
  const { c, scheme } = useWayfare();
  return (
    <div style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 42 }} gl={{ alpha: true, antialias: true }} style={{ background: 'transparent' }}>
        <ambientLight intensity={scheme === 'dark' ? 0.7 : 0.9} />
        <directionalLight position={[3, 2, 2]} intensity={1.3} />
        <DottedGlobe sphere={c.card} dots={c.primary} marker={c.a1} />
      </Canvas>
    </div>
  );
}
