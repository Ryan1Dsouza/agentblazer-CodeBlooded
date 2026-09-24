import { useState, useEffect, useRef, useCallback } from 'react';
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
  twinkleSpeed: number;
  twinkleOffset: number;
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
  const [showEnterPrompt, setShowEnterPrompt] = useState(false);

  // Mouse & Parallax tracking
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2, normX: 0, normY: 0 });
  const exitProgressRef = useRef(0);
  const timeRef = useRef(0);

  // Dynamically select the logo based on the active theme
  const clubLogoPath = '/AgentBlazer_Logo.png';

  const themeColors = {
    violet: {
      primary: '#8b5cf6',
      secondary: '#00d4ff',
      accent: '#c084fc',
      glow: 'rgba(139, 92, 246, 0.65)',
      badge: 'VIOLET CORE',
      gradient: ['#8b5cf6', '#6d28d9', '#4c1d95']
    },
    inferno: {
      primary: '#ff6b35',
      secondary: '#fbbf24',
      accent: '#f97316',
      glow: 'rgba(255, 107, 53, 0.65)',
      badge: 'MAGMA CORE',
      gradient: ['#ff6b35', '#dc2626', '#991b1b']
    },
    frost: {
      primary: '#0ea5e9',
      secondary: '#38bdf8',
      accent: '#e0f2fe',
      glow: 'rgba(14, 165, 233, 0.65)',
      badge: 'CRYO CORE',
      gradient: ['#0ea5e9', '#0284c7', '#0c4a6e']
    }
  }[theme] || {
    primary: '#8b5cf6',
    secondary: '#00d4ff',
    accent: '#c084fc',
    glow: 'rgba(139, 92, 246, 0.65)',
    badge: 'VIOLET CORE',
    gradient: ['#8b5cf6', '#6d28d9', '#4c1d95']
  };

  const handleEnter = useCallback(() => {
    if (!showEnterPrompt || isExiting) return;
    // Tell the app to start animating background components (like the ParticleLogo) immediately
    (window as any).isAppLoading = false;
    setIsExiting(true);
    setTimeout(() => {
      document.body.style.overflow = '';
      onComplete();
    }, 750);
  }, [showEnterPrompt, isExiting, onComplete]);

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

    let loadedCount = 0;
    const totalAssets = criticalAssetUrls.length + 2; // +1 for fonts, +1 for window load
    let hasCompleted = false;

    const completeLoading = () => {
      if (hasCompleted) return;
      hasCompleted = true;
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

      // Show interactive enter prompt instead of auto-advancing
      setTimeout(() => {
        setShowEnterPrompt(true);
      }, 400);
    };

    const markLoaded = (stageName: string, telemetryPatch: Partial<typeof telemetry>) => {
      if (hasCompleted) return;
      loadedCount++;
      const currentPct = Math.min(99, Math.round((loadedCount / totalAssets) * 100));
      setProgress((prev) => Math.max(prev, currentPct));
      setStatusStage(stageName);
      setTelemetry((prev) => ({
        ...prev,
        ...telemetryPatch,
        assetsLoaded: Math.min(loadedCount, totalAssets),
        assetsTotal: totalAssets
      }));

      if (loadedCount >= totalAssets) {
        completeLoading();
      }
    };

    // Stage 1: Core & Fonts
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => markLoaded('FONTS LOADED...', { core: 'ONLINE' })).catch(() => markLoaded('FONTS LOADED...', { core: 'ONLINE' }));
    } else {
      markLoaded('FONTS LOADED...', { core: 'ONLINE' });
    }

    // Stage 2: Document Window Load
    const handleWindowLoad = () => markLoaded('DOCUMENT READY...', { network: 'CONNECTED' });
    if (document.readyState === 'complete') {
      handleWindowLoad();
    } else {
      window.addEventListener('load', handleWindowLoad);
    }

    // Stage 3: Preload critical image assets
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
          engine3D: idx >= 2 ? 'READY' : 'INITIALIZING'
        });
      };
      img.onload = onDone;
      img.onerror = onDone;
    });

    // Safety timeout in case network hangs (10 seconds max)
    const safetyTimer = setTimeout(() => {
      completeLoading();
    }, 10000);

    return () => {
      window.removeEventListener('load', handleWindowLoad);
      clearTimeout(safetyTimer);
      document.body.style.overflow = '';
    };
  }, [clubLogoPath, onComplete]);

  // Click / Tap / Key listener for enter
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') handleEnter();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleEnter]);

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

    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      mouseRef.current.x = t.clientX;
      mouseRef.current.y = t.clientY;
      mouseRef.current.normX = (t.clientX - width / 2) / (width / 2);
      mouseRef.current.normY = (t.clientY - height / 2) / (height / 2);
    };
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Generate background particle field
    const particleCount = Math.min(90, Math.round(width * 0.05));
    const particles: Particle[] = [];
    const colors = [themeColors.primary, themeColors.secondary, themeColors.accent, '#ffffff'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 0.6,
        alpha: Math.random() * 0.5 + 0.15,
        baseAlpha: Math.random() * 0.5 + 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkleSpeed: 1.5 + Math.random() * 3,
        twinkleOffset: Math.random() * Math.PI * 2
      });
    }

    // Inward core sparks
    const coreSparks: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[] = [];

    let scanRadius = 0;
    let scanAlpha = 0.4;
    let pulsePhase = 0;

    const render = () => {
      timeRef.current += 0.016;
      const time = timeRef.current;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2 + mouseRef.current.normX * 20;
      const centerY = height * 0.38 + mouseRef.current.normY * 20;

      if (isExiting) {
        exitProgressRef.current = Math.min(1, exitProgressRef.current + 0.035);
      }

      const exitP = exitProgressRef.current;

      // 1. Pulsing radial gradient background breath
      pulsePhase += 0.008;
      const breathAlpha = 0.03 + Math.sin(pulsePhase) * 0.015;
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.6);
      bgGrad.addColorStop(0, `${themeColors.primary}${Math.round(breathAlpha * 255).toString(16).padStart(2, '0')}`);
      bgGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Radial Scan Wave
      scanRadius += 1.8;
      scanAlpha = Math.max(0, 0.35 * (1 - scanRadius / 500));
      if (scanRadius > 500) {
        scanRadius = 50;
        scanAlpha = 0.35;
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, scanRadius, 0, Math.PI * 2);
      ctx.strokeStyle = themeColors.secondary;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = scanAlpha * (1 - exitP);
      ctx.stroke();

      // Second, offset scan wave for depth
      const scanRadius2 = (scanRadius + 200) % 500;
      const scanAlpha2 = Math.max(0, 0.2 * (1 - scanRadius2 / 500));
      ctx.beginPath();
      ctx.arc(centerX, centerY, scanRadius2, 0, Math.PI * 2);
      ctx.strokeStyle = themeColors.primary;
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = scanAlpha2 * (1 - exitP);
      ctx.stroke();

      // 3. Twinkling particles with connection lines
      ctx.globalAlpha = 1;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Mouse repulsion
        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          const force = (130 - dist) / 130;
          p.x += (dx / dist) * force * 1.8;
          p.y += (dy / dist) * force * 1.8;
          p.alpha = Math.min(1, p.baseAlpha + 0.5);
        } else {
          p.alpha = p.baseAlpha * (0.7 + 0.3 * Math.sin(time * p.twinkleSpeed + p.twinkleOffset));
        }

        // Exit explosion
        if (exitP > 0) {
          const cdx = p.x - centerX;
          const cdy = p.y - centerY;
          const cDist = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
          p.x += (cdx / cDist) * exitP * 18;
          p.y += (cdy / cDist) * exitP * 18;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (1 - exitP * 0.8);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw connection lines between nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const connDist = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
          if (connDist < 100) {
            ctx.strokeStyle = themeColors.primary;
            ctx.globalAlpha = (1 - connDist / 100) * 0.08 * (1 - exitP);
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // 4. Inflow core energy sparks
      if (Math.random() < 0.4 && exitP === 0) {
        const angle = Math.random() * Math.PI * 2;
        const spawnDist = 170 + Math.random() * 50;
        const targetSpeed = 1.0 + Math.random() * 1.5;
        coreSparks.push({
          x: centerX + Math.cos(angle) * spawnDist,
          y: centerY + Math.sin(angle) * spawnDist,
          vx: -Math.cos(angle) * targetSpeed,
          vy: -Math.sin(angle) * targetSpeed,
          life: 0,
          maxLife: 55 + Math.random() * 20,
          color: Math.random() > 0.5 ? themeColors.primary : themeColors.secondary,
          size: 1 + Math.random() * 1.2
        });
      }

      for (let s = coreSparks.length - 1; s >= 0; s--) {
        const sp = coreSparks[s];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life++;

        const sparkAlpha = Math.sin((sp.life / sp.maxLife) * Math.PI);
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = sparkAlpha * 0.8;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();

        // Spark trail
        ctx.globalAlpha = sparkAlpha * 0.2;
        ctx.beginPath();
        ctx.arc(sp.x + sp.vx * 3, sp.y + sp.vy * 3, sp.size * 0.6, 0, Math.PI * 2);
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
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [themeColors, isExiting]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div
      id="preloader"
      onClick={handleEnter}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        backgroundColor: '#030308',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        overflow: 'hidden',
        cursor: showEnterPrompt ? 'pointer' : 'default',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.06)' : 'scale(1)',
        pointerEvents: isExiting ? 'none' : 'auto',
        transition: 'opacity 0.75s ease, transform 0.75s ease'
      }}
    >
      {/* Background Interactive HTML5 Canvas Layer */}
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

      {/* Subtle Cyber Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.018) 1px, transparent 1px)',
          backgroundSize: isMobile ? '2.5rem 2.5rem' : '3.5rem 3.5rem',
          pointerEvents: 'none',
          maskImage: 'radial-gradient(ellipse 65% 55% at 50% 40%, #000 60%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 50% 40%, #000 60%, transparent 100%)'
        }}
      />

      {/* Ambient Core Glow — larger and more diffuse */}
      <div
        style={{
          position: 'absolute',
          width: isMobile ? '320px' : '600px',
          height: isMobile ? '320px' : '600px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${themeColors.primary}44 0%, ${themeColors.secondary}22 40%, transparent 70%)`,
          opacity: isSystemReady ? 0.55 : 0.25,
          filter: 'blur(100px)',
          pointerEvents: 'none',
          transition: 'opacity 0.5s ease'
        }}
      />

      {/* ====== CENTRAL LOGO COMPOSITION ====== */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: isMobile ? '1.2rem' : '2rem',
          transform: `translate(${mouseRef.current.normX * 8}px, ${mouseRef.current.normY * 8}px) ${
            isExiting ? 'scale(1.3)' : 'scale(1)'
          }`,
          transition: 'transform 0.15s ease-out'
        }}
      >
        {/* Ring 1: Outer dashed holographic ring */}
        <div
          style={{
            position: 'absolute',
            borderRadius: '50%',
            border: `1px dashed ${themeColors.primary}44`,
            pointerEvents: 'none',
            width: isExiting ? '400px' : isMobile ? '200px' : '280px',
            height: isExiting ? '400px' : isMobile ? '200px' : '280px',
            animation: 'spin 20s linear infinite',
            transition: 'width 0.7s ease, height 0.7s ease'
          }}
        />

        {/* Ring 2: Counter-rotating precision ring with nodes */}
        <div
          style={{
            position: 'absolute',
            borderRadius: '50%',
            border: `1px solid ${themeColors.secondary}33`,
            pointerEvents: 'none',
            width: isExiting ? '340px' : isMobile ? '165px' : '230px',
            height: isExiting ? '340px' : isMobile ? '165px' : '230px',
            animation: 'spin 14s linear infinite reverse',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'width 0.7s ease, height 0.7s ease'
          }}
        >
          {[0, 90, 180, 270].map((deg) => (
            <span
              key={deg}
              style={{
                position: 'absolute',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: themeColors.secondary,
                boxShadow: `0 0 10px ${themeColors.secondary}`,
                transform: `rotate(${deg}deg) translate(${isMobile ? 82 : 115}px) rotate(-${deg}deg)`
              }}
            />
          ))}
        </div>

        {/* Ring 3: Inner energy ring */}
        <div
          style={{
            position: 'absolute',
            borderRadius: '50%',
            border: `1.5px solid ${themeColors.accent}66`,
            pointerEvents: 'none',
            width: isExiting ? '270px' : isMobile ? '135px' : '185px',
            height: isExiting ? '270px' : isMobile ? '135px' : '185px',
            boxShadow: isSystemReady ? `0 0 35px ${themeColors.glow}, inset 0 0 15px ${themeColors.primary}15` : 'none',
            animation: 'pulse 2.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            transition: 'width 0.5s ease, height 0.5s ease, box-shadow 0.3s ease'
          }}
        />

        {/* LOGO CORE */}
        <div
          style={{
            position: 'relative',
            width: isMobile ? '110px' : '155px',
            height: isMobile ? '110px' : '155px',
            borderRadius: '26px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1.5px solid ${isSystemReady ? themeColors.secondary : `${themeColors.primary}66`}`,
            backgroundColor: 'rgba(6, 6, 16, 0.88)',
            boxShadow: `0 0 50px ${themeColors.glow}, 0 0 100px ${themeColors.primary}15, inset 0 0 25px ${themeColors.primary}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '0.6rem' : '0.9rem',
            zIndex: 10,
            transition: 'all 0.4s ease'
          }}
        >
          <img
            src={clubLogoPath}
            alt="AgentBlazer Club Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              mixBlendMode: 'screen',
              filter: `drop-shadow(0 0 14px rgba(255,255,255,0.4)) drop-shadow(0 0 30px ${themeColors.primary}40)`,
              animation: 'pulse 3.5s ease-in-out infinite'
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
              top: '-5px',
              right: '-5px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: isSystemReady ? '#22d3ee' : themeColors.secondary,
              boxShadow: `0 0 12px ${isSystemReady ? '#22d3ee' : themeColors.secondary}`,
              border: '2.5px solid #030308',
              transition: 'background-color 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* ====== LOADING STATUS, PROGRESS BAR & TELEMETRY ====== */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isMobile ? '0.65rem' : '0.85rem',
          zIndex: 10,
          maxWidth: isMobile ? '320px' : '400px',
          width: '90%',
          padding: '0 1rem'
        }}
      >
        {/* Status Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', textAlign: 'center' }}>
          <span
            style={{
              fontSize: isMobile ? '9px' : '11px',
              fontFamily: "'Space Mono', monospace",
              fontWeight: 'bold',
              letterSpacing: '0.2em',
              color: '#94a3b8',
              textTransform: 'uppercase'
            }}
          >
            INITIALIZING AGENTBLAZER
          </span>

          <span
            style={{
              fontSize: isMobile ? '11px' : '13px',
              fontFamily: "'Space Mono', monospace",
              fontWeight: 'bold',
              letterSpacing: '0.08em',
              color: isSystemReady ? '#22d3ee' : themeColors.secondary,
              transition: 'color 0.3s ease'
            }}
          >
            {statusStage}
          </span>
        </div>

        {/* Progress Bar & Percentage */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '7px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: '9999px',
                position: 'relative',
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${themeColors.primary}, ${themeColors.secondary})`,
                boxShadow: `0 0 18px ${themeColors.primary}88, 0 0 4px ${themeColors.secondary}`,
                transition: 'width 0.2s ease-out'
              }}
            >
              {/* Leading edge glow */}
              <span
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '-2px',
                  bottom: '-2px',
                  width: '12px',
                  borderRadius: '9999px',
                  backgroundColor: '#ffffff',
                  boxShadow: `0 0 12px #ffffff, 0 0 20px ${themeColors.secondary}`
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: isMobile ? '9px' : '11px', fontFamily: "'Space Mono', monospace", color: '#64748b' }}>
            <span style={{ letterSpacing: '0.12em', fontWeight: 600, color: '#cbd5e1' }}>AGENTBLAZER CORE</span>
            <span style={{ fontWeight: 'bold', color: themeColors.secondary, fontSize: isMobile ? '10px' : '12px' }}>{progress}%</span>
          </div>
        </div>

        {/* Telemetry Grid */}
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.4rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: isMobile ? '9px' : '10px',
            fontFamily: "'Space Mono', monospace",
            color: '#64748b'
          }}
        >
          {[
            { label: 'SYSTEM', value: telemetry.core, color: '#4ade80' },
            { label: '3D ENGINE', value: telemetry.engine3D, color: themeColors.secondary },
            { label: 'ASSETS', value: `${telemetry.assetsLoaded}/${telemetry.assetsTotal}`, color: '#e2e8f0' },
            { label: 'NETWORK', value: telemetry.network, color: '#22d3ee' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: isMobile ? '0.25rem 0.5rem' : '0.35rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span>{item.label}</span>
              <span style={{ fontWeight: 'bold', color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Interactive Enter Prompt */}
        {showEnterPrompt && (
          <button
            onClick={handleEnter}
            style={{
              marginTop: '0.8rem',
              padding: isMobile ? '0.65rem 1.8rem' : '0.75rem 2.4rem',
              borderRadius: '14px',
              border: `1.5px solid ${themeColors.secondary}88`,
              backgroundColor: `${themeColors.primary}18`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              color: '#e2e8f0',
              fontFamily: "'Space Mono', monospace",
              fontSize: isMobile ? '11px' : '12px',
              fontWeight: 'bold',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: `0 0 30px ${themeColors.primary}25, 0 0 60px ${themeColors.primary}10`,
              animation: 'pulse 2s ease-in-out infinite, expedition-hud-enter 0.5s ease both',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = `${themeColors.primary}35`;
              (e.target as HTMLElement).style.borderColor = themeColors.secondary;
              (e.target as HTMLElement).style.boxShadow = `0 0 40px ${themeColors.primary}40`;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = `${themeColors.primary}18`;
              (e.target as HTMLElement).style.borderColor = `${themeColors.secondary}88`;
              (e.target as HTMLElement).style.boxShadow = `0 0 30px ${themeColors.primary}25`;
            }}
          >
            {isMobile ? 'TAP TO ENTER' : 'ENTER AGENTBLAZER ↗'}
          </button>
        )}
      </div>
    </div>
  );
}
