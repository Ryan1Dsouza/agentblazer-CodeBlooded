import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Event } from '../../types';

export default function Checkpoint3D({ event, position, isActive, isReached, onClick }: { event: Event; position: [number, number, number]; isActive: boolean; isReached: boolean; onClick: () => void }) {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const getCategoryColor = () => {
    switch (event.category) {
      case 'Workshop': return '#00d4ff';
      case 'Contest': return '#f59e0b';
      case 'Masterclass': return '#8b5cf6';
      default: return '#00d4ff';
    }
  };

  const color = getCategoryColor();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = t * (isActive ? 2.5 : 0.8);
      const scale = isActive ? 1 + Math.sin(t * 4) * 0.08 : 1;
      outerRingRef.current.scale.set(scale, scale, scale);
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = -t * (isActive ? 3 : 1.2);
    }
    if (beaconRef.current) {
      beaconRef.current.position.y = Math.sin(t * 1.8) * 0.3 + 0.5;
    }
    if (glowRef.current) {
      const pulse = 0.6 + Math.sin(t * 3) * 0.4;
      glowRef.current.scale.set(pulse, pulse, pulse);
    }
    if (lightRef.current) {
      lightRef.current.intensity = isActive ? 4 + Math.sin(t * 5) * 1.5 : 1.5 + Math.sin(t * 2) * 0.4;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Outer rotating hexagonal gate ring */}
      <mesh ref={outerRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.5, 0.08, 8, 6]} />
        <meshBasicMaterial color={color} transparent opacity={isActive ? 1 : 0.6} />
      </mesh>

      {/* Inner rotating ring */}
      <mesh ref={innerRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.8, 0.05, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={isActive ? 0.8 : 0.4} />
      </mesh>

      {/* Center glow disc when reached */}
      {(isActive || isReached) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.5, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {/* Floating Beacon / Holographic sphere */}
      <group ref={beaconRef}>
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.85} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={color}
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Grounded neon pillar connecting to beacon */}
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 3, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>

      {/* Dynamic point light */}
      <pointLight
        ref={lightRef}
        color={color}
        intensity={1.5}
        distance={18}
        decay={2}
        position={[0, 0.5, 0]}
      />

      <mesh position={[0, 4.2, 0]} rotation={[-Math.PI / 6, 0, 0]}>
        <planeGeometry args={[3.8, 0.9]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.85} />
      </mesh>

    </group>
  );
}
