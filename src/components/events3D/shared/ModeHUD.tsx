import { Compass, Keyboard, Mouse, Navigation, Radio, Zap } from 'lucide-react';
import './ExpeditionHUD.css';

interface ModeHUDProps {
  theme: string;
  gameState: 'GAMEPLAY' | 'DOCKING' | 'HUD_OPEN';
  isMobile?: boolean;
}

export default function ModeHUD({ theme, gameState, isMobile = false }: ModeHUDProps) {
  if (gameState === 'HUD_OPEN') return null;
  const frost = theme === 'frost';
  const inferno = theme === 'inferno';
  const docking = gameState === 'DOCKING';
  const destination = frost ? 'outpost' : inferno ? 'depot' : 'station';

  return (
    <aside className="expedition-hud expedition-controls" data-mode={theme} data-touch={isMobile} data-docking={docking} aria-label="Expedition instructions">
      <div className="expedition-hud__header">
        <span className="expedition-hud__icon"><Compass size={18} strokeWidth={1.5} /></span>
        <div>
          <span className="expedition-hud__eyebrow">{frost ? 'Arctic explorer' : inferno ? 'Magma expedition' : 'Orbital explorer'}</span>
          <h3 className="expedition-hud__title">Pilot's guide</h3>
        </div>
        <span className="expedition-hud__signal" aria-hidden="true"><i /><i /><i /></span>
      </div>

      {docking ? (
        <div className="expedition-controls__docking" role="status">
          <Radio size={20} />
          <div><strong>Autopilot engaged</strong><span>Parking at the {destination}…</span></div>
          <div className="expedition-controls__scan" aria-hidden="true" />
        </div>
      ) : isMobile ? (
        <div className="expedition-controls__touch">
          <span><Navigation size={15} /> Joystick to {inferno ? 'drive' : frost ? 'drive & steer' : 'fly'}</span>
          <span><Zap size={15} /> Hold <strong>BOOST</strong></span>
        </div>
      ) : (
        <dl className="expedition-controls__list">
          <div className="expedition-controls__row">
            <dt><Keyboard size={15} /><span>{inferno ? 'Drive train' : frost ? 'Drive & steer' : 'Free flight'}<small>Arrow keys also work</small></span></dt>
            <dd className="expedition-controls__keys" aria-label={inferno ? 'W and S' : 'W A S D'}>
              {(inferno ? ['W', 'S'] : ['W', 'A', 'S', 'D']).map((key) => <kbd key={key}>{key}</kbd>)}
            </dd>
          </div>
          <div className="expedition-controls__row">
            <dt><Zap size={15} /><span>{frost ? 'Polar boost' : inferno ? 'Overdrive' : 'Hyper boost'}</span></dt>
            <dd><kbd className="expedition-controls__boost-key">Shift <span>↗</span></kbd></dd>
          </div>
          <div className="expedition-controls__row">
            <dt><Mouse size={15} /><span>Follow the route</span></dt>
            <dd><kbd>Scroll</kbd></dd>
          </div>
          {frost && (
            <div className="expedition-controls__row">
              <dt><Navigation size={15} /><span>Park at outpost<small>Within 25 m</small></span></dt>
              <dd><kbd>E</kbd></dd>
            </div>
          )}
        </dl>
      )}

      {!docking && (
        <div className="expedition-controls__footer">
          <span className="expedition-hud__dot" />
          Approach the {destination} to {frost ? 'park' : 'dock'} automatically
        </div>
      )}
    </aside>
  );
}
