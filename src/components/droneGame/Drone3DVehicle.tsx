import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Drone3DVehicle({ thrustLevel }: { thrustLevel: number }) {
  const rotor1Ref = useRef<THREE.Group>(null);
  const rotor2Ref = useRef<THREE.Group>(null);
  const rotor3Ref = useRef<THREE.Group>(null);
  const rotor4Ref = useRef<THREE.Group>(null);
  const thrusterLRef = useRef<THREE.Mesh>(null);
  const thrusterRRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    // Rotor spin speed increases with thrust
    const spinSpeed = (20 + thrustLevel * 45) * delta;

    if (rotor1Ref.current) rotor1Ref.current.rotation.y += spinSpeed;
    if (rotor2Ref.current) rotor2Ref.current.rotation.y -= spinSpeed;
    if (rotor3Ref.current) rotor3Ref.current.rotation.y -= spinSpeed;
    if (rotor4Ref.current) rotor4Ref.current.rotation.y += spinSpeed;

    // Pulse core glow
    if (coreRef.current) {
      const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.15;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }

    // Scale thrusters based on thrust level
    const thrusterScale = 0.3 + thrustLevel * 0.9;
    if (thrusterLRef.current) {
      thrusterLRef.current.scale.set(1, thrusterScale, 1);
    }
    if (thrusterRRef.current) {
      thrusterRRef.current.scale.set(1, thrusterScale, 1);
    }
  });

  return (
    <group>
      {/* Central Fuselage / Carbon Shell */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.9, 0.22, 1.2]} />
        <meshStandardMaterial
          color="#121224"
          metalness={0.85}
          roughness={0.25}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Top Cockpit Cowling */}
      <mesh position={[0, 0.14, -0.08]}>
        <coneGeometry args={[0.38, 0.8, 5]} />
        <meshStandardMaterial
          color="#1c1c38"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Glowing AI Core Sensor Dome */}
      <mesh ref={coreRef} position={[0, 0.15, -0.15]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00d4ff"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>

      {/* Cyber Visor / Front Scanner Bar */}
      <mesh position={[0, 0.02, -0.62]}>
        <boxGeometry args={[0.5, 0.08, 0.08]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00d4ff"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>

      {/* Twin Forward Headlights */}
      <spotLight
        position={[0, 0, -0.5]}
        target-position={[0, -1, -6]}
        color="#00ffff"
        intensity={2.5}
        distance={25}
        angle={0.65}
        penumbra={0.5}
      />

      {/* 4 Carbon Arms extending diagonally to rotor hubs */}
      {/* Front-Left Arm */}
      <mesh position={[-0.8, 0.02, -0.6]} rotation={[0, Math.PI / 5, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.08]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} />
      </mesh>
      {/* Front-Right Arm */}
      <mesh position={[0.8, 0.02, -0.6]} rotation={[0, -Math.PI / 5, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.08]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} />
      </mesh>
      {/* Rear-Left Arm */}
      <mesh position={[-0.8, 0.02, 0.6]} rotation={[0, -Math.PI / 5, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.08]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} />
      </mesh>
      {/* Rear-Right Arm */}
      <mesh position={[0.8, 0.02, 0.6]} rotation={[0, Math.PI / 5, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.08]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} />
      </mesh>

      {/* 4 Ducted Rotor Rings & Propeller Discs */}
      {/* Front-Left Rotor */}
      <group position={[-1.3, 0.08, -0.9]}>
        <mesh>
          <torusGeometry args={[0.42, 0.035, 12, 24]} />
          <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.8} />
        </mesh>
        <group ref={rotor1Ref}>
          <mesh>
            <boxGeometry args={[0.78, 0.015, 0.07]} />
            <meshStandardMaterial color="#ffffff" emissive="#00ffff" emissiveIntensity={1.2} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.78, 0.015, 0.07]} />
            <meshStandardMaterial color="#ffffff" emissive="#00ffff" emissiveIntensity={1.2} />
          </mesh>
        </group>
      </group>

      {/* Front-Right Rotor */}
      <group position={[1.3, 0.08, -0.9]}>
        <mesh>
          <torusGeometry args={[0.42, 0.035, 12, 24]} />
          <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.8} />
        </mesh>
        <group ref={rotor2Ref}>
          <mesh>
            <boxGeometry args={[0.78, 0.015, 0.07]} />
            <meshStandardMaterial color="#ffffff" emissive="#00ffff" emissiveIntensity={1.2} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.78, 0.015, 0.07]} />
            <meshStandardMaterial color="#ffffff" emissive="#00ffff" emissiveIntensity={1.2} />
          </mesh>
        </group>
      </group>

      {/* Rear-Left Rotor */}
      <group position={[-1.3, 0.08, 0.9]}>
        <mesh>
          <torusGeometry args={[0.42, 0.035, 12, 24]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.8} />
        </mesh>
        <group ref={rotor3Ref}>
          <mesh>
            <boxGeometry args={[0.78, 0.015, 0.07]} />
            <meshStandardMaterial color="#ffffff" emissive="#8b5cf6" emissiveIntensity={1.2} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.78, 0.015, 0.07]} />
            <meshStandardMaterial color="#ffffff" emissive="#8b5cf6" emissiveIntensity={1.2} />
          </mesh>
        </group>
      </group>

      {/* Rear-Right Rotor */}
      <group position={[1.3, 0.08, 0.9]}>
        <mesh>
          <torusGeometry args={[0.42, 0.035, 12, 24]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.8} />
        </mesh>
        <group ref={rotor4Ref}>
          <mesh>
            <boxGeometry args={[0.78, 0.015, 0.07]} />
            <meshStandardMaterial color="#ffffff" emissive="#8b5cf6" emissiveIntensity={1.2} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.78, 0.015, 0.07]} />
            <meshStandardMaterial color="#ffffff" emissive="#8b5cf6" emissiveIntensity={1.2} />
          </mesh>
        </group>
      </group>

      {/* Rear Ion Thruster Exhausts */}
      <group position={[-0.25, -0.02, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh ref={thrusterLRef}>
          <coneGeometry args={[0.12, 0.7, 12]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.7} />
        </mesh>
      </group>
      <group position={[0.25, -0.02, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh ref={thrusterRRef}>
          <coneGeometry args={[0.12, 0.7, 12]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Downward Scanner Beam cone */}
      <mesh position={[0, -1.2, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 1.4, 2.4, 16, 1, true]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
