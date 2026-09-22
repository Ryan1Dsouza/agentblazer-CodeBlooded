import * as THREE from 'three';
import { Event } from '../../../../types';
import StationDisplayPanel from '../../shared/StationDisplayPanel';

interface StationProps {
  event: Event;
  index: number;
  position: [number, number, number];
  isActive: boolean;
  onInspect: () => void;
}

export default function LavaStationDepot({
  event,
  index,
  position,
  isActive,
  onInspect
}: StationProps) {
  const accentColor = '#ff6b35';

  return (
    <group position={position}>
      {/* Industrial Foundation Platform */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[8, 0.8, 6]} />
        <meshStandardMaterial
          color="#1c1917"
          roughness={0.7}
          metalness={0.8}
          emissive="#7c2d12"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Platform Edge Hazard Strip */}
      <mesh position={[0, 0.05, 2.8]}>
        <boxGeometry args={[7.5, 0.08, 0.3]} />
        <meshStandardMaterial color="#ea580c" emissive="#f97316" emissiveIntensity={2.0} />
      </mesh>

      {/* Support Pylons */}
      <mesh position={[-3.5, 2.5, -2.5]}>
        <boxGeometry args={[0.6, 6, 0.6]} />
        <meshStandardMaterial color="#292524" metalness={0.9} />
      </mesh>
      <mesh position={[3.5, 2.5, -2.5]}>
        <boxGeometry args={[0.6, 6, 0.6]} />
        <meshStandardMaterial color="#292524" metalness={0.9} />
      </mesh>
      {/* Crossbeam */}
      <mesh position={[0, 5.5, -2.5]}>
        <boxGeometry args={[7.5, 0.5, 0.6]} />
        <meshStandardMaterial color="#292524" metalness={0.9} />
      </mesh>

      {/* Overhead Beacon */}
      <mesh position={[0, 6.5, -2.5]}>
        <torusGeometry args={[1.2, 0.15, 6, 18]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#ff6b35"
          emissiveIntensity={isActive ? 3.0 : 1.2}
        />
      </mesh>

      {/* Station Illumination */}
      <pointLight
        position={[0, 4, 0]}
        color="#f97316"
        intensity={isActive ? 10 : 4}
        distance={22}
      />

      {/* 
        === 3D HOLOGRAPHIC WORKSHOP DISPLAY PANEL ===
        Transparent glassmorphic panel with scrollable workshop images
      */}
      <StationDisplayPanel
        event={event}
        index={index}
        position={[0, 4.2, 0]}
        isActive={isActive}
        theme="inferno"
        onInspect={onInspect}
      />
    </group>
  );
}
