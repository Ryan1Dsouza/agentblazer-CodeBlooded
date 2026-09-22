import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RoverProps {
  speed: number;
  steering: number;
}

export default function ArcticRoverVehicle({ speed, steering }: RoverProps) {
  const wheelsRef = useRef<THREE.Group>(null);
  const antennaRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (wheelsRef.current && speed !== 0) {
      wheelsRef.current.children.forEach((wheel) => {
        wheel.rotation.x += speed * delta * 4;
      });
    }
    if (antennaRef.current) {
      antennaRef.current.rotation.y += delta * 2;
    }
  });

  return (
    <group>
      {/* Main Armored Cabin Body */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[1.8, 1.0, 3.2]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.4}
          metalness={0.7}
          emissive="#0369a1"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Cockpit Canopy Windshield */}
      <mesh position={[0, 1.3, 0.6]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[1.6, 0.6, 1.2]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.8}
          emissive="#0284c7"
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* Roof Solar Panels & Radar Dish */}
      <mesh position={[0, 1.45, -0.6]}>
        <boxGeometry args={[1.5, 0.1, 1.4]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} />
      </mesh>
      <group position={[0, 1.8, -0.6]}>
        <mesh ref={antennaRef} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.05, 0.2, 12]} />
          <meshStandardMaterial color="#38bdf8" wireframe />
        </mesh>
      </group>

      {/* Cyber Cyan Neon Side Armor Strips */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.92, 0.9, 0]}>
          <boxGeometry args={[0.08, 0.3, 2.8]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0ea5e9"
            emissiveIntensity={2.5}
          />
        </mesh>
      ))}

      {/* Heavy Snow Tread Wheels */}
      <group ref={wheelsRef}>
        {[
          [-1.0, 0.45, 1.1],
          [1.0, 0.45, 1.1],
          [-1.0, 0.45, -1.1],
          [1.0, 0.45, -1.1]
        ].map(([x, y, z], idx) => {
          const isFront = z > 0;
          return (
            <group
              key={idx}
              position={[x, y, z]}
              rotation={[0, isFront ? steering * 0.4 : 0, 0]}
            >
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.45, 0.45, 0.4, 16]} />
                <meshStandardMaterial color="#1e293b" roughness={0.9} metalness={0.2} />
              </mesh>
              {/* Wheel Rim Glow */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.25, 0.25, 0.42, 8]} />
                <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={1.5} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Forward High-Beam Headlights */}
      <spotLight
        position={[0, 1.1, 1.7]}
        target-position={[0, 0, 25]}
        color="#e0f2fe"
        intensity={5}
        distance={30}
        angle={0.65}
        penumbra={0.4}
      />
      <pointLight position={[0, 1.0, 0]} color="#0ea5e9" intensity={3} distance={8} />
    </group>
  );
}
