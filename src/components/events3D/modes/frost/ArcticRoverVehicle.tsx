import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import * as THREE from 'three';

interface RoverProps {
  speed: number;
  steering: number;
}

// Clipped corners and a tapered upper deck create a machined, faceted silhouette.
function createHull(width: number, height: number, length: number, taper = 0.86, sweep = 0) {
  const outline = [[-0.36, -0.5], [0.36, -0.5], [0.5, -0.34], [0.5, 0.34], [0.36, 0.5], [-0.36, 0.5], [-0.5, 0.34], [-0.5, -0.34]];
  return new ConvexGeometry(outline.flatMap(([x, z]) => [
    new THREE.Vector3(x * width, -height / 2, z * length),
    new THREE.Vector3(x * width * taper, height / 2, z * length * taper + sweep),
  ]));
}

const matte = (color: string) => new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 1, flatShading: true });

function useRoverParts() {
  const parts = useMemo(() => ({
    hull: createHull(1.68, 0.48, 3.35),
    canopy: createHull(1.32, 0.62, 1.52, 0.75, 0.2),
    nose: createHull(1.5, 0.2, 0.85, 0.83),
    fender: createHull(0.55, 0.16, 1.27, 0.8),
    tread: new THREE.BoxGeometry(0.155, 0.085, 0.12),
    spoke: new THREE.BoxGeometry(0.035, 0.34, 0.065),
    armor: matte('#e1ebf1'),
    graphite: matte('#405363'),
    titanium: matte('#9eb3c1'),
    rubber: matte('#3b4851'),
    treadMaterial: matte('#536571'),
    glass: matte('#789eaf'),
    cyan: matte('#9bc2d2'),
    white: matte('#f5f9fb'),
    marker: matte('#bdcdd7'),
  }), []);
  useEffect(() => () => Object.values(parts).forEach((part) => part.dispose()), [parts]);
  return parts;
}

type RoverParts = ReturnType<typeof useRoverParts>;

function RoverWheel({ position, side, front, speed, steering, parts }: {
  position: [number, number, number];
  side: number;
  front: boolean;
  speed: number;
  steering: number;
  parts: RoverParts;
}) {
  const knuckle = useRef<THREE.Group>(null);
  const rolling = useRef<THREE.Group>(null);
  const treads = useRef<THREE.InstancedMesh>(null);
  const spokes = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 40; i++) {
      const angle = Math.floor(i / 2) / 20 * Math.PI * 2;
      const row = i % 2 === 0 ? -1 : 1;
      dummy.position.set(row * 0.09, Math.cos(angle) * 0.47, Math.sin(angle) * 0.47);
      dummy.rotation.set(angle, 0, row * 0.25);
      dummy.updateMatrix();
      treads.current?.setMatrixAt(i, dummy.matrix);
    }
    for (let i = 0; i < 6; i++) {
      dummy.position.set(side * 0.202, 0, 0);
      dummy.rotation.set(i * Math.PI / 3, 0, 0);
      dummy.updateMatrix();
      spokes.current?.setMatrixAt(i, dummy.matrix);
    }
    for (const mesh of [treads.current, spokes.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [side]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (rolling.current) rolling.current.rotation.x -= speed * dt / 0.5;
    if (knuckle.current) {
      knuckle.current.rotation.y = THREE.MathUtils.damp(knuckle.current.rotation.y, front ? THREE.MathUtils.clamp(steering * 0.3, -0.3, 0.3) : 0, 12, dt);
    }
  });

  return (
    <group ref={knuckle} position={position}>
      <group ref={rolling}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={parts.rubber}>
          <cylinderGeometry args={[0.465, 0.465, 0.36, 12]} />
        </mesh>
        <instancedMesh ref={treads} args={[parts.tread, parts.treadMaterial, 40]} />
        <mesh rotation={[0, 0, Math.PI / 2]} material={parts.graphite}>
          <cylinderGeometry args={[0.29, 0.29, 0.39, 12]} />
        </mesh>
        <instancedMesh ref={spokes} args={[parts.spoke, parts.titanium, 6]} />
        <mesh position={[side * 0.208, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={parts.cyan}>
          <torusGeometry args={[0.245, 0.018, 4, 12]} />
        </mesh>
        <mesh position={[side * 0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={parts.titanium}>
          <cylinderGeometry args={[0.105, 0.105, 0.065, 6]} />
        </mesh>
      </group>
    </group>
  );
}

export default function ArcticRoverVehicle({ speed, steering }: RoverProps) {
  const parts = useRoverParts();
  const body = useRef<THREE.Group>(null);
  const scanner = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const moving = Math.min(Math.abs(speed) / 12, 1);
    if (body.current) {
      body.current.position.y = Math.sin(state.clock.elapsedTime * 9) * 0.012 * moving;
      body.current.rotation.z = THREE.MathUtils.damp(body.current.rotation.z, -steering * moving * 0.035, 7, dt);
    }
    if (scanner.current) scanner.current.rotation.y += dt * 0.8;
  });

  return (
    <group>
      <mesh position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.62, 1, 1]}>
        <circleGeometry args={[2.1, 8]} />
        <meshBasicMaterial color="#b7cbd6" toneMapped={false} />
      </mesh>
      {/* Forward is -Z, matching the scene's drive vector and steering axle. */}
      {[-1.08, 1.08].map((z) => (
        <mesh key={z} position={[0, 0.55, z]} rotation={[0, 0, Math.PI / 2]} material={parts.titanium}>
          <cylinderGeometry args={[0.075, 0.075, 2.05, 10]} />
        </mesh>
      ))}
      {[-1, 1].flatMap((side) => [-1.08, 1.08].map((z) => (
        <RoverWheel key={side + '-' + z} position={[side * 1.02, 0.54, z]} side={side} front={z < 0} speed={speed} steering={steering} parts={parts} />
      )))}

      <group ref={body}>
        <mesh position={[0, 0.62, 0]} material={parts.graphite}>
          <boxGeometry args={[1.43, 0.25, 2.85]} />
        </mesh>
        <mesh position={[0, 0.98, 0]} geometry={parts.hull} material={parts.armor} />
        <mesh position={[0, 1.18, -1.05]} geometry={parts.nose} material={parts.graphite} />
        <mesh position={[0, 1.43, -0.38]} geometry={parts.canopy} material={parts.glass} />
        <mesh position={[0, 1.74, -0.2]} material={parts.armor}>
          <boxGeometry args={[1.05, 0.055, 0.77]} />
        </mesh>
        <mesh position={[0, 1.43, -0.945]} rotation={[0.56, 0, 0]} material={parts.titanium}>
          <boxGeometry args={[0.045, 0.72, 0.035]} />
        </mesh>
        <mesh position={[0, 1.15, -1.66]} material={parts.cyan}>
          <boxGeometry args={[0.92, 0.045, 0.035]} />
        </mesh>
        <mesh position={[0, 0.68, -1.71]} material={parts.titanium}>
          <boxGeometry args={[1.25, 0.13, 0.15]} />
        </mesh>

        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.835, 0.91, 0.05]} material={parts.graphite}>
              <boxGeometry args={[0.065, 0.26, 1.5]} />
            </mesh>
            <mesh position={[side * 0.873, 1.035, 0.05]} material={parts.cyan}>
              <boxGeometry args={[0.022, 0.032, 1.53]} />
            </mesh>
            <mesh position={[side * 0.73, 0.49, 0.1]} material={parts.cyan}>
              <boxGeometry args={[0.035, 0.035, 1.6]} />
            </mesh>
            {Array.from({ length: 5 }, (_, i) => (
              <mesh key={i} position={[side * 0.79, 1.15, 0.4 + i * 0.14]} rotation={[0, 0, side * 0.12]} material={parts.graphite}>
                <boxGeometry args={[0.055, 0.11, 0.055]} />
              </mesh>
            ))}
            {[-1.08, 1.08].map((z) => (
              <group key={z}>
                <mesh position={[side * 0.99, 1.17, z]} geometry={parts.fender} material={parts.armor} />
                <mesh position={[side * 1.225, 1.2, z]} material={parts.cyan}>
                  <boxGeometry args={[0.022, 0.028, 0.77]} />
                </mesh>
                <mesh position={[side * 0.84, 0.74, z]} rotation={[0, 0, side * -0.36]} material={parts.titanium}>
                  <cylinderGeometry args={[0.055, 0.055, 0.37, 8]} />
                </mesh>
              </group>
            ))}
            <mesh position={[side * 0.58, 0.99, -1.59]} material={parts.white}>
              <boxGeometry args={[0.22, 0.1, 0.08]} />
            </mesh>
            <mesh position={[side * 0.63, 1.07, 1.52]} material={parts.marker}>
              <boxGeometry args={[0.2, 0.045, 0.05]} />
            </mesh>
            <mesh position={[side * 0.42, 0.83, 1.58]} rotation={[Math.PI / 2, 0, 0]} material={parts.graphite}>
              <cylinderGeometry args={[0.2, 0.24, 0.28, 12]} />
            </mesh>
            <mesh position={[side * 0.42, 0.83, 1.73]} material={parts.cyan}>
              <torusGeometry args={[0.145, 0.025, 4, 10]} />
            </mesh>
          </group>
        ))}

        <mesh position={[0, 1.25, 0.96]} material={parts.graphite}>
          <boxGeometry args={[1.05, 0.12, 0.83]} />
        </mesh>
        {[-0.33, 0, 0.33].map((x) => (
          <mesh key={x} position={[x, 1.32, 1.0]} material={parts.glass}>
            <boxGeometry args={[0.27, 0.018, 0.59]} />
          </mesh>
        ))}
        <mesh position={[0, 1.42, 0.56]} material={parts.titanium}>
          <cylinderGeometry args={[0.06, 0.08, 0.36, 10]} />
        </mesh>
        <group ref={scanner} position={[0, 1.67, 0.56]}>
          <mesh material={parts.graphite}>
            <cylinderGeometry args={[0.23, 0.25, 0.12, 8]} />
          </mesh>
          <mesh position={[0, 0, -0.232]} material={parts.cyan}>
            <boxGeometry args={[0.2, 0.045, 0.025]} />
          </mesh>
        </group>
        <mesh position={[-0.57, 1.59, 1.03]} material={parts.titanium}>
          <cylinderGeometry args={[0.009, 0.022, 0.67, 6]} />
        </mesh>
        <mesh position={[-0.57, 1.935, 1.03]} material={parts.marker}>
          <octahedronGeometry args={[0.045, 0]} />
        </mesh>
      </group>

    </group>
  );
}
