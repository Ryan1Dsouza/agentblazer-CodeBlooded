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
  const shockDiamondLeftRef = useRef<THREE.Mesh>(null);
  const shockDiamondRightRef = useRef<THREE.Mesh>(null);
  const wingTrailLeftRef = useRef<THREE.Mesh>(null);
  const wingTrailRightRef = useRef<THREE.Mesh>(null);
  const cockpitRef = useRef<THREE.Mesh>(null);
  const neonStripRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const basePulse = isBoosting ? 3.5 : 1.2;
    const flicker = Math.sin(time * 35) * 0.25 + (speed / 15);
    const scaleZ = Math.max(0.8, basePulse + flicker);

    // Engine exhaust scaling
    if (thrusterLeftRef.current && thrusterRightRef.current && thrusterCenterRef.current) {
      thrusterLeftRef.current.scale.set(isBoosting ? 1.3 : 1, isBoosting ? 1.3 : 1, scaleZ * (isBoosting ? 1.4 : 1.0));
      thrusterRightRef.current.scale.set(isBoosting ? 1.3 : 1, isBoosting ? 1.3 : 1, scaleZ * (isBoosting ? 1.4 : 1.0));
      thrusterCenterRef.current.scale.set(isBoosting ? 1.6 : 1.1, isBoosting ? 1.6 : 1.1, scaleZ * (isBoosting ? 1.6 : 1.2));
    }

    // Shock diamonds
    if (shockDiamondLeftRef.current && shockDiamondRightRef.current) {
      shockDiamondLeftRef.current.scale.set(1, 1, isBoosting ? 1.5 + Math.sin(time * 40) * 0.25 : 0.6);
      shockDiamondRightRef.current.scale.set(1, 1, isBoosting ? 1.5 + Math.sin(time * 40) * 0.25 : 0.6);
    }

    // Wing trails
    if (wingTrailLeftRef.current && wingTrailRightRef.current) {
      const trailOpacity = isBoosting ? 0.4 : Math.min(0.15, speed / 25);
      const trailLength = isBoosting ? 3.0 : 0.9;
      wingTrailLeftRef.current.scale.set(1, 1, trailLength);
      wingTrailRightRef.current.scale.set(1, 1, trailLength);
      (wingTrailLeftRef.current.material as THREE.MeshBasicMaterial).opacity = trailOpacity;
      (wingTrailRightRef.current.material as THREE.MeshBasicMaterial).opacity = trailOpacity;
    }

    // Cockpit pulse
    if (cockpitRef.current) {
      const mat = cockpitRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isBoosting ? 2.2 + Math.sin(time * 6) * 0.5 : 1.2 + Math.sin(time * 2) * 0.3;
    }

    // Neon strip animation
    neonStripRefs.current.forEach((ref, i) => {
      if (ref) {
        const mat = ref.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = isBoosting
          ? 3.0 + Math.sin(time * 8 + i * 1.5) * 1.0
          : 1.5 + Math.sin(time * 3 + i * 1.5) * 0.5;
      }
    });
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* 
        SPACESHIP COORDINATE SYSTEM:
        Forward = -Z, Nose = z ≈ -1.8, Engines = z ≈ +1.3
      */}

      {/* ═══ MAIN HULL — sleeker, angular fuselage ═══ */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.58, 3.6, 8]} />
        <meshStandardMaterial
          color="#0e0a1f"
          metalness={0.94}
          roughness={0.2}
          emissive="#3b0764"
          emissiveIntensity={isBoosting ? 0.9 : 0.4}
        />
      </mesh>

      {/* Hull spine ridge */}
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.08, 0.12, 2.8]} />
        <meshStandardMaterial
          color="#7c3aed"
          emissive="#8b5cf6"
          emissiveIntensity={isBoosting ? 2.0 : 1.0}
        />
      </mesh>

      {/* ═══ COCKPIT — holographic canopy ═══ */}
      <mesh ref={cockpitRef} position={[0, 0.3, -0.5]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.38, 0.28, 1.2]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.08}
          metalness={0.65}
          emissive={isBoosting ? '#38bdf8' : '#8b5cf6'}
          emissiveIntensity={1.2}
        />
      </mesh>
      {/* Cockpit frame */}
      <mesh position={[0, 0.32, -0.5]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.42, 0.03, 1.24]} />
        <meshStandardMaterial color="#1e1b4b" metalness={0.95} />
      </mesh>

      {/* ═══ SWEPT DELTA WINGS — left ═══ */}
      <mesh position={[-1.0, -0.02, 0.3]} rotation={[0, -0.2, -0.1]}>
        <boxGeometry args={[1.6, 0.05, 1.7]} />
        <meshStandardMaterial
          color="#130e28"
          metalness={0.9}
          roughness={0.25}
          emissive="#2e1065"
          emissiveIntensity={isBoosting ? 0.7 : 0.3}
        />
      </mesh>
      {/* Left Wing Neon Edge */}
      <mesh
        ref={(el) => { neonStripRefs.current[0] = el; }}
        position={[-1.82, 0.2, 0.3]}
        rotation={[0, -0.2, 0.1]}
      >
        <boxGeometry args={[0.06, 0.48, 1.5]} />
        <meshStandardMaterial
          color={isBoosting ? '#38bdf8' : '#c084fc'}
          emissive={isBoosting ? '#0ea5e9' : '#a855f7'}
          emissiveIntensity={1.5}
        />
      </mesh>
      {/* Left wing tip nacelle */}
      <mesh position={[-1.82, 0.0, 0.8]}>
        <boxGeometry args={[0.18, 0.18, 0.5]} />
        <meshStandardMaterial color="#1e1b4b" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Left Wingtip Trail */}
      <mesh ref={wingTrailLeftRef} position={[-1.82, 0.18, 1.5]}>
        <boxGeometry args={[0.03, 0.14, 2.0]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} />
      </mesh>

      {/* ═══ SWEPT DELTA WINGS — right ═══ */}
      <mesh position={[1.0, -0.02, 0.3]} rotation={[0, 0.2, 0.1]}>
        <boxGeometry args={[1.6, 0.05, 1.7]} />
        <meshStandardMaterial
          color="#130e28"
          metalness={0.9}
          roughness={0.25}
          emissive="#2e1065"
          emissiveIntensity={isBoosting ? 0.7 : 0.3}
        />
      </mesh>
      {/* Right Wing Neon Edge */}
      <mesh
        ref={(el) => { neonStripRefs.current[1] = el; }}
        position={[1.82, 0.2, 0.3]}
        rotation={[0, 0.2, -0.1]}
      >
        <boxGeometry args={[0.06, 0.48, 1.5]} />
        <meshStandardMaterial
          color={isBoosting ? '#38bdf8' : '#c084fc'}
          emissive={isBoosting ? '#0ea5e9' : '#a855f7'}
          emissiveIntensity={1.5}
        />
      </mesh>
      {/* Right wing tip nacelle */}
      <mesh position={[1.82, 0.0, 0.8]}>
        <boxGeometry args={[0.18, 0.18, 0.5]} />
        <meshStandardMaterial color="#1e1b4b" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Right Wingtip Trail */}
      <mesh ref={wingTrailRightRef} position={[1.82, 0.18, 1.5]}>
        <boxGeometry args={[0.03, 0.14, 2.0]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} />
      </mesh>

      {/* ═══ CANARDS (nose stabilizers) ═══ */}
      <mesh position={[-0.5, 0.06, -1.0]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.55, 0.03, 0.38]} />
        <meshStandardMaterial color="#2e1065" metalness={0.92} />
      </mesh>
      <mesh position={[0.5, 0.06, -1.0]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.55, 0.03, 0.38]} />
        <meshStandardMaterial color="#2e1065" metalness={0.92} />
      </mesh>

      {/* ═══ VERTICAL TAIL FIN — with neon accent ═══ */}
      <mesh position={[0, 0.5, 0.65]} rotation={[-0.22, 0, 0]}>
        <boxGeometry args={[0.05, 0.7, 1.0]} />
        <meshStandardMaterial
          color="#1e1b4b"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      {/* Tail fin neon edge */}
      <mesh
        ref={(el) => { neonStripRefs.current[2] = el; }}
        position={[0, 0.88, 0.65]}
      >
        <boxGeometry args={[0.06, 0.04, 0.9]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#9333ea"
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* ═══ UNDER-HULL NEON ACCENT STRIPS ═══ */}
      {[-0.3, 0.3].map((x, i) => (
        <mesh
          key={`understrip-${i}`}
          ref={(el) => { neonStripRefs.current[3 + i] = el; }}
          position={[x, -0.28, 0.1]}
        >
          <boxGeometry args={[0.03, 0.02, 2.0]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#7c3aed"
            emissiveIntensity={1.0}
          />
        </mesh>
      ))}

      {/* ═══ ENGINE NACELLES & ION EXHAUST ═══ */}
      {/* Left Engine */}
      <group position={[-0.48, 0, 1.25]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.24, 0.65, 16]} />
          <meshStandardMaterial color="#1e1b4b" metalness={0.96} roughness={0.15} />
        </mesh>
        {/* Engine ring detail */}
        <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.02, 8, 16]} />
          <meshStandardMaterial color="#7c3aed" emissive="#a855f7" emissiveIntensity={1.5} />
        </mesh>
        <mesh ref={thrusterLeftRef} position={[0, 0, 0.65]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.18, 1.5, 12]} />
          <meshBasicMaterial
            color={isBoosting ? '#38bdf8' : '#a855f7'}
            transparent
            opacity={0.82}
          />
        </mesh>
        <mesh ref={shockDiamondLeftRef} position={[0, 0, 1.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <octahedronGeometry args={[0.1, 0]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={isBoosting ? 0.55 : 0.2} />
        </mesh>
      </group>

      {/* Right Engine */}
      <group position={[0.48, 0, 1.25]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.24, 0.65, 16]} />
          <meshStandardMaterial color="#1e1b4b" metalness={0.96} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.02, 8, 16]} />
          <meshStandardMaterial color="#7c3aed" emissive="#a855f7" emissiveIntensity={1.5} />
        </mesh>
        <mesh ref={thrusterRightRef} position={[0, 0, 0.65]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.18, 1.5, 12]} />
          <meshBasicMaterial
            color={isBoosting ? '#38bdf8' : '#a855f7'}
            transparent
            opacity={0.82}
          />
        </mesh>
        <mesh ref={shockDiamondRightRef} position={[0, 0, 1.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <octahedronGeometry args={[0.1, 0]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={isBoosting ? 0.55 : 0.2} />
        </mesh>
      </group>

      {/* Center Afterburner */}
      <group position={[0, -0.05, 1.45]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.3, 0.55, 16]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.96}
            emissive="#7e22ce"
            emissiveIntensity={isBoosting ? 1.5 : 0.8}
          />
        </mesh>
        <mesh ref={thrusterCenterRef} position={[0, 0, 0.75]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.24, 2.0, 12]} />
          <meshBasicMaterial
            color={isBoosting ? '#38bdf8' : '#c084fc'}
            transparent
            opacity={0.88}
          />
        </mesh>
      </group>

      {/* Dynamic Engine Lighting */}
      <pointLight
        position={[0, 0, 2.2]}
        color={isBoosting ? '#38bdf8' : '#a855f7'}
        intensity={isBoosting ? 10.0 : 4.5}
        distance={16}
      />
      {/* Under-hull ambient glow */}
      <pointLight
        position={[0, -0.5, 0]}
        color="#7c3aed"
        intensity={isBoosting ? 2.0 : 0.8}
        distance={6}
      />
    </group>
  );
}
