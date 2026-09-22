import { Event } from '../../types';

interface DroneHUDProps {
  currentEvent: Event | null;
  currentIndex: number;
  totalEvents: number;
  nextCheckpoint: number;
  showControls: boolean;
  isMobile: boolean;
}

export default function DroneHUD({ 
  currentEvent, 
  currentIndex, 
  totalEvents, 
  nextCheckpoint,
  showControls,
  isMobile 
}: DroneHUDProps) {
  return (
    <div className="drone-game-hud">
      {/* Top-left: Mission Status */}
      <div className="hud-panel hud-mission">
        <div className="hud-panel-header">
          <span className="hud-icon">◎</span> MISSION STATUS
        </div>
        <div className="hud-stat">
          <span className="hud-label">WP</span>
          <span className="hud-value highlight">{currentIndex + 1} / {totalEvents}</span>
        </div>
        <div className="hud-progress-bar">
          <div 
            className="hud-progress-fill" 
            style={{ width: `${((currentIndex + 1) / totalEvents) * 100}%` }} 
          />
        </div>
      </div>

      {/* Top-right: Current Target */}
      <div className="hud-panel hud-target">
        <div className="hud-panel-header">
          <span className="hud-icon">◉</span> CURRENT TARGET
        </div>
        {currentEvent && (
          <>
            <div className="hud-event-title">{currentEvent.title}</div>
            <div className="hud-event-date">{currentEvent.date}</div>
            <div className="hud-event-meta">
              <span className="hud-category">{currentEvent.category}</span>
              <span className="hud-dot">•</span>
              <span>{currentEvent.metric}</span>
            </div>
          </>
        )}
      </div>

      {/* Bottom-left: Navigation */}
      <div className="hud-panel hud-navigation">
        <div className="hud-panel-header">
          <span className="hud-icon">⟳</span> NAV
        </div>
        <div className="hud-stat">
          <span className="hud-label">NEXT WP</span>
          <span className="hud-value">
            {nextCheckpoint < totalEvents 
              ? `WP-0${nextCheckpoint + 1}` 
              : 'NONE'}
          </span>
        </div>
      </div>

      {/* Control hints – desktop only */}
      {showControls && !isMobile && (
        <div className="hud-panel hud-controls-hint">
          <div className="control-row">
            <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move
          </div>
          <div className="control-row">
            <kbd>SPACE</kbd> Ascend
          </div>
          <div className="control-row">
            <kbd>SHIFT</kbd> Descend
          </div>
          <div className="control-row">
            <kbd>MOUSE</kbd> Look
          </div>
        </div>
      )}
    </div>
  );
}
