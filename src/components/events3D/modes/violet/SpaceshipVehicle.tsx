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
  const thrusterLeftRef = useRef<THREE.Mesh>(null);
  const thrusterRightRef = useRef<THREE.Mesh>(null);
  const thrusterCenterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const basePulse = isBoosting ? 3.0 : 1.2;
    const flicker = Math.sin(time * 35) * 0.3 + (speed / 12);
    const scaleZ = Math.max(0.8, basePulse + flicker);

    if (thrusterLeftRef.current && thrusterRightRef.current && thrusterCenterRef.current) {
      thrusterLeftRef.current.scale.set(isBoosting ? 1.3 : 1, isBoosting ? 1.3 : 1, scaleZ);
      thrusterRightRef.current.scale.set(isBoosting ? 1.3 : 1, isBoosting ? 1.3 : 1, scaleZ);
      thrusterCenterRef.current.scale.set(isBoosting ? 1.6 : 1.1, isBoosting ? 1.6 : 1.1, scaleZ * 1.2);
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* 
        SPACESHIP COORDINATE SYSTEM:
        - Forward direction is -Z
        - Nose cone is at z = -1.6
        - Engines & exhaust are at rear: z = +1.2 to +1.8 (exhaust shoots into +Z)
      */}

      {/* Main Hull Body / Fuselage */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.55, 3.2, 8]} />
        <meshStandardMaterial
          color="#120e24"
          metalness={0.92}
          roughness={0.25}
          emissive="#3b0764"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Aerodynamic Cockpit Glass Canopy (forward sloped) */}
      <mesh position={[0, 0.28, -0.4]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.36, 0.26, 1.1]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.6}
          emissive="#a855f7"
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* Main Swept Delta Wings (Left) */}
      <mesh position={[-0.95, -0.02, 0.3]} rotation={[0, -0.2, -0.08]}>
        <boxGeometry args={[1.5, 0.05, 1.6]} />
        <meshStandardMaterial
          color="#181133"
          metalness={0.88}
          roughness={0.3}
          emissive="#2e1065"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Left Wing Neon Blade Edge */}
      <mesh position={[-1.72, 0.18, 0.3]} rotation={[0, -0.2, 0.1]}>
        <boxGeometry args={[0.06, 0.45, 1.4]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#a855f7"
          emissiveIntensity={3.5}
        />
      </mesh>

      {/* Main Swept Delta Wings (Right) */}
      <mesh position={[0.95, -0.02, 0.3]} rotation={[0, 0.2, 0.08]}>
        <boxGeometry args={[1.5, 0.05, 1.6]} />
        <meshStandardMaterial
          color="#181133"
          metalness={0.88}
          roughness={0.3}
          emissive="#2e1065"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Right Wing Neon Blade Edge */}
      <mesh position={[1.72, 0.18, 0.3]} rotation={[0, 0.2, -0.1]}>
        <boxGeometry args={[0.06, 0.45, 1.4]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#a855f7"
          emissiveIntensity={3.5}
        />
      </mesh>

      {/* Forward Canards (Nose Stabilizers) */}
      <mesh position={[-0.45, 0.05, -0.9]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.03, 0.35]} />
        <meshStandardMaterial color="#2e1065" metalness={0.9} />
      </mesh>
      <mesh position={[0.45, 0.05, -0.9]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.5, 0.03, 0.35]} />
        <meshStandardMaterial color="#2e1065" metalness={0.9} />
      </mesh>

      {/* Vertical Dorsal Tail Fin */}
      <mesh position={[0, 0.45, 0.6]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[0.05, 0.65, 0.9]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#9333ea"
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* 
        === REAR ION THRUSTER ENGINES & PLASMATIC EXHAUST ===
        Positioned at REAR (+Z = 1.3) pointing into +Z (backward)
      */}

      {/* Left Engine Nacelle */}
      <group position={[-0.45, 0, 1.2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.22, 0.6, 16]} />
          <meshStandardMaterial color="#1e1b4b" metalness={0.95} roughness={0.2} />
        </mesh>
        {/* Exhaust Cone (Points BACKWARD into +Z) */}
        <mesh
          ref={thrusterLeftRef}
          position={[0, 0, 0.6]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <coneGeometry args={[0.16, 1.4, 12]} />
          <meshBasicMaterial
            color={isBoosting ? '#38bdf8' : '#a855f7'}
            transparent
            opacity={0.88}
          />
        </mesh>
      </group>

      {/* Right Engine Nacelle */}
      <group position={[0.45, 0, 1.2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.22, 0.6, 16]} />
          <meshStandardMaterial color="#1e1b4b" metalness={0.95} roughness={0.2} />
        </mesh>
        {/* Exhaust Cone (Points BACKWARD into +Z) */}
        <mesh
          ref={thrusterRightRef}
          position={[0, 0, 0.6]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <coneGeometry args={[0.16, 1.4, 12]} />
          <meshBasicMaterial
            color={isBoosting ? '#38bdf8' : '#a855f7'}
            transparent
            opacity={0.88}
          />
        </mesh>
      </group>

      {/* Center Main Afterburner Turbine */}
      <group position={[0, -0.05, 1.4]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.28, 0.5, 16]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.95}
            emissive="#7e22ce"
            emissiveIntensity={1.5}
          />
        </mesh>
        {/* Center Exhaust Plasma Flame */}
        <mesh
          ref={thrusterCenterRef}
          position={[0, 0, 0.7]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <coneGeometry args={[0.22, 1.8, 12]} />
          <meshBasicMaterial
            color={isBoosting ? '#00ffff' : '#c084fc'}
            transparent
            opacity={0.95}
          />
        </mesh>
      </group>

      {/* Dynamic Engine Lighting in the Rear */}
      <pointLight
        position={[0, 0, 1.8]}
        color={isBoosting ? '#38bdf8' : '#a855f7'}
        intensity={isBoosting ? 15 : 6}
        distance={16}
      />
    </group>
  );
}
