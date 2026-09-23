import { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Event } from '../../types';
import VioletSpaceScene from './modes/violet/VioletSpaceScene';
import InfernoLavaScene from './modes/inferno/InfernoLavaScene';
import FrostLodgeScene from './modes/frost/FrostLodgeScene';
import ModeHUD from './shared/ModeHUD';
import TargetHUD from './shared/TargetHUD';
import VirtualJoystickOverlay from './shared/VirtualJoystickOverlay';
import EventDetailModal from './shared/EventDetailModal';
import RoverSpeedometerHUD from './modes/frost/RoverSpeedometerHUD';

interface Events3DCanvasProps {
  events: Event[];
  theme: string;
  onAbort?: () => void;
}

export type GameState = 'GAMEPLAY' | 'DOCKING' | 'HUD_OPEN';

export interface TargetInfo {
  name: string | null;
  distance: number;
  status: 'APPROACHING' | 'DOCKING' | 'IDLE';
}

export default function Events3DCanvas({
  events,
  theme,
  onAbort
}: Events3DCanvasProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [gameState, setGameState] = useState<GameState>('GAMEPLAY');
  const [modalEvent, setModalEvent] = useState<Event | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [targetInfo, setTargetInfo] = useState<TargetInfo>({ name: null, distance: 0, status: 'IDLE' });

  // Rover Speedometer State (Frost Mode)
  const [speed, setSpeed] = useState(0);
  const [isBoosting, setIsBoosting] = useState(false);

  // Mobile movement & look vectors
  const [mobileMove, setMobileMove] = useState({ x: 0, y: 0 });
  const [mobileLook, setMobileLook] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard shortcut to abort mission (if not in HUD)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't abort if HUD is open (HUD handles its own close via X/ESC)
      if (gameState === 'HUD_OPEN') return;

      if (e.key === 'x' || e.key === 'X' || e.key === 'Escape') {
        if (onAbort) onAbort();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState, onAbort]);

  // Handle docking sequence callback from 3D scene
  const handleDockComplete = (idx: number) => {
    if (idx === -1) {
      // Transitioning to docking sequence
      setGameState('DOCKING');
    } else {
      // Docking locked & complete -> open event HUD
      setActiveIdx(idx);
      setGameState('HUD_OPEN');
      setModalEvent(events[idx] || events[0]);
    }
  };

  const handleInspect = (event: Event) => {
    setGameState('HUD_OPEN');
    setModalEvent(event);
  };

  const handleCloseHUD = () => {
    setModalEvent(null);
    setGameState('GAMEPLAY');
  };

  return (
    <div className="events-canvas-container">
      {/* Three.js R3F Canvas - 100% full viewport */}
      <Canvas
        camera={{ position: [0, 5, 20], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <Suspense fallback={null}>
          {theme === 'inferno' ? (
            <InfernoLavaScene
              events={events}
              activeIdx={activeIdx}
              gameState={gameState}
              onDockComplete={handleDockComplete}
              onInspect={handleInspect}
              onTargetUpdate={setTargetInfo}
              mobileMove={gameState === 'GAMEPLAY' ? mobileMove : undefined}
            />
          ) : theme === 'frost' ? (
            <FrostLodgeScene
              events={events}
              activeIdx={activeIdx}
              gameState={gameState}
              onDockComplete={handleDockComplete}
              onInspect={handleInspect}
              onTargetUpdate={setTargetInfo}
              onSpeedUpdate={(s, b) => { setSpeed(s); setIsBoosting(b); }}
              mobileMove={gameState === 'GAMEPLAY' ? mobileMove : undefined}
            />
          ) : (
            <VioletSpaceScene
              events={events}
              activeIdx={activeIdx}
              gameState={gameState}
              onDockComplete={handleDockComplete}
              onInspect={handleInspect}
              onTargetUpdate={setTargetInfo}
              mobileMove={gameState === 'GAMEPLAY' ? mobileMove : undefined}
              mobileLook={gameState === 'GAMEPLAY' ? mobileLook : undefined}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Target HUD — top-right approach indicator */}
      {gameState !== 'HUD_OPEN' && (
        <TargetHUD
          targetName={targetInfo.name}
          distance={targetInfo.distance}
          status={gameState === 'DOCKING' ? 'DOCKING' : targetInfo.status}
          theme={theme}
        />
      )}

      {/* Speedometer HUD — bottom-right (Frost Mode only) */}
      {theme === 'frost' && (
        <RoverSpeedometerHUD
          speed={speed}
          isBoosting={isBoosting}
          visible={gameState === 'GAMEPLAY'}
        />
      )}

      {/* Minimal Bottom-Left Controls HUD only */}
      <ModeHUD theme={theme} gameState={gameState} />

      {/* Mobile Virtual Controls when in GAMEPLAY mode */}
      {isMobile && gameState === 'GAMEPLAY' && (
        <VirtualJoystickOverlay
          onMove={(x, y) => setMobileMove({ x, y })}
          onLook={(dx, dy) => setMobileLook({ x: dx, y: dy })}
          onAction={(act) => {
            if (act === 'interact') {
              setModalEvent(events[activeIdx] || events[0]);
              setGameState('HUD_OPEN');
            }
          }}
          actionLabel="INSPECT"
          theme={theme}
        />
      )}

      {/* Unified In-World Event HUD & Photo Slideshow Terminal */}
      <EventDetailModal
        event={modalEvent}
        onClose={handleCloseHUD}
        theme={theme}
      />
    </div>
  );
}
