interface ModeHUDProps {
  theme: string;
  gameState: 'GAMEPLAY' | 'DOCKING' | 'HUD_OPEN';
}

export default function ModeHUD({ theme, gameState }: ModeHUDProps) {
  const themeAccent =
    theme === 'inferno' ? '#ff6b35' : theme === 'frost' ? '#0ea5e9' : '#a855f7';

  if (gameState === 'HUD_OPEN') return null;

  return (
    <div className="fixed bottom-6 left-6 pointer-events-none z-30 select-none">
      <div
        className="backdrop-blur-md bg-black/75 px-4 py-3 rounded-2xl border shadow-2xl flex flex-col gap-1.5"
        style={{
          borderColor: `${themeAccent}55`,
          boxShadow: `0 0 20px ${themeAccent}33`
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: themeAccent, boxShadow: `0 0 8px ${themeAccent}` }}
          />
          <span className="text-[11px] font-mono font-bold tracking-wider text-white uppercase">
            {gameState === 'DOCKING' ? 'AUTOPILOT DOCKING...' : 'EXPEDITION CONTROLS'}
          </span>
        </div>

        {theme === 'inferno' ? (
          <div className="text-[11px] text-gray-300 font-mono space-y-0.5">
            <div><span className="text-white font-bold">Scroll / W S:</span> Drive Train along Spline</div>
            <div><span className="text-white font-bold">Shift:</span> Overdrive Boost</div>
            <div><span className="text-white font-bold">Approach Depot:</span> Automatic Docking</div>
          </div>
        ) : theme === 'frost' ? (
          <div className="text-[11px] text-gray-300 font-mono space-y-0.5">
            <div><span className="text-white font-bold">Scroll Wheel:</span> Auto-Travel to Next Outpost</div>
            <div><span className="text-white font-bold">WASD / Shift:</span> Drive & Sprint Zoom</div>
            <div><span className="text-white font-bold">Approach Outpost:</span> Automatic Parking</div>
          </div>
        ) : (
          <div className="text-[11px] text-gray-300 font-mono space-y-0.5">
            <div><span className="text-white font-bold">Scroll Wheel:</span> Auto-Travel to Next Station</div>
            <div><span className="text-white font-bold">WASD / Shift:</span> Free Flight & Hyper Boost</div>
            <div><span className="text-white font-bold">Approach Station:</span> Automatic Docking</div>
          </div>
        )}
      </div>
    </div>
  );
}
