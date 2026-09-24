import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Activity, ArrowUpRight, Check, ChevronRight, Cpu, Flame, Orbit, Pause, Play, Radio, Snowflake, Terminal } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../types';
import { useBootCanvas } from './loading/useBootCanvas';
import { BOOT_LOGO as LOGO, BOOT_RESOURCE_COUNT as RESOURCE_COUNT, startBootResourceChecks } from './loading/bootResources';
import '../styles/loadingScreen.css';

interface LoadingScreenProps { onComplete: () => void; }

const ENVIRONMENTS = {
  violet: {
    name: 'Orbital Station', short: 'Orbital', sector: 'KEPLER SECTOR / 07', code: 'ORB–07',
    primary: '#ad87ff', secondary: '#6ee7ef', particle: '#c9b4ff', icon: Orbit,
    core: 'QUANTUM CORE', location: 'LOW ORBIT', condition: 'Orbital alignment stable',
    temperature: 34, temperatureScale: 42,
    logs: ['Initializing quantum core', 'Calibrating orbital thrusters', 'Mapping constellation grid', 'Synchronizing navigation array', 'Decrypting event data', 'Establishing deep-space uplink', 'Aligning holographic interface', 'Verifying mission coordinates'],
  },
  inferno: {
    name: 'Magma Depot', short: 'Magma', sector: 'OBSIDIAN SECTOR / 09', code: 'MAG–09',
    primary: '#ff743d', secondary: '#ffc46b', particle: '#ff4b25', icon: Flame,
    core: 'FUSION REACTOR', location: 'CALDERA BASE', condition: 'Reactor containment stable',
    temperature: 682, temperatureScale: 76,
    logs: ['Igniting fusion reactor', 'Pressurizing coolant lines', 'Engaging thermal shielding', 'Calibrating rail propulsion', 'Decrypting event data', 'Routing geothermal power', 'Sealing blast-door interlocks', 'Verifying depot clearance'],
  },
  frost: {
    name: 'Arctic Outpost', short: 'Arctic', sector: 'BOREALIS SECTOR / 03', code: 'ARC–03',
    primary: '#2174b6', secondary: '#087e97', particle: '#ffffff', icon: Snowflake,
    core: 'CRYOGENIC CORE', location: 'POLAR ARRAY', condition: 'Cryogenic equilibrium stable',
    temperature: -32, temperatureScale: 28,
    logs: ['Initializing cryogenic core', 'Deploying atmospheric sensors', 'Calibrating rover navigation', 'Defrosting antenna array', 'Decrypting event data', 'Mapping subglacial terrain', 'Synchronizing polar satellites', 'Verifying outpost clearance'],
  },
} satisfies Record<Theme, object>;

type Environment = (typeof ENVIRONMENTS)[Theme];
const PHASES = ['Core handshake', 'Asset uplink', 'Interface sync', 'Mission ready'];

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

const BootTerminal = memo(function BootTerminal({ environment, ready, quiet }: { environment: Environment; ready: boolean; quiet: boolean }) {
  const [entries, setEntries] = useState([{ id: 0, message: 'Boot protocol initiated', code: 'INIT' }]);
  const sequence = useRef(0);
  useEffect(() => {
    sequence.current = 0;
    setEntries([{ id: 0, message: `${environment.short} protocol initiated`, code: 'INIT' }]);
  }, [environment]);
  useEffect(() => {
    if (quiet) {
      sequence.current = 6;
      setEntries(environment.logs.slice(0, 6).map((message, id) => ({ id, message, code: ready ? 'OK' : 'WAIT' })));
      return;
    }
    let ticks = 0;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      if (ready && sequence.current >= environment.logs.length && ++ticks % 4 !== 0) return;
      const id = ++sequence.current;
      const message = id <= environment.logs.length
        ? environment.logs[id - 1]
        : ready
          ? ['Mission channel standing by', 'Core integrity verified', 'Awaiting operator authorization', environment.condition][(id - 1) % 4]
          : ['Receiving asset packets', 'Holding uplink connection', 'Synchronizing resource buffer'][(id - 1) % 3];
      setEntries(previous => [...previous.slice(-7), { id, message, code: id % 3 === 0 ? 'SYNC' : 'OK' }]);
    }, 340);
    return () => window.clearInterval(timer);
  }, [environment, ready, quiet]);
  return (
    <section className="boot-panel boot-terminal" aria-labelledby="boot-terminal-title">
      <div className="boot-panel-heading"><h2 id="boot-terminal-title"><Terminal size={14} /> Boot sequence</h2><span className="boot-live"><i /> {quiet ? 'HOLD' : 'LIVE'}</span></div>
      <div className="boot-terminal-path"><span>agentblazer</span> / sys / initialize</div>
      <div className="boot-log-window" role="log" aria-live="off" aria-label="Simulated system boot logs">
        {entries.map(entry => <div className="boot-log-line" key={`${environment.short}-${entry.id}`}><span className="boot-log-index">{String(entry.id).padStart(3, '0')}</span><span>{entry.message}<span className="boot-log-ellipsis">...</span></span><span className="boot-log-code">{entry.code}</span></div>)}
      </div>
      <div className="boot-terminal-prompt"><ChevronRight size={13} /><span>{ready ? 'awaiting operator' : 'executing boot sequence'}</span><i /></div>
      <div className="boot-panel-foot"><span>PROTOCOL AB / 01</span><span>SECURE SHELL <Check size={10} /></span></div>
    </section>
  );
});

function Gauge({ value, label, detail }: { value: number; label: string; detail: string }) {
  return <div className="boot-gauge"><div className="boot-gauge-dial"><svg viewBox="0 0 84 84" aria-hidden="true"><circle className="boot-gauge-track" cx="42" cy="42" r="35" /><circle className="boot-gauge-fill" cx="42" cy="42" r="35" pathLength="100" strokeDasharray={`${value} 100`} /></svg><span>{Math.round(value)}<small>%</small></span></div><strong>{label}</strong><span className="boot-gauge-detail">{detail}</span></div>;
}

const Telemetry = memo(function Telemetry({ environment, progress, quiet }: { environment: Environment; progress: number; quiet: boolean }) {
  const [sample, setSample] = useState({ heat: 0, latency: 24, memory: 2.4, hex: 'A7F0  03BC  E291' });
  useEffect(() => {
    if (quiet) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setSample({ heat: Math.round(Math.random() * 4 - 2), latency: 18 + Math.round(Math.random() * 12), memory: 2.4 + Math.random() * 0.8,
        hex: Array.from({ length: 3 }, () => Math.floor(Math.random() * 65536).toString(16).padStart(4, '0').toUpperCase()).join('  ') });
    }, 720);
    return () => window.clearInterval(timer);
  }, [quiet]);
  const metrics = [
    { label: 'Engine temperature', value: `${environment.temperature + sample.heat}°`, unit: 'C', fill: environment.temperatureScale + sample.heat },
    { label: 'Network latency', value: sample.latency, unit: 'MS', fill: sample.latency * 2 },
    { label: 'Memory allocation', value: sample.memory.toFixed(1), unit: '/ 8 GB', fill: sample.memory / 8 * 100 },
  ];
  return (
    <section className="boot-panel boot-telemetry" aria-labelledby="boot-telemetry-title">
      <div className="boot-panel-heading"><h2 id="boot-telemetry-title"><Cpu size={14} /> System telemetry</h2><span className="boot-micro">01—03</span></div>
      <div className="boot-gauges"><Gauge value={progress} label="Core sync" detail={progress === 100 ? 'COMPLETE' : 'SYNCING'} /><Gauge value={Math.min(100, Math.round(progress * 0.92 + 8))} label="Signal lock" detail="SIMULATED" /></div>
      <div className="boot-metrics" aria-label="Simulated system metrics" aria-live="off">{metrics.map(metric => <div className="boot-metric" key={metric.label}><div><span>{metric.label}</span><strong>{metric.value} <small>{metric.unit}</small></strong></div><div className="boot-meter"><i style={{ transform: `scaleX(${metric.fill / 100})` }} /></div></div>)}</div>
      <div className="boot-hex"><span>MEM ADDR</span><code>{sample.hex}</code></div>
      <div className="boot-panel-foot"><span>SIMULATED DIAGNOSTICS</span><Activity size={12} /></div>
    </section>
  );
});

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const { theme, switchTheme } = useTheme();
  const environment = ENVIRONMENTS[theme] || ENVIRONMENTS.violet;
  const EnvironmentIcon = environment.icon;
  const prefersReducedMotion = useReducedMotion();
  const [motionPaused, setMotionPaused] = useState(false);
  const quiet = prefersReducedMotion || motionPaused;
  const [resources, setResources] = useState({ settled: 0, failed: 0, finished: false });
  const [isExiting, setIsExiting] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const progress = Math.round(resources.settled / RESOURCE_COUNT * 100);
  const ready = resources.finished;
  const rootRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const gyroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signalRef = useRef<HTMLCanvasElement>(null);
  const frequencyRef = useRef<HTMLSpanElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const exitTimer = useRef<number>();
  const exitStarted = useRef(false);
  const completeRef = useRef(onComplete);
  const progressRef = useRef(progress);
  completeRef.current = onComplete;
  progressRef.current = progress;

  useBootCanvas({ rootRef, deckRef, gyroRef, canvasRef, signalRef, frequencyRef, progressRef, theme, colors: environment, quiet });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // The background page must not receive focus while the boot dialog is open.
    const siblings = Array.from(rootRef.current?.parentElement?.children ?? []).filter(element => element !== rootRef.current && element instanceof HTMLElement) as HTMLElement[];
    const previousInert = siblings.map(element => element.inert);
    siblings.forEach(element => { element.inert = true; });
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    rootRef.current?.focus({ preventScroll: true });
    const stopResourceChecks = startBootResourceChecks(setResources);
    return () => {
      stopResourceChecks();
      window.clearTimeout(exitTimer.current);
      document.body.style.overflow = previousOverflow;
      siblings.forEach((element, index) => { element.inert = previousInert[index]; });
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  const handleEnter = useCallback(() => {
    if (!ready || exitStarted.current) return;
    exitStarted.current = true;
    (window as Window & { isAppLoading?: boolean }).isAppLoading = false;
    setIsExiting(true);
    exitTimer.current = window.setTimeout(() => completeRef.current(), quiet ? 0 : 650);
  }, [ready, quiet]);
  useEffect(() => {
    if (ready && document.activeElement === rootRef.current) enterRef.current?.focus({ preventScroll: true });
  }, [ready]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const buttons = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === rootRef.current)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
      if (event.key === 'Enter' && !event.repeat && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); handleEnter(); }
    };
    const root = rootRef.current;
    root?.addEventListener('keydown', handleKey);
    return () => root?.removeEventListener('keydown', handleKey);
  }, [handleEnter]);

  return (
    <div id="preloader" ref={rootRef} role="dialog" aria-modal="true" aria-labelledby="boot-title" aria-describedby="boot-description" tabIndex={-1}
      className={`boot-screen boot-screen--${theme} ${ready ? 'is-ready' : ''} ${isExiting ? 'is-exiting' : ''} ${quiet ? 'is-quiet' : ''}`}>
      <div className="boot-atmosphere" aria-hidden="true" />
      <div className="boot-grid" aria-hidden="true" />
      <canvas ref={canvasRef} className="boot-particles" aria-hidden="true" />
      <div className="boot-shell">
        <header className="boot-header">
          <div className="boot-brand">
            <span className="boot-brand-mark"><EnvironmentIcon size={24} strokeWidth={1.3} /></span>
            <div><strong>AGENTBLAZER</strong><span>EXPLORATION STARTS WITH YOU</span></div>
          </div>
          <div className="boot-header-controls">
            <div className="boot-environments" role="group" aria-label="Command center theme">
              {(Object.keys(ENVIRONMENTS) as Theme[]).map(key => {
                const option = ENVIRONMENTS[key];
                const Icon = option.icon;
                return (
                  <button type="button" key={key} onClick={() => switchTheme(key)}
                    aria-pressed={theme === key} aria-label={`${option.name} theme`}>
                    <Icon size={13} /><span>{option.short}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" className="boot-motion" aria-label={quiet ? 'Resume animations' : 'Pause animations'}
              aria-pressed={quiet} disabled={prefersReducedMotion}
              title={prefersReducedMotion ? 'Reduced motion follows your device preference' : quiet ? 'Resume animations' : 'Pause animations'}
              onClick={() => setMotionPaused(previous => !previous)}>
              {quiet ? <Play size={14} /> : <Pause size={14} />}
            </button>
          </div>
        </header>
        <div className="boot-station-heading">
          <div>
            <div className="boot-eyebrow"><span className="boot-status-dot" /> COMMAND CENTER <span>/</span> {environment.code}</div>
            <h1 id="boot-title">{environment.name}<span>.</span></h1>
          </div>
          <div className="boot-station-meta">
            <span>{environment.sector}</span>
            <span><i /> {environment.location} <span className="boot-meta-divider">|</span> SECURE CONNECTION</span>
          </div>
        </div>
        <div className="boot-deck" ref={deckRef}>
          <div className="boot-left-column">
            <BootTerminal environment={environment} ready={ready} quiet={quiet} />
            <section className="boot-panel boot-signal" aria-labelledby="boot-signal-title">
              <div className="boot-panel-heading">
                <h2 id="boot-signal-title"><Radio size={14} /> Uplink frequency</h2>
                <span className="boot-signal-frequency" ref={frequencyRef}>42.80 Hz</span>
              </div>
              <div className="boot-signal-graph">
                <canvas ref={signalRef} aria-label="Animated frequency waveform responding to pointer movement" role="img" />
                <span className="boot-signal-axis">01</span><span className="boot-signal-axis">02</span><span className="boot-signal-axis">03</span>
              </div>
              <div className="boot-panel-foot"><span>{quiet ? 'SIGNAL HOLD' : 'MOVE POINTER TO MODULATE'}</span><span>RX / TX</span></div>
            </section>
          </div>
          <section className="boot-core" aria-label="AgentBlazer core initialization">
            <div className="boot-core-caption"><span>AB / {environment.core}</span><span>GEN. 03</span></div>
            <div className="boot-gyroscope" ref={gyroRef} aria-hidden="true">
              <div className="boot-core-aura" /><div className="boot-orbit-ticks" /><div className="boot-orbit-track" />
              <div className="boot-orbit boot-orbit--one"><div><i /><i /></div></div>
              <div className="boot-orbit boot-orbit--two"><div><i /><i /></div></div>
              <div className="boot-orbit boot-orbit--three"><div><i /></div></div>
              <span className="boot-crosshair boot-crosshair--top">+</span><span className="boot-crosshair boot-crosshair--right">+</span>
              <span className="boot-crosshair boot-crosshair--bottom">+</span><span className="boot-crosshair boot-crosshair--left">+</span>
              <div className="boot-logo-core">
                {logoFailed ? <span className="boot-logo-fallback">AB</span> : <img src={LOGO} alt="" onError={() => setLogoFailed(true)} />}
                <span className="boot-logo-indicator" />
              </div>
              <div className="boot-core-coordinate">{environment.code} <span>//</span> {ready ? 'STABILIZED' : 'CALIBRATING'}</div>
            </div>
            <div className="boot-core-message">
              <div className="boot-core-state"><span className="boot-status-dot" />{ready ? 'SYSTEM UNLOCKED' : `BOOT SEQUENCE ACTIVE · ${progress}%`}</div>
              <h2>{ready ? 'All systems. Go.' : 'A new mission awaits.'}</h2>
              <p id="boot-description">{ready ? 'Your world is ready. Take command.' : 'Bringing your AgentBlazer universe online.'}</p>
            </div>
            <button ref={enterRef} type="button" className="boot-enter" disabled={!ready || isExiting} onClick={handleEnter}>
              <span>{isExiting ? 'Launching mission' : ready ? 'Enter AgentBlazer' : 'Initializing systems'}</span>
              {ready ? <ArrowUpRight size={20} /> : <span className="boot-button-loader" />}
              <i className="boot-button-laser" aria-hidden="true" />
            </button>
            <span className="boot-enter-hint">{ready ? 'YOUR NEXT CHAPTER STARTS HERE' : 'ESTABLISHING YOUR CONNECTION'}</span>
          </section>
          <div className="boot-right-column">
            <Telemetry environment={environment} progress={progress} quiet={quiet} />
            <section className="boot-link-card">
              <div className="boot-link-icon"><EnvironmentIcon size={22} strokeWidth={1.2} /></div>
              <div>
                <span>{environment.condition}</span>
                <p>{resources.failed ? `${resources.failed} resource check${resources.failed > 1 ? 's' : ''} unavailable · fallback active` : 'All channels operating within range'}</p>
              </div>
              <span className="boot-status-dot" />
            </section>
          </div>
        </div>
        <section className="boot-progress-section" aria-label="Loading progress">
          <div className="boot-progress-info">
            <div>
              <span className="boot-eyebrow">{ready ? 'PRE-FLIGHT COMPLETE' : 'INITIALIZATION IN PROGRESS'}</span>
              <span className="boot-resource-count">{String(resources.settled).padStart(2, '0')} / {String(RESOURCE_COUNT).padStart(2, '0')} RESOURCE CHECKS</span>
            </div>
            <div className="boot-progress-number">{String(progress).padStart(2, '0')}<span>%</span></div>
          </div>
          <div className="boot-progress-track" role="progressbar" aria-label="Resource checks" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div style={{ transform: `scaleX(${progress / 100})` }} /><span />
          </div>
          <div className="boot-phases">
            {PHASES.map((phase, index) => {
              const done = progress >= (index + 1) * 25;
              return <div key={phase} className={done ? 'is-complete' : ''}><span>{done ? <Check size={11} /> : String(index + 1).padStart(2, '0')}</span>{phase}<i /></div>;
            })}
          </div>
        </section>
        <footer className="boot-footer">
          <span><span className="boot-status-dot" /> AGENTBLAZER OS <span className="boot-footer-version">/ V.03.26</span></span>
          <span>BUILT FOR THE CURIOUS. POWERED BY YOU.</span>
          <span>{environment.code} <span className="boot-footer-bars" aria-hidden="true">▂▄▆█</span></span>
        </footer>
      </div>
      <span className="boot-sr-only" role="status" aria-live="polite">{ready ? 'System unlocked. Enter AgentBlazer is ready.' : 'Loading AgentBlazer resources.'}</span>
      {ready && <div className="boot-unlock-flash" aria-hidden="true"><div><span>ACCESS GRANTED / {environment.code}</span><strong>SYSTEM UNLOCKED</strong><span>WELCOME TO AGENTBLAZER</span></div></div>}
    </div>
  );
}
