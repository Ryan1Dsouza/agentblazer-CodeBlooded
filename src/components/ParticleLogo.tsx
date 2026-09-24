import { useEffect, useRef, useCallback, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAnimationActivity } from '../hooks/useAnimationActivity';

interface ParticleLogoProps {
  logoPath: string;
  alt?: string;
  className?: string;
  theme?: string;
}

interface Particle {
  // Position where this particle belongs (the logo pixel)
  homeX: number;
  homeY: number;
  // Current animated position
  x: number;
  y: number;
  // Velocity for physics-based movement
  vx: number;
  vy: number;
  // Pixel color
  r: number;
  g: number;
  b: number;
  alpha: number;
  // Visual properties
  size: number;
  // Unique per-particle randomness for organic feel
  phase: number;
  friction: number;
  // Assembly animation: random spawn origin
  spawnX: number;
  spawnY: number;
}

export default function ParticleLogo({ logoPath, alt = 'AgentBlazer Logo', theme = 'violet' }: ParticleLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const assemblyProgressRef = useRef(0); // 0 = scattered spawn, 1 = fully assembled
  const isAssembledRef = useRef(false);
  const displaySizeRef = useRef({ w: 0, h: 0 });

  const [isHovered, setIsHovered] = useState(false);
  const [isAssembled, setIsAssembled] = useState(false);

  const reducedMotion = useReducedMotion();
  const isActive = useAnimationActivity(containerRef, !reducedMotion);
  const isActiveRef = useRef(isActive);

  // Sync ref with hook so the requestAnimationFrame loop can access it
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    // Assembly state is now managed perfectly by the render loop below
  }, []);

  const buildParticles = useCallback((img: HTMLImageElement, displayWidth: number, displayHeight: number) => {
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return [];

    offCanvas.width = displayWidth;
    offCanvas.height = displayHeight;

    // Fit image maintaining aspect ratio
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = displayWidth / displayHeight;
    let drawWidth = displayWidth;
    let drawHeight = displayHeight;

    if (canvasAspect > imgAspect) {
      drawHeight = displayHeight;
      drawWidth = displayHeight * imgAspect;
    } else {
      drawWidth = displayWidth;
      drawHeight = displayWidth / imgAspect;
    }

    // Scale down slightly to keep within bounds
    drawWidth *= 0.88;
    drawHeight *= 0.88;

    const drawX = (displayWidth - drawWidth) / 2;
    const drawY = (displayHeight - drawHeight) / 2;

    offCtx.clearRect(0, 0, displayWidth, displayHeight);
    offCtx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    const imageData = offCtx.getImageData(0, 0, displayWidth, displayHeight);
    const data = imageData.data;
    const particles: Particle[] = [];

    // Optimized sampling for performance (balance between powder density and framerate)
    const step = window.innerWidth < 768 ? 4.0 : 2.4; 
    const centerX = displayWidth / 2;
    const centerY = displayHeight / 2;

    for (let y = 0; y < displayHeight; y += step) {
      for (let x = 0; x < displayWidth; x += step) {
        const sampleX = Math.floor(x);
        const sampleY = Math.floor(y);
        const index = (sampleY * displayWidth + sampleX) * 4;
        const alpha = data[index + 3];

        if (alpha > 40) {
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const brightness = (r + g + b) / 3;

          // Skip fully transparent / near-black background pixels
          if (brightness > 15 || alpha < 200) {
            // Random spawn position in a circular cloud around center
            const angle = Math.random() * Math.PI * 2;
            const dist = 80 + Math.random() * (displayWidth * 0.6);
            const spawnX = centerX + Math.cos(angle) * dist;
            const spawnY = centerY + Math.sin(angle) * dist;

            particles.push({
              homeX: x,
              homeY: y,
              x: spawnX,
              y: spawnY,
              vx: 0,
              vy: 0,
              r,
              g,
              b,
              alpha: alpha / 255,
              size: Math.random() * 0.8 + 1.2, // Slightly larger to compensate for fewer particles
              phase: Math.random() * Math.PI * 2,
              friction: 0.88 + Math.random() * 0.07,
              spawnX,
              spawnY
            });
          }
        }
      }
    }
    return particles;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;
    assemblyProgressRef.current = 0;
    isAssembledRef.current = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = logoPath;

    img.onload = () => {
      if (!isMounted) return;

      const rect = container.getBoundingClientRect();
      const displayWidth = Math.max(150, Math.round(rect.width || 350));
      const displayHeight = Math.max(150, Math.round(rect.height || 350));
      displaySizeRef.current = { w: displayWidth, h: displayHeight };

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);

      particlesRef.current = buildParticles(img, displayWidth, displayHeight);

      let lastTime = performance.now();

      const render = (now: number) => {
        if (!isMounted) return;

        // Pause animation completely if the global loading screen is active or component is not active
        if ((window as any).isAppLoading || !isActiveRef.current) {
          lastTime = now; // Prevent large dt spikes
          animFrameRef.current = requestAnimationFrame(render);
          return;
        }

        const dt = Math.min((now - lastTime) / 1000, 0.05); // seconds, capped
        lastTime = now;

        const particles = particlesRef.current;
        const mouse = mouseRef.current;
        const W = displayWidth;
        const H = displayHeight;

        // Phase 1: Initial assembly (first ~1.8 seconds)
        if (!isAssembledRef.current) {
          assemblyProgressRef.current += dt * 0.65; // takes ~1.5s
          if (assemblyProgressRef.current >= 1.0) {
            assemblyProgressRef.current = 1.0;
            isAssembledRef.current = true;
            setIsAssembled(true); // Trigger the static image fade-in only when truly assembled
          }
        }

        ctx.clearRect(0, 0, W, H);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          if (!isAssembledRef.current) {
            // Initial assembly: lerp from spawn to home
            const progress = Math.max(0, Math.min(1, (assemblyProgressRef.current - (p.phase / (Math.PI * 8))) / 0.85));
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            p.x = p.spawnX + (p.homeX - p.spawnX) * eased;
            p.y = p.spawnY + (p.homeY - p.spawnY) * eased;
          } else {
            // Physics-based interaction
            if (mouse.active) {
              // Calculate vector from mouse to particle
              const dx = p.x - mouse.x;
              const dy = p.y - mouse.y;
              const distSq = dx * dx + dy * dy;
              const dist = Math.sqrt(distSq);

              // Explosion radius — particles within this range get pushed
              const explosionRadius = 120;
              const maxForce = 2800;

              if (dist < explosionRadius && dist > 0.1) {
                // Inverse-square repulsion force
                const force = maxForce / (distSq + 200);
                const nx = dx / dist;
                const ny = dy / dist;

                // Add turbulence for organic scattering
                const turbulence = 0.35;
                const tx = (Math.random() - 0.5) * turbulence;
                const ty = (Math.random() - 0.5) * turbulence;

                p.vx += (nx + tx) * force * dt;
                p.vy += (ny + ty) * force * dt;
              }

              // Gentle spring back toward home (weaker when mouse is active)
              const homeForce = 1.8;
              p.vx += (p.homeX - p.x) * homeForce * dt;
              p.vy += (p.homeY - p.y) * homeForce * dt;
            } else {
              // No mouse: strong spring back to home position
              const homeForce = 8.0;
              p.vx += (p.homeX - p.x) * homeForce * dt;
              p.vy += (p.homeY - p.y) * homeForce * dt;
            }

            // Apply velocity with friction
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;

            // Subtle ambient shimmer when near home
            const homeDist = Math.abs(p.x - p.homeX) + Math.abs(p.y - p.homeY);
            if (homeDist < 2 && !mouse.active) {
              const shimmer = Math.sin(now * 0.003 + p.phase) * 0.25;
              p.x = p.homeX + Math.cos(p.phase) * shimmer;
              p.y = p.homeY + Math.sin(p.phase) * shimmer;
            }
          }

          // Determine alpha based on distance from home (fade out when very far)
          const dxHome = p.x - p.homeX;
          const dyHome = p.y - p.homeY;
          const homeDistSq = dxHome * dxHome + dyHome * dyHome;
          const fadeStart = 100 * 100;
          const fadeEnd = 250 * 250;
          let drawAlpha = p.alpha;
          if (homeDistSq > fadeStart) {
            const fadeFactor = 1 - Math.min(1, (homeDistSq - fadeStart) / (fadeEnd - fadeStart));
            drawAlpha *= fadeFactor;
          }

          if (drawAlpha < 0.01) continue; // Skip invisible particles

          // Draw the particle using fillRect (massively faster than arc for thousands of particles)
          ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${drawAlpha})`;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }

        animFrameRef.current = requestAnimationFrame(render);
      };

      animFrameRef.current = requestAnimationFrame(render);
    };

    // Mouse event handlers
    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      setIsHovered(false);
    };

    // Touch event handlers for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        mouseRef.current.x = e.touches[0].clientX - rect.left;
        mouseRef.current.y = e.touches[0].clientY - rect.top;
        mouseRef.current.active = true;
        setIsHovered(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        mouseRef.current.x = e.touches[0].clientX - rect.left;
        mouseRef.current.y = e.touches[0].clientY - rect.top;
      }
    };

    const handleTouchEnd = () => {
      mouseRef.current.active = false;
      setIsHovered(false);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [logoPath, buildParticles]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        filter: theme === 'inferno' ? 'hue-rotate(140deg) saturate(1.4)' : theme === 'frost' ? 'hue-rotate(-70deg) saturate(1.2)' : 'none',
        transition: 'filter 0.5s ease-in-out'
      }}
    >
      {/* High-quality static PNG overlaid on top, fades out on hover to reveal the particles */}
      <img
        src={logoPath}
        alt={alt}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          mixBlendMode: 'screen', // Removes the black background of themed logos
          pointerEvents: 'none',
          zIndex: 20,
          opacity: (isAssembled && !isHovered) ? 1 : 0,
          transition: isHovered ? 'opacity 0s' : 'opacity 0.8s ease-in-out',
          transform: 'scale(0.88)'
        }}
      />
      
      {/* Particle canvas layer */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10
        }}
      />
    </div>
  );
}
