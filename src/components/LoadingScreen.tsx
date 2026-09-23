import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

interface LoadingScreenProps {
  onComplete: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  color: string;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [progress, setProgress] = useState(0);
  const [statusStage, setStatusStage] = useState('ESTABLISHING CORE...');
  const [telemetry, setTelemetry] = useState({
    core: 'ONLINE',
    engine3D: 'INITIALIZING',
    assetsLoaded: 1,
    assetsTotal: 12,
    network: 'CONNECTED'
  });
  const [isSystemReady, setIsSystemReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Mouse & Parallax tracking
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2, normX: 0, normY: 0 });
  const exitProgressRef = useRef(0);

  // Dynamically select the logo based on the active theme
  const clubLogoPath =
    theme === 'inferno'
      ? '/logos/AgentBlazer_Inferno.png'
      : theme === 'frost'
      ? '/logos/AgentBlazer_Frost.png'
      : '/AgentBlazer_Logo_Ready (1).png'; // Use high-quality transparent one for default/violet

  const themeColors = {
    violet: {
      primary: '#8b5cf6',
      secondary: '#00d4ff',
      accent: '#c084fc',
      glow: 'rgba(139, 92, 246, 0.65)',
      badge: 'VIOLET CORE'
    },
    inferno: {
      primary: '#ff6b35',
      secondary: '#fbbf24',
      accent: '#f97316',
      glow: 'rgba(255, 107, 53, 0.65)',
      badge: 'MAGMA CORE'
    },
    frost: {
      primary: '#0ea5e9',
      secondary: '#38bdf8',
      accent: '#e0f2fe',
      glow: 'rgba(14, 165, 233, 0.65)',
      badge: 'CRYO CORE'
    }
  }[theme] || {
    primary: '#8b5cf6',
    secondary: '#00d4ff',
    accent: '#c084fc',
    glow: 'rgba(139, 92, 246, 0.65)',
    badge: 'VIOLET CORE'
  };

  // Real critical asset loading synchronization
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const criticalAssetUrls = [
      clubLogoPath,
      '/AgentBlazer_Logo_Transparent.png',
      '/AgentBlazer_Logo.png',
      '/logos/AgentBlazer_Violet.png',
      '/logos/AgentBlazer_Inferno.png',
      '/logos/AgentBlazer_Frost.png'
    ];

    let loadedCount = 1;
    const totalAssets = criticalAssetUrls.length + 6;

    const markLoaded = (stageName: string, telemetryPatch: Partial<typeof telemetry>) => {
      loadedCount++;
      const currentPct = Math.min(100, Math.round((loadedCount / totalAssets) * 100));
      setProgress((prev) => Math.max(prev, currentPct));
      setStatusStage(stageName);
      setTelemetry((prev) => ({
        ...prev,
        ...telemetryPatch,
        assetsLoaded: loadedCount,
        assetsTotal: totalAssets
      }));
    };

    // Stage 1: Core & Fonts
    const t1 = setTimeout(() => {
      if (document.fonts) {
        document.fonts.ready
          .then(() => {
            markLoaded('LOADING 3D ENVIRONMENT...', { core: 'ONLINE', network: 'CONNECTED' });
          })
          .catch(() => {
            markLoaded('LOADING 3D ENVIRONMENT...', { core: 'ONLINE', network: 'CONNECTED' });
          });
      } else {
        markLoaded('LOADING 3D ENVIRONMENT...', { core: 'ONLINE', network: 'CONNECTED' });
      }
    }, 250);

    // Stage 2: Preload critical image assets
    criticalAssetUrls.forEach((url, idx) => {
      const img = new Image();
      img.src = url;
      const onDone = () => {
        const stageDescriptions = [
          'LOADING VISUAL ASSETS...',
          'INITIALIZING PARTICLE SYSTEM...',
          'LOADING EVENT MODULES...',
          'CALIBRATING INTERFACE...',
          'FINALIZING SYSTEM...'
        ];
        const desc = stageDescriptions[idx % stageDescriptions.length];
        markLoaded(desc, {
          engine3D: idx >= 2 ? 'READY' : 'INITIALIZING',
          network: 'CONNECTED'
        });
      };
      img.onload = onDone;
      img.onerror = onDone;
    });

    // Stage 3: Complete Sequence
    const completionTimer = setTimeout(() => {
      setProgress(100);
      setStatusStage('SYSTEM READY');
      setTelemetry((prev) => ({
        ...prev,
        core: 'ONLINE',
        engine3D: 'READY',
        network: 'CONNECTED',
        assetsLoaded: totalAssets,
        assetsTotal: totalAssets
      }));
      setIsSystemReady(true);

      // Trigger Final Cinematic Transition
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          document.body.style.overflow = '';
          onComplete();
        }, 750);
      }, 500);
    }, 2200);

    // Safety timeout
    const safetyTimer = setTimeout(() => {
      setProgress(100);
      setIsExiting(true);
      setTimeout(() => {
        document.body.style.overflow = '';
        onComplete();
      }, 300);
    }, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(completionTimer);
      clearTimeout(safetyTimer);
      document.body.style.overflow = '';
    };
  }, [clubLogoPath, onComplete]);

  // High performance Canvas particle & scanwave system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.normX = (e.clientX - width / 2) / (width / 2);
      mouseRef.current.normY = (e.clientY - height / 2) / (height / 2);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Generate subtle background particle field
    const particleCount = 75;
    const particles: Particle[] = [];
    const colors = [themeColors.primary, themeColors.secondary, themeColors.accent, '#ffffff'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.5 + 0.2,
        baseAlpha: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Inward/outward core sparks
    const coreSparks: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string }[] = [];

    let scanRadius = 0;
    let scanAlpha = 0.4;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2 + mouseRef.current.normX * 16;
      const centerY = height / 2 - 50 + mouseRef.current.normY * 16;

      if (isExiting) {
        exitProgressRef.current = Math.min(1, exitProgressRef.current + 0.04);
      }

      // 1. Radial Scan Wave expanding outward
      scanRadius += 1.6;
      scanAlpha = Math.max(0, 0.4 * (1 - scanRadius / 450));
      if (scanRadius > 450) {
        scanRadius = 60;
        scanAlpha = 0.4;
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, scanRadius, 0, Math.PI * 2);
      ctx.strokeStyle = themeColors.secondary;
      ctx.lineWidth = 1;
      ctx.globalAlpha = scanAlpha * (1 - exitProgressRef.current);
      ctx.stroke();

      // 2. Subtle background particles
      ctx.globalAlpha = 1;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          const force = (110 - dist) / 110;
          p.x += (dx / dist) * force * 1.5;
          p.y += (dy / dist) * force * 1.5;
          p.alpha = Math.min(1, p.baseAlpha + 0.4);
        } else {
          p.alpha = p.baseAlpha;
        }

        if (exitProgressRef.current > 0) {
          const cdx = p.x - centerX;
          const cdy = p.y - centerY;
          const cDist = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
          p.x += (cdx / cDist) * exitProgressRef.current * 16;
          p.y += (cdy / cDist) * exitProgressRef.current * 16;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (1 - exitProgressRef.current * 0.8);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Orbiting & Inflow core energy sparks
      if (Math.random() < 0.35 && exitProgressRef.current === 0) {
        const angle = Math.random() * Math.PI * 2;
        const spawnDist = 160 + Math.random() * 40;
        const targetSpeed = 1.2 + Math.random() * 1.2;
        coreSparks.push({
          x: centerX + Math.cos(angle) * spawnDist,
          y: centerY + Math.sin(angle) * spawnDist,
          vx: -Math.cos(angle) * targetSpeed,
          vy: -Math.sin(angle) * targetSpeed,
          life: 0,
          maxLife: 65,
          color: Math.random() > 0.5 ? themeColors.primary : themeColors.secondary
        });
      }

      for (let s = coreSparks.length - 1; s >= 0; s--) {
        const sp = coreSparks[s];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life++;

        const sparkAlpha = Math.sin((sp.life / sp.maxLife) * Math.PI);
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = sparkAlpha * 0.75;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 1.4, 0, Math.PI * 2);
        ctx.fill();

        if (sp.life >= sp.maxLife) {
          coreSparks.splice(s, 1);
        }
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [themeColors, isExiting]);

  return (
    <div
      id="preloader"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        backgroundColor: '#05050a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        overflow: 'hidden',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.04)' : 'scale(1)',
        pointerEvents: isExiting ? 'none' : 'auto',
        transition: 'opacity 0.75s ease, transform 0.75s ease'
      }}
    >
      {/* Background Interactive HTML5 Canvas Layer for Particles & Scanwave */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />

      {/* Cyber Grid Masked Layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '3.5rem 3.5rem',
          pointerEvents: 'none',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)'
        }}
      />

      {/* Ambient Core Glow */}
      <div
        style={{
          position: 'absolute',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${themeColors.primary} 0%, ${themeColors.secondary} 30%, transparent 70%)`,
          opacity: isSystemReady ? 0.45 : 0.22,
          filter: 'blur(120px)',
          pointerEvents: 'none',
          transform: `translate(${mouseRef.current.normX * 25}px, ${mouseRef.current.normY * 25}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      />

      {/* ========================================================================= */}
      {/* CENTRAL COMPOSITION: AGENTBLAZER CLUB LOGO & HOLOGRAPHIC CORE */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.75rem',
          transform: `translate(${mouseRef.current.normX * 10}px, ${mouseRef.current.normY * 10}px) ${
            isExiting ? 'scale(1.25)' : 'scale(1)'
          }`,
          transition: 'transform 0.2s ease-out'
        }}
      >
        {/* Ring 1: Outer Hexagonal / Dashed Holographic Ring (280px) */}
        <div
          style={{
            position: 'absolute',
            borderRadius: '50%',
            border: `1px dashed ${themeColors.primary}55`,
            pointerEvents: 'none',
            width: isExiting ? '420px' : '280px',
            height: isExiting ? '420px' : '280px',
            animation: 'spin 18s linear infinite',
            transform: `rotateX(${mouseRef.current.normY * 16}deg) rotateY(${mouseRef.current.normX * 16}deg)`,
            transition: 'width 0.7s ease, height 0.7s ease'
          }}
        />

        {/* Ring 2: Medium Counter-Rotating Precision Orbit Ring (230px) with 4 Calibration Nodes */}
        <div
          style={{
            position: 'absolute',
            borderRadius: '50%',
            border: `1px solid ${themeColors.secondary}44`,
            pointerEvents: 'none',
            width: isExiting ? '350px' : '230px',
            height: isExiting ? '350px' : '230px',
            animation: 'spin 12s linear infinite reverse',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `rotateX(${-mouseRef.current.normY * 14}deg) rotateY(${-mouseRef.current.normX * 14}deg)`,
            transition: 'width 0.7s ease, height 0.7s ease'
          }}
        >
          {[0, 90, 180, 270].map((deg) => (
            <span
              key={deg}
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: themeColors.secondary,
                boxShadow: `0 0 8px ${themeColors.secondary}`,
                transform: `rotate(${deg}deg) translate(115px) rotate(-${deg}deg)`
              }}
            />
          ))}
        </div>

        {/* Ring 3: Tight Inner Holographic Energy Ring (180px) */}
        <div
          style={{
            position: 'absolute',
            borderRadius: '50%',
            border: `1px solid ${themeColors.accent}77`,
            pointerEvents: 'none',
            width: isExiting ? '280px' : '180px',
            height: isExiting ? '280px' : '180px',
            boxShadow: isSystemReady ? `0 0 30px ${themeColors.glow}` : 'none',
            animation: 'pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            transition: 'width 0.5s ease, height 0.5s ease'
          }}
        />

        {/* ACTUAL AGENTBLAZER CLUB LOGO CORE (PROMINENT, SHARP & BREATHING) */}
        <div
          style={{
            position: 'relative',
            width: '150px',
            height: '150px',
            borderRadius: '24px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${isSystemReady ? themeColors.secondary : `${themeColors.primary}88`}`,
            backgroundColor: 'rgba(8, 8, 18, 0.85)',
            boxShadow: `0 0 45px ${themeColors.glow}, inset 0 0 20px ${themeColors.primary}25`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.85rem',
            zIndex: 10,
            transition: 'all 0.3s ease'
          }}
        >
          <img
            src={clubLogoPath}
            alt="AgentBlazer Club Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              mixBlendMode: 'screen', // This instantly removes the black background from the themed logos!
              filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.35))',
              animation: 'pulse 3s ease-in-out infinite'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/assets/AgentBlazer_Logo_Transparent.png';
            }}
          />

          {/* Active Core Status Node */}
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: themeColors.secondary,
              boxShadow: `0 0 10px ${themeColors.secondary}`,
              border: '2px solid #05050a'
            }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LOADING STATUS, PROGRESS BAR & TELEMETRY HUD */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.85rem',
          zIndex: 10,
          maxWidth: '380px',
          width: '90%',
          padding: '0 1rem'
        }}
      >
        {/* Status Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', textAlign: 'center' }}>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              letterSpacing: '0.15em',
              color: '#cbd5e1',
              textTransform: 'uppercase'
            }}
          >
            INITIALIZING AGENTBLAZER...
          </span>

          <span
            style={{
              fontSize: '12px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              letterSpacing: '0.08em',
              color: isSystemReady ? '#38bdf8' : themeColors.secondary,
              transition: 'color 0.2s ease'
            }}
          >
            {statusStage}
          </span>
        </div>

        {/* Progress Bar & Percentage */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '6px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
              padding: '1px',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: '9999px',
                position: 'relative',
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${themeColors.primary}, ${themeColors.secondary})`,
                boxShadow: `0 0 14px ${themeColors.primary}`,
                transition: 'width 0.15s ease-out'
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '8px',
                  borderRadius: '9999px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 0 8px #ffffff'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>
            <span style={{ letterSpacing: '0.1em', fontWeight: 600, color: '#e2e8f0' }}>AGENTBLAZER CORE</span>
            <span style={{ fontWeight: 'bold', color: themeColors.secondary }}>{progress}%</span>
          </div>
        </div>

        {/* Futuristic Secondary Telemetry Grid */}
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.5rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#94a3b8'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span>SYSTEM STATUS</span>
            <span style={{ fontWeight: 'bold', color: '#4ade80' }}>{telemetry.core}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span>3D ENGINE</span>
            <span style={{ fontWeight: 'bold', color: themeColors.secondary }}>{telemetry.engine3D}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span>ASSETS</span>
            <span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{telemetry.assetsLoaded} / {telemetry.assetsTotal}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span>NETWORK</span>
            <span style={{ fontWeight: 'bold', color: '#22d3ee' }}>{telemetry.network}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
