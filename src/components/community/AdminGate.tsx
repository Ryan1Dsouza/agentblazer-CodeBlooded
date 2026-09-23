import { useState, useCallback, useEffect, useRef } from 'react';
import {
  AdminEvent,
  EventCategory,
  EventStatus,
  EVENT_CATEGORIES,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
} from '../../store/eventStore';

// ─── Types ──────────────────────────────────────────────────

interface FormState {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: EventCategory | '';
  image: string;
  registrationLink: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  date?: string;
  category?: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  category: '',
  image: '',
  registrationLink: '',
};

// ─── Category emoji map ─────────────────────────────────────

const CATEGORY_ICONS: Record<EventCategory, string> = {
  Workshop: '🔧',
  Seminar: '🎓',
  Hackathon: '💡',
  Competition: '🏆',
  'Technical Event': '⚙️',
  'Club Event': '🎉',
  Other: '📌',
};

// ─── Helpers ────────────────────────────────────────────────

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim())       errors.title       = 'Event title is required.';
  if (!form.description.trim()) errors.description = 'Description is required.';
  if (!form.date)               errors.date        = 'Date is required.';
  if (!form.category)           errors.category    = 'Please select a category.';
  return errors;
}

// ─── Sub-components ─────────────────────────────────────────

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="admin-confirm-overlay" onClick={onCancel}>
      <div className="admin-confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="admin-confirm-icon">⚠️</div>
        <div className="admin-confirm-title">{title}</div>
        <p className="admin-confirm-msg">{message}</p>
        <div className="admin-confirm-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function EventFormModal({
  editingEvent,
  onClose,
  onSaved,
}: {
  editingEvent: AdminEvent | null;
  onClose: () => void;
  onSaved: (event: AdminEvent) => void;
}) {
  const [form, setForm] = useState<FormState>(
    editingEvent
      ? {
          title: editingEvent.title,
          description: editingEvent.description,
          date: editingEvent.date,
          startTime: editingEvent.startTime,
          endTime: editingEvent.endTime,
          location: editingEvent.location,
          category: editingEvent.category,
          image: editingEvent.image,
          registrationLink: editingEvent.registrationLink,
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (status: EventStatus) => {
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const payload = {
      ...form,
      category: form.category as EventCategory,
      status,
    };

    let saved: AdminEvent;
    if (editingEvent) {
      saved = updateEvent(editingEvent.id, payload)!;
    } else {
      saved = createEvent(payload);
    }
    onSaved(saved);
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal-header">
          <div className="admin-modal-title">
            <span>🗓️</span>
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </div>
          <button className="admin-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Form */}
        <div className="admin-form-grid">
          {/* Title */}
          <div className="admin-form-group full-width">
            <label className="admin-form-label">
              Event Title <span className="req">*</span>
            </label>
            <input
              name="title"
              className={`admin-form-input ${errors.title ? 'error' : ''}`}
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. AI Workshop 2026"
            />
            {errors.title && <span className="admin-form-error">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="admin-form-group full-width">
            <label className="admin-form-label">
              Description <span className="req">*</span>
            </label>
            <textarea
              name="description"
              className={`admin-form-textarea ${errors.description ? 'error' : ''}`}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the event, what attendees will learn, who should attend..."
              rows={3}
            />
            {errors.description && <span className="admin-form-error">{errors.description}</span>}
          </div>

          {/* Date */}
          <div className="admin-form-group">
            <label className="admin-form-label">
              Event Date <span className="req">*</span>
            </label>
            <input
              type="date"
              name="date"
              className={`admin-form-input ${errors.date ? 'error' : ''}`}
              value={form.date}
              onChange={handleChange}
            />
            {errors.date && <span className="admin-form-error">{errors.date}</span>}
          </div>

          {/* Category */}
          <div className="admin-form-group">
            <label className="admin-form-label">
              Category <span className="req">*</span>
            </label>
            <select
              name="category"
              className={`admin-form-select ${errors.category ? 'error' : ''}`}
              value={form.category}
              onChange={handleChange}
            >
              <option value="">— Select Category —</option>
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <span className="admin-form-error">{errors.category}</span>}
          </div>

          {/* Start Time */}
          <div className="admin-form-group">
            <label className="admin-form-label">Start Time</label>
            <input
              type="time"
              name="startTime"
              className="admin-form-input"
              value={form.startTime}
              onChange={handleChange}
            />
          </div>

          {/* End Time */}
          <div className="admin-form-group">
            <label className="admin-form-label">End Time</label>
            <input
              type="time"
              name="endTime"
              className="admin-form-input"
              value={form.endTime}
              onChange={handleChange}
            />
          </div>

          {/* Location */}
          <div className="admin-form-group full-width">
            <label className="admin-form-label">Location</label>
            <input
              name="location"
              className="admin-form-input"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. CSE Seminar Hall"
            />
          </div>

          {/* Image URL */}
          <div className="admin-form-group full-width">
            <label className="admin-form-label">Event Image URL</label>
            <input
              name="image"
              className="admin-form-input"
              value={form.image}
              onChange={handleChange}
              placeholder="https://..."
            />
            <span className="admin-form-hint">Paste a direct image link for the event poster/banner.</span>
          </div>

          {/* Registration Link */}
          <div className="admin-form-group full-width">
            <label className="admin-form-label">Registration Link</label>
            <input
              name="registrationLink"
              className="admin-form-input"
              value={form.registrationLink}
              onChange={handleChange}
              placeholder="https://forms.google.com/..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="admin-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-secondary"
            onClick={() => handleSubmit('draft')}
          >
            💾 Save Draft
          </button>
          <button
            className="btn-primary"
            onClick={() => handleSubmit('published')}
          >
            🚀 Publish Event
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Event Row ───────────────────────────────────────────────

function AdminEventRow({
  event,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  event: AdminEvent;
  onEdit: (e: AdminEvent) => void;
  onToggleStatus: (e: AdminEvent) => void;
  onDelete: (e: AdminEvent) => void;
}) {
  const isPublished = event.status === 'published';
  const icon = event.category ? CATEGORY_ICONS[event.category] : '📌';

  return (
    <div className={`admin-event-row ${isPublished ? 'is-published' : 'is-draft'}`}>
      {/* Thumbnail */}
      <div className="admin-event-thumb">
        {event.image
          ? <img src={event.image} alt={event.title} />
          : <span>{icon}</span>
        }
      </div>

      {/* Info */}
      <div className="admin-event-info">
        <div className="admin-event-name">{event.title}</div>
        <div className="admin-event-meta">
          <span className="admin-category-badge">{event.category}</span>
          <span className={`admin-status-badge ${event.status}`}>
            {isPublished ? '● Published' : '○ Draft'}
          </span>
          {event.date && (
            <span className="admin-event-meta-item">📅 {formatDisplayDate(event.date)}</span>
          )}
          {event.location && (
            <span className="admin-event-meta-item">📍 {event.location}</span>
          )}
          {event.startTime && (
            <span className="admin-event-meta-item">🕐 {event.startTime}{event.endTime ? ` – ${event.endTime}` : ''}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="admin-event-actions">
        <button className="btn-secondary" onClick={() => onEdit(event)}>✏️ Edit</button>
        {isPublished
          ? <button className="btn-unpublish" onClick={() => onToggleStatus(event)}>⏸ Unpublish</button>
          : <button className="btn-publish"   onClick={() => onToggleStatus(event)}>🚀 Publish</button>
        }
        <button className="btn-danger" onClick={() => onDelete(event)}>🗑️ Delete</button>
      </div>
    </div>
  );
}

// ─── Password Gate ───────────────────────────────────────────

const ADMIN_PASSWORD = 'admin@2025';
const SESSION_KEY    = 'ab_admin_auth';

function AdminLock({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [shake, setShake]         = useState(false);
  const [attempts, setAttempts]   = useState(0);
  const inputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onUnlock();
    } else {
      setAttempts((n) => n + 1);
      setError(attempts >= 2 ? 'Incorrect password. Access denied.' : 'Wrong password. Try again.');
      setShake(true);
      setPassword('');
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <section className="admin-lock-page">
      <div className={`admin-lock-card ${shake ? 'admin-lock-shake' : ''}`}>
        {/* Icon */}
        <div className="admin-lock-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
          </svg>
        </div>

        {/* Title */}
        <div className="admin-lock-badge">
          <span className="admin-badge-dot" /> Admin Area
        </div>
        <h1 className="admin-lock-title">Restricted Access</h1>
        <p className="admin-lock-subtitle">
          Enter the admin password to access the AgentBlazer Control Panel.
        </p>

        {/* Form */}
        <form className="admin-lock-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="admin-lock-field">
            <label className="admin-form-label">Password</label>
            <input
              ref={inputRef}
              id="admin-password-input"
              type="password"
              className={`admin-form-input admin-lock-input ${error ? 'error' : ''}`}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter admin password"
              autoComplete="current-password"
            />
            {error && <span className="admin-form-error">{error}</span>}
          </div>
          <button type="submit" className="btn-primary admin-lock-btn">
            🔓 Unlock Dashboard
          </button>
        </form>
      </div>
    </section>
  );
}

// ─── Main Admin Dashboard ────────────────────────────────────

function AdminDashboard() {
  const [events, setEvents] = useState<AdminEvent[]>(getEvents);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminEvent | null>(null);

  const refresh = useCallback(() => setEvents(getEvents()), []);

  // Open create modal
  const openCreate = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  // Open edit modal
  const openEdit = (event: AdminEvent) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  // Saved (create or edit)
  const handleSaved = (_event: AdminEvent) => {
    setShowForm(false);
    setEditingEvent(null);
    refresh();
  };

  // Toggle publish/unpublish
  const handleToggleStatus = (event: AdminEvent) => {
    if (event.status === 'published') unpublishEvent(event.id);
    else publishEvent(event.id);
    refresh();
  };

  // Confirm delete
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteEvent(deleteTarget.id);
    setDeleteTarget(null);
    refresh();
  };

  // Stats
  const totalEvents     = events.length;
  const publishedEvents = events.filter((e) => e.status === 'published').length;
  const draftEvents     = events.filter((e) => e.status === 'draft').length;

  return (
    <section className="admin-page">
      <div className="admin-container">

        {/* ── Hero ── */}
        <div className="admin-hero">
          <div className="admin-badge">
            <span className="admin-badge-dot" />
            Admin Control Panel
          </div>
          <h1 className="admin-title glow-text">Admin Dashboard</h1>
          <p className="admin-subtitle">
            Create, manage, and publish events that appear live on the AgentBlazer Community Hub.
          </p>
          <div className="admin-hero-actions">
            <button className="btn-primary" onClick={openCreate}>
              ＋ Create Event
            </button>
            <a href="/community" className="btn-secondary" style={{ textDecoration: 'none' }}>
              👁 View Community
            </a>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="admin-stats-bar">
          <div className="admin-stat-chip">
            <strong>{totalEvents}</strong> Total Events
          </div>
          <div className="admin-stat-chip">
            <strong>{publishedEvents}</strong> Published
          </div>
          <div className="admin-stat-chip">
            <strong>{draftEvents}</strong> Drafts
          </div>
        </div>

        {/* ── Event Management ── */}
        <div className="admin-section-header">
          <div className="admin-section-title">
            <span>📋</span> Event Management
          </div>
          <button className="btn-primary" onClick={openCreate}>＋ Create Event</button>
        </div>

        {events.length === 0 ? (
          <div className="admin-empty glass-panel">
            <span className="admin-empty-icon">🗂️</span>
            <p>No events created yet.</p>
            <small>Click "Create Event" to get started.</small>
          </div>
        ) : (
          <div className="admin-event-list">
            {events.map((event) => (
              <AdminEventRow
                key={event.id}
                event={event}
                onEdit={openEdit}
                onToggleStatus={handleToggleStatus}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showForm && (
        <EventFormModal
          editingEvent={editingEvent}
          onClose={() => { setShowForm(false); setEditingEvent(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Event?"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone and the event will be removed from the Community Hub.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </section>
  );
}

// ─── Gate (default export) ───────────────────────────────────

export default function AdminGate() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem('ab_admin_auth') === '1',
  );

  if (!authenticated) {
    return <AdminLock onUnlock={() => setAuthenticated(true)} />;
  }

  return <AdminDashboard />;
}
