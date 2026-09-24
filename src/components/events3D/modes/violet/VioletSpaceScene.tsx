import { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Event } from '../../../../types';
import SpaceshipVehicle from './SpaceshipVehicle';
import { createVioletEnvironment } from './createVioletEnvironment';
import StaticEnvironment from '../../shared/StaticEnvironment';

interface VioletSceneProps {
  events: Event[];
  activeIdx: number;
  gameState: 'GAMEPLAY' | 'DOCKING' | 'HUD_OPEN';
  onDockComplete: (idx: number) => void;
  onInspect: (event: Event) => void;
  onTargetUpdate: (target: { name: string | null; distance: number; status: 'APPROACHING' | 'DOCKING' | 'IDLE' }) => void;
  mobileMove?: { x: number; y: number };
  mobileLook?: { x: number; y: number };
  mobileBoost?: boolean;
}

export default function VioletSpaceScene({
  events,
  activeIdx: _activeIdx,
  gameState,
  onDockComplete,
  onInspect: _onInspect,
  onTargetUpdate,
  mobileMove,
  mobileLook,
  mobileBoost
}: VioletSceneProps) {
  const { camera } = useThree();

  // Ship group direct reference for zero-lag rendering
  const shipGroupRef = useRef<THREE.Group>(null);

  // Ship dynamic physical state
  const shipPos = useRef(new THREE.Vector3(0, 0, 10));
  const shipVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const shipRotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const [speedVal, setSpeedVal] = useState(0);
  const [isBoosting, setIsBoosting] = useState(false);
  const [trailProgress, setTrailProgress] = useState(0);

  // Smooth Scroll Autopilot state
  const currentScrollProgress = useRef(0);
  const targetScrollProgress = useRef(0);
  const isScrollNavigating = useRef(false);
  const scrollTimeout = useRef<number | null>(null);

  // Docking sequence state & departure latch
  const dockingTargetIdx = useRef<number | null>(null);
  const dockingProgress = useRef(0);
  const dockingCooldown = useRef(0);
  const lastCompletedStationIdx = useRef<number | null>(null);
  const prevGameState = useRef(gameState);

  // Set cooldown ONLY when resuming from HUD_OPEN to GAMEPLAY
  useEffect(() => {
    if (prevGameState.current === 'HUD_OPEN' && gameState === 'GAMEPLAY') {
      dockingCooldown.current = 3.5;
    }
    prevGameState.current = gameState;
  }, [gameState]);

  // Spatial coordinates for the 3 Space Stations positioned along natural flight trajectory
  const stationPositions = useMemo(() => {
    return [
      new THREE.Vector3(-18, 2, -28),  // Station 1: Cybersecurity & Career Pathways
      new THREE.Vector3(16, 4, -62),   // Station 2: GSoc and LLM Workshop
      new THREE.Vector3(-10, 1, -96)   // Station 3: PromptOps 2026
    ];
  }, []);

  // Catmull-Rom flight trajectory spline connecting start -> Station 1 -> Station 2 -> Station 3
  const flightSpline = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(-18, 2, -28),
      new THREE.Vector3(16, 4, -62),
      new THREE.Vector3(-10, 1, -96)
    ];
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.3);
  }, []);

  // Station normalized parameter points along flight spline
  const stationSplineTs = useMemo(() => [0.33, 0.67, 1.0], []);

  // Calibrated, smooth scroll wheel listener
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (gameState === 'HUD_OPEN' || gameState === 'DOCKING') return;

      const delta = e.deltaY * 0.00008; // Gentle, weighted increment
      targetScrollProgress.current = Math.max(0, Math.min(1, targetScrollProgress.current + delta));
      isScrollNavigating.current = true;

      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = window.setTimeout(() => {
        isScrollNavigating.current = false;
      }, 1500);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [gameState]);

  // Keyboard keys tracking
  const keys = useRef<{ [k: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'HUD_OPEN') return;
      keys.current[e.key.toLowerCase()] = true;
      if (e.key === 'Shift') keys.current['shift'] = true;

      // Disable scroll autopilot when player uses manual keys
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        isScrollNavigating.current = false;
      }

      // Press 'E' to instantly dock to nearest station if within 25m
      if (e.key.toLowerCase() === 'e' && gameState === 'GAMEPLAY') {
        let nearestIdx = -1;
        let nearestDist = Infinity;
        stationPositions.forEach((stPos, idx) => {
          const dist = shipPos.current.distanceTo(stPos);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestIdx = idx;
          }
        });
        if (nearestIdx >= 0 && nearestDist < 25) {
          dockingTargetIdx.current = nearestIdx;
          dockingProgress.current = 0;
          onDockComplete(-1);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
      if (e.key === 'Shift') keys.current['shift'] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, stationPositions, onDockComplete]);

  // Main flight kinematics & proximity docking loop
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    // Keep the swept wings inside the narrower horizontal field of view on phones.
    const framingScale = THREE.MathUtils.clamp(0.85 / (camera as THREE.PerspectiveCamera).aspect, 1, 2.4);

    // Only tick down cooldown during active GAMEPLAY exploration
    if (gameState === 'GAMEPLAY' && dockingCooldown.current > 0) {
      dockingCooldown.current -= dt;
    }

    // 1. AUTOMATIC DOCKING SEQUENCE
    if (gameState === 'DOCKING' && dockingTargetIdx.current !== null) {
      const targetStationPos = stationPositions[dockingTargetIdx.current];
      // Docking anchor point: in front of station at z + 6
      const targetDockPos = new THREE.Vector3(
        targetStationPos.x,
        targetStationPos.y - 0.2,
        targetStationPos.z + 6
      );

      dockingProgress.current = Math.min(1, dockingProgress.current + dt * 1.5);

      // Smoothly interpolate position and orientation into docking lock
      shipPos.current.lerp(targetDockPos, dt * 5.0);
      shipVelocity.current.multiplyScalar(0.5);

      shipRotation.current.x = THREE.MathUtils.lerp(shipRotation.current.x, 0, dt * 6);
      shipRotation.current.y = THREE.MathUtils.lerp(shipRotation.current.y, 0, dt * 6);
      shipRotation.current.z = THREE.MathUtils.lerp(shipRotation.current.z, 0, dt * 6);

      // Update Three.js matrix directly
      if (shipGroupRef.current) {
        shipGroupRef.current.position.copy(shipPos.current);
        shipGroupRef.current.rotation.copy(shipRotation.current);
      }

      // Chase Camera smooth framing during docking
      const desiredCamPos = new THREE.Vector3(
        shipPos.current.x,
        shipPos.current.y + 2.2 * framingScale,
        shipPos.current.z + 6.5 * framingScale
      );
      camera.position.lerp(desiredCamPos, dt * 5.5);
      camera.lookAt(targetStationPos);

      // Update target HUD during docking
      const dist = shipPos.current.distanceTo(targetStationPos);
      onTargetUpdate({
        name: events[dockingTargetIdx.current]?.title || null,
        distance: dist,
        status: 'DOCKING'
      });

      if (dockingProgress.current >= 0.95) {
        const completedIdx = dockingTargetIdx.current;
        lastCompletedStationIdx.current = completedIdx;
        dockingTargetIdx.current = null;
        dockingProgress.current = 0;
        onTargetUpdate({ name: null, distance: 0, status: 'IDLE' });
        onDockComplete(completedIdx);
      }
      return;
    }

    // 2. HUD OPEN (CONTROLS LOCKED)
    if (gameState === 'HUD_OPEN') {
      shipVelocity.current.set(0, 0, 0);
      return;
    }

    // 3. SMOOTH SCROLL-DRIVEN AUTOPILOT WITH GUARANTEED WAYPOINT INTERCEPT
    if (isScrollNavigating.current) {
      // Smoothly lerp towards target scroll progress to prevent discrete jumps
      const prevP = currentScrollProgress.current;
      currentScrollProgress.current = THREE.MathUtils.lerp(currentScrollProgress.current, targetScrollProgress.current, dt * 3.5);
      const currP = currentScrollProgress.current;

      const splinePt = flightSpline.getPointAt(currP);
      const splineTangent = flightSpline.getTangentAt(currP).normalize();

      shipPos.current.lerp(splinePt, dt * 6.0);
      const targetRotY = Math.atan2(-splineTangent.x, -splineTangent.z);
      shipRotation.current.y = THREE.MathUtils.lerp(shipRotation.current.y, targetRotY, dt * 6.0);
      shipRotation.current.x = THREE.MathUtils.lerp(shipRotation.current.x, splineTangent.y * 0.4, dt * 6.0);
      shipRotation.current.z = THREE.MathUtils.lerp(shipRotation.current.z, 0, dt * 6.0);

      if (shipGroupRef.current) {
        shipGroupRef.current.position.copy(shipPos.current);
        shipGroupRef.current.rotation.copy(shipRotation.current);
      }

      setTrailProgress(currP);

      const camOffset = new THREE.Vector3(0, 2.8, 7.5).multiplyScalar(framingScale);
      camOffset.applyEuler(new THREE.Euler(0, shipRotation.current.y, 0));
      const desiredCamPos = shipPos.current.clone().add(camOffset);
      camera.position.lerp(desiredCamPos, dt * 6);
      const lookTarget = shipPos.current.clone().add(splineTangent.clone().multiplyScalar(5));
      camera.lookAt(lookTarget);

      // GUARANTEED STATION INTERCEPT: Check if progress interval [prevP, currP] crosses station waypoint
      stationSplineTs.forEach((stT, idx) => {
        const isCrossing = (prevP <= stT && currP >= stT) || Math.abs(currP - stT) < 0.035;
        if (
          isCrossing &&
          dockingCooldown.current <= 0 &&
          lastCompletedStationIdx.current !== idx
        ) {
          // Snap progress to station and trigger docking
          currentScrollProgress.current = stT;
          targetScrollProgress.current = stT;
          dockingTargetIdx.current = idx;
          dockingProgress.current = 0;
          isScrollNavigating.current = false;
          onDockComplete(-1);
        }
      });
      return;
    }

    // 4. NORMAL FREE FLIGHT EXPLORATION
    let forward = 0;
    let turn = 0;
    let pitch = 0;
    let vertical = 0;
    const boosting = !!keys.current['shift'] || !!mobileBoost;
    setIsBoosting(boosting);

    if (keys.current['w'] || keys.current['arrowup']) forward += 1;
    if (keys.current['s'] || keys.current['arrowdown']) forward -= 0.6;
    if (keys.current['a'] || keys.current['arrowleft']) turn += 1;
    if (keys.current['d'] || keys.current['arrowright']) turn -= 1;
    if (keys.current[' ']) vertical += 1;

    // Mobile input integration
    if (mobileMove) {
      forward -= mobileMove.y;
      turn -= mobileMove.x;
    }
    if (mobileLook) {
      pitch -= mobileLook.y * 1.8;
      turn -= mobileLook.x * 2.2;
    }

    // Apply rotation dynamics
    const rotSpeed = 2.4;
    shipRotation.current.y += turn * rotSpeed * dt;
    shipRotation.current.x = THREE.MathUtils.lerp(
      shipRotation.current.x,
      pitch * 0.4 + forward * 0.08,
      dt * 5
    );
    shipRotation.current.z = THREE.MathUtils.lerp(
      shipRotation.current.z,
      turn * 0.6,
      dt * 7
    );

    // Forward propulsion vector (forward is -Z)
    const moveDir = new THREE.Vector3(0, 0, -1);
    moveDir.applyEuler(shipRotation.current);

    // High velocity & boost multiplier
    const accel = boosting ? 75 : 36;

    if (forward !== 0) {
      shipVelocity.current.addScaledVector(moveDir, forward * accel * dt);
    }
    if (vertical !== 0) {
      shipVelocity.current.y += vertical * 20 * dt;
    }

    // Velocity friction & decay
    shipVelocity.current.multiplyScalar(Math.pow(0.91, dt * 60));
    shipPos.current.addScaledVector(shipVelocity.current, dt);

    const curSpeed = shipVelocity.current.length();
    setSpeedVal(curSpeed);

    // Update trail progress approximately based on position along Z axis
    const zProgress = Math.max(0, Math.min(0.98, (10 - shipPos.current.z) / 106));
    setTrailProgress(zProgress);

    // Synchronize scroll progress tracker so scrolling can pick up smoothly from flight position
    currentScrollProgress.current = zProgress;
    targetScrollProgress.current = zProgress;

    // Direct Three.js transform update
    if (shipGroupRef.current) {
      shipGroupRef.current.position.copy(shipPos.current);
      shipGroupRef.current.rotation.copy(shipRotation.current);
    }

    // Dynamic Camera FOV Kick during Shift Boost
    const targetFov = boosting ? 68 : 60;
    if ((camera as THREE.PerspectiveCamera).fov !== targetFov) {
      (camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp(
        (camera as THREE.PerspectiveCamera).fov,
        targetFov,
        dt * 4
      );
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }

    // Chase Camera update
    const camOffset = new THREE.Vector3(0, 2.6, boosting ? 9.5 : 7.0).multiplyScalar(framingScale);
    camOffset.applyEuler(new THREE.Euler(0, shipRotation.current.y, 0));
    const desiredCamPos = shipPos.current.clone().add(camOffset);

    camera.position.lerp(desiredCamPos, dt * 6.5);
    const lookTarget = shipPos.current.clone().add(moveDir.clone().multiplyScalar(6));
    camera.lookAt(lookTarget);

    // PROXIMITY DETECTION — find nearest station & update target HUD
    let nearestIdx = -1;
    let nearestDist = Infinity;
    stationPositions.forEach((stPos, idx) => {
      const dist = shipPos.current.distanceTo(stPos);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    });

    // Reset departure latch if player has flown >18m away from last completed station
    if (lastCompletedStationIdx.current !== null) {
      const lastPos = stationPositions[lastCompletedStationIdx.current];
      if (lastPos && shipPos.current.distanceTo(lastPos) > 18) {
        lastCompletedStationIdx.current = null;
      }
    }

    // Show target HUD when within 60 units
    if (nearestIdx >= 0 && nearestDist < 60) {
      onTargetUpdate({
        name: events[nearestIdx]?.title || null,
        distance: nearestDist,
        status: 'APPROACHING'
      });
    } else {
      onTargetUpdate({ name: null, distance: 0, status: 'IDLE' });
    }

    // AUTOMATIC DOCKING — tight 8.5-unit capture radius with station departure latch
    if (
      dockingCooldown.current <= 0 &&
      nearestIdx >= 0 &&
      nearestDist < 8.5 &&
      lastCompletedStationIdx.current !== nearestIdx
    ) {
      dockingTargetIdx.current = nearestIdx;
      dockingProgress.current = 0;
      onDockComplete(-1); // Transition state to DOCKING
    }
  });

  // Build Kevin's baked violet environment once
  const envResources = useMemo(
    () => createVioletEnvironment(stationPositions, flightSpline),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[20, 40, 30]} intensity={1.5} color="#c084fc" />

      {/* Kevin's baked Violet environment: orbital stations, asteroids, space ring */}
      <StaticEnvironment resources={envResources} theme="violet" background="#08051a" />

      {/* Player Spaceship */}
      <group ref={shipGroupRef} position={[shipPos.current.x, shipPos.current.y, shipPos.current.z]}>
        <SpaceshipVehicle
          speed={speedVal}
          isBoosting={isBoosting}
        />
      </group>

      {/* Dynamic Forward-Only Disappearing Energy Flight Path */}
      <DynamicDisappearingBeam spline={flightSpline} progress={trailProgress} />
    </group>
  );
}

function DynamicDisappearingBeam({ spline, progress }: { spline: THREE.CatmullRomCurve3; progress: number }) {
  // Generate forward sub-spline from progress -> 1.0
  const forwardSpline = useMemo(() => {
    const startT = Math.min(0.96, Math.max(0, progress));
    const subPoints: THREE.Vector3[] = [];
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = startT + (i / steps) * (1.0 - startT);
      subPoints.push(spline.getPointAt(t));
    }
    return new THREE.CatmullRomCurve3(subPoints, false, 'catmullrom', 0.2);
  }, [spline, progress]);

  if (progress >= 0.97) return null;

  return (
    <group>
      <mesh>
        <tubeGeometry args={[forwardSpline, 60, 0.18, 8, false]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.65} />
      </mesh>
      <mesh>
        <tubeGeometry args={[forwardSpline, 60, 0.05, 6, false]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}
