import { Html } from '@react-three/drei';
import { Event } from '../../../../types';

interface BillboardProps {
  event: Event;
  index: number;
  position: [number, number, number];
  rotation: [number, number, number];
  isActive: boolean;
  onInspect: () => void;
}

export default function EventPhotoBillboard({
  event,
  index,
  position,
  rotation,
  isActive,
  onInspect
}: BillboardProps) {
  const accentColor = '#0ea5e9';
  const previewImg = event.gallery && event.gallery.length > 0 ? event.gallery[0] : null;

  return (
    <group position={position} rotation={rotation}>
      {/* Heavy Timber Frame Surround */}
      <mesh position={[0, 3.5, 0]}>
        <boxGeometry args={[6.2, 4.4, 0.3]} />
        <meshStandardMaterial color="#291403" roughness={0.6} />
      </mesh>

      {/* Frosted Cyan Neon Inner Rim */}
      <mesh position={[0, 3.5, 0.16]}>
        <boxGeometry args={[5.6, 3.8, 0.05]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={isActive ? 2.5 : 0.8}
        />
      </mesh>

      {/* Plaque Base */}
      <mesh position={[0, 0.9, 0.1]}>
        <boxGeometry args={[3.5, 0.6, 0.1]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>

      {/* Frame Spot Light */}
      <spotLight
        position={[0, 6, 2.5]}
        target-position={[0, 3.5, 0]}
        color="#bae6fd"
        intensity={isActive ? 4 : 1.5}
        distance={10}
        angle={0.7}
      />

      {/* In-Scene Interactive Billboard Card */}
      <Html position={[0, 3.5, 0.22]} transform distanceFactor={5.5}>
        <div
          onClick={onInspect}
          className={`w-[480px] p-5 rounded-xl backdrop-blur-md border transition-all cursor-pointer select-none shadow-2xl flex flex-col justify-between ${
            isActive ? 'ring-4 ring-cyan-400 scale-[1.02]' : 'hover:scale-[1.01] opacity-95'
          }`}
          style={{
            backgroundColor: 'rgba(8, 20, 36, 0.92)',
            borderColor: accentColor,
            boxShadow: `0 0 30px rgba(14, 165, 233, 0.4)`,
            color: '#fff',
            minHeight: '300px'
          }}
        >
          <div>
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2 mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-500/40">
                EXHIBIT 0{index + 1} • {event.category}
              </span>
              <span className="text-xs font-mono text-cyan-200">{event.date}</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
              {event.title}
            </h3>
            <p className="text-xs text-gray-300 line-clamp-3 mb-3 leading-relaxed">
              {event.description}
            </p>
          </div>

          {previewImg && (
            <div className="relative w-full h-32 rounded-lg overflow-hidden border border-cyan-500/30 bg-black/40 mb-3">
              <img
                src={previewImg}
                alt={event.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src.startsWith('/assets/')) {
                    target.src = target.src.replace('/assets/', '/');
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-mono text-cyan-300">
                  📷 {event.gallery.length} Photos in Gallery
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20 text-xs">
            <span className="font-mono text-gray-400">📍 {event.location}</span>
            <span className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] animate-pulse">
              Click to Open Full Lightbox ➔
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}

