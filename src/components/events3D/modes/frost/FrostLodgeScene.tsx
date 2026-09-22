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
  mobileMove?: { x: number; y: number };
}

export default function FrostLodgeScene({
  events,
  activeIdx,
  gameState,
  onDockComplete,
  onInspect,
  onTargetUpdate,
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

  const dockingTargetIdx = useRef<number | null>(null);
  const dockingProgress = useRef(0);
  const dockingCooldown = useRef(0);
  const prevGameState = useRef(gameState);

  // Set cooldown ONLY when resuming from HUD_OPEN to GAMEPLAY
  useEffect(() => {
    if (prevGameState.current === 'HUD_OPEN' && gameState === 'GAMEPLAY') {
      dockingCooldown.current = 2.5;
    }
    prevGameState.current = gameState;
  }, [gameState]);

  // Spatial coordinates for the 3 Arctic Research Outposts positioned closer together
  const outpostPositions = useMemo(() => {
    return [
      new THREE.Vector3(-18, 0, -28),  // Outpost 1: Cybersecurity
      new THREE.Vector3(16, 0, -60),   // Outpost 2: GSoC
      new THREE.Vector3(-10, 0, -92)   // Outpost 3: PromptOps
    ];
  }, []);

  // Keyboard navigation
  const keys = useRef<{ [k: string]: boolean }>({});
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (gameState === 'HUD_OPEN') return;
      keys.current[e.key.toLowerCase()] = true;

      // Press 'E' to instantly dock to nearest outpost if within 40m
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
        if (nearestIdx >= 0 && nearestDist < 40) {
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

      setSpeedVal(roverVelocity.current.length());
      setSteerVal(0);

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
      return;
    }

    // 3. NORMAL ARCTIC TUNDRA EXPLORATION
    let throttle = 0;
    let turn = 0;

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
    const turnSpeed = 2.2;
    roverYaw.current += turn * turnSpeed * dt;

    const forwardDir = new THREE.Vector3(
      -Math.sin(roverYaw.current),
      0,
      -Math.cos(roverYaw.current)
    );

    const accel = 30;
    if (throttle !== 0) {
      roverVelocity.current.addScaledVector(forwardDir, throttle * accel * dt);
    }

    // Terrain traction damping
    roverVelocity.current.multiplyScalar(Math.pow(0.89, dt * 60));
    roverPos.current.addScaledVector(roverVelocity.current, dt);

    // Keep on ground
    roverPos.current.y = 0;

    if (roverGroupRef.current) {
      roverGroupRef.current.position.copy(roverPos.current);
      roverGroupRef.current.rotation.set(0, roverYaw.current, 0);
    }

    setSpeedVal(roverVelocity.current.length());

    // Camera chase
    const camOffset = new THREE.Vector3(
      Math.sin(roverYaw.current) * 7.5,
      2.8,
      Math.cos(roverYaw.current) * 7.5
    );
    const desiredCamPos = roverPos.current.clone().add(camOffset);
    camera.position.lerp(desiredCamPos, dt * 6);

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

    if (nearestIdx >= 0 && nearestDist < 60) {
      onTargetUpdate({
        name: events[nearestIdx]?.title || null,
        distance: nearestDist,
        status: 'APPROACHING'
      });
    } else {
      onTargetUpdate({ name: null, distance: 0, status: 'IDLE' });
    }

    // AUTOMATIC DOCKING — generous 18-unit capture radius
    if (dockingCooldown.current <= 0 && nearestIdx >= 0 && nearestDist < 18) {
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
    </group>
  );
}
