import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';

export default function CursorFollower() {
  const { theme } = useTheme();
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState<{ x: number; y: number; opacity: number }[]>([]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setTrail(prev => {
        const next = [...prev.slice(-12), { x: e.clientX, y: e.clientY, opacity: 1 }];
        return next.map((t, i) => ({ ...t, opacity: 1 - (i / 13) * 0.9 }));
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const color = theme === 'violet' ? '#d946ef' : theme === 'inferno' ? '#ff6b35' : '#07b6d6';

  return (
    <>
      <style>{`@media (pointer: fine) { * { cursor: none !important; } }`}</style>
      <div aria-hidden="true" style={{ pointerEvents: 'none', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
      {/* Trail dots */}
      {trail.map((t, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            left: t.x - 4,
            top: t.y - 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
            opacity: t.opacity * 0.7,
            transition: 'opacity 0.15s ease',
            zIndex: 9999,
          }}
        />
      ))}
      {/* Main glowing core */}
      <div
        style={{
          position: 'fixed',
          left: pos.x - 10,
          top: pos.y - 10,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          boxShadow: `0 0 15px ${color}, 0 0 30px ${color}88`,
          opacity: 0.9,
          zIndex: 9999,
          pointerEvents: 'none',
          transition: 'left 0.05s linear, top 0.05s linear',
        }}
      />
      {/* Small inner bright dot */}
      <div
        style={{
          position: 'fixed',
          left: pos.x - 3,
          top: pos.y - 3,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: `0 0 8px ${color}, 0 0 16px ${color}`,
          zIndex: 9999,
          pointerEvents: 'none',
          transition: 'left 0.05s linear, top 0.05s linear',
        }}
      />
    </div>
    </>
  );
}
