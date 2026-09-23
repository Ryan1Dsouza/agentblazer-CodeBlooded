import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function BlizzardAndCabin() {
  const snowCount = 1800;
  const embersCount = 80;

  const snowRef = useRef<THREE.Points>(null);
  const emberRef = useRef<THREE.Points>(null);

  // Falling snow particles
  const [snowPos, snowSpeeds] = useMemo(() => {
    const pos = new Float32Array(snowCount * 3);
    const spd = new Float32Array(snowCount);
    for (let i = 0; i < snowCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 120;
      spd[i] = 4 + Math.random() * 6;
    }
    return [pos, spd];
  }, []);

  // Fireplace embers
  const emberPos = useMemo(() => {
    const pos = new Float32Array(embersCount * 3);
    for (let i = 0; i < embersCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.5;
      pos[i * 3 + 1] = Math.random() * 1.5 + 0.3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5 - 7.5;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (snowRef.current) {
      const arr = snowRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < snowCount; i++) {
        arr[i * 3 + 1] -= snowSpeeds[i] * delta;
        arr[i * 3] += Math.sin(arr[i * 3 + 1] * 0.5) * delta * 0.8;
        if (arr[i * 3 + 1] < 0) {
          arr[i * 3 + 1] = 40;
        }
      }
      snowRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (emberRef.current) {
      const eArr = emberRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < embersCount; i++) {
        eArr[i * 3 + 1] += delta * 0.5;
        if (eArr[i * 3 + 1] > 2.2) {
          eArr[i * 3 + 1] = 0.3;
        }
      }
      emberRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Falling 3D Snowflakes in exterior */}
      <points ref={snowRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[snowPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.6}
          color="#ffffff"
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>

      {/* Fireplace Floating Embers */}
      <points ref={emberRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[emberPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          color="#f97316"
          transparent
          opacity={0.9}
          sizeAttenuation
        />
      </points>

      {/* Exterior Snow Terrain */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200, 32, 32]} />
        <meshStandardMaterial
          color="#e0f2fe"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Pine Trees outside windows */}
      {[-25, -20, 20, 25].map((x, i) => (
        <group key={i} position={[x, 0, -25 + (i % 2) * 8]}>
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.4, 0.6, 4, 8]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
          <mesh position={[0, 6, 0]}>
            <coneGeometry args={[3, 6, 8]} />
            <meshStandardMaterial color="#064e3b" roughness={0.8} />
          </mesh>
          <mesh position={[0, 9, 0]}>
            <coneGeometry args={[2.2, 5, 8]} />
            <meshStandardMaterial color="#e0f2fe" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ===== COZY CABIN INTERIOR ===== */}
      <group>
        {/* Polished Pine Hardwood Floor */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[26, 22]} />
          <meshStandardMaterial color="#78350f" roughness={0.4} metalness={0.1} />
        </mesh>

        {/* Timber Log Walls */}
        {/* Back Wall with Fireplace Chimney */}
        <mesh position={[0, 4, -10]}>
          <boxGeometry args={[26, 8, 0.6]} />
          <meshStandardMaterial color="#451a03" roughness={0.7} />
        </mesh>
        {/* Left Wall */}
        <mesh position={[-12.5, 4, 0]}>
          <boxGeometry args={[0.6, 8, 22]} />
          <meshStandardMaterial color="#451a03" roughness={0.7} />
        </mesh>
        {/* Right Wall */}
        <mesh position={[12.5, 4, 0]}>
          <boxGeometry args={[0.6, 8, 22]} />
          <meshStandardMaterial color="#451a03" roughness={0.7} />
        </mesh>
        {/* Front Wall with Entrance */}
        <mesh position={[0, 4, 10]}>
          <boxGeometry args={[26, 8, 0.6]} />
          <meshStandardMaterial color="#451a03" roughness={0.7} />
        </mesh>

        {/* Vaulted Cedar Beam Ceiling */}
        <mesh position={[0, 8, 0]}>
          <boxGeometry args={[26, 0.4, 22]} />
          <meshStandardMaterial color="#291403" roughness={0.8} />
        </mesh>

        {/* Center Stone Fireplace Hearth */}
        <group position={[0, 0, -9.2]}>
          <mesh position={[0, 3, 0]}>
            <boxGeometry args={[5, 6, 1.8]} />
            <meshStandardMaterial color="#374151" roughness={0.9} />
          </mesh>
          {/* Fireplace Hearth Alcove */}
          <mesh position={[0, 1.2, 0.3]}>
            <boxGeometry args={[3, 2.4, 1.4]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
          {/* Glowing Burning Logs */}
          <mesh position={[0, 0.6, 0.3]}>
            <cylinderGeometry args={[0.2, 0.2, 2, 8]} />
            <meshStandardMaterial
              color="#ea580c"
              emissive="#f97316"
              emissiveIntensity={3}
            />
          </mesh>
          {/* Warm Amber Fireplace Light */}
          <pointLight
            position={[0, 1.5, 1]}
            color="#ff7a00"
            intensity={6}
            distance={18}
          />
        </group>

        {/* Cozy Center Rug */}
        <mesh position={[0, 0.02, -1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 8]} />
          <meshStandardMaterial color="#991b1b" roughness={0.8} />
        </mesh>

        {/* Overhead Hanging Lanterns */}
        {[-6, 6].map((x, i) => (
          <group key={i} position={[x, 6, 0]}>
            <mesh>
              <cylinderGeometry args={[0.05, 0.05, 2]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[0, -1.2, 0]}>
              <boxGeometry args={[0.6, 0.8, 0.6]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#f59e0b"
                emissiveIntensity={2}
              />
            </mesh>
            <pointLight position={[0, -1.5, 0]} color="#fde047" intensity={2} distance={12} />
          </group>
        ))}
      </group>
    </group>
  );
}
