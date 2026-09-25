import { Html } from '@react-three/drei';
import { Event } from '../../../../types';
import { FROST_CABIN_X } from './createFrostEnvironment';

interface OutpostProps {
  event: Event;
  index: number;
  position: [number, number, number];
  isActive: boolean;
  onInspect: () => void;
}

export default function ArcticResearchOutpost({ event, index, position, isActive, onInspect }: OutpostProps) {
  // Cabin geometry lives in the static landscape; only its event sign is interactive.
  return (
    <group position={position}>
      <Html position={[FROST_CABIN_X, 5.8, -1.6]} center distanceFactor={18} zIndexRange={[30, 0]} occlude>
        <button
          type="button"
          onClick={onInspect}
          aria-label={`Explore ${event.title}`}
          className={`flex w-48 cursor-pointer select-none flex-col items-start gap-1 border-2 bg-white px-3 py-2 text-left hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 ${
            isActive ? 'border-slate-500' : 'border-slate-300'
          }`}
          style={{ color: '#334155', borderRadius: '3px' }}
        >
          <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-slate-500">
            Outpost {String(index + 1).padStart(2, '0')} / {event.category}
          </span>
          <span className="line-clamp-2 text-xs font-bold leading-snug text-slate-800">{event.title}</span>
          <span className="font-mono text-[9px] text-slate-500">{event.date}</span>
          <span className="mt-1 font-mono text-[8px] font-bold uppercase tracking-wider text-sky-800">
            Explore event &rarr;
          </span>
        </button>
      </Html>
    </group>
  );
}
