import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function CosmicVoidWorld() {
  const starsCount = 1800;
  const dustCount = 120;

  const [starPositions, starColors] = useMemo(() => {
    const pos = new Float32Array(starsCount * 3);
    const col = new Float32Array(starsCount * 3);
    const colorChoices = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#e0e7ff'),
      new THREE.Color('#c084fc'),
      new THREE.Color('#38bdf8')
    ];

    for (let i = 0; i < starsCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 700;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 500;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 700;

      const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  const dustPositions = useMemo(() => {
    const pos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 400;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 300;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    return pos;
  }, []);

  const starsRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.004;
    }
    if (dustRef.current) {
      dustRef.current.rotation.y -= delta * 0.006;
    }
  });

  return (
    <group>
      {/* Background Starfield */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[starColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.9}
          vertexColors
          transparent
          opacity={0.85}
          sizeAttenuation
        />
      </points>

      {/* Subtle Violet Nebula Dust — reduced */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.2}
          color="#a855f7"
          transparent
          opacity={0.2}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Distant Cyber Planet */}
      <mesh position={[140, 50, -220]}>
        <sphereGeometry args={[28, 32, 32]} />
        <meshStandardMaterial
          color="#1e1035"
          emissive="#6b21a8"
          emissiveIntensity={0.6}
          roughness={0.7}
        />
      </mesh>
      {/* Planet Ring */}
      <mesh position={[140, 50, -220]} rotation={[1.2, 0.4, 0]}>
        <torusGeometry args={[44, 1.4, 2, 64]} />
        <meshBasicMaterial color="#c084fc" transparent opacity={0.4} />
      </mesh>

      {/* Subtle Distant Nebula Cloud */}
      <mesh position={[-200, 30, -300]}>
        <sphereGeometry args={[60, 16, 16]} />
        <meshBasicMaterial color="#2e1065" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

