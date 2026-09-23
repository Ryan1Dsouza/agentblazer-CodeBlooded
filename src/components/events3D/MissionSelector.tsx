import { Theme } from '../../types';

interface MissionSelectorProps {
  onSelectMission: (theme: Theme) => void;
}

export default function MissionSelector({ onSelectMission }: MissionSelectorProps) {
  const missions = [
    {
      id: 'violet',
      name: 'Orbital Node',
      theme: 'violet' as Theme,
      description: 'Zero-gravity environment. Secure the orbital station and manage energy grids.',
      color: '#8b5cf6'
    },
    {
      id: 'inferno',
      name: 'Magma Depot',
      theme: 'inferno' as Theme,
      description: 'High-temperature volcanic sector. Navigate the lava flows and extract core samples.',
      color: '#ff6b35'
    },
    {
      id: 'frost',
      name: 'Cryo Outpost',
      theme: 'frost' as Theme,
      description: 'Sub-zero frozen wasteland. Deploy drones to survey the ice caverns.',
      color: '#0ea5e9'
    }
  ];

  return (
    <div className="mission-selector-overlay">
      <div className="mission-selector-content">
        <h1 className="mission-selector-title glow-text">Select Deployment Sector</h1>
        <p className="mission-selector-subtitle">Choose your operational environment</p>
        
        <div className="mission-cards-container">
          {missions.map((mission) => (
            <div 
              key={mission.id}
              className={`mission-card mission-card-${mission.theme}`}
              onClick={() => onSelectMission(mission.theme)}
            >
              <div className="mission-card-glow" />
              <div className="mission-card-inner">
                <div className="mission-icon" style={{ borderColor: mission.color }}>
                  <div className="mission-icon-inner" style={{ background: mission.color }} />
                </div>
                <h2 style={{ color: mission.color }}>{mission.name}</h2>
                <p>{mission.description}</p>
                <div className="mission-card-footer">
                  <span className="mission-status" style={{ color: mission.color }}>STATUS: ONLINE</span>
                  <button className="btn-launch" style={{ borderColor: mission.color, color: mission.color }}>
                    INITIALIZE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
