import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

export default function DroneWorld() {
  const particlesRef = useRef<THREE.Points>(null);

  // Atmospheric star particles
  const starPositions = useMemo(() => {
    const count = 1200;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      arr[i] = (Math.random() - 0.5) * 120;
      arr[i + 1] = (Math.random() - 0.5) * 60 + 15;
      arr[i + 2] = (Math.random() - 0.5) * 120;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <group>
      {/* Atmospheric fog is controlled via Canvas fog prop */}

      {/* Subtle ambient light for the world */}
      <ambientLight intensity={0.15} color="#4466aa" />

      {/* Distant fill light so the world isn't pitch-black */}
      <directionalLight position={[40, 40, -30]} intensity={0.25} color="#334488" />

      {/* Ground Reference Grid */}
      <gridHelper
        args={[200, 80, '#1a1a3a', '#0c0c22']}
        position={[0, -3, 0]}
      />

      {/* Glowing floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.01, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color="#05050d"
          metalness={0.4}
          roughness={0.7}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Atmospheric Particles / Stars */}
      <Points ref={particlesRef} positions={starPositions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#8888cc"
          size={0.12}
          sizeAttenuation
          depthWrite={false}
          opacity={0.6}
        />
      </Points>
    </group>
  );
}
