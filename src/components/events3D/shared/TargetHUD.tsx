interface TargetHUDProps {
  targetName: string | null;
  distance: number;
  status: 'APPROACHING' | 'DOCKING' | 'IDLE';
  theme: string;
}

export default function TargetHUD({ targetName, distance, status, theme }: TargetHUDProps) {
  if (!targetName || status === 'IDLE') return null;

  const accent =
    theme === 'inferno' ? '#ff6b35' : theme === 'frost' ? '#0ea5e9' : '#8b5cf6';

  const modeLabel =
    theme === 'inferno' ? 'DEPOT' : theme === 'frost' ? 'OUTPOST' : 'STATION';

  return (
    <div
      className="fixed top-24 sm:top-20 right-4 sm:right-6 z-40 pointer-events-none select-none scale-75 sm:scale-100 origin-top-right"
      style={{ fontFamily: 'monospace' }}
    >
      <div
        className="px-4 py-3 rounded-2xl border backdrop-blur-md flex flex-col gap-1"
        style={{
          backgroundColor: 'rgba(0,0,0,0.75)',
          borderColor: `${accent}66`,
          boxShadow: `0 0 18px ${accent}33`,
          minWidth: '180px'
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: accent,
              boxShadow: `0 0 6px ${accent}`,
              animation: status === 'DOCKING' ? 'pulse 0.6s infinite' : 'none'
            }}
          />
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: accent }}
          >
            TARGET {modeLabel}
          </span>
        </div>
        <span className="text-sm font-bold text-white truncate max-w-[200px]">
          {targetName}
        </span>
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className="text-gray-400">
            DIST <span className="text-white font-bold">{Math.round(distance)}m</span>
          </span>
          <span
            className="font-bold uppercase tracking-wider"
            style={{ color: status === 'DOCKING' ? '#22c55e' : accent }}
          >
            {status === 'DOCKING' ? 'DOCKING...' : 'APPROACHING'}
          </span>
        </div>
      </div>
    </div>
  );
}
