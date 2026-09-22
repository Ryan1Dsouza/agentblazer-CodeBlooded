import { useRef, useEffect, useState, useCallback } from 'react';

interface MobileControlsProps {
  onMove: (x: number, z: number) => void;
  onLook: (x: number, y: number) => void;
  onAscend: () => void;
  onDescend: () => void;
}

export default function MobileControls({ onMove, onLook, onAscend, onDescend }: MobileControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const lookPadRef = useRef<HTMLDivElement>(null);

  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [ascendPressed, setAscendPressed] = useState(false);
  const [descendPressed, setDescendPressed] = useState(false);

  // Joystick handlers
  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsJoystickActive(true);
  }, []);

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    if (!isJoystickActive || !joystickRef.current) return;
    e.preventDefault();

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const touch = e.touches[0];
    let dx = (touch.clientX - rect.left - centerX) / centerX;
    let dy = (touch.clientY - rect.top - centerY) / centerY;

    // Clamp to circle
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
      dx /= dist;
      dy /= dist;
    }

    setJoystickPos({ x: dx * 28, y: dy * 28 });
    onMove(dx, dy);
  }, [isJoystickActive, onMove]);

  const handleJoystickEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    onMove(0, 0);
  }, [onMove]);

  // Look pad handlers
  const handleLookStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
  }, []);

  const handleLookMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!lookPadRef.current) return;

    const rect = lookPadRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const touch = e.touches[0];
    const dx = (touch.clientX - rect.left - centerX) / centerX;
    const dy = (touch.clientY - rect.top - centerY) / centerY;

    onLook(Math.max(-1, Math.min(1, dx)), Math.max(-1, Math.min(1, dy)));
  }, [onLook]);

  const handleLookEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    onLook(0, 0);
  }, [onLook]);

  // Prevent default touch behavior to avoid scrolling
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', preventScroll, { passive: false });
    return () => document.removeEventListener('touchmove', preventScroll);
  }, []);

  return (
    <div className="mobile-controls">
      {/* Left: Movement Joystick */}
      <div
        ref={joystickRef}
        className={`joystick-base ${isJoystickActive ? 'active' : ''}`}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
      >
        <div
          ref={joystickKnobRef}
          className="joystick-knob"
          style={{
            transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
          }}
        />
        <div className="joystick-label">MOVE</div>
      </div>

      {/* Right: Look Pad + Altitude */}
      <div className="right-controls">
        <div
          ref={lookPadRef}
          className="look-pad"
          onTouchStart={handleLookStart}
          onTouchMove={handleLookMove}
          onTouchEnd={handleLookEnd}
        >
          <div className="look-pad-label">LOOK</div>
        </div>

        <div className="altitude-controls">
          <button
            className={`altitude-btn ascend ${ascendPressed ? 'pressed' : ''}`}
            onTouchStart={() => { setAscendPressed(true); onAscend(); }}
            onTouchEnd={() => setAscendPressed(false)}
          >
            ▲
          </button>
          <button
            className={`altitude-btn descend ${descendPressed ? 'pressed' : ''}`}
            onTouchStart={() => { setDescendPressed(true); onDescend(); }}
            onTouchEnd={() => setDescendPressed(false)}
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}

