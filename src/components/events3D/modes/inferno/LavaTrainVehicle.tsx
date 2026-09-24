import { memo, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  beam, createGlowTexture, createHull, createMetalFinish,
  InstancedParts, useVehicleResources, type PartTransform,
} from '../../shared/VehicleModelParts';

interface LavaTrainProps {
  // A ref lets the scene supply live speed without a React update every frame.
  speed: number | RefObject<number>;
}

const CAR_CENTERS = [-4.2, -7.5];
const CARRIAGES: PartTransform[] = CAR_CENTERS.map((z) => ({ position: [0, 0, z] }));
const CARS = [{ z: 0.15, length: 3.7 }, ...CAR_CENTERS.map((z) => ({ z, length: 2.8 }))];
const EXHAUST_COUNT = 64;

function makeTrainDetails() {
  const armor: PartTransform[] = [];
  const bolts: PartTransform[] = [];
  const windowFrames: PartTransform[] = [];
  const windows: PartTransform[] = [];
  const sills: PartTransform[] = [];
  const rails: PartTransform[] = [];
  const railLights: PartTransform[] = [];
  const railHalos: PartTransform[] = [];
  const bogies: PartTransform[] = [];
  const coils: PartTransform[] = [];
  const pistons: PartTransform[] = [];
  const crossmembers: PartTransform[] = [];
  const ventHousings: PartTransform[] = [];
  const ventCores: PartTransform[] = [];
  const ventBlades: PartTransform[] = [];
  const signalStrips: PartTransform[] = [];
  const hazardMarks: PartTransform[] = [];
  const bellows: PartTransform[] = [];
  const couplers: PartTransform[] = [];
  const cabFrame: PartTransform[] = [];

  for (const { z, length } of CARS) {
    const isEngine = z === 0.15;
    for (const offset of [-0.87, 0.87]) {
      crossmembers.push({ position: [0, 0.4, z + offset], scale: [1.68, 0.16, 0.2] });
    }
    for (const side of [-1, 1]) {
      rails.push({ position: [side * 0.88, 0.27, z], scale: [0.29, 0.25, length] });
      railLights.push({ position: [side * 1.033, 0.235, z], scale: [0.025, 0.065, length * 0.94] });
      railHalos.push({ position: [side * 0.88, 0.12, z], rotation: [-Math.PI / 2, 0, 0], scale: [0.95, length + 0.65, 1] });
      for (const offset of [-0.87, 0.87]) {
        const axleZ = z + offset;
        bogies.push({ position: [side * 0.73, 0.44, axleZ], scale: [0.38, 0.3, 0.53] });
        coils.push({ position: [side * 0.95, 0.445, axleZ], rotation: [0, Math.PI / 2, 0] });
        pistons.push(beam([side * 0.66, 0.41, axleZ - 0.23], [side * 0.91, 0.7, axleZ + 0.18], 0.047));
      }
      const plateCount = isEngine ? 3 : 4;
      for (let i = 0; i < plateCount; i++) {
        const plateZ = isEngine ? -1.13 + i * 0.62 : z - 0.99 + i * 0.66;
        armor.push({ position: [side * (isEngine ? 0.93 : 0.9), 0.86, plateZ], scale: [0.105, 0.43, 0.59] });
        for (const dz of [-0.22, 0.22]) {
          for (const y of [0.705, 1.015]) {
            bolts.push({ position: [side * (isEngine ? 0.992 : 0.962), y, plateZ + dz], rotation: [0, 0, Math.PI / 2], scale: [0.024, 0.022, 0.024] });
          }
        }
        if (!isEngine) {
          windowFrames.push({ position: [side * 0.897, 1.355, plateZ], scale: [0.1, 0.43, 0.51] });
          windows.push({ position: [side * 0.95, 1.355, plateZ], scale: [0.027, 0.315, 0.38] });
          sills.push({ position: [side * 0.971, 1.183, plateZ], scale: [0.018, 0.025, 0.38] });
        }
      }
      signalStrips.push({ position: [side * 0.875, 1.645, isEngine ? -0.71 : z], scale: [0.026, 0.027, isEngine ? 1.42 : 2.52] });
      for (let i = 0; i < 3; i++) {
        hazardMarks.push({ position: [side * 0.969, 0.7, z - 1.11 + i * 0.1], rotation: [-0.45, 0, 0], scale: [0.013, 0.16, 0.036] });
      }

      const ventZ = isEngine ? -1.0 : z;
      const ventY = isEngine ? 1.775 : 1.805;
      ventHousings.push({ position: [side * 0.4, ventY, ventZ], scale: [0.64, 0.16, 0.99] });
      ventCores.push({ position: [side * 0.4, ventY + 0.085, ventZ], scale: [0.51, 0.014, 0.83] });
      for (let i = 0; i < 7; i++) {
        ventBlades.push({ position: [side * 0.4, ventY + 0.11, ventZ - 0.36 + i * 0.12], rotation: [0.27, 0, 0], scale: [0.55, 0.035, 0.065] });
      }
    }
  }

  for (const side of [-1, 1]) {
    signalStrips.push(beam([side * 0.8, 1.42, 0.83], [side * 0.46, 0.73, 2.35], 0.028));
    cabFrame.push(
      beam([side * 0.52, 1.58, 1.31], [side * 0.56, 2.1, 0.51], 0.043),
      beam([side * 0.56, 2.1, 0.51], [side * 0.54, 2.12, -0.49], 0.043),
    );
  }
  cabFrame.push(
    beam([-0.53, 1.585, 1.31], [0.53, 1.585, 1.31], 0.045),
    beam([-0.56, 2.105, 0.51], [0.56, 2.105, 0.51], 0.05),
    beam([0, 1.585, 1.31], [0, 2.105, 0.51], 0.04),
  );

  for (const { z, length } of [{ z: -2.27, length: 1.06 }, { z: -5.85, length: 0.64 }]) {
    couplers.push({ position: [0, 0.64, z], scale: [0.55, 0.22, length + 0.2] });
    for (let i = 0; i < 7; i++) {
      bellows.push({ position: [0, 1.13, z - length * 0.36 + i * length * 0.12], scale: [1.27, 0.97, 0.053] });
    }
    signalStrips.push({ position: [0, 0.54, z], scale: [0.13, 0.04, length + 0.2] });
  }

  const grille: PartTransform[] = Array.from({ length: 9 }, (_, i) => ({ position: [-0.32 + i * 0.08, 0.465, 2.455], scale: [0.035, 0.13, 0.065] }));
  const headlightFrames: PartTransform[] = [-1, 1].map((side) => ({ position: [side * 0.31, 0.637, 2.455], scale: [0.32, 0.145, 0.1] }));
  const headlights: PartTransform[] = [-1, 1].map((side) => ({ position: [side * 0.31, 0.65, 2.514], scale: [0.23, 0.053, 0.022] }));
  const taillights: PartTransform[] = [-1, 1].map((side) => ({ position: [side * 0.58, 1.26, -8.96], scale: [0.14, 0.11, 0.025] }));
  const stacks: PartTransform[] = [-1, 1].map((side) => ({ position: [side * 0.4, 2.005, -1.22], rotation: [-0.32, 0, 0] }));
  const stackRims: PartTransform[] = [-1, 1].map((side) => ({ position: [side * 0.4, 2.18, -1.278], rotation: [-Math.PI / 2 - 0.32, 0, 0] }));

  return { armor, bolts, windowFrames, windows, sills, rails, railLights, railHalos, bogies, coils, pistons, crossmembers, ventHousings, ventCores, ventBlades, signalStrips, hazardMarks, bellows, couplers, cabFrame, grille, headlightFrames, headlights, taillights, stacks, stackRims };
}

const DETAILS = makeTrainDetails();

function createTrainResources() {
  const finish = createMetalFinish();
  const glowTexture = createGlowTexture();
  const metalMaps = { roughnessMap: finish, metalnessMap: finish };
  // Bevels run around the visible Y/Z face of the side-mounted armor/windows.
  const panel = createHull([[-0.5, 1, -0.5, 0.5], [0.5, 1, -0.5, 0.5]]).rotateY(Math.PI / 2);
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(EXHAUST_COUNT * 3);
  const seeds = new Float32Array(EXHAUST_COUNT);
  for (let i = 0; i < EXHAUST_COUNT; i++) {
    positions.set([i % 2 ? 0.4 : -0.4, 2.18, -1.28], i * 3);
    seeds[i] = ((i * 37) % EXHAUST_COUNT) / EXHAUST_COUNT;
  }
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  // Shader-driven particles move beyond the static emitter positions.
  particles.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 3, -1.3), 6);

  return {
    finish,
    glowTexture,
    chassis: createHull([[-1.81, 1.78, 0.33, 0.59], [1.27, 1.83, 0.3, 0.65], [2.44, 1.09, 0.31, 0.53]]),
    locomotive: createHull([[-1.76, 1.78, 0.54, 1.65], [-0.3, 1.91, 0.5, 1.75], [0.8, 1.74, 0.45, 1.55], [2.45, 1.03, 0.37, 0.73]]),
    cab: createHull([[-0.5, 1.4, 1.55, 2.1], [0.52, 1.46, 1.46, 2.08], [1.3, 1.1, 1.05, 1.58]]),
    cabRoof: createHull([[-0.61, 1.22, 2.085, 2.16], [0.5, 1.22, 2.065, 2.14]]),
    splitter: createHull([[-0.36, 1.65, -0.13, 0.08], [0.24, 1.35, -0.13, -0.015]]),
    carriage: createHull([[-1.45, 1.69, 0.51, 1.63], [-1.16, 1.78, 0.5, 1.79], [1.16, 1.78, 0.5, 1.79], [1.45, 1.69, 0.51, 1.63]]),
    carriageRoof: createHull([[-1.29, 1.4, 1.71, 1.83], [1.29, 1.4, 1.71, 1.83]]),
    panel,
    box: new THREE.BoxGeometry(1, 1, 1),
    plane: new THREE.PlaneGeometry(1, 1),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 8),
    bolt: new THREE.CylinderGeometry(1, 1, 1, 6),
    coil: new THREE.TorusGeometry(0.137, 0.026, 5, 12),
    stack: new THREE.CylinderGeometry(0.18, 0.135, 0.38, 12, 1, true),
    stackRim: new THREE.TorusGeometry(0.164, 0.022, 5, 12),
    particles,
    armor: new THREE.MeshPhysicalMaterial({ color: '#282c33', metalness: 0.87, roughness: 0.5, clearcoat: 0.18, envMapIntensity: 0.85, ...metalMaps }),
    panels: new THREE.MeshStandardMaterial({ color: '#373335', metalness: 0.86, roughness: 0.48, envMapIntensity: 0.75, ...metalMaps }),
    steel: new THREE.MeshStandardMaterial({ color: '#6d7479', metalness: 0.93, roughness: 0.35, envMapIntensity: 0.8, ...metalMaps }),
    copper: new THREE.MeshStandardMaterial({ color: '#784325', metalness: 0.84, roughness: 0.5, envMapIntensity: 0.8, ...metalMaps }),
    dark: new THREE.MeshStandardMaterial({ color: '#101319', metalness: 0.65, roughness: 0.55, ...metalMaps }),
    rubber: new THREE.MeshStandardMaterial({ color: '#111015', metalness: 0.12, roughness: 0.88 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#100d10', roughness: 0.12, metalness: 0.36, clearcoat: 0.9, clearcoatRoughness: 0.08, ior: 1.48, envMapIntensity: 0.7, transparent: true, opacity: 0.96 }),
    window: new THREE.MeshPhysicalMaterial({ color: '#5b250c', emissive: '#ed6515', emissiveIntensity: 0.4, roughness: 0.18, metalness: 0.25, clearcoat: 1, envMapIntensity: 0.4 }),
    amber: new THREE.MeshStandardMaterial({ color: '#f05a17', emissive: '#ff3506', emissiveIntensity: 2.3, roughness: 0.34, envMapIntensity: 0, toneMapped: false }),
    reactor: new THREE.MeshStandardMaterial({ color: '#a83311', emissive: '#ff2306', emissiveIntensity: 1.5, envMapIntensity: 0, toneMapped: false }),
    headlight: new THREE.MeshBasicMaterial({ color: '#ffe8b8', toneMapped: false }),
    red: new THREE.MeshStandardMaterial({ color: '#ff391f', emissive: '#ff1709', emissiveIntensity: 1.8, envMapIntensity: 0, toneMapped: false }),
    underglow: new THREE.MeshBasicMaterial({ map: glowTexture, color: '#ff490c', transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, toneMapped: false }),
    embers: new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPower: { value: 0 }, uTravel: { value: 0 }, uPixelRatio: { value: 1 } },
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uPower;
        uniform float uTravel;
        uniform float uPixelRatio;
        varying float vLife;
        void main() {
          vLife = fract(aSeed + uTime * (0.7 + fract(aSeed * 12.7) * 0.6));
          vec3 p = position;
          p.x += sin(aSeed * 137.0 + vLife * 5.0) * vLife * 0.38;
          p.y += vLife * (1.15 + uPower * 0.65);
          p.z += vLife * (-0.65 + uTravel * 3.7);
          vec4 view = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * view;
          gl_PointSize = clamp((1.4 + fract(aSeed * 17.3) * 2.5) * uPixelRatio * 18.0 / max(1.0, -view.z), 1.0, 12.0);
        }
      `,
      fragmentShader: `
        varying float vLife;
        void main() {
          float radius = length(gl_PointCoord - 0.5) * 2.0;
          float alpha = (1.0 - smoothstep(0.1, 1.0, radius)) * pow(1.0 - vLife, 1.6);
          vec3 color = mix(vec3(1.0, 0.67, 0.2), vec3(1.0, 0.12, 0.015), vLife);
          gl_FragColor = vec4(color * 1.7, alpha * 0.8);
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    }),
  };
}

const LavaTrainVehicle = memo(function LavaTrainVehicle({ speed }: LavaTrainProps) {
  const parts = useVehicleResources(createTrainResources);
  const body = useRef<THREE.Group>(null);
  const railLight = useRef<THREE.PointLight>(null);
  const power = useRef(0);
  const headlightTarget = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock, gl }, delta) => {
    const dt = Math.min(delta, 0.05);
    const velocity = typeof speed === 'number' ? speed : speed.current ?? 0;
    const throttle = Math.min(Math.abs(velocity) / 55, 1);
    power.current = THREE.MathUtils.damp(power.current, throttle, 4, dt);
    const pulse = Math.sin(clock.elapsedTime * 3.1) * 0.13;
    if (body.current) {
      body.current.position.y = 0.035 + Math.sin(clock.elapsedTime * 2.4) * 0.018;
      body.current.rotation.z = Math.sin(clock.elapsedTime * 1.7) * 0.003 * power.current;
    }
    parts.amber.emissiveIntensity = 2 + power.current * 1.2 + pulse;
    parts.reactor.emissiveIntensity = 1.2 + power.current * 1.1 + pulse;
    parts.window.emissiveIntensity = 0.4 + Math.sin(clock.elapsedTime * 1.3) * 0.035;
    parts.underglow.opacity = 0.5 + power.current * 0.16;
    parts.embers.uniforms.uTime.value += dt * (0.4 + power.current * 0.35);
    parts.embers.uniforms.uPower.value = power.current;
    parts.embers.uniforms.uTravel.value = THREE.MathUtils.damp(parts.embers.uniforms.uTravel.value, THREE.MathUtils.clamp(-velocity / 55, -1, 1), 4, dt);
    parts.embers.uniforms.uPixelRatio.value = gl.getPixelRatio();
    if (railLight.current) railLight.current.intensity = 2.4 + power.current * 1.8 + pulse;
  });

  return (
    <group name="inferno-maglev" dispose={null}>
      {/* Forward = +Z. The scene aligns this nose with the rail tangent. */}
      <group ref={body} name="maglev-body">
        <mesh geometry={parts.chassis} material={parts.dark} />
        <mesh geometry={parts.locomotive} material={parts.armor} />
        <mesh geometry={parts.splitter} material={parts.panels} position={[0, 0.43, 2.28]} />
        <mesh geometry={parts.cab} material={parts.glass} />
        <mesh geometry={parts.cabRoof} material={parts.panels} />
        <mesh geometry={parts.box} material={parts.amber} position={[0, 1.625, 1.2]} scale={[0.86, 0.02, 0.025]} />
        <InstancedParts name="cab-frames" geometry={parts.box} material={parts.steel} transforms={DETAILS.cabFrame} />
        <InstancedParts name="carriage-shells" geometry={parts.carriage} material={parts.armor} transforms={CARRIAGES} />
        <InstancedParts name="carriage-roofs" geometry={parts.carriageRoof} material={parts.panels} transforms={CARRIAGES} />
        <InstancedParts name="armored-side-plates" geometry={parts.panel} material={parts.panels} transforms={DETAILS.armor} />
        <InstancedParts name="armor-bolts" geometry={parts.bolt} material={parts.steel} transforms={DETAILS.bolts} />
        <InstancedParts name="window-recesses" geometry={parts.panel} material={parts.dark} transforms={DETAILS.windowFrames} />
        <InstancedParts name="carriage-windows" geometry={parts.panel} material={parts.window} transforms={DETAILS.windows} />
        <InstancedParts name="window-light-sills" geometry={parts.box} material={parts.amber} transforms={DETAILS.sills} />
        <InstancedParts name="hull-signal-strips" geometry={parts.box} material={parts.amber} transforms={DETAILS.signalStrips} />
        <InstancedParts name="hazard-markings" geometry={parts.box} material={parts.headlight} transforms={DETAILS.hazardMarks} />

        <InstancedParts name="maglev-skates" geometry={parts.panel} material={parts.dark} transforms={DETAILS.rails} />
        <InstancedParts name="energy-rails" geometry={parts.box} material={parts.amber} transforms={DETAILS.railLights} />
        <InstancedParts name="rail-glow" geometry={parts.plane} material={parts.underglow} transforms={DETAILS.railHalos} />
        <InstancedParts name="suspension-bogies" geometry={parts.panel} material={parts.dark} transforms={DETAILS.bogies} />
        <InstancedParts name="magnetic-coils" geometry={parts.coil} material={parts.reactor} transforms={DETAILS.coils} />
        <InstancedParts name="hydraulic-pistons" geometry={parts.cylinder} material={parts.steel} transforms={DETAILS.pistons} />
        <InstancedParts name="undercarriage-crossmembers" geometry={parts.box} material={parts.copper} transforms={DETAILS.crossmembers} />
        <InstancedParts name="articulated-bellows" geometry={parts.panel} material={parts.rubber} transforms={DETAILS.bellows} />
        <InstancedParts name="carriage-couplers" geometry={parts.box} material={parts.steel} transforms={DETAILS.couplers} />

        <InstancedParts name="radiator-housings" geometry={parts.panel} material={parts.dark} transforms={DETAILS.ventHousings} />
        <InstancedParts name="radiator-cores" geometry={parts.box} material={parts.reactor} transforms={DETAILS.ventCores} />
        <InstancedParts name="cooling-louvres" geometry={parts.box} material={parts.copper} transforms={DETAILS.ventBlades} />
        <InstancedParts name="exhaust-stacks" geometry={parts.stack} material={parts.dark} transforms={DETAILS.stacks} />
        <InstancedParts name="exhaust-rims" geometry={parts.stackRim} material={parts.reactor} transforms={DETAILS.stackRims} />
        <points name="trailing-embers" geometry={parts.particles} material={parts.embers} />

        <InstancedParts name="nose-grille" geometry={parts.box} material={parts.dark} transforms={DETAILS.grille} />
        <InstancedParts name="headlamp-bezels" geometry={parts.panel} material={parts.dark} transforms={DETAILS.headlightFrames} />
        <InstancedParts name="headlights" geometry={parts.box} material={parts.headlight} transforms={DETAILS.headlights} />
        <InstancedParts name="rear-marker-lights" geometry={parts.box} material={parts.red} transforms={DETAILS.taillights} />
        <primitive object={headlightTarget} position={[0, 0.2, 18]} />
        <spotLight position={[0, 0.8, 2.55]} target={headlightTarget} color="#ffe3b3" intensity={6} distance={28} angle={0.46} penumbra={0.65} />
        <pointLight ref={railLight} position={[0, 0.25, -0.8]} color="#ff590f" intensity={2.4} distance={6} />
      </group>
    </group>
  );
});

export default LavaTrainVehicle;
