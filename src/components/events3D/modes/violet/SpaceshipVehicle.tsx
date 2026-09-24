import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  beam, createGlowTexture, createHull, createMetalFinish, createPanel,
  InstancedParts, useVehicleResources,
  type PartTransform, type Vector3Tuple,
} from '../../shared/VehicleModelParts';

interface SpaceshipProps {
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  speed: number;
  isBoosting: boolean;
}

const ENGINE_MOUNTS: Vector3Tuple[] = [[-0.7, -0.05, 1.02], [0.7, -0.05, 1.02], [0, -0.17, 1.18]];
const ENGINES: PartTransform[] = ENGINE_MOUNTS.map((position) => ({ position }));
const enginePartsAt = (z: number): PartTransform[] => ENGINE_MOUNTS.map(([x, y, mountZ]) => ({ position: [x, y, mountZ + z] }));
const ENGINE_LIPS = enginePartsAt(0.66);
const ENGINE_RINGS = enginePartsAt(0.625);
const ENGINE_CORES = enginePartsAt(0.57);

function wingOutline(side: number): Vector3Tuple[] {
  return [
    [side * 0.4, -0.02, -1.05], [side * 0.94, -0.05, -0.58],
    [side * 2.5, -0.1, 1.05], [side * 2.27, -0.08, 1.5], [side * 0.52, 0, 1.07],
  ];
}

function wingInset(side: number): Vector3Tuple[] {
  return [
    [side * 0.9, 0.025, -0.3], [side * 2.25, -0.035, 1.1],
    [side * 1.9, -0.01, 1.23], [side * 0.75, 0.055, 0.79],
  ];
}

function tailOutline(side: number): Vector3Tuple[] {
  return [[side * 0.57, 0.18, 0.3], [side * 0.86, 0.88, 1.17], [side * 0.88, 0.94, 1.58], [side * 0.68, 0.12, 1.52]];
}

function makeShipDetails() {
  const strips: PartTransform[] = [];
  const seams: PartTransform[] = [];
  const vents: PartTransform[] = [];
  const fasteners: PartTransform[] = [];
  const markings: PartTransform[] = [];
  const canopyFrame: PartTransform[] = [];

  for (const side of [-1, 1]) {
    strips.push(
      beam([side * 1.09, 0.01, -0.32], [side * 2.44, -0.055, 1.1], 0.026),
      beam([side * 2.44, -0.055, 1.1], [side * 2.28, -0.035, 1.39], 0.026),
      beam([side * 0.24, 0.12, -1.81], [side * 0.57, 0.26, -0.61], 0.022),
      beam([side * 0.86, 0.905, 1.19], [side * 0.88, 0.965, 1.56], 0.023),
      beam([side * 0.3, -0.275, -0.43], [side * 0.36, -0.235, 0.92], 0.028),
    );
    seams.push(
      beam([side * 0.98, 0.056, 0.32], [side * 1.53, 0.025, 1.02], 0.016),
      beam([side * 1.26, 0.04, 0.42], [side * 1.85, 0.015, 1.15], 0.012),
      beam([side * 0.31, 0.12, -1.69], [side * 0.45, 0.23, -1.0], 0.012),
    );
    canopyFrame.push(
      beam([side * 0.09, 0.29, -1.43], [side * 0.23, 0.725, -0.67], 0.026),
      beam([side * 0.23, 0.725, -0.67], [side * 0.22, 0.675, 0.04], 0.026),
      beam([side * 0.22, 0.675, 0.04], [side * 0.14, 0.39, 0.25], 0.026),
    );
    for (let i = 0; i < 6; i++) {
      vents.push({ position: [side * 0.71, 0.243, 0.55 + i * 0.115], scale: [0.3, 0.035, 0.04], rotation: [0, side * -0.2, 0] });
      fasteners.push({ position: [side * (1.2 + i * 0.17), 0.007, 0.4 + i * 0.16], scale: [0.019, 0.014, 0.019] });
    }
    for (let i = 0; i < 4; i++) {
      markings.push({ position: [side * (1.55 + i * 0.075), 0.025, 1.04], scale: [0.025, 0.009, i === 0 ? 0.23 : 0.12] });
    }
  }
  canopyFrame.push(beam([-0.225, 0.705, -0.34], [0.225, 0.705, -0.34], 0.023));
  const nozzleFins: PartTransform[] = ENGINE_MOUNTS.flatMap(([x, y, z]) => Array.from({ length: 10 }, (_, i): PartTransform => {
    const angle = i / 10 * Math.PI * 2;
    return {
      position: [x + Math.cos(angle) * 0.253, y + Math.sin(angle) * 0.253, z + 0.4],
      rotation: [0, 0, angle], scale: [0.045, 0.025, 0.31],
    };
  }));
  return { strips, seams, vents, fasteners, markings, canopyFrame, nozzleFins };
}

const DETAILS = makeShipDetails();

function createShipResources() {
  const finish = createMetalFinish();
  const glowTexture = createGlowTexture();
  const metalMaps = { roughnessMap: finish, metalnessMap: finish };
  // A closed wall profile leaves a real recessed throat inside each bell.
  const bell = new THREE.LatheGeometry([
    new THREE.Vector2(0.18, 0), new THREE.Vector2(0.2, 0.17),
    new THREE.Vector2(0.3, 0.46), new THREE.Vector2(0.315, 0.52),
    new THREE.Vector2(0.267, 0.52), new THREE.Vector2(0.253, 0.45),
    new THREE.Vector2(0.151, 0.16), new THREE.Vector2(0.14, 0),
  ], 20);
  bell.rotateX(Math.PI / 2).translate(0, 0, 0.14);
  // +Y becomes +Z, then translate so the plume stretches from its root, never
  // through the engine. The ship itself travels toward -Z.
  const plume = new THREE.ConeGeometry(1, 1, 16, 1, true);
  plume.rotateX(Math.PI / 2).translate(0, 0, 0.5);

  return {
    finish,
    glowTexture,
    hull: createHull([[-2.75, 0.09, -0.035, 0.045], [-1.5, 0.73, -0.16, 0.23], [-0.35, 1.34, -0.3, 0.36], [0.8, 1.22, -0.28, 0.28], [1.4, 0.82, -0.16, 0.16]]),
    belly: createHull([[-1.73, 0.28, -0.14, -0.08], [-0.3, 1.05, -0.37, -0.2], [1.22, 0.74, -0.28, -0.08]]),
    spine: createHull([[0.12, 0.43, 0.28, 0.4], [0.78, 0.37, 0.21, 0.34], [1.27, 0.23, 0.14, 0.24]]),
    cockpitRim: createHull([[-1.55, 0.31, 0.18, 0.27], [-0.62, 0.75, 0.26, 0.38], [0.26, 0.55, 0.27, 0.39]]),
    canopy: createHull([[-1.45, 0.2, 0.24, 0.29], [-0.67, 0.6, 0.33, 0.72], [0.04, 0.58, 0.31, 0.66], [0.26, 0.35, 0.29, 0.38]]),
    leftWing: createPanel(wingOutline(-1), 0.085),
    rightWing: createPanel(wingOutline(1), 0.085),
    leftInset: createPanel(wingInset(-1), 0.018),
    rightInset: createPanel(wingInset(1), 0.018),
    leftFin: createPanel(tailOutline(-1), 0.055, 0),
    rightFin: createPanel(tailOutline(1), 0.055, 0),
    leftCanard: createPanel([[-0.26, 0.02, -1.58], [-0.96, -0.04, -0.77], [-0.37, 0.03, -0.93]], 0.045),
    rightCanard: createPanel([[0.26, 0.02, -1.58], [0.96, -0.04, -0.77], [0.37, 0.03, -0.93]], 0.045),
    nacelle: createHull([[-0.71, 0.31, -0.17, 0.18], [-0.33, 0.58, -0.26, 0.29], [0.23, 0.56, -0.25, 0.26]]),
    box: new THREE.BoxGeometry(1, 1, 1),
    bolt: new THREE.CylinderGeometry(1, 1, 1, 6),
    bell,
    lip: new THREE.TorusGeometry(0.298, 0.024, 6, 20),
    ring: new THREE.TorusGeometry(0.239, 0.024, 6, 20),
    throat: new THREE.CircleGeometry(0.25, 20),
    plume,
    titanium: new THREE.MeshPhysicalMaterial({ color: '#606c85', metalness: 0.9, roughness: 0.4, clearcoat: 0.25, clearcoatRoughness: 0.25, envMapIntensity: 0.8, ...metalMaps }),
    graphite: new THREE.MeshStandardMaterial({ color: '#202034', metalness: 0.83, roughness: 0.46, envMapIntensity: 0.9, ...metalMaps }),
    ceramic: new THREE.MeshPhysicalMaterial({ color: '#34314f', metalness: 0.66, roughness: 0.38, clearcoat: 0.4, envMapIntensity: 0.8, ...metalMaps }),
    dark: new THREE.MeshStandardMaterial({ color: '#080b16', metalness: 0.42, roughness: 0.58 }),
    nozzle: new THREE.MeshStandardMaterial({ color: '#625a72', metalness: 0.94, roughness: 0.33, envMapIntensity: 0.9, ...metalMaps }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#141329', metalness: 0.35, roughness: 0.09, clearcoat: 1, clearcoatRoughness: 0.06, ior: 1.46, specularIntensity: 1, envMapIntensity: 0.9, transparent: true, opacity: 0.94 }),
    violet: new THREE.MeshStandardMaterial({ color: '#854acb', emissive: '#792dff', emissiveIntensity: 1.7, roughness: 0.3, envMapIntensity: 0, toneMapped: false }),
    cockpitLight: new THREE.MeshStandardMaterial({ color: '#739cda', emissive: '#768aff', emissiveIntensity: 1.3, envMapIntensity: 0, toneMapped: false }),
    core: new THREE.MeshBasicMaterial({ color: '#d5c6ff', transparent: true, opacity: 0.43, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    glow: new THREE.SpriteMaterial({ map: glowTexture, color: '#a06bff', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    exhaust: new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPower: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vUv = uv;
          vec4 view = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = -view.xyz;
          gl_Position = projectionMatrix * view;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uPower;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float axial = vUv.y;
          float fade = pow(1.0 - axial, 1.4);
          float bands = 0.82 + 0.18 * sin(axial * 42.0 - uTime * 13.0);
          float facing = 0.3 + 0.7 * abs(dot(normalize(vNormal), normalize(vView)));
          vec3 color = mix(vec3(0.86, 0.8, 1.0), vec3(0.4, 0.12, 1.0), smoothstep(0.0, 0.65, axial));
          gl_FragColor = vec4(color * (1.4 + uPower * 0.5), fade * bands * facing * (0.58 + uPower * 0.12));
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      side: THREE.DoubleSide, forceSinglePass: true, toneMapped: false,
    }),
  };
}

const SpaceshipVehicle = memo(function SpaceshipVehicle({ position = [0, 0, 0], rotation = [0, 0, 0], speed, isBoosting }: SpaceshipProps) {
  const parts = useVehicleResources(createShipResources);
  const airframe = useRef<THREE.Group>(null);
  const exhausts = useRef<(THREE.Group | null)[]>([]);
  const engineLight = useRef<THREE.PointLight>(null);
  const power = useRef(0);

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;
    const throttle = Math.min(Math.abs(speed) / 14, 1);
    power.current = THREE.MathUtils.damp(power.current, throttle * 0.65 + (isBoosting ? 1 : 0), 5, Math.min(delta, 0.05));
    const pulse = Math.sin(time * 3.4) * 0.15 + Math.sin(time * 19) * 0.035;

    if (airframe.current) {
      // Animate a nested group so flight controls retain ownership of the root.
      airframe.current.position.y = Math.sin(time * 1.7) * 0.035;
      airframe.current.rotation.z = Math.sin(time * 1.1) * 0.009;
    }
    exhausts.current.forEach((exhaust, index) => {
      if (!exhaust) return;
      exhaust.scale.set(1 + power.current * 0.07, 1 + power.current * 0.07, 0.8 + power.current * 0.85 + Math.sin(time * 12 + index) * 0.035);
    });
    parts.violet.emissiveIntensity = 1.7 + power.current * 0.9 + pulse;
    parts.cockpitLight.emissiveIntensity = 1.1 + Math.sin(time * 2) * 0.15;
    parts.exhaust.uniforms.uTime.value = time;
    parts.exhaust.uniforms.uPower.value = power.current;
    parts.glow.opacity = 0.5 + power.current * 0.12 + pulse * 0.12;
    if (engineLight.current) engineLight.current.intensity = 2.6 + power.current * 3 + pulse;
  });

  return (
    <group name="violet-spacecraft" position={position} rotation={rotation} dispose={null}>
      <group ref={airframe} name="spacecraft-airframe">
        <mesh geometry={parts.hull} material={parts.titanium} />
        <mesh geometry={parts.belly} material={parts.graphite} />
        <mesh geometry={parts.spine} material={parts.ceramic} />
        <mesh geometry={parts.leftWing} material={parts.titanium} />
        <mesh geometry={parts.rightWing} material={parts.titanium} />
        <mesh geometry={parts.leftInset} material={parts.graphite} />
        <mesh geometry={parts.rightInset} material={parts.graphite} />
        <mesh geometry={parts.leftCanard} material={parts.ceramic} />
        <mesh geometry={parts.rightCanard} material={parts.ceramic} />
        <mesh geometry={parts.leftFin} material={parts.graphite} />
        <mesh geometry={parts.rightFin} material={parts.graphite} />

        <mesh geometry={parts.cockpitRim} material={parts.dark} />
        <mesh geometry={parts.canopy} material={parts.glass} />
        <mesh geometry={parts.box} material={parts.dark} position={[0, 0.4, -0.4]} scale={[0.32, 0.22, 0.47]} />
        <mesh geometry={parts.box} material={parts.cockpitLight} position={[0, 0.41, -0.93]} scale={[0.29, 0.018, 0.04]} />
        <InstancedParts name="canopy-frames" geometry={parts.box} material={parts.nozzle} transforms={DETAILS.canopyFrame} />
        <InstancedParts name="violet-light-strips" geometry={parts.box} material={parts.violet} transforms={DETAILS.strips} />
        <InstancedParts name="hull-panel-seams" geometry={parts.box} material={parts.dark} transforms={DETAILS.seams} />
        <InstancedParts name="nacelle-cooling-vents" geometry={parts.box} material={parts.dark} transforms={DETAILS.vents} />
        <InstancedParts name="wing-fasteners" geometry={parts.bolt} material={parts.nozzle} transforms={DETAILS.fasteners} />
        <InstancedParts name="wing-markings" geometry={parts.box} material={parts.titanium} transforms={DETAILS.markings} />

        <InstancedParts name="engine-nacelles" geometry={parts.nacelle} material={parts.graphite} transforms={ENGINES} />
        <InstancedParts name="thruster-bells" geometry={parts.bell} material={parts.nozzle} transforms={ENGINES} />
        <InstancedParts name="nozzle-cooling-fins" geometry={parts.box} material={parts.titanium} transforms={DETAILS.nozzleFins} />
        <InstancedParts name="thruster-lips" geometry={parts.lip} material={parts.titanium} transforms={ENGINE_LIPS} />
        <InstancedParts name="ion-engine-rings" geometry={parts.ring} material={parts.violet} transforms={ENGINE_RINGS} />
        <InstancedParts name="engine-throats" geometry={parts.throat} material={parts.dark} transforms={ENGINE_CORES} />

        {ENGINE_MOUNTS.map(([x, y, z], index) => (
          <group key={index} position={[x, y, z + 0.68]}>
            <sprite material={parts.glow} scale={[1.13, 1.13, 1]} position={[0, 0, 0.025]} />
            <group name={`ion-plume-${index}`} ref={(group) => { exhausts.current[index] = group; }}>
              <mesh geometry={parts.plume} material={parts.exhaust} scale={[0.265, 0.265, 1.15]} />
              <mesh geometry={parts.plume} material={parts.core} scale={[0.115, 0.115, 0.62]} />
            </group>
          </group>
        ))}
        <pointLight ref={engineLight} position={[0, 0, 2.15]} color="#9d71ff" intensity={2.6} distance={7} />
        <pointLight position={[0, -0.45, -0.2]} color="#7c3aed" intensity={0.65} distance={3} />
      </group>
    </group>
  );
});

export default SpaceshipVehicle;
