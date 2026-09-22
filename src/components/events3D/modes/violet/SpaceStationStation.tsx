import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Event } from '../../../../types';
import StationDisplayPanel from '../../shared/StationDisplayPanel';

interface StationProps {
  event: Event;
  index: number;
  position: [number, number, number];
  isActive: boolean;
  isDocking: boolean;
  onInspect: () => void;
}

export default function SpaceStationStation({
  event,
  index,
  position,
  isActive,
  isDocking,
  onInspect
}: StationProps) {
  const ringRef = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.4;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x += delta * 0.3;
      ring2Ref.current.rotation.y += delta * 0.2;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.8;
    }
  });

  const categoryColor =
    event.category.toLowerCase().includes('workshop')
      ? '#8b5cf6'
      : event.category.toLowerCase().includes('contest')
      ? '#ec4899'
      : '#06b6d4';

  return (
    <group position={position}>
      {/* Central Quantum Reactor Core */}
      <mesh ref={coreRef} position={[0, 0, 0]}>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color={categoryColor}
          emissive={categoryColor}
          emissiveIntensity={isActive ? 3.0 : 1.5}
          wireframe
        />
      </mesh>

      {/* Inner Glowing Plasma Sphere */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Outer Rotating Docking Ring 1 */}
      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.2, 0.22, 12, 36]} />
          <meshStandardMaterial
            color="#1e1b2e"
            metalness={0.92}
            roughness={0.2}
            emissive={categoryColor}
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Docking Light Beacons */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2;
          const x = Math.cos(angle) * 3.2;
          const y = Math.sin(angle) * 3.2;
          return (
            <mesh key={i} position={[x, y, 0]}>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshBasicMaterial color={categoryColor} />
            </mesh>
          );
        })}
      </group>

      {/* Outer Rotating Gimbal Ring 2 */}
      <group ref={ring2Ref}>
        <mesh>
          <torusGeometry args={[3.8, 0.1, 8, 32]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.95}
            emissive="#a855f7"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* Holographic Signal Beacon */}
      <mesh position={[0, 4.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 6, 6]} />
        <meshBasicMaterial color={categoryColor} transparent opacity={0.6} />
      </mesh>

      {/* Station Omnidirectional Lighting */}
      <pointLight color={categoryColor} intensity={isActive ? 12 : 5} distance={25} />

      {/* 
        === 3D HOLOGRAPHIC WORKSHOP DISPLAY PANEL ===
        Transparent glassmorphic panel with scrollable workshop images
      */}
      <StationDisplayPanel
        event={event}
        index={index}
        position={[0, 4.2, 0]}
        isActive={isActive}
        isDocking={isDocking}
        theme="violet"
        onInspect={onInspect}
      />
    </group>
  );
}
