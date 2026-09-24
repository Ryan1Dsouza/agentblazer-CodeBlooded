import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Event } from '../../../../types';

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
  const beaconRef = useRef<THREE.Mesh>(null);
  const antennaLightRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    // Pulsing beacon
    if (beaconRef.current) {
      const mat = beaconRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.6 + Math.sin(time * 3) * 0.3;
    }
    // Antenna blink
    if (antennaLightRef.current) {
      const mat = antennaLightRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(time * 2) > 0 ? 1 : 0.3;
    }
  });

  return (
    <group position={position}>
      {/* Snow foundation pad */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5, 16]} />
        <meshStandardMaterial
          color="#cbd5e1"
          roughness={0.9}
          emissive="#bae6fd"
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Research Pod Base — larger, more detailed */}
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[3.2, 3.6, 3.2, 12]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.45}
          metalness={0.75}
          emissive="#0369a1"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Base ring detail */}
      <mesh position={[0, 0.15, 0]}>
        <torusGeometry args={[3.6, 0.12, 6, 12]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={isActive ? 2.0 : 0.8}
        />
      </mesh>

      {/* Dome Roof — more refined */}
      <mesh position={[0, 3.2, 0]}>
        <sphereGeometry args={[3.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.25}
          metalness={0.85}
          emissive="#0c4a6e"
          emissiveIntensity={0.08}
        />
      </mesh>

      {/* Dome skylight */}
      <mesh position={[0, 4.8, 0]}>
        <circleGeometry args={[0.8, 12]} />
        <meshStandardMaterial
          color="#bae6fd"
          emissive="#38bdf8"
          emissiveIntensity={isActive ? 2.5 : 1.0}
          roughness={0.05}
          metalness={0.9}
        />
      </mesh>

      {/* Communication Antenna — taller with crossbar */}
      <mesh position={[0, 6.5, 0]}>
        <cylinderGeometry args={[0.05, 0.12, 5.5, 6]} />
        <meshStandardMaterial color="#475569" metalness={0.92} />
      </mesh>
      {/* Antenna crossbar */}
      <mesh position={[0, 7.5, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.06]} />
        <meshStandardMaterial color="#475569" metalness={0.9} />
      </mesh>
      {/* Top Beacon — animated blink */}
      <mesh ref={antennaLightRef} position={[0, 9.5, 0]}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={1} />
      </mesh>
      <pointLight position={[0, 9.5, 0]} color="#38bdf8" intensity={isActive ? 4 : 1.5} distance={15} />

      {/* Warm Window Lights — more windows */}
      {[0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * 3.25, 1.6, Math.sin(angle) * 3.25]} rotation={[0, -angle, 0]}>
          <boxGeometry args={[0.7, 0.45, 0.05]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#f59e0b"
            emissiveIntensity={isActive ? 3.5 : 1.8}
          />
        </mesh>
      ))}

      {/* Entrance door */}
      <mesh position={[0, 0.8, 3.55]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.9, 1.6, 0.08]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.8}
          emissive="#0284c7"
          emissiveIntensity={isActive ? 1.0 : 0.3}
        />
      </mesh>
      {/* Door frame light */}
      <mesh position={[0, 1.7, 3.6]}>
        <boxGeometry args={[1.1, 0.08, 0.04]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={2} />
      </mesh>

      {/* Equipment boxes beside the outpost */}
      {[-2.5, 2.5].map((x, i) => (
        <mesh key={`box-${i}`} position={[x, 0.35, 3.5]}>
          <boxGeometry args={[0.8, 0.7, 0.6]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}

      {/* Parking Apron — landing/docking zone */}
      <mesh position={[0, 0.04, 5.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 5.5]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#0ea5e9"
          emissiveIntensity={isActive ? 1.2 : 0.5}
          wireframe
        />
      </mesh>

      {/* Landing pad holographic beacon */}
      <mesh ref={beaconRef} position={[0, 0.06, 5.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 2.0, 6]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Illumination */}
      <pointLight
        position={[0, 5, 0]}
        color="#38bdf8"
        intensity={isActive ? 10 : 4}
        distance={22}
      />
      {/* Ground-level warmth from windows */}
      <pointLight
        position={[0, 1.5, 0]}
        color="#f59e0b"
        intensity={isActive ? 3 : 1}
        distance={10}
      />

      {/* Compact In-World Outpost Beacon Marker */}
      <Html position={[0, 5.2, 0]} center distanceFactor={18} zIndexRange={[50, 0]}>
        <div
          onClick={onInspect}
          className={`px-3 py-2 rounded-xl backdrop-blur-md border text-center transition-all cursor-pointer select-none shadow-xl flex flex-col items-center gap-1 ${
            isActive ? 'scale-105 ring-1 ring-cyan-400' : 'hover:scale-105 opacity-90'
          }`}
          style={{
            backgroundColor: 'rgba(8, 20, 36, 0.9)',
            borderColor: accentColor,
            boxShadow: `0 0 20px rgba(14, 165, 233, 0.35)`,
            color: '#fff',
            minWidth: '170px'
          }}
        >
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 uppercase">
              OUTPOST 0{index + 1} • {event.category}
            </span>
          </div>
          <h3 className="text-xs font-bold text-white tracking-wide truncate max-w-[160px]">
            {event.title}
          </h3>
          <span className="text-[9px] text-cyan-200/80 font-mono">{event.date}</span>
          <span
            className="text-[8px] font-mono font-bold mt-0.5 uppercase tracking-wider animate-pulse"
            style={{ color: accentColor }}
          >
            Approach Outpost ➔
          </span>
        </div>
      </Html>
    </group>
  );
}
