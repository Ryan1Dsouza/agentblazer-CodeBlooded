import { useMemo, useState, useEffect } from 'react';
import { events } from '../data/events';
import Events3DCanvas from '../components/events3D/Events3DCanvas';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types';
import MissionSelector from '../components/events3D/MissionSelector';

export default function Events() {
  const { theme, switchTheme } = useTheme();
  const [missionActive, setMissionActive] = useState(false);
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
    setMissionActive(true);
  };

  return (
    <section className="events-viewport-section">
      {!missionActive ? (
        <MissionSelector onSelectMission={handleSelectMission} />
      ) : (
        <>
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
