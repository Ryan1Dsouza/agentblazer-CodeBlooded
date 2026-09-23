import React, { useRef, useState, useCallback } from 'react';

interface Props {
  onMove: (x: number, y: number) => void;
  onLook?: (dx: number, dy: number) => void;
  onAction?: (action: 'up' | 'down' | 'boost' | 'interact') => void;
  actionLabel?: string;
  theme?: string;
}

export default function VirtualJoystickOverlay({
  onMove,
  onLook,
  onAction,
  actionLabel = 'DOCK',
  theme = 'violet'
}: Props) {
  const stickRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const lookTouchRef = useRef<{ id: number; x: number; y: number } | null>(null);

  const themeAccent = theme === 'inferno' ? '#ff6b35' : theme === 'frost' ? '#0ea5e9' : '#8b5cf6';

  const handleStickStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setActive(true);
  };

  const handleStickMove = useCallback(
    (e: React.TouchEvent) => {
      if (!active || !stickRef.current) return;
      e.stopPropagation();
      const rect = stickRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const touch = e.touches[0];
      let dx = (touch.clientX - cx) / (rect.width / 2);
      let dy = (touch.clientY - cy) / (rect.height / 2);

      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
      setPos({ x: dx * 30, y: dy * 30 });
      onMove(dx, dy);
    },
    [active, onMove]
  );

  const handleStickEnd = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      setActive(false);
      setPos({ x: 0, y: 0 });
      onMove(0, 0);
    },
    [onMove]
  );

  // Look pad handling for right half
  const handleLookStart = (e: React.TouchEvent) => {
    if (lookTouchRef.current) return;
    const touch = e.changedTouches[0];
    lookTouchRef.current = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
  };

  const handleLookMove = (e: React.TouchEvent) => {
    if (!lookTouchRef.current || !onLook) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchRef.current.id) {
        const dx = (touch.clientX - lookTouchRef.current.x) * 0.015;
        const dy = (touch.clientY - lookTouchRef.current.y) * 0.015;
        lookTouchRef.current = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
        onLook(dx, dy);
        break;
      }
    }
  };

  const handleLookEnd = (e: React.TouchEvent) => {
    if (!lookTouchRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchRef.current.id) {
        lookTouchRef.current = null;
        if (onLook) {
          onLook(0, 0); // Stop looking when finger lifted
        }
        break;
      }
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none touch-none">
      {/* Look Area (Full Screen) */}
      <div
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
        className="absolute inset-0 z-0 pointer-events-auto touch-none"
      />

      {/* Left movement joystick */}
      <div
        className="absolute left-6 bottom-8 pointer-events-auto flex flex-col items-center justify-center z-10"
      >
        <div
          ref={stickRef}
          onTouchStart={handleStickStart}
          onTouchMove={handleStickMove}
          onTouchEnd={handleStickEnd}
          className="relative w-28 h-28 rounded-full border-2 bg-black/40 backdrop-blur-md flex items-center justify-center transition-shadow shadow-lg touch-none"
          style={{
            borderColor: active ? themeAccent : 'rgba(255,255,255,0.2)',
            boxShadow: active ? `0 0 20px ${themeAccent}66` : 'none'
          }}
        >
          <div
            className="w-12 h-12 rounded-full pointer-events-none shadow-md"
            style={{
              backgroundColor: active ? themeAccent : 'rgba(255,255,255,0.6)',
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              transition: active ? 'none' : 'transform 0.15s ease-out'
            }}
          />
        </div>
        <span className="text-[10px] font-mono tracking-widest text-gray-400 mt-2 pointer-events-none">MOVE / STEER</span>
      </div>

      {/* Right Action Buttons */}
      <div
        className="absolute right-6 bottom-10 pointer-events-auto flex flex-col items-end gap-3 z-10"
      >
        {onAction && (
          <button
            onTouchStart={(e) => { e.stopPropagation(); onAction('boost'); }}
            onTouchEnd={(e) => { e.stopPropagation(); onAction('boost_end'); }}
            onTouchCancel={(e) => { e.stopPropagation(); onAction('boost_end'); }}
            className="w-24 h-24 rounded-full text-white font-bold tracking-widest border backdrop-blur-md active:scale-95 flex items-center justify-center shadow-lg pointer-events-auto touch-none select-none"
            style={{
              backgroundColor: `${themeAccent}99`,
              borderColor: themeAccent,
              boxShadow: `0 0 20px ${themeAccent}aa`
            }}
          >
            BOOST
          </button>
        )}
      </div>
    </div>
  );
}
