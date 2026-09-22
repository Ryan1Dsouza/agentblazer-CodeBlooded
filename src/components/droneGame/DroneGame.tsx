import { useMemo, useState } from 'react';
import { Event } from '../../types';
import Drone3DGame from './Drone3DGame';

interface Props {
  events: Event[];
}

export default function DroneGame({ events }: Props) {
  // Chronological order
  const sorted = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const [activeIdx] = useState(0); // maintained for interface; drone controls index
  const [showCard, setShowCard] = useState(false);

  const current = sorted[activeIdx];

  return (
    <div className="drone-game-container">
      <style>{`
        .drone-game-container {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }
        .drone-game-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 80px 20px 20px;
        }
        .drone-game-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          pointer-events: auto;
        }
        .drone-title-badge {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 212, 255, 0.3);
          color: var(--accent-primary);
          padding: 0.5rem 1.25rem;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .drone-event-badge {
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid var(--accent-secondary);
          color: var(--accent-secondary);
          padding: 0.5rem 1.25rem;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .webgl-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: var(--text-primary);
          gap: 1rem;
          padding: 2rem;
          text-align: center;
        }
        .fallback-events {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          max-width: 800px;
          margin-top: 1rem;
        }
        .fallback-event {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem;
        }
      `}</style>

      <Drone3DGame events={sorted} />

      {/* 2D overlay info */}
      <div className="drone-game-overlay">
        <div className="drone-game-topbar">
          <span className="drone-title-badge">Pilot Your Drone → {current.title}</span>
          <span className="drone-event-badge">{current.category}</span>
        </div>

        <div className="drone-game-bottombar">
          <div className="drone-progress">
            Event {activeIdx + 1} of {sorted.length}
            <div className="drone-progress-track">
              <div className="drone-progress-fill" style={{
                width: `${((activeIdx + 1) / sorted.length) * 100}%`
              }} />
            </div>
          </div>
          <button 
            className="drone-view-events-btn"
            onClick={() => setShowCard(true)}
          >
            View Event Details
          </button>
        </div>
      </div>

      {showCard && current && (
        <div className="drone-card-overlay" onClick={() => setShowCard(false)}>
          <div className="drone-card" onClick={(e) => e.stopPropagation()}>
            <button className="drone-card-close" onClick={() => setShowCard(false)}>×</button>
            <span className="drone-card-cat">{current.category}</span>
            <span className="drone-card-date">{current.date}</span>
            <h3>{current.title}</h3>
            <p>{current.description}</p>
            <div className="drone-card-meta">
              <span>📍 {current.location}</span>
              <span>📊 {current.metric}</span>
            </div>
            <button 
              className="drone-card-btn" 
              onClick={() => setShowCard(false)}
            >
              Continue Flying
            </button>
          </div>
        </div>
      )}

      <style>{`
        .drone-game-bottombar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          pointer-events: auto;
        }
        .drone-progress {
          color: var(--text-primary);
          font-size: 0.9rem;
          font-weight: 600;
          pointer-events: auto;
        }
        .drone-progress-track {
          width: 200px;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          margin-top: 0.5rem;
        }
        .drone-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-secondary), var(--accent-primary));
          border-radius: 2px;
          transition: width 0.5s ease;
        }
        .drone-view-events-btn {
          background: var(--button-background);
          color: #fff;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.3s;
        }
        .drone-view-events-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px var(--glow);
        }
        .drone-card-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          pointer-events: auto;
        }
        .drone-card {
          background: var(--surface-elevated);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2rem;
          max-width: 500px;
          width: 90%;
          position: relative;
          pointer-events: auto;
        }
        .drone-card-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 1.5rem;
          cursor: pointer;
        }
        .drone-card-cat {
          display: inline-block;
          padding: 0.2rem 0.8rem;
          background: var(--surface);
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--accent-primary);
          text-transform: uppercase;
          border: 1px solid var(--border);
          margin-bottom: 0.5rem;
        }
        .drone-card-date {
          display: block;
          color: var(--accent-primary);
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        .drone-card h3 {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
        }
        .drone-card p {
          color: var(--text-secondary);
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        .drone-card-meta {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        .drone-card-btn {
          background: var(--button-background);
          color: #fff;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .drone-card-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px var(--glow);
        }
      `}</style>
    </div>
  );
}
