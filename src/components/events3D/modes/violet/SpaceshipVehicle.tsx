import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SpaceshipProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  speed: number;
  isBoosting: boolean;
}

export default function SpaceshipVehicle({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  speed,
  isBoosting
}: SpaceshipProps) {
  const groupRef = useRef<THREE.Group>(null);
  const enginesRef = useRef<THREE.Group>(null);
  const trailsRef = useRef<THREE.Group>(null);
  const pulseRingsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    if (groupRef.current) {
      // Hovering and banking animation
      groupRef.current.position.y = position[1] + Math.sin(t * 2.5) * 0.15;
      // Slight banking based on sine wave for dynamic flight feel
      groupRef.current.rotation.z = rotation[2] + Math.sin(t * 1.5) * 0.1;
      groupRef.current.rotation.x = rotation[0] + (isBoosting ? -0.1 : Math.sin(t * 2) * 0.05);
    }

    if (enginesRef.current) {
      const scale = isBoosting ? 1.5 + Math.sin(t * 30) * 0.2 : 1.0 + Math.sin(t * 10) * 0.05;
      enginesRef.current.scale.set(scale, scale, isBoosting ? 2.0 : 1.0);
    }

    if (pulseRingsRef.current) {
      pulseRingsRef.current.children.forEach((ring, i) => {
        const r = ring as THREE.Mesh;
        const mat = r.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = isBoosting ? 4 + Math.sin(t * 15 + i) * 2 : 1 + Math.sin(t * 5 + i) * 0.5;
      });
    }

    if (trailsRef.current) {
      trailsRef.current.children.forEach((trail) => {
        const tr = trail as THREE.Mesh;
        tr.scale.z = isBoosting ? 3.5 : 1.2;
        (tr.material as THREE.MeshBasicMaterial).opacity = isBoosting ? 0.6 : 0.2;
      });
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      
      {/* --- FUSELAGE --- */}
      <group position={[0, 0, 0]}>
        {/* Main Body */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.5, 3.5, 16, 16]} />
          <meshPhysicalMaterial 
            color="#080512" 
            metalness={0.9} 
            roughness={0.15} 
            clearcoat={0.5}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Cockpit Canopy */}
        <mesh position={[0, 0.35, -0.8]} rotation={[-0.15, 0, 0]}>
          <capsuleGeometry args={[0.35, 1.2, 16, 16]} />
          <meshPhysicalMaterial
            color="#000000"
            metalness={1.0}
            roughness={0.05}
            transmission={0.9}
            thickness={0.5}
            emissive="#a855f7"
            emissiveIntensity={0.2}
          />
        </mesh>
        
        {/* Neon Spine */}
        <mesh position={[0, 0.45, 0.5]}>
          <boxGeometry args={[0.05, 0.05, 2.5]} />
          <meshStandardMaterial color="#c084fc" emissive="#d8b4fe" emissiveIntensity={3} />
        </mesh>
      </group>

      {/* --- WINGS --- */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.8, -0.1, 0.5]}>
          {/* Swept Forward Wing */}
          <mesh rotation={[0, side * 0.4, 0]}>
            <boxGeometry args={[1.5, 0.08, 1.8]} />
            <meshPhysicalMaterial color="#0a0718" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Wing Edge Neon */}
          <mesh position={[side * 0.75, 0, 0]} rotation={[0, side * 0.4, 0]}>
            <boxGeometry args={[0.1, 0.12, 1.9]} />
            <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={2.5} />
          </mesh>
          {/* Wingtip Cannons / Sensors */}
          <mesh position={[side * 1.5, 0, -0.8]}>
            <cylinderGeometry args={[0.08, 0.08, 0.6]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#222" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* --- CANARDS (Front stabilizers) --- */}
      {[-1, 1].map((side) => (
        <mesh key={`canard-${side}`} position={[side * 0.6, 0.1, -1.5]} rotation={[0, side * -0.2, 0]}>
          <boxGeometry args={[0.8, 0.05, 0.6]} />
          <meshPhysicalMaterial color="#080512" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}

      {/* --- THRUSTERS & EXHAUST --- */}
      <group position={[0, 0, 2.0]}>
        {/* Main Engine Housings */}
        {[-0.4, 0.4].map((side) => (
          <mesh key={`engine-${side}`} position={[side, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.35, 0.8, 16]} />
            <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        {/* Center Engine Housing */}
        <mesh position={[0, 0.2, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.25, 0.8, 16]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Engine Glow Rings */}
        <group ref={pulseRingsRef}>
          {[-0.4, 0.4].map((side, idx) => (
            <mesh key={`ring-${idx}`} position={[side, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.22, 0.04, 16, 32]} />
              <meshStandardMaterial color="#c084fc" emissive="#a855f7" />
            </mesh>
          ))}
          <mesh position={[0, 0.2, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.18, 0.03, 16, 32]} />
            <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" />
          </mesh>
        </group>

        {/* Exhaust Plumes */}
        <group ref={enginesRef} position={[0, 0, 0.4]}>
          {[-0.4, 0.4].map((side, idx) => (
            <mesh key={`plume-${idx}`} position={[side, 0, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.2, 1.8, 16]} />
              <meshBasicMaterial color="#a855f7" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
            </mesh>
          ))}
          <mesh position={[0, 0.2, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.15, 1.5, 16]} />
            <meshBasicMaterial color="#00d4ff" transparent opacity={0.9} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      </group>

      {/* --- WING TRAILS --- */}
      <group ref={trailsRef} position={[0, 0, 0.5]}>
        {[-1.5, 1.5].map((side, idx) => (
          <mesh key={`trail-${idx}`} position={[side, 0, 0.8]}>
            <boxGeometry args={[0.04, 0.04, 3]} />
            <meshBasicMaterial color="#00d4ff" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>

      {/* --- DYNAMIC LIGHTING --- */}
      <pointLight position={[0, 0, 2.5]} color="#a855f7" intensity={isBoosting ? 8 : 3} distance={15} />
      <pointLight position={[0, 0.5, -0.5]} color="#c084fc" intensity={1} distance={5} />
    </group>
  );
}
