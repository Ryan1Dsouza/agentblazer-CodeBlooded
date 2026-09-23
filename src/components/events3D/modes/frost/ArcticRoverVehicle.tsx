import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RoverProps {
  speed: number;
  steering: number;
}

export default function ArcticRoverVehicle({ speed, steering }: RoverProps) {
  const frontLeftWheelRef = useRef<THREE.Group>(null);
  const frontRightWheelRef = useRef<THREE.Group>(null);
  const rearLeftWheelRef = useRef<THREE.Group>(null);
  const rearRightWheelRef = useRef<THREE.Group>(null);
  const antennaRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    // Spin tires around their rolling axle (Z-axis in local wheel cylinder alignment)
    if (speed !== 0) {
      const spinDelta = speed * delta * 4.5;
      if (frontLeftWheelRef.current) frontLeftWheelRef.current.rotation.x += spinDelta;
      if (frontRightWheelRef.current) frontRightWheelRef.current.rotation.x += spinDelta;
      if (rearLeftWheelRef.current) rearLeftWheelRef.current.rotation.x += spinDelta;
      if (rearRightWheelRef.current) rearRightWheelRef.current.rotation.x += spinDelta;
    }
    if (antennaRef.current) {
      antennaRef.current.rotation.y += delta * 2.5;
    }
  });

  // Clamp steering angle so tires stay strictly inside wheel wells
  const steerAngle = Math.max(-0.28, Math.min(0.28, steering * 0.22));

  return (
    <group>
      {/* Main Armored Cabin Chassis */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[1.6, 0.85, 3.2]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.4}
          metalness={0.7}
          emissive="#0369a1"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Cockpit Canopy Windshield */}
      <mesh position={[0, 1.25, 0.6]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[1.4, 0.55, 1.2]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.8}
          emissive="#0284c7"
          emissiveIntensity={1.4}
        />
      </mesh>

      {/* Armored Wheel Arch Fenders / Mudguards (Over each wheel) */}
      {[
        [-0.88, 0.72, 1.05],
        [0.88, 0.72, 1.05],
        [-0.88, 0.72, -1.05],
        [0.88, 0.72, -1.05]
      ].map(([fx, fy, fz], idx) => (
        <group key={idx} position={[fx, fy, fz]}>
          <mesh>
            <boxGeometry args={[0.32, 0.22, 0.95]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.11, 0]}>
            <boxGeometry args={[0.34, 0.04, 0.97]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={2.0} />
          </mesh>
        </group>
      ))}

      {/* Roof Solar Array & Radar Dish */}
      <mesh position={[0, 1.35, -0.6]}>
        <boxGeometry args={[1.3, 0.08, 1.3]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} />
      </mesh>
      <group position={[0, 1.7, -0.6]}>
        <mesh ref={antennaRef} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.05, 0.2, 12]} />
          <meshStandardMaterial color="#38bdf8" wireframe />
        </mesh>
      </group>

      {/* Cyber Cyan Neon Side Armor Strips */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.82, 0.85, 0]}>
          <boxGeometry args={[0.06, 0.25, 2.6]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0ea5e9"
            emissiveIntensity={2.5}
          />
        </mesh>
      ))}

      {/* Axle Support Struts Connecting Wheels to Chassis */}
      {[1.05, -1.05].map((zPos, zIdx) => (
        <mesh key={zIdx} position={[0, 0.45, zPos]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 1.7, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.2} />
        </mesh>
      ))}

      {/* 
        === WHEEL KNUCKLES & ROTATING TIRES === 
        Front wheels steer strictly around their central kingpin hub
      */}
      {/* Front-Left Wheel */}
      <group position={[-0.85, 0.45, 1.05]} rotation={[0, steerAngle, 0]}>
        <group ref={frontLeftWheelRef}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.4, 0.4, 0.28, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.3} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.3, 12]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={2.0} />
          </mesh>
        </group>
      </group>

      {/* Front-Right Wheel */}
      <group position={[0.85, 0.45, 1.05]} rotation={[0, steerAngle, 0]}>
        <group ref={frontRightWheelRef}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.4, 0.4, 0.28, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.3} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.3, 12]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={2.0} />
          </mesh>
        </group>
      </group>

      {/* Rear-Left Wheel (Fixed steering) */}
      <group position={[-0.85, 0.45, -1.05]}>
        <group ref={rearLeftWheelRef}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.4, 0.4, 0.28, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.3} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.3, 12]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={2.0} />
          </mesh>
        </group>
      </group>

      {/* Rear-Right Wheel (Fixed steering) */}
      <group position={[0.85, 0.45, -1.05]}>
        <group ref={rearRightWheelRef}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.4, 0.4, 0.28, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.3} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.3, 12]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={2.0} />
          </mesh>
        </group>
      </group>

      {/* Forward High-Beam Headlights */}
      <spotLight
        position={[0, 1.1, 1.7]}
        target-position={[0, 0, 25]}
        color="#e0f2fe"
        intensity={6}
        distance={35}
        angle={0.65}
        penumbra={0.4}
      />
      <pointLight position={[0, 1.0, 0]} color="#0ea5e9" intensity={4} distance={10} />
    </group>
  );
}

