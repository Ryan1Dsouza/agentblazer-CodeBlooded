interface Props {
  isFlying: boolean;
  tilt: number;
  scanActive: boolean;
}

export default function DroneVehicle({ isFlying, tilt, scanActive }: Props) {
  return (
    <div 
      className={`drone-vehicle-wrapper ${isFlying ? 'is-flying' : 'is-hovering'}`}
      style={{
        transform: `translate(-50%, -50%) rotate(${tilt}deg)`
      }}
    >
      {/* Downward Scanner Beam */}
      <div className={`drone-scanner-beam ${scanActive ? 'active' : ''}`} />

      {/* Thruster exhaust particles when in flight */}
      <div className={`drone-thruster-particles ${isFlying ? 'active' : ''}`}>
        <span className="thruster-dot dot-1" />
        <span className="thruster-dot dot-2" />
        <span className="thruster-dot dot-3" />
      </div>

      {/* Futuristic Drone Vector */}
      <svg 
        className="drone-svg"
        viewBox="0 0 120 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="droneChassis" x1="0" y1="0" x2="120" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e1e38" />
            <stop offset="0.5" stopColor="#2c2c54" />
            <stop offset="1" stopColor="#0f0f20" />
          </linearGradient>
          <linearGradient id="droneCore" x1="50" y1="40" x2="70" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--accent-primary)" />
            <stop offset="1" stopColor="var(--accent-secondary)" />
          </linearGradient>
          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        {/* Structural Arms */}
        <path d="M60 50 L20 22 M60 50 L100 22 M60 50 L20 78 M60 50 L100 78" stroke="var(--border)" strokeWidth="4" strokeLinecap="round" />
        <path d="M60 50 L20 22 M60 50 L100 22 M60 50 L20 78 M60 50 L100 78" stroke="var(--accent-primary)" strokeWidth="1.5" strokeOpacity="0.9" strokeLinecap="round" />

        {/* 4 Ducted Rotor Housings & Spinning Propellers */}
        {/* Top-Left Rotor */}
        <g transform="translate(20, 22)">
          <circle r="16" fill="rgba(0, 212, 255, 0.08)" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="3 2" />
          <g className="drone-propeller rotor-cw">
            <line x1="-14" y1="0" x2="14" y2="0" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" filter="url(#neonGlow)" />
            <circle cx="0" cy="0" r="3.5" fill="#fff" />
          </g>
        </g>

        {/* Top-Right Rotor */}
        <g transform="translate(100, 22)">
          <circle r="16" fill="rgba(0, 212, 255, 0.08)" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="3 2" />
          <g className="drone-propeller rotor-ccw">
            <line x1="-14" y1="0" x2="14" y2="0" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" filter="url(#neonGlow)" />
            <circle cx="0" cy="0" r="3.5" fill="#fff" />
          </g>
        </g>

        {/* Bottom-Left Rotor */}
        <g transform="translate(20, 78)">
          <circle r="16" fill="rgba(0, 212, 255, 0.08)" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="3 2" />
          <g className="drone-propeller rotor-ccw">
            <line x1="-14" y1="0" x2="14" y2="0" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" filter="url(#neonGlow)" />
            <circle cx="0" cy="0" r="3.5" fill="#fff" />
          </g>
        </g>

        {/* Bottom-Right Rotor */}
        <g transform="translate(100, 78)">
          <circle r="16" fill="rgba(0, 212, 255, 0.08)" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="3 2" />
          <g className="drone-propeller rotor-cw">
            <line x1="-14" y1="0" x2="14" y2="0" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" filter="url(#neonGlow)" />
            <circle cx="0" cy="0" r="3.5" fill="#fff" />
          </g>
        </g>

        {/* Fuselage / Main Body */}
        <polygon points="60,26 80,42 76,70 60,76 44,70 40,42" fill="url(#droneChassis)" stroke="var(--border)" strokeWidth="2" />
        <polygon points="60,32 72,44 68,64 60,68 52,64 48,44" fill="#0d0d1a" stroke="var(--accent-secondary)" strokeWidth="1" />

        {/* Glowing Central AI Sensor Lens */}
        <circle cx="60" cy="50" r="7.5" fill="url(#droneCore)" filter="url(#neonGlow)" className="drone-core-pulse" />
        <circle cx="60" cy="50" r="3" fill="#ffffff" />

        {/* Optical Sensor Scan Line */}
        <line x1="53" y1="50" x2="67" y2="50" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

        {/* Dual Forward Beacons */}
        <circle cx="54" cy="30" r="2.5" fill="var(--accent-primary)" filter="url(#neonGlow)" />
        <circle cx="66" cy="30" r="2.5" fill="var(--accent-primary)" filter="url(#neonGlow)" />
      </svg>
    </div>
  );
}
