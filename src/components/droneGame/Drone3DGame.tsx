import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Event } from '../../types';
import Drone3DVehicle from './Drone3DVehicle';
import Checkpoint3D from './Checkpoint3D';
import DroneWorld from './DroneWorld';
import FlightPath from './FlightPath';
import DroneHUD from './DroneHUD';
import MobileControls from './MobileControls';
import EventCardModal from './EventCardModal';

interface Props {
  events: Event[];
}

interface DroneState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationY: number; // yaw
  bankAngle: number; // roll
  pitchAngle: number;
  thrust: number; // 0 to 1
}

function Scene({ events, activeIndex, onActiveChange, onReach }: { events: Event[]; activeIndex: number; onActiveChange: (i: number) => void; onReach: () => void }) {
  const { camera } = useThree();
  const stateRef = useRef<DroneState>({
    position: new THREE.Vector3(0, 2, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    rotationY: 0,
    bankAngle: 0,
    pitchAngle: 0,
    thrust: 0
  });

  const [isMobile, setIsMobile] = useState(false);

  const checkpoints = useMemo(() => {
    return events.map((e) => {
      const idx = events.indexOf(e);
      const t = idx / Math.max(1, events.length - 1);
      const x = (t - 0.5) * 20;
      const y = Math.sin(t * Math.PI) * 2 + 1;
      const z = -idx * 10;
      return [x, y, z] as [number, number, number];
    });
  }, [events]);

  // Keyboard input
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef({ dx: 0, dy: 0 });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.dx = e.movementX * 0.003;
      mouseRef.current.dy = e.movementY * 0.003;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  // Mobile touch
    const onMobileMove = useCallback((x: number, z: number) => {
      const state = stateRef.current;
      state.thrust = Math.min(1, state.thrust + 0.05);
      // Apply velocity in facing direction based on joystick
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.rotationY);
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.rotationY);
      if (Math.abs(z) > 0.1) state.velocity.add(forward.multiplyScalar(z * 0.9));
      if (Math.abs(x) > 0.1) state.velocity.add(right.multiplyScalar(x * 0.9));
    }, []);

  const onMobileLook = useCallback((x: number, y: number) => {
    const state = stateRef.current;
    state.rotationY += x * 0.05;
    state.pitchAngle = Math.max(-0.8, Math.min(0.8, state.pitchAngle + y * 0.05));
  }, []);

  const onMobileAscend = useCallback(() => {
    const state = stateRef.current;
    state.velocity.y = 0.15;
  }, []);

  const onMobileDescend = useCallback(() => {
    const state = stateRef.current;
    state.velocity.y = -0.15;
  }, []);

  useEffect(() => {
    setIsMobile('ontouchstart' in window);
  }, []);

  // Animation loop
  useFrame((_state, delta) => {
    const state = stateRef.current;
    const dt = Math.min(delta, 0.05);

    // Keyboard input processing
    let thrustForward = 0;
    let thrustRight = 0;
    let thrustUp = 0;

    if (keysRef.current['w'] || keysRef.current['arrowup']) {
      thrustForward = 1;
      state.thrust = Math.min(1, state.thrust + 0.04);
    }
    if (keysRef.current['s'] || keysRef.current['arrowdown']) {
      thrustForward = -0.6;
      state.thrust = Math.max(0, state.thrust - 0.02);
    }
    if (keysRef.current['a'] || keysRef.current['arrowleft']) {
      thrustRight = -1;
    }
    if (keysRef.current['d'] || keysRef.current['arrowright']) {
      thrustRight = 1;
    }
    if (keysRef.current[' ']) {
      thrustUp = 1;
    }
    if (keysRef.current['shift']) {
      thrustUp = -1;
    }

    // Mouse look
    state.rotationY += mouseRef.current.dx;
    state.pitchAngle = Math.max(-0.8, Math.min(0.8, state.pitchAngle + mouseRef.current.dy));
    mouseRef.current.dx *= 0.85;
    mouseRef.current.dy *= 0.85;

    // Apply movement relative to drone rotation
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.rotationY);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.rotationY);

    const speed = 12;
    state.velocity.add(forward.multiplyScalar(thrustForward * speed * dt));
    state.velocity.add(right.multiplyScalar(thrustRight * speed * dt));
    state.velocity.y += thrustUp * 15 * dt;

    // Smooth deceleration
    state.velocity.multiplyScalar(Math.pow(0.96, dt * 60));

    // Banking based on movement
    const targetBank = -state.velocity.x * 0.04;
    const targetPitch = state.velocity.z * 0.04;
    state.bankAngle += (targetBank - state.bankAngle) * 0.1;
    state.pitchAngle += (targetPitch - state.pitchAngle) * 0.08;

    // Apply movement
    state.position.add(state.velocity.clone().multiplyScalar(dt));

    // Boundary limits
    state.position.x = Math.max(-40, Math.min(40, state.position.x));
    state.position.z = Math.max(-80, Math.min(10, state.position.z));
    state.position.y = Math.max(-1, Math.min(15, state.position.y));

    // Update camera
    const cameraOffset = new THREE.Vector3(0, 3, 10).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.rotationY);
    const lookAt = state.position.clone().add(new THREE.Vector3(0, 1, 0));

    camera.position.copy(state.position).add(cameraOffset);
    camera.lookAt(lookAt);

    // Check checkpoint proximity
    const currentCP = checkpoints[activeIndex];
    if (currentCP) {
      const cpPos = new THREE.Vector3(...currentCP);
      const dist = state.position.distanceTo(cpPos);
      if (dist < 3.5 && activeIndex < events.length - 1) {
        onReach();
      }
      // Also check all checkpoints for direct navigation
      if (dist > 3.5) {
        for (let i = 0; i < checkpoints.length; i++) {
          if (i === activeIndex) continue;
          const cpPos2 = new THREE.Vector3(...checkpoints[i]);
          const d = state.position.distanceTo(cpPos2);
          if (d < 3) {
            onActiveChange(i);
            break;
          }
        }
      }
    }
  });

  // When drone reaches an event, open the card
  const prevActiveRef = useRef(activeIndex);
  useEffect(() => {
    if (activeIndex !== prevActiveRef.current) {
      prevActiveRef.current = activeIndex;
    }
  }, [activeIndex]);

  return (
    <>
      <DroneWorld />
      
      <group>
        {/* Flight Path Line */}
        <FlightPath checkpoints={checkpoints} reachedIndex={activeIndex} />

        {/* Event Checkpoints */}
        {events.map((event, idx) => (
          <Checkpoint3D
            key={event.id}
            event={event}
            position={checkpoints[idx]}
            isActive={idx === activeIndex}
            isReached={idx <= activeIndex}
            onClick={() => onActiveChange(idx)}
          />
        ))}
      </group>

      {/* Drone Vehicle */}
      <Drone3DVehicle 
        thrustLevel={stateRef.current.thrust}
      />

      {/* HUD Overlay */}
      <Html>
        <DroneHUD
          currentEvent={events[activeIndex]}
          currentIndex={activeIndex}
          totalEvents={events.length}
          nextCheckpoint={activeIndex + 1}
          showControls={true}
          isMobile={isMobile}
        />
      </Html>

      {/* Mobile Controls */}
      {isMobile && (
        <Html>
          <MobileControls
            onMove={onMobileMove}
            onLook={onMobileLook}
            onAscend={onMobileAscend}
            onDescend={onMobileDescend}
          />
        </Html>
      )}
    </>
  );
}

export default function Drone3DGame({ events }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showEventCard, setShowEventCard] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sort events chronologically
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const handleReachCheckpoint = useCallback(() => {
    if (activeIndex < sortedEvents.length - 1) {
      setShowEventCard(true);
    }
  }, [activeIndex, sortedEvents.length]);

  // WebGL check
  const [webglOk, setWebglOk] = useState(true);
  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      setWebglOk(!!gl);
    } catch {
      setWebglOk(false);
    }
  }, []);

  if (!webglOk) {
    return (
      <div className="webgl-fallback">
        <h3>WebGL Not Available</h3>
        <p>Your browser does not support WebGL. Here are the events:</p>
        <div className="fallback-events">
          {sortedEvents.map((e) => (
            <div key={e.id} className="fallback-event">{e.title} — {e.date}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="drone-game-wrapper">
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 5, 20], fov: 60 }}
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: 'high-performance'
        }}
        style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: '100vw', zIndex: 0 }}
      >
        <Scene
          events={sortedEvents}
          activeIndex={activeIndex}
          onActiveChange={setActiveIndex}
          onReach={handleReachCheckpoint}
        />
      </Canvas>

      {/* 2D Event Info Overlay */}
      <div className="drone-game-overlay">
        {/* Top HUD bar */}
        <div className="drone-game-topbar">
          <span className="drone-title-badge">AgentBlazer Events</span>
          <span className="drone-event-badge">{sortedEvents[activeIndex]?.category || ''}</span>
        </div>

        {/* Event card modal */}
        {showEventCard && sortedEvents[activeIndex] && (
          <EventCardModal
            event={sortedEvents[activeIndex]}
            onClose={() => setShowEventCard(false)}
          />
        )}
      </div>
    </div>
  );
}
