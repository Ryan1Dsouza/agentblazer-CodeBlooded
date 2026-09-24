import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function LavaTrainVehicle({ speed }: { speed: number }) {
  const trainGroup = useRef<THREE.Group>(null);
  const chimneySmokeRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (chimneySmokeRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 15) * 0.4 + Math.abs(speed);
      chimneySmokeRef.current.scale.set(s, s * 1.5, s);
    }
  });

  return (
    <group ref={trainGroup}>
      {/* Heavy Magma Locomotive Head */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1.6, 1.2, 3.2]} />
        <meshStandardMaterial
          color="#1c1917"
          roughness={0.4}
          metalness={0.8}
          emissive="#7c2d12"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Armored Cowcatcher / Grill */}
      <mesh position={[0, 0.4, 1.8]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[1.7, 0.6, 0.5]} />
        <meshStandardMaterial color="#44403c" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Glowing Molten Core Boiler */}
      <mesh position={[0, 0.8, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 2.2, 16]} />
        <meshStandardMaterial
          color="#ea580c"
          emissive="#ff6b35"
          emissiveIntensity={2.5}
          roughness={0.2}
        />
      </mesh>

      {/* Chimney Funnel with Smoke / Ember Output */}
      <mesh position={[0, 1.8, 1.1]}>
        <cylinderGeometry args={[0.25, 0.18, 0.8, 12]} />
        <meshStandardMaterial color="#292524" metalness={0.8} />
      </mesh>
      {/* Chimney Glow Puff */}
      <mesh ref={chimneySmokeRef} position={[0, 2.4, 1.1]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.7} />
      </mesh>

      {/* Driver Cabin */}
      <mesh position={[0, 1.6, -1.0]}>
        <boxGeometry args={[1.5, 1.2, 1.4]} />
        <meshStandardMaterial color="#0c0a09" roughness={0.5} metalness={0.7} />
      </mesh>
      {/* Cabin Windows */}
      <mesh position={[0, 1.7, -0.25]}>
        <boxGeometry args={[1.3, 0.5, 0.1]} />
        <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={3} />
      </mesh>

      {/* Trailing Passenger / Observation Carriage 1 */}
      <mesh position={[0, 0.8, -4.2]}>
        <boxGeometry args={[1.5, 1.1, 2.8]} />
        <meshStandardMaterial color="#292524" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.9, -4.2]}>
        <boxGeometry args={[1.55, 0.4, 2.4]} />
        <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={1.5} />
      </mesh>

      {/* Trailing Passenger Carriage 2 */}
      <mesh position={[0, 0.8, -7.5]}>
        <boxGeometry args={[1.5, 1.1, 2.8]} />
        <meshStandardMaterial color="#292524" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.9, -7.5]}>
        <boxGeometry args={[1.55, 0.4, 2.4]} />
        <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={1.5} />
      </mesh>

      {/* Underside Mag-Lev Rail Skates & Sparks */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.7, 0.1, 0]}>
            <boxGeometry args={[0.2, 0.3, 3]} />
            <meshStandardMaterial color="#78716c" metalness={0.9} />
          </mesh>
          <mesh position={[side * 0.7, 0.1, -4.2]}>
            <boxGeometry args={[0.2, 0.3, 2.6]} />
            <meshStandardMaterial color="#78716c" metalness={0.9} />
          </mesh>
          <mesh position={[side * 0.7, 0.1, -7.5]}>
            <boxGeometry args={[0.2, 0.3, 2.6]} />
            <meshStandardMaterial color="#78716c" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Headlight Beam illuminating the track ahead */}
      <spotLight
        position={[0, 1.2, 2]}
        target-position={[0, 0, 20]}
        color="#ffedd5"
        intensity={6}
        distance={35}
        angle={0.6}
        penumbra={0.5}
      />
      <pointLight position={[0, 1, 0]} color="#f97316" intensity={5} distance={10} />
    </group>
  );
}
