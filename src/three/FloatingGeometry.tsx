import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function FloatingGeometry() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += delta * 0.1;
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[20, 10, -10]}>
      <mesh>
        <boxGeometry args={[3, 3, 3]} />
        <meshBasicMaterial color="#d946ef" wireframe transparent opacity={0.3} />
      </mesh>
      <mesh position={[-15, -8, 5]}>
        <octahedronGeometry args={[2, 0]} />
        <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.25} />
      </mesh>
      <mesh position={[25, -15, -5]}>
        <tetrahedronGeometry args={[2.5, 0]} />
        <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.2} />
      </mesh>
    </group>
  );
}
