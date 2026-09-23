import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Event } from '../../../../types';

interface StationProps {
  event: Event;
  index: number;
  position: [number, number, number];
  isActive: boolean;
  isDocking: boolean;
  
}

export default function SpaceStationStation({
  event,
  index,
  position,
  isActive,
  isDocking,
  onInspect
}: StationProps) {
  const outerRingRef = useRef<THREE.Group>(null);
  const innerRingRef = useRef<THREE.Group>(null);
  const coreSpireRef = useRef<THREE.Group>(null);
  const solarWingsRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.35;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 0.55;
      innerRingRef.current.rotation.x += delta * 0.15;
    }
    if (coreSpireRef.current) {
      coreSpireRef.current.rotation.y += delta * 0.75;
    }
    if (solarWingsRef.current) {
      solarWingsRef.current.rotation.y -= delta * 0.1;
    }
  });

  const categoryColor =
    event.category.toLowerCase().includes('workshop')
      ? '#a855f7'
      : event.category.toLowerCase().includes('contest')
      ? '#ec4899'
      : '#06b6d4';

  return (
    <group position={position}>
      {/* 
        === CENTRAL QUANTUM REACTOR SPIRE === 
      */}
      <group ref={coreSpireRef}>
        {/* Upper Reactor Crystal */}
        <mesh position={[0, 1.4, 0]}>
          <octahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial
            color={categoryColor}
            emissive={categoryColor}
            emissiveIntensity={isActive ? 3.5 : 2.0}
            wireframe
          />
        </mesh>
        {/* Lower Reactor Crystal */}
        <mesh position={[0, -1.4, 0]}>
          <octahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial
            color={categoryColor}
            emissive={categoryColor}
            emissiveIntensity={isActive ? 3.5 : 2.0}
            wireframe
          />
        </mesh>
        {/* Core Spindle Hub */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 3.8, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.2} />
        </mesh>
        {/* Inner Superheated Plasma Core */}
        <mesh>
          <sphereGeometry args={[0.65, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* 
        === DUAL COUNTER-ROTATING HABITAT & DOCKING RINGS === 
      */}
      {/* Outer Ring with Docking Bays */}
      <group ref={outerRingRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.6, 0.28, 14, 40]} />
          <meshStandardMaterial
            color="#181329"
            metalness={0.92}
            roughness={0.25}
            emissive={categoryColor}
            emissiveIntensity={0.6}
          />
        </mesh>

        {/* Outer Ring Docking Clamps & Light Beacons */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2;
          const x = Math.cos(angle) * 3.6;
          const y = Math.sin(angle) * 3.6;
          return (
            <group key={i} position={[x, y, 0]}>
              <mesh>
                <boxGeometry args={[0.4, 0.4, 0.6]} />
                <meshStandardMaterial color="#334155" metalness={0.9} />
              </mesh>
              <mesh position={[0, 0, 0.35]}>
                <sphereGeometry args={[0.12, 8, 8]} />
                <meshBasicMaterial color={categoryColor} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Inner Counter-Rotating Gimbal Ring */}
      <group ref={innerRingRef}>
        <mesh>
          <torusGeometry args={[2.4, 0.14, 10, 32]} />
          <meshStandardMaterial
            color="#090d16"
            metalness={0.95}
            emissive="#38bdf8"
            emissiveIntensity={0.8}
          />
        </mesh>
      </group>

      {/* 
        === 4 DEPLOYED PHOTOVOLTAIC SOLAR RADIATOR ARRAYS === 
      */}
      <group ref={solarWingsRef}>
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
          <group key={i} rotation={[0, angle, 0]}>
            {/* Strut Arm */}
            <mesh position={[0, 0, 3.2]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 2.5, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.9} />
            </mesh>
            {/* Solar Panel Wing */}
            <mesh position={[0, 0, 4.6]} rotation={[0, 0, 0]}>
              <boxGeometry args={[1.6, 0.04, 1.2]} />
              <meshStandardMaterial
                color="#0369a1"
                metalness={0.9}
                roughness={0.1}
                emissive="#0284c7"
                emissiveIntensity={0.6}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Vertical Holographic Guidance Signal Beams */}
      <mesh position={[0, 4.8, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 5, 6]} />
        <meshBasicMaterial color={categoryColor} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 7.2, 0]}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshBasicMaterial color={categoryColor} />
      </mesh>

      {/* Station Omnidirectional Pulse Lighting */}
      <pointLight color={categoryColor} intensity={isActive ? 16 : 7} distance={30} />

      {/* Compact In-World Station Beacon Marker */}
      <Html position={[0, 4.8, 0]} center distanceFactor={20} zIndexRange={[50, 0]}>
        <div
          onClick={onInspect}
          className={`px-3 py-2 rounded-xl backdrop-blur-md border text-center transition-all cursor-pointer select-none shadow-xl flex flex-col items-center gap-1 ${
            isActive ? 'scale-105 ring-1 ring-white' : 'hover:scale-105 opacity-90'
          }`}
          style={{
            backgroundColor: 'rgba(10, 8, 22, 0.88)',
            borderColor: categoryColor,
            boxShadow: `0 0 20px ${categoryColor}66`,
            color: '#fff',
            minWidth: '170px'
          }}
        >
          <div className="flex items-center gap-1">
            <span
              className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase"
              style={{ backgroundColor: `${categoryColor}44`, color: '#fff' }}
            >
              STATION 0{index + 1} • {event.category}
            </span>
          </div>
          <h3 className="text-xs font-bold text-white tracking-wide truncate max-w-[160px]">
            {event.title}
          </h3>
          <span className="text-[9px] text-gray-300 font-mono">{event.date}</span>
          <span
            className="text-[8px] font-mono font-bold mt-0.5 uppercase tracking-wider animate-pulse"
            style={{ color: categoryColor }}
          >
            {isDocking ? 'AUTOPILOT DOCKING...' : 'Approach to Dock ➔'}
          </span>
        </div>
      </Html>
    </group>
  );
}

