import { useMemo, useState, useEffect } from 'react';
import { events } from '../data/events';
import Events3DCanvas from '../components/events3D/Events3DCanvas';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types';
import MissionSelector from '../components/events3D/MissionSelector';

export default function Events() {
  const { theme, switchTheme } = useTheme();
  const [missionActive, setMissionActive] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => parseInt(a.id) - parseInt(b.id));
  }, []);

  // Abort the current mission if the user changes the theme from the global header navigation
  useEffect(() => {
    if (missionActive && activeTheme && theme !== activeTheme) {
      setMissionActive(false);
      setActiveTheme(null);
    }
  }, [theme, missionActive, activeTheme]);

  const handleSelectMission = (selectedTheme: Theme) => {
    switchTheme(selectedTheme);
    setActiveTheme(selectedTheme);
    setIsLaunching(true);

    // Brief delay so the 3D canvas can mount behind the overlay
    requestAnimationFrame(() => {
      setMissionActive(true);
      // Fade out the launch overlay after a short moment
      setTimeout(() => setIsLaunching(false), 600);
    });
  };

  const themeColor = theme === 'inferno' ? '#ff6b35' : theme === 'frost' ? '#0ea5e9' : '#a855f7';

  return (
    <section className="events-viewport-section">
      {!missionActive && !isLaunching ? (
        <MissionSelector onSelectMission={handleSelectMission} />
      ) : (
        <>
          {/* Launch overlay — shows briefly while 3D scene loads */}
          {isLaunching && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.95)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '16px',
              animation: 'fadeIn 0.2s ease',
            }}>
              <div style={{
                width: '40px', height: '40px',
                border: `3px solid ${themeColor}33`,
                borderTopColor: themeColor,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px', letterSpacing: '3px',
                color: themeColor, textTransform: 'uppercase',
              }}>
                Initializing environment...
              </span>
              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              `}</style>
            </div>
          )}
          <Events3DCanvas 
            events={sortedEvents} 
            theme={theme} 
            onAbort={() => setMissionActive(false)}
          />
          <button 
            className="btn-exit-mission glass-panel-elevated"
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setMissionActive(false);
            }}
          >
            <span className="exit-icon">✕</span> ABORT MISSION
          </button>
        </>
      )}
    </section>
  );
}
