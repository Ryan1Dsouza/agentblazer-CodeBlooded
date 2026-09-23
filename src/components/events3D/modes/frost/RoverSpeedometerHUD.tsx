interface SpeedometerProps {
  speed: number;
  isBoosting: boolean;
  visible: boolean;
}

export default function RoverSpeedometerHUD({
  speed,
  isBoosting,
  visible
}: SpeedometerProps) {
  if (!visible) return null;

  // Convert game units/s to realistic KM/H scale
  const kmh = Math.round(speed * 4.2);
  const maxKmh = 140;
  const percentage = Math.min(100, Math.round((kmh / maxKmh) * 100));

  return (
    <div 
      style={{ position: 'absolute', right: '24px', bottom: '24px', zIndex: 35 }}
      className="flex flex-col items-end gap-1.5 select-none animate-fade-in font-mono pointer-events-none"
    >
      <div
        className={`backdrop-blur-md px-4 py-3 rounded-2xl border shadow-2xl flex flex-col items-end gap-1 transition-all ${
          isBoosting
            ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_25px_rgba(56,189,248,0.5)]'
            : 'bg-black/75 border-cyan-500/40 shadow-[0_0_15px_rgba(14,165,233,0.25)]'
        }`}
      >
        {/* Top Status & Gear */}
        <div className="flex items-center justify-between w-full gap-4 border-b border-cyan-500/20 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isBoosting ? 'bg-cyan-300 animate-ping' : 'bg-cyan-400 animate-pulse'
              }`}
            />
            <span className="text-[10px] font-bold text-cyan-300 tracking-wider">
              {isBoosting ? 'HYPER DRIVE' : 'ROVER TELEMETRY'}
            </span>
          </div>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
              isBoosting
                ? 'bg-cyan-400 text-black font-extrabold'
                : 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
            }`}
          >
            {isBoosting ? 'BOOST' : kmh > 0 ? 'DRIVE' : 'PARK'}
          </span>
        </div>

        {/* Speed Digital Readout */}
        <div className="flex items-baseline gap-1 my-0.5">
          <span
            className={`text-3xl font-extrabold tracking-tight transition-colors ${
              isBoosting ? 'text-cyan-200' : 'text-white'
            }`}
          >
            {kmh}
          </span>
          <span className="text-[11px] text-cyan-400 font-bold">KM/H</span>
        </div>

        {/* Segmented Speed Progress Bar */}
        <div className="w-36 h-2 rounded-full bg-cyan-950/60 border border-cyan-500/30 overflow-hidden p-[1px]">
          <div
            className={`h-full rounded-full transition-all duration-100 ${
              isBoosting ? 'bg-gradient-to-r from-cyan-400 to-white' : 'bg-cyan-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
