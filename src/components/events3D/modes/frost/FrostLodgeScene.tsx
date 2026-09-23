import { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Event } from '../../../../types';
import ArcticRoverVehicle from './ArcticRoverVehicle';
import ArcticTundraTerrain from './ArcticTundraTerrain';
import ArcticResearchOutpost from './ArcticResearchOutpost';

interface FrostSceneProps {
  events: Event[];
  activeIdx: number;
  gameState: 'GAMEPLAY' | 'DOCKING' | 'HUD_OPEN';
  onDockComplete: (idx: number) => void;
  onInspect: (event: Event) => void;
  onTargetUpdate: (target: { name: string | null; distance: number; status: 'APPROACHING' | 'DOCKING' | 'IDLE' }) => void;
  onSpeedUpdate?: (speed: number, isBoosting: boolean) => void;
  mobileMove?: { x: number; y: number };
}

export default function FrostLodgeScene({
  events,
  activeIdx,
  gameState,
  onDockComplete,
  onInspect,
  onTargetUpdate,
  onSpeedUpdate,
  mobileMove
}: FrostSceneProps) {
  const { camera } = useThree();

  const roverGroupRef = useRef<THREE.Group>(null);

  // Rover physical state
  const roverPos = useRef(new THREE.Vector3(0, 0, 10));
  const roverVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const roverYaw = useRef(0);
  const [speedVal, setSpeedVal] = useState(0);
  const [steerVal, setSteerVal] = useState(0);
  const [trailProgress, setTrailProgress] = useState(0);

  // Smooth Scroll Autopilot state
  const currentScrollProgress = useRef(0);
  const targetScrollProgress = useRef(0);
  const isScrollNavigating = useRef(false);
  const scrollTimeout = useRef<number | null>(null);

  const dockingTargetIdx = useRef<number | null>(null);
  const dockingProgress = useRef(0);
  const dockingCooldown = useRef(0);
  const lastCompletedOutpostIdx = useRef<number | null>(null);
  const prevGameState = useRef(gameState);

  // Set cooldown ONLY when resuming from HUD_OPEN to GAMEPLAY
  useEffect(() => {
    if (prevGameState.current === 'HUD_OPEN' && gameState === 'GAMEPLAY') {
      dockingCooldown.current = 3.5;
    }
    prevGameState.current = gameState;
  }, [gameState]);

  // Spatial coordinates for the 3 Arctic Research Outposts positioned along a natural trail
  const outpostPositions = useMemo(() => {
    return [
      new THREE.Vector3(-18, 0, -28),  // Outpost 1: Cybersecurity
      new THREE.Vector3(16, 0, -60),   // Outpost 2: GSoC
      new THREE.Vector3(-10, 0, -92)   // Outpost 3: PromptOps
    ];
  }, []);

  // Catmull-Rom Ground Trail connecting start -> Outpost 1 -> Outpost 2 -> Outpost 3
  const groundSpline = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(-18, 0, -28),
      new THREE.Vector3(16, 0, -60),
      new THREE.Vector3(-10, 0, -92)
    ];
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.25);
  }, []);

  // Station normalized parameter points along ground spline
  const outpostSplineTs = useMemo(() => [0.33, 0.67, 1.0], []);

  // Calibrated, smooth scroll wheel listener
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (gameState === 'HUD_OPEN' || gameState === 'DOCKING') return;

      const delta = e.deltaY * 0.00008; // Gentle progression
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

  // Keyboard navigation
  const keys = useRef<{ [k: string]: boolean }>({});
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (gameState === 'HUD_OPEN') return;
      keys.current[e.key.toLowerCase()] = true;
      if (e.key === 'Shift') keys.current['shift'] = true;

      // Disable scroll autopilot when player uses manual keys
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        isScrollNavigating.current = false;
      }

      // Press 'E' to instantly dock to nearest outpost if within 25m
      if (e.key.toLowerCase() === 'e' && gameState === 'GAMEPLAY') {
        let nearestIdx = -1;
        let nearestDist = Infinity;
        outpostPositions.forEach((outPos, idx) => {
          const dist = roverPos.current.distanceTo(outPos);
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
    const onUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
      if (e.key === 'Shift') keys.current['shift'] = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [gameState, outpostPositions, onDockComplete]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // Only tick down cooldown during active GAMEPLAY exploration
    if (gameState === 'GAMEPLAY' && dockingCooldown.current > 0) {
      dockingCooldown.current -= dt;
    }

    // 1. AUTOMATIC PARKING DOCKING AT OUTPOST
    if (gameState === 'DOCKING' && dockingTargetIdx.current !== null) {
      const targetOutpost = outpostPositions[dockingTargetIdx.current];
      // Park directly on the apron at z + 5.5
      const targetParkPos = new THREE.Vector3(targetOutpost.x, 0, targetOutpost.z + 5.5);

      dockingProgress.current = Math.min(1, dockingProgress.current + dt * 1.5);

      roverPos.current.lerp(targetParkPos, dt * 5.0);
      roverVelocity.current.multiplyScalar(0.5);
      roverYaw.current = THREE.MathUtils.lerp(roverYaw.current, 0, dt * 5);

      if (roverGroupRef.current) {
        roverGroupRef.current.position.copy(roverPos.current);
        roverGroupRef.current.rotation.set(0, roverYaw.current, 0);
      }

      const dockingSpeed = roverVelocity.current.length();
      setSpeedVal(dockingSpeed);
      setSteerVal(0);
      if (onSpeedUpdate) {
        onSpeedUpdate(dockingSpeed, false);
      }

      const desiredCamPos = new THREE.Vector3(
        roverPos.current.x,
        roverPos.current.y + 2.8,
        roverPos.current.z + 7.5
      );
      camera.position.lerp(desiredCamPos, dt * 5);
      camera.lookAt(targetOutpost);

      // Update target HUD
      const dist = roverPos.current.distanceTo(targetOutpost);
      onTargetUpdate({
        name: events[dockingTargetIdx.current]?.title || null,
        distance: dist,
        status: 'DOCKING'
      });

      if (dockingProgress.current >= 0.95) {
        const completedIdx = dockingTargetIdx.current;
        lastCompletedOutpostIdx.current = completedIdx;
        dockingTargetIdx.current = null;
        dockingProgress.current = 0;
        onTargetUpdate({ name: null, distance: 0, status: 'IDLE' });
        onDockComplete(completedIdx);
      }
      return;
    }

    // 2. HUD OPEN (ROVER STATIONARY)
    if (gameState === 'HUD_OPEN') {
      roverVelocity.current.set(0, 0, 0);
      setSpeedVal(0);
      if (onSpeedUpdate) {
        onSpeedUpdate(0, false);
      }
      return;
    }

    // 3. SMOOTH SCROLL-DRIVEN AUTOPILOT WITH GUARANTEED WAYPOINT INTERCEPT
    if (isScrollNavigating.current) {
      const prevP = currentScrollProgress.current;
      currentScrollProgress.current = THREE.MathUtils.lerp(currentScrollProgress.current, targetScrollProgress.current, dt * 3.5);
      const currP = currentScrollProgress.current;

      const splinePt = groundSpline.getPointAt(currP);
      const splineTangent = groundSpline.getTangentAt(currP).normalize();

      roverPos.current.lerp(splinePt, dt * 5.0);
      const targetYaw = Math.atan2(-splineTangent.x, -splineTangent.z);
      roverYaw.current = THREE.MathUtils.lerp(roverYaw.current, targetYaw, dt * 5.0);

      if (roverGroupRef.current) {
        roverGroupRef.current.position.copy(roverPos.current);
        roverGroupRef.current.rotation.set(0, roverYaw.current, 0);
      }

      setSpeedVal(18);
      setSteerVal(0);
      setTrailProgress(currP);
      if (onSpeedUpdate) {
        onSpeedUpdate(18, false);
      }

      const camOffset = new THREE.Vector3(
        Math.sin(roverYaw.current) * 7.5,
        2.8,
        Math.cos(roverYaw.current) * 7.5
      );
      const desiredCamPos = roverPos.current.clone().add(camOffset);
      camera.position.lerp(desiredCamPos, dt * 6);
      const lookTarget = roverPos.current.clone().add(splineTangent.clone().multiplyScalar(4));
      camera.lookAt(lookTarget);

      // GUARANTEED OUTPOST INTERCEPT: Check if progress interval [prevP, currP] crosses outpost
      outpostSplineTs.forEach((stT, idx) => {
        const isCrossing = (prevP <= stT && currP >= stT) || Math.abs(currP - stT) < 0.035;
        if (
          isCrossing &&
          dockingCooldown.current <= 0 &&
          lastCompletedOutpostIdx.current !== idx
        ) {
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

    // 4. NORMAL ARCTIC TUNDRA EXPLORATION
    let throttle = 0;
    let turn = 0;
    const boosting = !!keys.current['shift'];

    if (keys.current['w'] || keys.current['arrowup']) throttle += 1;
    if (keys.current['s'] || keys.current['arrowdown']) throttle -= 0.6;
    if (keys.current['a'] || keys.current['arrowleft']) turn += 1;
    if (keys.current['d'] || keys.current['arrowright']) turn -= 1;

    if (mobileMove) {
      throttle -= mobileMove.y;
      turn -= mobileMove.x;
    }

    setSteerVal(turn);

    // Apply vehicle steering
    const turnSpeed = 2.4;
    roverYaw.current += turn * turnSpeed * dt;

    const forwardDir = new THREE.Vector3(
      -Math.sin(roverYaw.current),
      0,
      -Math.cos(roverYaw.current)
    );

    // High speed & Sprint Boost multiplier
    const accel = boosting ? 80 : 50;
    if (throttle !== 0) {
      roverVelocity.current.addScaledVector(forwardDir, throttle * accel * dt);
    }

    // Terrain traction damping
    roverVelocity.current.multiplyScalar(Math.pow(0.92, dt * 60));
    roverPos.current.addScaledVector(roverVelocity.current, dt);

    // Keep on ground
    roverPos.current.y = 0;

    if (roverGroupRef.current) {
      roverGroupRef.current.position.copy(roverPos.current);
      roverGroupRef.current.rotation.set(0, roverYaw.current, 0);
    }

    const curSpeed = roverVelocity.current.length();
    setSpeedVal(curSpeed);
    if (onSpeedUpdate) {
      onSpeedUpdate(curSpeed, boosting);
    }

    const zProgress = Math.max(0, Math.min(0.98, (10 - roverPos.current.z) / 102));
    setTrailProgress(zProgress);

    // Synchronize scroll progress tracker so scrolling can pick up smoothly
    currentScrollProgress.current = zProgress;
    targetScrollProgress.current = zProgress;

    // Dynamic Camera FOV & Zoom-In on Shift Boost
    const targetFov = boosting ? 54 : 60; // 54deg zooms in on the rover
    if ((camera as THREE.PerspectiveCamera).fov !== targetFov) {
      (camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp(
        (camera as THREE.PerspectiveCamera).fov,
        targetFov,
        dt * 4
      );
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }

    // Chase Camera update (pulled in closer on Shift boost)
    const camDistance = boosting ? 6.2 : 7.5;
    const camHeight = boosting ? 2.3 : 2.8;
    const camOffset = new THREE.Vector3(
      Math.sin(roverYaw.current) * camDistance,
      camHeight,
      Math.cos(roverYaw.current) * camDistance
    );
    const desiredCamPos = roverPos.current.clone().add(camOffset);
    camera.position.lerp(desiredCamPos, dt * (boosting ? 7.5 : 6.0));

    const lookTarget = roverPos.current.clone().add(forwardDir.clone().multiplyScalar(4));
    camera.lookAt(lookTarget);

    // PROXIMITY DETECTION — find nearest outpost & update target HUD
    let nearestIdx = -1;
    let nearestDist = Infinity;
    outpostPositions.forEach((outPos, idx) => {
      const dist = roverPos.current.distanceTo(outPos);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    });

    // Reset departure latch if player has driven >18m away from last completed outpost
    if (lastCompletedOutpostIdx.current !== null) {
      const lastPos = outpostPositions[lastCompletedOutpostIdx.current];
      if (lastPos && roverPos.current.distanceTo(lastPos) > 18) {
        lastCompletedOutpostIdx.current = null;
      }
    }

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
      lastCompletedOutpostIdx.current !== nearestIdx
    ) {
      dockingTargetIdx.current = nearestIdx;
      dockingProgress.current = 0;
      onDockComplete(-1); // Transition to DOCKING state
    }
  });

  return (
    <group>
      {/* Frozen Tundra Snow Terrain & Aurora Sky */}
      <ArcticTundraTerrain />

      {/* Player Arctic Rover Vehicle */}
      <group ref={roverGroupRef}>
        <ArcticRoverVehicle speed={speedVal} steering={steerVal} />
      </group>

      {/* 3 Research Outposts at Event Coordinates */}
      {events.map((evt, idx) => {
        const pos = outpostPositions[idx] || outpostPositions[0];
        return (
          <ArcticResearchOutpost
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

      {/* Dynamic Forward-Only Disappearing Ground Energy Trail */}
      <DynamicDisappearingGroundBeam spline={groundSpline} progress={trailProgress} />
    </group>
  );
}

function DynamicDisappearingGroundBeam({ spline, progress }: { spline: THREE.CatmullRomCurve3; progress: number }) {
  const forwardSpline = useMemo(() => {
    const startT = Math.min(0.96, Math.max(0, progress));
    const subPoints: THREE.Vector3[] = [];
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = startT + (i / steps) * (1.0 - startT);
      const pt = spline.getPointAt(t);
      subPoints.push(new THREE.Vector3(pt.x, 0.05, pt.z)); // Snag directly to snow surface
    }
    return new THREE.CatmullRomCurve3(subPoints, false, 'catmullrom', 0.2);
  }, [spline, progress]);

  if (progress >= 0.97) return null;

  return (
    <group>
      <mesh>
        <tubeGeometry args={[forwardSpline, 60, 0.16, 8, false]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.65} />
      </mesh>
      <mesh>
        <tubeGeometry args={[forwardSpline, 60, 0.04, 6, false]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

