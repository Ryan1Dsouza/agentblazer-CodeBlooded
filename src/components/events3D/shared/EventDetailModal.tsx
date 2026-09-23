import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Event } from '../../../types';
import './EventDetailModal.css';

interface EventModalProps {
  event: Event | null;
  onClose: () => void;
  theme?: string;
}

export default function EventDetailModal({ event, onClose, theme = 'violet' }: EventModalProps) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const lastInteractionTime = useRef(Date.now());
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);

  // Filter gallery to ensure only valid displayable image files
  const gallery = (event?.gallery || []).filter((url) => {
    const lower = url.toLowerCase();
    return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp');
  });
  const totalPhotos = gallery.length;

  const nextPhoto = useCallback(() => {
    if (totalPhotos > 0) {
      setActivePhotoIdx((prev) => (prev < totalPhotos - 1 ? prev + 1 : 0));
    }
  }, [totalPhotos]);

  const prevPhoto = useCallback(() => {
    if (totalPhotos > 0) {
      setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : totalPhotos - 1));
    }
  }, [totalPhotos]);

  // Reset states on open
  useEffect(() => {
    if (!event) return;
    document.body.style.overflow = 'hidden';
    setActivePhotoIdx(0);
    setIsZoomed(false);
    setIsPaused(false);
    lastInteractionTime.current = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      lastInteractionTime.current = Date.now();
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        nextPhoto();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        prevPhoto();
      } else if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [event, nextPhoto, prevPhoto, onClose]);

  // Auto-play slideshow timer (advances every 3.5s unless hovered/paused)
  useEffect(() => {
    if (!event || totalPhotos <= 1) return;

    const interval = setInterval(() => {
      const now = Date.now();
      // Only auto-advance if not paused and at least 2.5s since last manual interaction
      if (!isPaused && now - lastInteractionTime.current >= 2500) {
        nextPhoto();
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [event, totalPhotos, isPaused, nextPhoto]);

  // Wheel listener to smoothly step through the image sequence on scroll
  const handlePhotoWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastInteractionTime.current > 120) {
      lastInteractionTime.current = now;
      if (e.deltaY > 15 || e.deltaX > 15) {
        nextPhoto();
      } else if (e.deltaY < -15 || e.deltaX < -15) {
        prevPhoto();
      }
    }
  };

  // Keep active thumbnail in view
  useEffect(() => {
    if (thumbnailScrollRef.current) {
      const activeThumb = thumbnailScrollRef.current.children[activePhotoIdx] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activePhotoIdx]);

  if (!event) return null;

  const themeConfig = {
    violet: {
      accent: '#a855f7',
      accentLight: '#c084fc',
      accentGlow: 'rgba(168, 85, 247, 0.45)',
      hudBadge: 'ORBITAL DOCK TERMINAL',
      panelBg: 'rgba(9, 7, 24, 0.75)',
      tagBg: 'rgba(147, 51, 234, 0.25)',
      tagBorder: 'rgba(168, 85, 247, 0.4)'
    },
    inferno: {
      accent: '#f97316',
      accentLight: '#fb923c',
      accentGlow: 'rgba(249, 115, 22, 0.45)',
      hudBadge: 'MAGMA DEPOT TERMINAL',
      panelBg: 'rgba(22, 11, 7, 0.75)',
      tagBg: 'rgba(234, 88, 12, 0.25)',
      tagBorder: 'rgba(249, 115, 22, 0.4)'
    },
    frost: {
      accent: '#0ea5e9',
      accentLight: '#38bdf8',
      accentGlow: 'rgba(14, 165, 233, 0.45)',
      hudBadge: 'ARCTIC OUTPOST TERMINAL',
      panelBg: 'rgba(6, 17, 30, 0.75)',
      tagBg: 'rgba(2, 132, 199, 0.25)',
      tagBorder: 'rgba(14, 165, 233, 0.4)'
    }
  }[theme as 'violet' | 'inferno' | 'frost'] || {
    accent: '#a855f7',
    accentLight: '#c084fc',
    accentGlow: 'rgba(168, 85, 247, 0.45)',
    hudBadge: 'EVENT TERMINAL',
    panelBg: 'rgba(9, 7, 24, 0.75)',
    tagBg: 'rgba(147, 51, 234, 0.25)',
    tagBorder: 'rgba(168, 85, 247, 0.4)'
  };

  const currentPhotoUrl = gallery[activePhotoIdx] || gallery[0];

  const hudClipPath = 'polygon(40px 0, calc(100% - 80px) 0, 100% 80px, 100% 100%, 0 100%, 0 40px)';
  const innerClipPath = 'polygon(39px 0, calc(100% - 79px) 0, 100% 79px, 100% 100%, 0 100%, 0 39px)';

  const modalContent = (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Floating Data Node (Top-Left Branch) */}
        <div className="event-modal-telemetry-node">
          <div
            className="event-modal-telemetry-card"
            style={{ borderColor: themeConfig.accent, boxShadow: `-10px 10px 20px ${themeConfig.accentGlow}` }}
          >
            <div className="event-modal-telemetry-title">
              {themeConfig.hudBadge}
            </div>
            <div className="event-modal-telemetry-body">
              SYS.SYNC: {new Date().toLocaleTimeString()} <br />
              COORD: {event.location.substring(0, 15)}... <br />
              STATUS: <span className="event-modal-telemetry-status">SECURE DOCK</span>
            </div>
            <div
              className="event-modal-telemetry-dot"
              style={{ backgroundColor: themeConfig.accent }}
            />
          </div>
          {/* Angled Connecting Line */}
          <div
            className="event-modal-telemetry-connector"
            style={{ borderColor: themeConfig.accent }}
          />
        </div>

        {/* 
          === MAIN HOLOGRAPHIC HUD PANEL === 
        */}
        <div className="event-modal-main-panel">
          {/* Layer 1: Glowing Angular Border */}
          <div
            className="event-modal-hud-border"
            style={{
              backgroundColor: themeConfig.accent,
              clipPath: hudClipPath,
              boxShadow: `0 0 30px ${themeConfig.accentGlow}`
            }}
          >
            {/* Layer 2: Transparent Inner Glass + Dotted Grid */}
            <div
              className="event-modal-hud-glass"
              style={{
                backgroundColor: themeConfig.panelBg,
                clipPath: innerClipPath
              }}
            />
          </div>

          {/* Top/Bottom Horizontal Glow Flares */}
          <div className="event-modal-top-flare" />
          <div className="event-modal-bottom-flare" />

          {/* ========================================================================= */}
          {/* LEFT COLUMN: Dedicated Content Space */}
          {/* ========================================================================= */}
          <div className="event-modal-left-column">
            {/* Event Title */}
            <h2 className="event-modal-title">
              {event.title}
            </h2>

            {/* Key Metrics Chips */}
            <div className="event-modal-metrics-grid">
              <div className="event-modal-metric-chip">
                <span className="event-modal-metric-label">Date & Time</span>
                <span className="event-modal-metric-value">{event.date}</span>
              </div>
              <div className="event-modal-metric-chip">
                <span className="event-modal-metric-label">Attendance</span>
                <span className="event-modal-metric-value">{event.metric}</span>
              </div>
            </div>

            {/* Main Description */}
            <div className="event-modal-desc-section">
              <span className="event-modal-desc-label">
                Log Description
              </span>
              <p className="event-modal-desc-box">
                {event.description}
              </p>
            </div>

            {/* Bottom Left Action Button */}
            <div className="event-modal-left-footer">
              <button
                onClick={onClose}
                className="event-modal-terminate-btn"
                style={{
                  backgroundColor: themeConfig.accent,
                  boxShadow: `0 0 20px ${themeConfig.accentGlow}`
                }}
              >
                <span>Terminate Link</span>
                <span className="event-modal-close-x">✕</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Sized Workshop Images with Auto-Play & Scroll Sequence      */}
          {/* ========================================================================= */}
          <div
            className="event-modal-right-column"
            onWheel={handlePhotoWheel}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Top Image HUD Bar */}
            <div className="event-modal-feed-header">
              <div className="event-modal-feed-status-group">
                <span className="event-modal-feed-title">
                  VISUAL FEED
                </span>
                <span
                  className="event-modal-counter-badge"
                  style={{
                    borderColor: themeConfig.tagBorder,
                    color: themeConfig.accentLight
                  }}
                >
                  {String(activePhotoIdx + 1).padStart(2, '0')} / {String(totalPhotos).padStart(2, '0')}
                </span>
                {isPaused ? (
                  <span className="event-modal-status-badge paused">
                    PAUSED
                  </span>
                ) : (
                  <span className="event-modal-status-badge autoplay">
                    <span className="event-modal-pulse-dot" />
                    AUTO-PLAY
                  </span>
                )}
              </div>
            </div>

            {/* Main Sized Image Viewport */}
            <div className="event-modal-image-viewport">
              {totalPhotos > 0 ? (
                <img
                  src={currentPhotoUrl}
                  alt={`${event.title} capture ${activePhotoIdx + 1}`}
                  className="event-modal-main-img"
                  style={{
                    width: isZoomed ? '100%' : 'auto',
                    height: isZoomed ? '100%' : 'auto',
                    objectFit: isZoomed ? 'cover' : 'contain'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.endsWith('.HEIC') || target.src.endsWith('.heic')) {
                      target.src = target.src.replace(/\.(HEIC|heic)$/, '.JPG');
                    }
                  }}
                />
              ) : (
                <div className="event-modal-empty-feed">No visual feed found</div>
              )}

              {/* Navigation Chevrons */}
              {totalPhotos > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      lastInteractionTime.current = Date.now();
                      prevPhoto();
                    }}
                    className="event-modal-nav-btn prev"
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      lastInteractionTime.current = Date.now();
                      nextPhoto();
                    }}
                    className="event-modal-nav-btn next"
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}

              {/* Zoom Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  lastInteractionTime.current = Date.now();
                  setIsZoomed((z) => !z);
                }}
                className="event-modal-zoom-btn"
              >
                {isZoomed ? 'FIT' : 'FILL'}
              </button>

              {/* Scanline Overlay */}
              <div className="event-modal-scanlines" />
            </div>

            {/* Horizontal Thumbnail Sequence Strip */}
            {totalPhotos > 1 && (
              <div ref={thumbnailScrollRef} className="event-modal-thumbnails-strip">
                {gallery.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      lastInteractionTime.current = Date.now();
                      setActivePhotoIdx(idx);
                    }}
                    className={`event-modal-thumb-btn ${activePhotoIdx === idx ? 'active' : 'inactive'}`}
                    style={{
                      borderColor: activePhotoIdx === idx ? themeConfig.accent : undefined
                    }}
                  >
                    <img src={photo} alt="" className="event-modal-thumb-img" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 
          === HOLOGRAPHIC PROJECTOR BASE === 
        */}
        <div className="event-modal-projector-base">
          {/* Light Beam projecting UP into the panel */}
          <div
            className="event-modal-projector-beam"
            style={{
              background: `linear-gradient(to top, ${themeConfig.accent}, transparent)`,
              clipPath: 'polygon(0 100%, 100% 100%, 80% 0, 20% 0)'
            }}
          />
          {/* Physical Projector Ring */}
          <div
            className="event-modal-projector-ring"
            style={{
              borderColor: themeConfig.accent,
              backgroundColor: 'rgba(0,0,0,0.8)',
              boxShadow: `0 0 30px ${themeConfig.accentGlow}, inset 0 0 15px ${themeConfig.accent}`
            }}
          />
          <div className="event-modal-projector-glow" />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
