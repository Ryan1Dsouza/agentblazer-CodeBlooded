import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export default function CursorFollower() {
  const { theme } = useTheme();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Refs for direct DOM manipulation to avoid React re-renders
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const mouse = useRef({ x: -100, y: -100 });
  const trailHistory = useRef(Array(12).fill({ x: -100, y: -100 }));

  if (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024) {
    return null;
  }

  useEffect(() => {
    const mobileCheck = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024;
    setIsMobile(mobileCheck);
    
    let animationFrameId: number;

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      
      const gamma = Math.max(-45, Math.min(45, e.gamma));
      const beta = Math.max(0, Math.min(90, e.beta));
      
      const targetX = screenW / 2 + (gamma / 45) * (screenW / 1.5);
      const targetY = screenH / 2 + ((beta - 45) / 45) * (screenH / 1.5);
      
      mouse.current = {
        x: mouse.current.x === -100 ? targetX : mouse.current.x + (targetX - mouse.current.x) * 0.1,
        y: mouse.current.y === -100 ? targetY : mouse.current.y + (targetY - mouse.current.y) * 0.1
      };
    };

    const renderLoop = () => {
      const { x, y } = mouse.current;
      
      // Update main cursor
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${x - 10}px, ${y - 10}px)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${x - 3}px, ${y - 3}px)`;
      }

      // Update trail
      trailHistory.current.push({ x, y });
      trailHistory.current.shift();

      trailRefs.current.forEach((ref, index) => {
        if (ref) {
          const pos = trailHistory.current[index];
          ref.style.transform = `translate(${pos.x - 4}px, ${pos.y - 4}px)`;
        }
      });

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    if (mobileCheck) {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        // Handle iOS
      }
      window.addEventListener('deviceorientation', onDeviceOrientation);
      mouse.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    } else {
      window.addEventListener('mousemove', onMove);
    }

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('deviceorientation', onDeviceOrientation);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const color = theme === 'violet' ? '#d946ef' : theme === 'inferno' ? '#ff6b35' : '#07b6d6';

  // Do not show the cursor follower on mobile if we are on the events page (interferes with 3D canvas)
  if (isMobile && location.pathname === '/events') {
    return null;
  }

  return (
    <>
      <style>{`
        @media (pointer: fine) { 
          body:not(:has(dialog[open])) * { cursor: none !important; } 
          body:has(dialog[open]) .custom-cursor-container { display: none !important; }
        }
      `}</style>
      <div className="custom-cursor-container" aria-hidden="true" style={{ pointerEvents: 'none', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 999999 }}>
        {/* Trail dots */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            ref={(el) => (trailRefs.current[i] = el)}
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
              opacity: (1 - ((11 - i) / 13) * 0.9) * 0.7,
              zIndex: 999999,
              willChange: 'transform'
            }}
          />
        ))}
        
        {/* Main glowing core */}
        <div
          ref={cursorRef}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            boxShadow: `0 0 15px ${color}, 0 0 30px ${color}88`,
            opacity: 0.9,
            zIndex: 999999,
            pointerEvents: 'none',
            willChange: 'transform'
          }}
        />
        
        {/* Small inner bright dot */}
        <div
          ref={dotRef}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: `0 0 8px ${color}, 0 0 16px ${color}`,
            zIndex: 999999,
            pointerEvents: 'none',
            willChange: 'transform'
          }}
        />
      </div>
    </>
  );
}
