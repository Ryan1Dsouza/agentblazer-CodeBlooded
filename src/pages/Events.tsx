import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { events } from '../data/events';
import EventCard from '../components/EventCard';

// 2D Rocket Journey — replaces 3D experience
export default function Events() {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCard, setShowCard] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const total = sortedEvents.length;
  const currentEvent = sortedEvents[currentIndex];
  const nextEvent = sortedEvents[Math.min(currentIndex + 1, total - 1)];

  const progress = ((currentIndex + 1) / total) * 100;

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isAnimating || showCard) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'd' || e.key === ' ') {
        e.preventDefault();
        if (currentIndex < total - 1) setCurrentIndex(i => i + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'a' || e.key === 'w') {
        e.preventDefault();
        if (currentIndex > 0) setCurrentIndex(i => i - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentIndex, isAnimating, showCard, total]);

  const goTo = useCallback((idx: number) => {
    if (idx === currentIndex || isAnimating) return;
    setIsAnimating(true);
    setShowCard(false);
    setTimeout(() => {
      setCurrentIndex(idx);
      setIsAnimating(false);
      setShowCard(true);
    }, 900);
  }, [currentIndex, isAnimating]);

  const goNext = () => goTo(Math.min(currentIndex + 1, total - 1));
  const goPrev = () => goTo(Math.max(currentIndex - 1, 0));

  // Touch swipe (mobile)
  const [touchStartX, setTouchStartX] = useState(0);
  const onTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      if (dx < 0 && currentIndex < total - 1) goNext();
      else if (dx > 0 && currentIndex > 0) goPrev();
    }
  };

  const checkpoints = sortedEvents.map((e, i) => ({
    event: e,
    index: i,
    xPct: (i / Math.max(1, total - 1)) * 100,
  }));

  return (
    <section className="events-page">
      <div className="container">
        <h2 className="section-title">Workshops, Contests & Masterclasses</h2>
        <p className="events-subtitle">
          Launch your journey through the AgentBlazer timeline.
        </p>

        {/* Background stars */}
        <div className="rocket-stars-bg" aria-hidden="true">
          {Array.from({ length: 30 }).map((_, i) => (
            <span
              key={i}
              className="bg-star"
              style={{
                left: `${(i * 7 + 3) % 100}%`,
                top: `${(i * 13 + 5) % 100}%`,
                animationDelay: `${(i * 0.3) % 3}s`,
                animationDuration: `${2 + (i % 3)}s`
              }}
            />
          ))}
        </div>

        {/* 2D Rocket Timeline */}
        <div className="rocket-journey-wrapper" style={{ overflow: 'visible' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

          {/* HUD Header */}
          <div className="rocket-hud-header">
            <div className="rocket-hud-title">
              <span className="rocket-icon">●</span>
              <span>ROCKET JOURNEY // CHRONOLOGICAL TIMELINE</span>
            </div>
            <div className="rocket-hud-telemetry">
              <span><strong>WP</strong> {currentIndex + 1} / {total}</span>
              <span><strong>NEXT</strong> {nextEvent?.title || 'COMPLETE'}</span>
            </div>
          </div>

          {/* Track area */}
          <div className="rocket-track-area" ref={trackRef}>
            {/* Track curve with glowing path */}
            <svg className="rocket-track-svg" viewBox="0 0 1000 280" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
                </linearGradient>
                <filter id="glowFilter">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00d4ff" floodOpacity="0.6" />
                </filter>
              </defs>
              {/* Glowing track line */}
              <path
                d="M 50 140 Q 250 80 450 140 T 850 140"
                fill="none"
                stroke="url(#trackGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                filter="url(#glowFilter)"
              />
              <path
                d="M 50 140 Q 250 80 450 140 T 850 140"
                fill="none"
                stroke="#00d4ff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.9"
              />
              {/* Completed portion */}
              <path
                d="M 50 140 Q 250 80 450 140"
                fill="none"
                stroke="#00ffcc"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="8 4"
                strokeOpacity="0.8"
                style={{
                  strokeDashoffset: -20,
                  animation: 'dashSlide 1s linear infinite'
                }}
              />
            </svg>

            {/* Checkpoints positioned along track */}
            {checkpoints.map((cp, idx) => {
              const isActive = idx === currentIndex;
              const isPassed = idx <= currentIndex;
              const progress = idx / Math.max(1, total - 1);
              // Safe margins so first/last checkpoints stay fully inside container (8% / 82%)
              const x = 8 + progress * 74;

              return (
                <button
                  key={cp.event.id}
                  className={`track-checkpoint ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
                  style={{
                    left: `${x}%`,
                    top: `${48 + (Math.sin(progress * Math.PI) * -10)}%`
                  }}
                  onClick={() => goTo(idx)}
                  aria-label={`Event ${idx + 1}: ${cp.event.title}`}
                >
                  <div className="checkpoint-ring">
                    <span className="checkpoint-num">0{idx + 1}</span>
                  </div>
                  <div className="checkpoint-label">
                    <div className="checkpoint-date">{cp.event.date}</div>
                    <div className="checkpoint-title">{cp.event.title}</div>
                  </div>
                </button>
              );
            })}

            {/* Rocket / Vehicle */}
            <div
              className={`rocket-vehicle ${isAnimating ? 'flying' : ''}`}
              style={{
                left: `${8 + (currentIndex / Math.max(1, total - 1)) * 74}%`,
                top: `48%`,
                transform: `translate(-50%, -50%) rotate(${currentIndex > 0 ? 12 : 0}deg)`,
                transition: isAnimating ? 'left 0.9s cubic-bezier(0.25, 1, 0.5, 1), top 0.9s ease-out' : 'left 0.4s ease, top 0.4s ease'
              }}
            >
              <div className="rocket-body">
                <div className="rocket-window" />
                {/* Flame exhaust */}
                <div className="rocket-flame" />
              </div>
              <div className="rocket-trail" />
            </div>
          </div>

          {/* Controls */}
          <div className="rocket-controls">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0 || isAnimating}
              className="ctrl-btn prev"
              aria-label="Previous event"
            >
              ◀ PREV
            </button>

            <div className="ctrl-indicator">
              <span className="ctrl-progress-text">
                {currentIndex + 1} / {total}
              </span>
              <div className="ctrl-progress-bar">
                <div
                  className="ctrl-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="ctrl-current-label">{currentEvent?.title}</span>
            </div>

            <button
              onClick={goNext}
              disabled={currentIndex === total - 1 || isAnimating}
              className="ctrl-btn next"
              aria-label="Next event"
            >
              NEXT ▶
            </button>
          </div>
        </div>

        {/* Existing cards preserved — hover interaction untouched */}
        <div className="events-grid">
          {sortedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
