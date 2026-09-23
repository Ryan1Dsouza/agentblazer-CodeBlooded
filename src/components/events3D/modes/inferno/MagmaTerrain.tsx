import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function MagmaTerrain() {
  const embersCount = 200;
  const pillarsCount = 18;

  const lavaFloorRef = useRef<THREE.Mesh>(null);
  const embersRef = useRef<THREE.Points>(null);

  // Generate glowing floating ember particles — reduced count
  const [emberPositions, emberSpeeds] = useMemo(() => {
    const pos = new Float32Array(embersCount * 3);
    const spd = new Float32Array(embersCount);
    for (let i = 0; i < embersCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 320;
      pos[i * 3 + 1] = Math.random() * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 320;
      spd[i] = 1.5 + Math.random() * 3;
    }
    return [pos, spd];
  }, []);

  // Procedural Basalt Pillar Formations — pushed far from track
  const pillars = useMemo(() => {
    const items = [];
    for (let i = 0; i < pillarsCount; i++) {
      // Place pillars in outer regions only
      const angle = (i / pillarsCount) * Math.PI * 2;
      const radius = 100 + Math.random() * 60;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 10 + Math.random() * 20;
      const r = 3 + Math.random() * 4;
      items.push({ x, z, height, radius: r, rot: Math.random() * Math.PI });
    }
    return items;
  }, []);

  useFrame((state, delta) => {
    if (embersRef.current) {
      const positions = embersRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < embersCount; i++) {
        positions[i * 3 + 1] += emberSpeeds[i] * delta;
        if (positions[i * 3 + 1] > 30) {
          positions[i * 3 + 1] = 0;
        }
      }
      embersRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (lavaFloorRef.current) {
      const mat = lavaFloorRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.0 + Math.sin(state.clock.elapsedTime * 2.2) * 0.2;
    }
  });

  return (
    <group>
      {/* Deep Lava Floor — lowered so rail is clearly elevated */}
      <mesh ref={lavaFloorRef} position={[0, -10, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[450, 450, 16, 16]} />
        <meshStandardMaterial
          color="#7f1d1d"
          emissive="#ef4444"
          emissiveIntensity={1.0}
          roughness={0.25}
          metalness={0.2}
        />
      </mesh>

      {/* Dark Rock Terrain around lava channels */}
      <mesh position={[0, -8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[450, 450, 8, 8]} />
        <meshStandardMaterial
          color="#1c1917"
          roughness={0.85}
          metalness={0.4}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Lava Rivers — glowing channels */}
      {[
        { pos: [-60, -9, 0] as [number, number, number], rot: 0.3, w: 8, l: 200 },
        { pos: [50, -9, -40] as [number, number, number], rot: -0.4, w: 6, l: 180 },
        { pos: [0, -9, 80] as [number, number, number], rot: 1.2, w: 10, l: 160 },
      ].map((river, i) => (
        <mesh key={i} position={river.pos} rotation={[-Math.PI / 2, 0, river.rot]}>
          <planeGeometry args={[river.w, river.l]} />
          <meshStandardMaterial
            color="#dc2626"
            emissive="#f97316"
            emissiveIntensity={2.0}
            roughness={0.1}
          />
        </mesh>
      ))}

      {/* Hexagonal Basalt Pillars — far from track */}
      {pillars.map((p, idx) => (
        <mesh
          key={idx}
          position={[p.x, p.height / 2 - 10, p.z]}
          rotation={[0, p.rot, 0]}
        >
          <cylinderGeometry args={[p.radius, p.radius * 1.1, p.height, 6]} />
          <meshStandardMaterial
            color="#1c1917"
            roughness={0.75}
            metalness={0.5}
            emissive="#431407"
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}

      {/* Rising Embers — smaller and fewer */}
      <points ref={embersRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[emberPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.8}
          color="#f97316"
          transparent
          opacity={0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Volcanic Ambient & Directional Lighting */}
      <ambientLight intensity={0.4} color="#ffedd5" />
      <directionalLight position={[50, 80, 20]} intensity={1.5} color="#ea580c" />
      <pointLight position={[0, 6, 0]} color="#f97316" intensity={3} distance={50} />

      {/* Fog for atmosphere */}
      <fog attach="fog" args={['#1a0a00', 50, 350]} />
    </group>
  );
}

