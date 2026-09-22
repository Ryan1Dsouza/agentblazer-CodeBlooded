import { useState, useEffect, useRef, useCallback } from 'react';
import { Event } from '../types';
import DroneVehicle from './DroneVehicle';

interface Props {
  events: Event[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}

export default function DroneTimeline({ events, activeIndex, onSelectIndex }: Props) {
  const [isFlying, setIsFlying] = useState(false);
  const [tilt, setTilt] = useState(0);
  const [scanActive, setScanActive] = useState(true);
  const [autoPatrol, setAutoPatrol] = useState(false);
  const [dronePos, setDronePos] = useState({ x: 0, y: 0 });

  const trackRef = useRef<HTMLDivElement>(null);
  const waypointsRef = useRef<(HTMLDivElement | null)[]>([]);
  const prevIndexRef = useRef(activeIndex);
  const flightTimerRef = useRef<number | null>(null);

  // Calculate pixel position of the active waypoint within the track
  const updateDronePosition = useCallback((targetIndex: number, animate = true) => {
    if (!trackRef.current) return;
    const waypointEl = waypointsRef.current[targetIndex];
    if (!waypointEl) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    const wpRect = waypointEl.getBoundingClientRect();

    const targetX = wpRect.left - trackRect.left + wpRect.width / 2;
    const targetY = wpRect.top - trackRect.top + wpRect.height / 2;

    if (animate && prevIndexRef.current !== targetIndex) {
      const delta = targetIndex - prevIndexRef.current;
      setIsFlying(true);
      setScanActive(false);
      // Bank forward in direction of travel
      setTilt(delta > 0 ? 12 : -12);

      if (flightTimerRef.current) clearTimeout(flightTimerRef.current);

      flightTimerRef.current = window.setTimeout(() => {
        setIsFlying(false);
        setTilt(0);
        setScanActive(true);
      }, 750);
    }

    setDronePos({ x: targetX, y: targetY });
    prevIndexRef.current = targetIndex;
  }, []);

  // Update on index change
  useEffect(() => {
    updateDronePosition(activeIndex, true);
  }, [activeIndex, updateDronePosition]);

  // Update on resize or mount
  useEffect(() => {
    const handleResize = () => {
      updateDronePosition(activeIndex, false);
    };

    window.addEventListener('resize', handleResize);
    // Initial sync
    const timer = setTimeout(() => updateDronePosition(activeIndex, false), 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      if (flightTimerRef.current) clearTimeout(flightTimerRef.current);
    };
  }, [activeIndex, updateDronePosition]);

  // Auto patrol mode
  useEffect(() => {
    if (!autoPatrol) return;
    const interval = setInterval(() => {
      onSelectIndex((prevIndexRef.current + 1) % events.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [autoPatrol, events.length, onSelectIndex]);

  const handlePrev = () => {
    if (activeIndex > 0) {
      onSelectIndex(activeIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeIndex < events.length - 1) {
      onSelectIndex(activeIndex + 1);
    }
  };

  const activeEvent = events[activeIndex] || events[0];

  return (
    <div className="drone-timeline-container glass-panel-elevated">
      {/* Flight Control Deck Header */}
      <div className="drone-deck-header">
        <div className="drone-deck-title">
          <span className="drone-beacon-indicator active" />
          <span className="drone-deck-label">DRONE FLIGHT RECON // CHRONOLOGICAL LOG</span>
        </div>
        <div className="drone-telemetry-strip">
          <span className="telemetry-item">
            <span className="telemetry-label">ALT</span> 45M
          </span>
          <span className="telemetry-item">
            <span className="telemetry-label">STATUS</span> {isFlying ? 'IN TRANSIT' : 'HOVER SCAN'}
          </span>
          <button 
            className={`drone-patrol-toggle ${autoPatrol ? 'active' : ''}`}
            onClick={() => setAutoPatrol(!autoPatrol)}
            title="Toggle Auto Patrol"
          >
            {autoPatrol ? '● AUTO PATROL ON' : '○ AUTO PATROL'}
          </button>
        </div>
      </div>

      {/* Visual Timeline / Flight Corridor Path */}
      <div className="drone-flight-corridor" ref={trackRef}>
        {/* Animated Flight Corridor Vector Line */}
        <div className="flight-path-line">
          <div 
            className="flight-path-progress"
            style={{
              width: events.length > 1 ? `${(activeIndex / (events.length - 1)) * 100}%` : '0%'
            }}
          />
        </div>

        {/* Chronological Waypoints Along the Corridor */}
        <div className="drone-waypoints-track">
          {events.map((event, idx) => {
            const isCurrent = idx === activeIndex;
            const isPassed = idx < activeIndex;

            return (
              <div 
                key={event.id}
                ref={(el) => (waypointsRef.current[idx] = el)}
                className={`drone-waypoint-node ${isCurrent ? 'is-active' : ''} ${isPassed ? 'is-passed' : ''}`}
                onClick={() => onSelectIndex(idx)}
              >
                {/* Sonar Pulse Ring on Active Node */}
                {isCurrent && <div className="waypoint-sonar-ring" />}

                <div className="waypoint-stop-marker">
                  <span className="waypoint-index">0{idx + 1}</span>
                </div>

                <div className="waypoint-info-card">
                  <span className="waypoint-date">{event.date}</span>
                  <h4 className="waypoint-title">{event.title}</h4>
                  <span className="waypoint-category">{event.category}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* The Flying Drone Vehicle */}
        <div 
          className="drone-actor"
          style={{
            left: `${dronePos.x}px`,
            top: `${dronePos.y}px`
          }}
        >
          <DroneVehicle 
            isFlying={isFlying} 
            tilt={tilt} 
            scanActive={scanActive} 
          />
        </div>
      </div>

      {/* Futuristic Drone Controller Console */}
      <div className="drone-controller-hud">
        {/* Previous Button */}
        <button 
          className="controller-nav-btn prev-btn"
          onClick={handlePrev}
          disabled={activeIndex === 0}
          aria-label="Previous chronological event"
        >
          <span className="btn-chevron">◄</span>
          <span className="btn-text">PREV EVENT</span>
        </button>

        {/* Central HUD Target Indicator */}
        <div className="controller-hud-center">
          <div className="hud-waypoint-tag">
            <span className="hud-tag-badge">TARGET WP 0{activeIndex + 1} / 0{events.length}</span>
            <span className="hud-date-badge">{activeEvent.date}</span>
          </div>
          <div className="hud-event-name">{activeEvent.title}</div>
          <div className="hud-meta-row">
            <span className="hud-metric">{activeEvent.metric}</span>
            <span className="hud-dot">•</span>
            <span className="hud-loc">{activeEvent.location}</span>
          </div>

          {/* Quick Waypoint Selector Pills */}
          <div className="hud-quick-select">
            {events.map((_, idx) => (
              <button
                key={idx}
                className={`quick-wp-pill ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => onSelectIndex(idx)}
              >
                WP 0{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Next Button */}
        <button 
          className="controller-nav-btn next-btn"
          onClick={handleNext}
          disabled={activeIndex === events.length - 1}
          aria-label="Next chronological event"
        >
          <span className="btn-text">NEXT EVENT</span>
          <span className="btn-chevron">►</span>
        </button>
      </div>
    </div>
  );
}
