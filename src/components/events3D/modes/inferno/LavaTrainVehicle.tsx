import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function LavaTrainVehicle({ speed }: { speed: number }) {
  const trainGroup = useRef<THREE.Group>(null);
  const hoverRailsRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (trainGroup.current) {
      // Gentle maglev hovering
      trainGroup.current.position.y = Math.sin(t * 3) * 0.05;
      // Slight pitch based on speed and hover
      trainGroup.current.rotation.x = Math.sin(t * 2) * 0.01;
    }
    
    if (hoverRailsRef.current) {
      // Pulse the maglev rails
      hoverRailsRef.current.children.forEach((child, i) => {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = 2 + Math.sin(t * 8 + i) * 1.5;
        }
      });
    }
  });

  return (
    <group>
      <group ref={trainGroup}>
        {/* Main Body - Sleeker Cyberpunk Streamline */}
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[1.8, 1.4, 4.5]} />
          <meshStandardMaterial color="#111111" metalness={0.9} roughness={0.3} />
        </mesh>
        
        {/* Aerodynamic Nose */}
        <mesh position={[0, 1.0, 2.8]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[1.8, 1.0, 1.5]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.85} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.45, 3.4]} rotation={[-0.8, 0, 0]}>
          <boxGeometry args={[1.7, 0.5, 1.2]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Cockpit Glass */}
        <mesh position={[0, 1.7, 1.6]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[1.6, 0.6, 1.2]} />
          <meshPhysicalMaterial 
            color="#000000" 
            metalness={0.9} 
            roughness={0.1} 
            envMapIntensity={2.0} 
            clearcoat={1.0}
            emissive="#ff3300"
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Glowing Magma Core (Exposed) */}
        <mesh position={[0, 1.4, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.75, 0.75, 2.5, 24]} />
          <meshStandardMaterial color="#ff2200" emissive="#ff4400" emissiveIntensity={3} roughness={0.1} />
        </mesh>
        
        {/* Core Containment Ribs */}
        {[0, 1, 2, 3, 4].map(i => (
          <mesh key={i} position={[0, 1.4, -1.5 + i * 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.8, 0.1, 16, 32]} />
            <meshStandardMaterial color="#222" metalness={0.95} roughness={0.2} />
          </mesh>
        ))}

        {/* Heavy Side Armor Plating */}
        {[-1, 1].map(side => (
          <group key={side}>
            <mesh position={[side * 0.95, 1.2, 0]}>
              <boxGeometry args={[0.2, 0.8, 4.2]} />
              <meshStandardMaterial color="#1a1818" metalness={0.7} roughness={0.6} />
            </mesh>
            {/* Glowing Accent Lines */}
            <mesh position={[side * 1.06, 1.2, 0]}>
              <boxGeometry args={[0.02, 0.05, 3.8]} />
              <meshStandardMaterial color="#ff5500" emissive="#ff3300" emissiveIntensity={2.5} />
            </mesh>
          </group>
        ))}

        {/* Rear Exhaust / Thrusters */}
        <group position={[0, 1.2, -2.3]}>
          {[-0.5, 0.5].map(side => (
            <mesh key={side} position={[side, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.3, 0.4, 0.6, 16]} />
              <meshStandardMaterial color="#0a0a0a" metalness={0.9} />
            </mesh>
          ))}
          {/* Exhaust Glow */}
          {[-0.5, 0.5].map(side => (
            <mesh key={side} position={[side, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.25, 0.1, 0.8, 16]} />
              <meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
            </mesh>
          ))}
        </group>

        {/* Carriage 1 */}
        <group position={[0, 0, -5.5]}>
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[1.7, 1.3, 4.5]} />
            <meshStandardMaterial color="#141414" metalness={0.8} roughness={0.4} />
          </mesh>
          {/* Carriage Windows */}
          {[-1, 1].map(side => (
            <mesh key={side} position={[side * 0.86, 1.4, 0]}>
              <boxGeometry args={[0.05, 0.4, 3.8]} />
              <meshStandardMaterial color="#000" emissive="#ff3300" emissiveIntensity={0.5} />
            </mesh>
          ))}
          {/* Connector */}
          <mesh position={[0, 1.0, 2.5]}>
            <cylinderGeometry args={[0.4, 0.4, 0.8, 16]} rotation={[Math.PI/2, 0, 0]} />
            <meshStandardMaterial color="#333" metalness={0.9} />
          </mesh>
        </group>
      </group>

      {/* Undercarriage Mag-Lev Rails (Stationary to world, or moving relative to track) */}
      <group ref={hoverRailsRef} position={[0, 0.2, 0]}>
        {[-0.8, 0.8].map((side, idx) => (
          <mesh key={idx} position={[side, 0, -2]}>
            <boxGeometry args={[0.3, 0.1, 12]} />
            <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={2} transparent opacity={0.8} />
          </mesh>
        ))}
      </group>

      {/* Dynamic Lighting */}
      <spotLight position={[0, 2.5, 4]} angle={0.5} penumbra={0.4} intensity={8} color="#ffaa55" distance={40} target-position={[0, 0, 20]} />
      <pointLight position={[0, 1.5, -0.5]} color="#ff4400" intensity={4} distance={15} />
    </group>
  );
}
