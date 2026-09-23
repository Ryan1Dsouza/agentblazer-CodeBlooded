import { Html } from '@react-three/drei';
import { Event } from '../../../../types';

interface OutpostProps {
  event: Event;
  index: number;
  position: [number, number, number];
  isActive: boolean;
  onInspect: () => void;
}

export default function ArcticResearchOutpost({
  event,
  index,
  position,
  isActive,
  onInspect
}: OutpostProps) {
  const accentColor = '#0ea5e9';

  return (
    <group position={position}>
      {/* Research Pod Base */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[3, 3.5, 3.0, 10]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.5}
          metalness={0.7}
          emissive="#0369a1"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Dome Roof */}
      <mesh position={[0, 3.0, 0]}>
        <sphereGeometry args={[3, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Communication Antenna */}
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[0.06, 0.15, 5, 6]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.9} />
      </mesh>
      {/* Top Beacon */}
      <mesh position={[0, 8.8, 0]}>
        <sphereGeometry args={[0.2, 6, 6]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Warm Window Lights */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * 3.05, 1.5, Math.sin(angle) * 3.05]} rotation={[0, -angle, 0]}>
          <boxGeometry args={[0.8, 0.5, 0.05]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#f59e0b"
            emissiveIntensity={isActive ? 3 : 1.5}
          />
        </mesh>
      ))}

      {/* Parking Apron */}
      <mesh position={[0, 0.03, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#0ea5e9"
          emissiveIntensity={isActive ? 1.2 : 0.5}
          wireframe
        />
      </mesh>

      {/* Illumination */}
      <pointLight
        position={[0, 5, 0]}
        color="#38bdf8"
        intensity={isActive ? 8 : 3}
        distance={20}
      />

      {/* Compact In-World Outpost Beacon Marker */}
      <Html position={[0, 5.0, 0]} center distanceFactor={18} zIndexRange={[50, 0]}>
        <div
          onClick={onInspect}
          className={`px-3 py-2 rounded-xl backdrop-blur-md border text-center transition-all cursor-pointer select-none shadow-xl flex flex-col items-center gap-1 ${
            isActive ? 'scale-105 ring-1 ring-cyan-400' : 'hover:scale-105 opacity-90'
          }`}
          style={{
            backgroundColor: 'rgba(8, 20, 36, 0.9)',
            borderColor: accentColor,
            boxShadow: `0 0 20px rgba(14, 165, 233, 0.35)`,
            color: '#fff',
            minWidth: '170px'
          }}
        >
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 uppercase">
              OUTPOST 0{index + 1} • {event.category}
            </span>
          </div>
          <h3 className="text-xs font-bold text-white tracking-wide truncate max-w-[160px]">
            {event.title}
          </h3>
          <span className="text-[9px] text-cyan-200/80 font-mono">{event.date}</span>
          <span
            className="text-[8px] font-mono font-bold mt-0.5 uppercase tracking-wider animate-pulse"
            style={{ color: accentColor }}
          >
            Approach Outpost ➔
          </span>
        </div>
      </Html>
    </group>
  );
}

