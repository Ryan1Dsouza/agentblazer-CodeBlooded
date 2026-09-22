import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function ArcticTundraTerrain() {
  const snowCount = 600;
  const snowRef = useRef<THREE.Points>(null);

  const [snowPos, snowSpeeds] = useMemo(() => {
    const pos = new Float32Array(snowCount * 3);
    const spd = new Float32Array(snowCount);
    for (let i = 0; i < snowCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 350;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 350;
      spd[i] = 2 + Math.random() * 4;
    }
    return [pos, spd];
  }, []);

  useFrame((_, delta) => {
    if (snowRef.current) {
      const arr = snowRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < snowCount; i++) {
        arr[i * 3 + 1] -= snowSpeeds[i] * delta;
        arr[i * 3] += Math.sin(arr[i * 3 + 1] * 0.3) * delta * 0.4;
        if (arr[i * 3 + 1] < 0) {
          arr[i * 3 + 1] = 40;
        }
      }
      snowRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Gentle Falling Snowflakes */}
      <points ref={snowRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[snowPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.5}
          color="#ffffff"
          transparent
          opacity={0.7}
          sizeAttenuation
        />
      </points>

      {/* Main Frozen Snow Terrain */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[450, 450, 32, 32]} />
        <meshStandardMaterial
          color="#e2e8f0"
          roughness={0.8}
          metalness={0.1}
          emissive="#0284c7"
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Frozen Lake Patches — glassy */}
      {[
        { x: -70, z: -60, r: 22 },
        { x: 45, z: -30, r: 28 },
        { x: 100, z: -90, r: 18 }
      ].map((lake, i) => (
        <mesh key={i} position={[lake.x, 0.03, lake.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[lake.r, 24]} />
          <meshStandardMaterial
            color="#bae6fd"
            roughness={0.05}
            metalness={0.95}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}

      {/* Varied Mountain Ridges — different sizes and offsets */}
      {[
        { x: -180, z: -200, h: 50, r: 40 },
        { x: -100, z: -220, h: 65, r: 35 },
        { x: -30, z: -240, h: 80, r: 45 },
        { x: 60, z: -230, h: 55, r: 30 },
        { x: 140, z: -210, h: 70, r: 38 },
        { x: 200, z: -200, h: 45, r: 28 },
        // Closer ridges for foreground depth
        { x: -130, z: -120, h: 25, r: 18 },
        { x: 160, z: -130, h: 30, r: 22 },
      ].map((m, i) => (
        <mesh key={i} position={[m.x, m.h * 0.4, m.z]}>
          <coneGeometry args={[m.r, m.h, 7]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.85}
            emissive="#0c4a6e"
            emissiveIntensity={0.12}
          />
        </mesh>
      ))}

      {/* Snow-capped mountain tops */}
      {[
        { x: -30, z: -240, h: 20, r: 22, y: 60 },
        { x: -100, z: -220, h: 15, r: 18, y: 48 },
        { x: 140, z: -210, h: 16, r: 20, y: 52 },
      ].map((m, i) => (
        <mesh key={`snow-${i}`} position={[m.x, m.y, m.z]}>
          <coneGeometry args={[m.r, m.h, 7]} />
          <meshStandardMaterial
            color="#f1f5f9"
            roughness={0.9}
            emissive="#e0f2fe"
            emissiveIntensity={0.1}
          />
        </mesh>
      ))}

      {/* Subtle Aurora — translucent curved band */}
      <mesh position={[0, 60, -150]} rotation={[0.2, 0, 0]}>
        <planeGeometry args={[300, 30, 8, 4]} />
        <meshBasicMaterial
          color="#06b6d4"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[40, 65, -160]} rotation={[0.15, 0.3, 0.1]}>
        <planeGeometry args={[250, 20, 6, 3]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Arctic Lighting */}
      <ambientLight intensity={0.5} color="#e0f2fe" />
      <directionalLight position={[40, 70, 30]} intensity={1.2} color="#93c5fd" />
      <pointLight position={[0, 15, -40]} color="#38bdf8" intensity={2} distance={80} />

      {/* Atmospheric Fog */}
      <fog attach="fog" args={['#1e293b', 60, 350]} />
    </group>
  );
}
