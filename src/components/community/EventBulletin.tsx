import { useState, useEffect } from 'react';
import { AdminEvent, getPublishedEvents } from '../../store/eventStore';

// ─── Helpers ─────────────────────────────────────────────────

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(t: string): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour   = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  Workshop:        'var(--accent-primary)',
  Seminar:         'var(--accent-secondary)',
  Hackathon:       '#22c55e',
  Competition:     '#f59e0b',
  'Technical Event': '#a78bfa',
  'Club Event':    '#f472b6',
  Other:           'var(--text-secondary)',
};

// ─── Component ───────────────────────────────────────────────

export default function EventBulletin() {
  const [events, setEvents] = useState<AdminEvent[]>([]);

  // Poll every 1 second so edits from /admin show up immediately
  useEffect(() => {
    const sync = () => setEvents(getPublishedEvents());
    sync();
    const id = setInterval(sync, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bulletin-section">
      <div className="bulletin-header">
        <div>
          <h2 className="section-title">
            <span className="section-icon">📡</span> Event Bulletin Board
          </h2>
          <p className="section-subtitle">Upcoming events, workshops &amp; announcements</p>
        </div>
      </div>

      {/* Empty State */}
      {events.length === 0 ? (
        <div className="bulletin-empty">
          <span className="empty-icon">📭</span>
          <p>No events posted yet.</p>
          <p className="empty-hint">Check back soon — events will appear here when published.</p>
        </div>
      ) : (
        <div className="bulletin-grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Event Card ──────────────────────────────────────────────

function EventCard({ event }: { event: AdminEvent }) {
  const catColor = CATEGORY_COLORS[event.category] ?? 'var(--accent-primary)';
  const hasTime  = event.startTime || event.endTime;

  return (
    <div className="bulletin-card glass-panel">
      {/* Image */}
      {event.image && (
        <div className="bulletin-media">
          <img src={event.image} alt={event.title} loading="lazy" />
        </div>
      )}

      {/* Category badge overlay */}
      <div
        className="bulletin-category-badge"
        style={{ '--cat-color': catColor } as React.CSSProperties}
      >
        {event.category}
      </div>

      {/* Content */}
      <div className="bulletin-content">
        <div className="bulletin-meta">
          {event.date && (
            <span className="bulletin-date">
              📅 {formatDisplayDate(event.date)}
            </span>
          )}
          {hasTime && (
            <span className="bulletin-date">
              🕐 {formatTime(event.startTime)}{event.endTime ? ` – ${formatTime(event.endTime)}` : ''}
            </span>
          )}
          {event.location && (
            <span className="bulletin-location">📍 {event.location}</span>
          )}
        </div>

        <h3 className="bulletin-title">{event.title}</h3>

        {event.description && (
          <p className="bulletin-desc">{event.description}</p>
        )}

        {event.registrationLink && (
          <a
            href={event.registrationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bulletin-register-btn"
          >
            Register Now →
          </a>
        )}
      </div>
    </div>
  );
}
