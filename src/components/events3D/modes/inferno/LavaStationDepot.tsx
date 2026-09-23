import { Html } from '@react-three/drei';
import { Event } from '../../../../types';

interface StationProps {
  event: Event;
  index: number;
  position: [number, number, number];
  isActive: boolean;
  
}

export default function LavaStationDepot({
  event,
  index,
  position,
  isActive,
  onInspect
}: StationProps) {
  const accentColor = '#ff6b35';

  return (
    <group position={position}>
      {/* Industrial Foundation Platform */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[8, 0.8, 6]} />
        <meshStandardMaterial
          color="#1c1917"
          roughness={0.7}
          metalness={0.8}
          emissive="#7c2d12"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Platform Edge Hazard Strip */}
      <mesh position={[0, 0.05, 2.8]}>
        <boxGeometry args={[7.5, 0.08, 0.3]} />
        <meshStandardMaterial color="#ea580c" emissive="#f97316" emissiveIntensity={2.0} />
      </mesh>

      {/* Support Pylons */}
      <mesh position={[-3.5, 2.5, -2.5]}>
        <boxGeometry args={[0.6, 6, 0.6]} />
        <meshStandardMaterial color="#292524" metalness={0.9} />
      </mesh>
      <mesh position={[3.5, 2.5, -2.5]}>
        <boxGeometry args={[0.6, 6, 0.6]} />
        <meshStandardMaterial color="#292524" metalness={0.9} />
      </mesh>
      {/* Crossbeam */}
      <mesh position={[0, 5.5, -2.5]}>
        <boxGeometry args={[7.5, 0.5, 0.6]} />
        <meshStandardMaterial color="#292524" metalness={0.9} />
      </mesh>

      {/* Overhead Beacon */}
      <mesh position={[0, 6.5, -2.5]}>
        <torusGeometry args={[1.2, 0.15, 6, 18]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#ff6b35"
          emissiveIntensity={isActive ? 3.0 : 1.2}
        />
      </mesh>

      {/* Station Illumination */}
      <pointLight
        position={[0, 4, 0]}
        color="#f97316"
        intensity={isActive ? 10 : 4}
        distance={22}
      />

      {/* Compact In-World Depot Beacon Marker */}
      <Html position={[0, 4.5, 0]} center distanceFactor={18} zIndexRange={[50, 0]}>
        <div
          onClick={onInspect}
          className={`px-3 py-2 rounded-xl backdrop-blur-md border text-center transition-all cursor-pointer select-none shadow-xl flex flex-col items-center gap-1 ${
            isActive ? 'scale-105 ring-1 ring-orange-400' : 'hover:scale-105 opacity-90'
          }`}
          style={{
            backgroundColor: 'rgba(28, 15, 10, 0.9)',
            borderColor: accentColor,
            boxShadow: `0 0 20px ${accentColor}66`,
            color: '#fff',
            minWidth: '170px'
          }}
        >
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-orange-600/40 text-orange-200 border border-orange-500/40 uppercase">
              DEPOT 0{index + 1} • {event.category}
            </span>
          </div>
          <h3 className="text-xs font-bold text-white tracking-wide truncate max-w-[160px]">
            {event.title}
          </h3>
          <span className="text-[9px] text-orange-200/80 font-mono">{event.date}</span>
          <span
            className="text-[8px] font-mono font-bold mt-0.5 uppercase tracking-wider animate-pulse"
            style={{ color: accentColor }}
          >
            Approach Platform ➔
          </span>
        </div>
      </Html>
    </group>
  );
}

