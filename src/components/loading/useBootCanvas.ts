import { useEffect } from 'react';
import type { RefObject, MutableRefObject } from 'react';
import type { Theme } from '../../types';

interface BootCanvasOptions {
  rootRef: RefObject<HTMLDivElement>;
  deckRef: RefObject<HTMLDivElement>;
  gyroRef: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  progressRef: MutableRefObject<number>;
  theme: Theme;
  colors: { primary: string; secondary: string; particle: string };
  quiet: boolean;
}
interface Particle { x: number; y: number; size: number; speed: number; phase: number; }

// One bounded 30fps loop handles both canvases and transform-only parallax.
// No per-frame React renders, WebGL contexts or pairwise particle connections.
export function useBootCanvas({ rootRef, deckRef, gyroRef, canvasRef, progressRef, theme, colors, quiet }: BootCanvasOptions) {
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!root || !canvas || !ctx) return;
    let width = 1, height = 1;
    let particles: Particle[] = [];
    let frame = 0, lastFrame = 0, elapsed = 0, angle = 0;
    let pointerX = 0, pointerY = 0, tiltX = 0, tiltY = 0;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    const draw = (delta: number) => {
      elapsed += delta;
      ctx.clearRect(0, 0, width, height);
      for (const particle of particles) {
        const drift = Math.sin(elapsed * 0.7 + particle.phase);
        if (theme === 'inferno') { particle.x += (drift * 19 + pointerX * 16) * delta; particle.y -= particle.speed * delta; }
        else if (theme === 'frost') { particle.x += (26 + drift * 15 + pointerX * 22) * delta; particle.y += particle.speed * delta; }
        else { particle.x += (drift * 5 + pointerX * 4) * delta; particle.y -= particle.speed * delta * 0.15; }
        if (particle.x < -8) particle.x = width + 8;
        if (particle.x > width + 8) particle.x = -8;
        if (particle.y < -8) particle.y = height + 8;
        if (particle.y > height + 8) particle.y = -8;
        ctx.globalAlpha = theme === 'frost' ? 0.45 + particle.size * 0.14 : 0.2 + (Math.sin(elapsed + particle.phase) + 1) * 0.22;
        ctx.fillStyle = theme === 'inferno' && particle.size > 1.8 ? colors.secondary : colors.particle;
        ctx.beginPath();
        if (theme === 'inferno') ctx.ellipse(particle.x, particle.y, particle.size * 0.6, particle.size * 2.3, drift * 0.5, 0, Math.PI * 2);
        else ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        if (theme === 'frost' && particle.size > 2.2) {
          ctx.strokeStyle = colors.particle; ctx.lineWidth = 0.8; ctx.beginPath();
          ctx.moveTo(particle.x - 4, particle.y); ctx.lineTo(particle.x + 4, particle.y);
          ctx.moveTo(particle.x, particle.y - 4); ctx.lineTo(particle.x, particle.y + 4); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      angle += delta * (12 + progressRef.current * 0.52);
      gyroRef.current?.style.setProperty('--gyro-angle', `${angle.toFixed(2)}deg`);
      const ease = quiet ? 1 : 1 - Math.exp(-delta * 7);
      tiltX += ((quiet ? 0 : -pointerY * 1.6) - tiltX) * ease;
      tiltY += ((quiet ? 0 : pointerX * 2) - tiltY) * ease;
      deckRef.current?.style.setProperty('--tilt-x', `${tiltX.toFixed(3)}deg`);
      deckRef.current?.style.setProperty('--tilt-y', `${tiltY.toFixed(3)}deg`);
    };
    const resize = () => {
      width = root.clientWidth; height = root.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = quiet ? 22 : Math.min(theme === 'frost' ? 90 : 66, Math.round(width / 19));
      particles = Array.from({ length: count }, () => ({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * (theme === 'frost' ? 2.4 : 1.8) + 0.5, speed: 12 + Math.random() * 34, phase: Math.random() * Math.PI * 2 }));
      draw(0);
    };
    const animate = (timestamp: number) => {
      if (timestamp - lastFrame >= 1000 / 30) { const delta = lastFrame ? Math.min((timestamp - lastFrame) / 1000, 0.07) : 1 / 30; lastFrame = timestamp; draw(delta); }
      frame = window.requestAnimationFrame(animate);
    };
    const move = (event: PointerEvent) => {
      if (!finePointer.matches || quiet) return;
      pointerX = Math.max(-1, Math.min(1, event.clientX / width * 2 - 1));
      pointerY = Math.max(-1, Math.min(1, event.clientY / height * 2 - 1));
    };
    const resetPointer = () => { pointerX = 0; pointerY = 0; };
    const visibility = () => {
      window.cancelAnimationFrame(frame);
      root.style.setProperty('--boot-play-state', document.hidden ? 'paused' : 'running');
      if (!document.hidden && !quiet) { lastFrame = 0; frame = window.requestAnimationFrame(animate); }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    root.addEventListener('pointermove', move, { passive: true }); root.addEventListener('pointerleave', resetPointer);
    window.addEventListener('blur', resetPointer); document.addEventListener('visibilitychange', visibility);
    resize(); visibility();
    return () => {
      window.cancelAnimationFrame(frame); observer.disconnect();
      root.removeEventListener('pointermove', move); root.removeEventListener('pointerleave', resetPointer);
      window.removeEventListener('blur', resetPointer); document.removeEventListener('visibilitychange', visibility);
    };
  }, [rootRef, deckRef, gyroRef, canvasRef, progressRef, theme, colors, quiet]);
}
