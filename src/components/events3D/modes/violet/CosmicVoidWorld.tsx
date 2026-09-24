import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function CosmicVoidWorld() {
  const starsCount = 2200;

  const [starPositions, starColors] = useMemo(() => {
    const pos = new Float32Array(starsCount * 3);
    const col = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);
    const colorChoices = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#e0e7ff'),
      new THREE.Color('#c084fc'),
      new THREE.Color('#38bdf8'),
      new THREE.Color('#a78bfa'),
      new THREE.Color('#f0abfc')
    ];

    for (let i = 0; i < starsCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 800;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 600;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 800;

      const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      sizes[i] = 0.4 + Math.random() * 1.2;
    }
    return [pos, col, sizes];
  }, []);


  const starsRef = useRef<THREE.Points>(null);

  const wormholeRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.003;
      starsRef.current.rotation.x += delta * 0.001;
    }


    // Animate wormhole
    if (wormholeRef.current) {
      wormholeRef.current.rotation.z += delta * 0.6;
      wormholeRef.current.children.forEach((child, i) => {
        if ((child as THREE.Mesh).isMesh) {
          const scale = 1 + Math.sin(time * 2 + i * 0.5) * 0.08;
          child.scale.set(scale, scale, 1);
        }
      });
    }
  });

  return (
    <group>
      {/* Dense Starfield */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[starColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.9}
          vertexColors
          transparent
          opacity={0.88}
          sizeAttenuation
        />
      </points>



      {/* Distant Cyber Planet — detailed */}
      <group position={[140, 50, -230]}>
        {/* Planet body */}
        <mesh>
          <sphereGeometry args={[30, 48, 48]} />
          <meshStandardMaterial
            color="#1a0c30"
            emissive="#6b21a8"
            emissiveIntensity={0.7}
            roughness={0.6}
            metalness={0.4}
          />
        </mesh>
        {/* Planet atmosphere glow */}
        <mesh>
          <sphereGeometry args={[31.5, 32, 32]} />
          <meshBasicMaterial
            color="#7c3aed"
            transparent
            opacity={0.08}
            side={THREE.BackSide}
          />
        </mesh>
        {/* Planet Ring — primary */}
        <mesh rotation={[1.2, 0.4, 0]}>
          <torusGeometry args={[48, 1.8, 2, 80]} />
          <meshBasicMaterial color="#c084fc" transparent opacity={0.45} />
        </mesh>
        {/* Planet Ring — secondary, thinner */}
        <mesh rotation={[1.15, 0.38, 0.05]}>
          <torusGeometry args={[54, 0.6, 2, 64]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={0.2} />
        </mesh>
        {/* Planet light source */}
        <pointLight color="#7c3aed" intensity={3} distance={120} />
      </group>

      {/* Distant Wormhole / Portal — animated rings */}
      <group ref={wormholeRef} position={[-180, 20, -250]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, i * 0.3]}>
            <torusGeometry args={[18 + i * 5, 0.3 + i * 0.15, 16, 48]} />
            <meshBasicMaterial
              color={i === 0 ? '#38bdf8' : i === 1 ? '#a855f7' : '#ec4899'}
              transparent
              opacity={0.25 - i * 0.06}
            />
          </mesh>
        ))}
        {/* Wormhole core glow */}
        <mesh>
          <sphereGeometry args={[8, 16, 16]} />
          <meshBasicMaterial color="#e0e7ff" transparent opacity={0.05} />
        </mesh>
        <pointLight color="#38bdf8" intensity={4} distance={80} />
      </group>

      {/* Distant Nebula Clouds — volumetric-style large spheres */}
      <mesh position={[-220, 40, -320]}>
        <sphereGeometry args={[70, 16, 16]} />
        <meshBasicMaterial color="#2e1065" transparent opacity={0.06} />
      </mesh>
      <mesh position={[180, -30, -280]}>
        <sphereGeometry args={[50, 12, 12]} />
        <meshBasicMaterial color="#1e1b4b" transparent opacity={0.05} />
      </mesh>
      <mesh position={[0, 80, -350]}>
        <sphereGeometry args={[90, 16, 16]} />
        <meshBasicMaterial color="#312e81" transparent opacity={0.035} />
      </mesh>

    </group>
  );
}
