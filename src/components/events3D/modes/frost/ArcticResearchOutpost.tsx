import * as THREE from 'three';
import { Event } from '../../../../types';
import StationDisplayPanel from '../../shared/StationDisplayPanel';

interface OutpostProps {
  event: Event;
  index: number;
  position: [number, number, number];
  isActive: boolean;
  onInspect: () => void;
}

export default function ArcticResearchOutpost({
  event,
  index,
  position,
  isActive,
  onInspect
}: OutpostProps) {
  const accentColor = '#0ea5e9';

  return (
    <group position={position}>
      {/* Research Pod Base */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[3, 3.5, 3.0, 10]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.5}
          metalness={0.7}
          emissive="#0369a1"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Dome Roof */}
      <mesh position={[0, 3.0, 0]}>
        <sphereGeometry args={[3, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Communication Antenna */}
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[0.06, 0.15, 5, 6]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.9} />
      </mesh>
      {/* Top Beacon */}
      <mesh position={[0, 8.8, 0]}>
        <sphereGeometry args={[0.2, 6, 6]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Warm Window Lights */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * 3.05, 1.5, Math.sin(angle) * 3.05]} rotation={[0, -angle, 0]}>
          <boxGeometry args={[0.8, 0.5, 0.05]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#f59e0b"
            emissiveIntensity={isActive ? 3 : 1.5}
          />
        </mesh>
      ))}

      {/* Parking Apron */}
      <mesh position={[0, 0.03, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#0ea5e9"
          emissiveIntensity={isActive ? 1.2 : 0.5}
          wireframe
        />
      </mesh>

      {/* Illumination */}
      <pointLight
        position={[0, 5, 0]}
        color="#38bdf8"
        intensity={isActive ? 8 : 3}
        distance={20}
      />

      {/* 
        === 3D HOLOGRAPHIC WORKSHOP DISPLAY PANEL ===
        Transparent glassmorphic panel with scrollable workshop images
      */}
      <StationDisplayPanel
        event={event}
        index={index}
        position={[0, 5.0, 0]}
        isActive={isActive}
        theme="frost"
        onInspect={onInspect}
      />
    </group>
  );
}
