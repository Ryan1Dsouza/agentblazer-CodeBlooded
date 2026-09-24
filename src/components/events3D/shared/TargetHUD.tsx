import { Crosshair, Radio } from 'lucide-react';
import './ExpeditionHUD.css';

interface TargetHUDProps {
  targetName: string | null;
  distance: number;
  status: 'APPROACHING' | 'DOCKING' | 'IDLE';
  theme: string;
}

export default function TargetHUD({ targetName, distance, status, theme }: TargetHUDProps) {
  if (!targetName || status === 'IDLE') return null;
  const docking = status === 'DOCKING';
  const label = theme === 'inferno' ? 'Depot' : theme === 'frost' ? 'Research outpost' : 'Orbital station';
  const metres = Number.isFinite(distance) ? Math.max(0, Math.round(distance)) : 0;

  return (
    <aside className="expedition-hud expedition-target" data-mode={theme} data-docking={docking} aria-label="Navigation target">
      <div className="expedition-target__label">
        <Crosshair size={15} strokeWidth={1.5} />
        <span>{label}</span>
        <span className="expedition-hud__dot" aria-hidden="true" />
      </div>
      <h3 className="expedition-target__name" title={targetName}>{targetName}</h3>
      <div className="expedition-target__telemetry">
        <div className="expedition-target__distance"><strong>{metres}</strong><span>m<small>Distance</small></span></div>
        <span className="expedition-target__status" role="status"><Radio size={12} />{docking ? 'Docking' : 'Approaching'}</span>
      </div>
      <div className="expedition-target__track" aria-hidden="true"><span style={{ width: docking ? '100%' : Math.max(4, Math.min(100, (1 - metres / 60) * 100)) + '%' }} /></div>
    </aside>
  );
}