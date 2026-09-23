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
      {/* Left movement joystick */}
      <div
        className="absolute left-6 bottom-8 pointer-events-auto flex flex-col items-center justify-center"
      >
        <div
          ref={stickRef}
          onTouchStart={handleStickStart}
          onTouchMove={handleStickMove}
          onTouchEnd={handleStickEnd}
          className="relative w-28 h-28 rounded-full border-2 bg-black/40 backdrop-blur-md flex items-center justify-center transition-shadow shadow-lg"
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
        <span className="text-[10px] font-mono tracking-widest text-gray-400 mt-2">MOVE / STEER</span>
      </div>

      {/* Right Look Area & Action Buttons */}
      <div
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        className="absolute right-6 bottom-8 pointer-events-auto flex flex-col items-end gap-3"
      >
        <div className="flex gap-2">
          {onAction && (
            <>
              <button
                onTouchStart={() => onAction('up')}
                className="w-12 h-12 rounded-full border border-white/20 bg-black/50 text-white font-bold backdrop-blur-md active:scale-95 flex items-center justify-center shadow-lg"
              >
                ▲
              </button>
              <button
                onTouchStart={() => onAction('down')}
                className="w-12 h-12 rounded-full border border-white/20 bg-black/50 text-white font-bold backdrop-blur-md active:scale-95 flex items-center justify-center shadow-lg"
              >
                ▼
              </button>
            </>
          )}
          {onAction && (
            <button
              onTouchStart={() => onAction('interact')}
              className="px-4 h-12 rounded-full text-white font-bold text-xs tracking-wider border backdrop-blur-md active:scale-95 flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: `${themeAccent}cc`,
                borderColor: themeAccent,
                boxShadow: `0 0 15px ${themeAccent}88`
              }}
            >
              {actionLabel}
            </button>
          )}
        </div>
        <div className="w-32 h-20 rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <span className="text-[10px] font-mono tracking-widest text-gray-400">TOUCH TO LOOK</span>
        </div>
      </div>
    </div>
  );
}
