import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FlightPathProps {
  checkpoints: [number, number, number][];
  reachedIndex: number;
}

export default function FlightPath({ checkpoints, reachedIndex }: FlightPathProps) {
  const energyRef = useRef<THREE.Mesh>(null);

  const curvePoints = useMemo(() => {
    if (checkpoints.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(
      checkpoints.map(p => new THREE.Vector3(...p)),
      false,
      'catmullrom',
      0.5
    );
    return curve.getPoints(100);
  }, [checkpoints]);

  useFrame(({ clock }) => {
    if (energyRef.current) {
      const mat = energyRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(clock.getElapsedTime() * 3) * 0.15;
    }
  });

  if (!curvePoints || curvePoints.length < 2) return null;

  const trackGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);

  return (
    <group>
      <line>
        <bufferGeometry attach="geometry" {...trackGeometry} />
        <lineBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.2}
          linewidth={1}
        />
      </line>

      {/* Energized path segment (reached portion) */}
      {reachedIndex > 0 && (
        <line ref={energyRef as any}>
          <bufferGeometry attach="geometry">
            {(() => {
              const segPoints = curvePoints.slice(0, Math.floor((reachedIndex / (checkpoints.length - 1)) * 100));
              if (segPoints.length < 2) return null;
              const g = new THREE.BufferGeometry().setFromPoints(segPoints);
              return <bufferAttribute attach="attributes-position" {...g.getAttribute('position')} />;
            })()}
          </bufferGeometry>
          <lineBasicMaterial
            color="#00ffcc"
            transparent
            opacity={0.45}
            linewidth={1}
          />
        </line>
      )}
    </group>
  );
}
