import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Event } from '../../../../types';
import LavaTrainVehicle from './LavaTrainVehicle';
import MagmaTerrain from './MagmaTerrain';
import LavaStationDepot from './LavaStationDepot';

interface InfernoSceneProps {
  events: Event[];
  activeIdx: number;
  gameState: 'GAMEPLAY' | 'DOCKING' | 'HUD_OPEN';
  onDockComplete: (idx: number) => void;
  onInspect: (event: Event) => void;
  onTargetUpdate: (target: { name: string | null; distance: number; status: 'APPROACHING' | 'DOCKING' | 'IDLE' }) => void;
  mobileMove?: { x: number; y: number };
}

export default function InfernoLavaScene({
  events,
  activeIdx,
  gameState,
  onDockComplete,
  onInspect,
  onTargetUpdate,
  mobileMove
}: InfernoSceneProps) {
  const { camera } = useThree();

  // Train group direct reference
  const trainGroupRef = useRef<THREE.Group>(null);

  // Progress along the rail spline: range [0, 1]
  const progressRef = useRef(0.12);
  const velocityRef = useRef(0);
  const throttleTarget = useRef(0);
  const dockingTargetIdx = useRef<number | null>(null);
  const dockingProgress = useRef(0);
  const dockingCooldown = useRef(0);
  const prevGameState = useRef(gameState);

  // Generate a winding monorail spline passing through the 3 depots
  const { spline, stationTs, stationPositions } = useMemo(() => {
    const rawPoints = [
      new THREE.Vector3(0, 0, 35),
      new THREE.Vector3(-30, 2, 8),
      new THREE.Vector3(-45, 1, -28),  // Station 1: Cybersecurity
      new THREE.Vector3(-10, 3, -65),
      new THREE.Vector3(32, 2, -90),   // Station 2: GSoC
      new THREE.Vector3(55, 4, -40),
      new THREE.Vector3(35, 3, 18),    // Station 3: PromptOps
      new THREE.Vector3(0, 0, 35)
    ];

    const curve = new THREE.CatmullRomCurve3(rawPoints, true, 'centripetal', 0.5);
    const ts = [0.25, 0.50, 0.75];
    const stPositions = ts.map((t) => curve.getPointAt(t));

    return { spline: curve, stationTs: ts, stationPositions: stPositions };
  }, []);

  // Position train immediately on initial mount
  useEffect(() => {
    if (trainGroupRef.current) {
      const pt = spline.getPointAt(progressRef.current);
      const tangent = spline.getTangentAt(progressRef.current).normalize();
      trainGroupRef.current.position.copy(pt);
      const rotY = Math.atan2(tangent.x, tangent.z) + Math.PI;
      trainGroupRef.current.rotation.set(0, rotY, 0);

      // Position camera
      const camOffset = new THREE.Vector3(0, 5.5, 0).sub(tangent.clone().multiplyScalar(13));
      camera.position.copy(pt.clone().add(camOffset));
      camera.lookAt(pt);
    }
  }, [spline, camera]);

  // Set cooldown ONLY when resuming from HUD_OPEN to GAMEPLAY
  useEffect(() => {
    if (prevGameState.current === 'HUD_OPEN' && gameState === 'GAMEPLAY') {
      dockingCooldown.current = 2.5;
    }
    prevGameState.current = gameState;
  }, [gameState]);

  // Scroll wheel listener for natural scroll-driven rail traversal
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (gameState === 'HUD_OPEN' || gameState === 'DOCKING') return;
      const delta = e.deltaY * 0.0004;
      progressRef.current = (progressRef.current + delta + 1) % 1;
      velocityRef.current = Math.sign(delta) * 0.6;
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [gameState]);

  // Keyboard navigation
  const keys = useRef<{ [k: string]: boolean }>({});
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (gameState === 'HUD_OPEN') return;
      keys.current[e.key.toLowerCase()] = true;

      // Press 'E' to instantly dock to nearest depot
      if (e.key.toLowerCase() === 'e' && gameState === 'GAMEPLAY') {
        let nearestIdx = -1;
        let nearestDiff = Infinity;
        stationTs.forEach((stT, idx) => {
          const diff = Math.min(
            Math.abs(progressRef.current - stT),
            1 - Math.abs(progressRef.current - stT)
          );
          if (diff < nearestDiff) {
            nearestDiff = diff;
            nearestIdx = idx;
          }
        });
        if (nearestIdx >= 0 && nearestDiff < 0.1) {
          dockingTargetIdx.current = nearestIdx;
          dockingProgress.current = 0;
          onDockComplete(-1);
        }
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [gameState, stationTs, onDockComplete]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // Only tick down cooldown during active GAMEPLAY exploration
    if (gameState === 'GAMEPLAY' && dockingCooldown.current > 0) {
      dockingCooldown.current -= dt;
    }

    // 1. AUTOMATIC DOCKING AT TRAIN PLATFORM
    if (gameState === 'DOCKING' && dockingTargetIdx.current !== null) {
      const targetT = stationTs[dockingTargetIdx.current];
      dockingProgress.current = Math.min(1, dockingProgress.current + dt * 1.5);

      // Smoothly interpolate progress directly to depot stopping coordinate
      progressRef.current = THREE.MathUtils.lerp(progressRef.current, targetT, dt * 5.0);
      velocityRef.current *= 0.5;
      throttleTarget.current = 0;

      const pt = spline.getPointAt(progressRef.current);
      const tangent = spline.getTangentAt(progressRef.current).normalize();

      if (trainGroupRef.current) {
        trainGroupRef.current.position.copy(pt);
        const rotY = Math.atan2(tangent.x, tangent.z) + Math.PI;
        trainGroupRef.current.rotation.set(0, rotY, 0);
      }

      const lookAheadPt = spline.getPointAt((progressRef.current + 0.03) % 1);
      const camOffset = new THREE.Vector3(0, 5.5, 0).sub(tangent.clone().multiplyScalar(12));
      const desiredCamPos = pt.clone().add(camOffset).add(new THREE.Vector3(tangent.z * 4, 0, -tangent.x * 4));
      camera.position.lerp(desiredCamPos, dt * 5);
      camera.lookAt(lookAheadPt);

      // Update target HUD
      onTargetUpdate({
        name: events[dockingTargetIdx.current]?.title || null,
        distance: Math.abs(progressRef.current - targetT) * 400,
        status: 'DOCKING'
      });

      if (dockingProgress.current >= 0.95) {
        const completedIdx = dockingTargetIdx.current;
        dockingTargetIdx.current = null;
        dockingProgress.current = 0;
        onTargetUpdate({ name: null, distance: 0, status: 'IDLE' });
        onDockComplete(completedIdx);
      }
      return;
    }

    // 2. HUD OPEN (TRAIN STOPPED)
    if (gameState === 'HUD_OPEN') {
      velocityRef.current = 0;
      throttleTarget.current = 0;
      return;
    }

    // 3. NORMAL TRAIN EXPEDITION DRIVING
    let driveInput = 0;
    if (keys.current['w'] || keys.current['arrowup'] || keys.current['arrowright'] || keys.current['d']) driveInput += 1;
    if (keys.current['s'] || keys.current['arrowdown'] || keys.current['arrowleft'] || keys.current['a']) driveInput -= 1;

    if (mobileMove) {
      driveInput -= mobileMove.y;
    }

    // Smooth throttle interpolation from keyboard
    if (driveInput !== 0) {
      throttleTarget.current += driveInput * 0.5 * dt;
      throttleTarget.current = Math.max(-0.4, Math.min(0.4, throttleTarget.current));
    } else {
      throttleTarget.current = THREE.MathUtils.lerp(throttleTarget.current, 0, dt * 3);
    }

    velocityRef.current += throttleTarget.current * dt;
    velocityRef.current *= Math.pow(0.89, dt * 60);
    progressRef.current = (progressRef.current + velocityRef.current * dt + 1) % 1;

    const pt = spline.getPointAt(progressRef.current);
    const tangent = spline.getTangentAt(progressRef.current).normalize();

    if (trainGroupRef.current) {
      trainGroupRef.current.position.copy(pt);
      const rotY = Math.atan2(tangent.x, tangent.z) + Math.PI;
      trainGroupRef.current.rotation.set(0, rotY, 0);
    }

    // PROXIMITY DETECTION — find nearest station & update target HUD
    let nearestIdx = -1;
    let nearestDiff = Infinity;
    stationTs.forEach((stT, idx) => {
      const diff = Math.min(
        Math.abs(progressRef.current - stT),
        1 - Math.abs(progressRef.current - stT)
      );
      if (diff < nearestDiff) {
        nearestDiff = diff;
        nearestIdx = idx;
      }
    });

    const approxDist = nearestDiff * 400;
    if (nearestIdx >= 0 && approxDist < 90) {
      onTargetUpdate({
        name: events[nearestIdx]?.title || null,
        distance: approxDist,
        status: 'APPROACHING'
      });
    } else {
      onTargetUpdate({ name: null, distance: 0, status: 'IDLE' });
    }

    // AUTOMATIC DOCKING — 0.04 spline diff trigger
    if (dockingCooldown.current <= 0 && nearestIdx >= 0 && nearestDiff < 0.04) {
      dockingTargetIdx.current = nearestIdx;
      dockingProgress.current = 0;
      onDockComplete(-1); // Transition to DOCKING state
    }

    // Camera chase logic
    const lookAheadPt = spline.getPointAt((progressRef.current + 0.04) % 1);
    const camOffset = new THREE.Vector3(0, 5.0, 0).sub(tangent.clone().multiplyScalar(12));
    const desiredCamPos = pt.clone().add(camOffset).add(new THREE.Vector3(tangent.z * 3.5, 0, -tangent.x * 3.5));

    camera.position.lerp(desiredCamPos, dt * 5);
    camera.lookAt(lookAheadPt);
  });

  return (
    <group>
      {/* Volcanic Magma Terrain & Sky */}
      <MagmaTerrain />

      {/* 3D Elevated Mag-Lev Monorail Structure */}
      <RailTrackStructure spline={spline} />

      {/* Train Locomotive & Carriages */}
      <group ref={trainGroupRef}>
        <LavaTrainVehicle speed={velocityRef.current * 10} />
      </group>

      {/* Magma Depots at each Event Station */}
      {events.map((evt, idx) => {
        const pos = stationPositions[idx] || new THREE.Vector3(0, 0, 0);
        return (
          <LavaStationDepot
            key={evt.id}
            event={evt}
            index={idx}
            position={[pos.x, pos.y, pos.z]}
            isActive={activeIdx === idx}
            onInspect={() => {
              if (onInspect) onInspect(evt);
              dockingTargetIdx.current = idx;
              dockingProgress.current = 0;
              onDockComplete(-1);
            }}
          />
        );
      })}
    </group>
  );
}

function RailTrackStructure({ spline }: { spline: THREE.CatmullRomCurve3 }) {
  const ties = useMemo(() => {
    const items = [];
    for (let i = 0; i < 80; i++) {
      const t = i / 80;
      const pt = spline.getPointAt(t);
      const tangent = spline.getTangentAt(t).normalize();
      const rotY = Math.atan2(tangent.x, tangent.z);
      items.push({ pos: pt, rotY });
    }
    return items;
  }, [spline]);

  return (
    <group>
      {/* Left Glowing Rail */}
      <mesh>
        <tubeGeometry args={[spline, 160, 0.25, 8, true]} />
        <meshStandardMaterial
          color="#ea580c"
          emissive="#ff6b35"
          emissiveIntensity={2.2}
          metalness={0.9}
        />
      </mesh>

      {/* Cross-ties and vertical support columns */}
      {ties.map((tie, idx) => (
        <group key={idx} position={[tie.pos.x, tie.pos.y - 0.3, tie.pos.z]} rotation={[0, tie.rotY, 0]}>
          <mesh>
            <boxGeometry args={[3.2, 0.3, 0.4]} />
            <meshStandardMaterial color="#292524" metalness={0.8} />
          </mesh>
          <mesh position={[0, -5, 0]}>
            <cylinderGeometry args={[0.3, 0.4, 10, 8]} />
            <meshStandardMaterial color="#1c1917" metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
