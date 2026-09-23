import { useState } from 'react';

interface VoiceEntry {
  id: string;
  author: string;
  message: string;
  pinned: boolean;
  createdAt: number;
}

interface Props {
  isAdmin: boolean;
}

function getStoredVoices(): VoiceEntry[] {
  try {
    const raw = localStorage.getItem('nexus_community_voices');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveVoices(entries: VoiceEntry[]) {
  localStorage.setItem('nexus_community_voices', JSON.stringify(entries));
}

export default function CommunityVoice({ isAdmin }: Props) {
  const [entries, setEntries] = useState<VoiceEntry[]>(getStoredVoices);
  const [showForm, setShowForm] = useState(false);
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !message.trim()) return;

    const newEntry: VoiceEntry = {
      id: Date.now().toString(36),
      author: author.trim(),
      message: message.trim(),
      pinned: false,
      createdAt: Date.now(),
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveVoices(updated);
    setAuthor('');
    setMessage('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveVoices(updated);
  };

  const handlePin = (id: string) => {
    const updated = entries.map((e) =>
      e.id === id ? { ...e, pinned: !e.pinned } : e
    );
    setEntries(updated);
    saveVoices(updated);
  };

  // Sort: pinned first, then by date
  const sorted = [...entries].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt - a.createdAt;
  });

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="voice-section">
      <div className="voice-header">
        <div>
          <h2 className="section-title">
            <span className="section-icon">🎙️</span> Voice of the Community
          </h2>
          <p className="section-subtitle">Share your thoughts, experiences & ideas</p>
        </div>
        {isAdmin && (
          <button
            className="btn-admin-action"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancel' : '✍️ Share Your Voice'}
          </button>
        )}
      </div>

      {/* Submit Form */}
      {isAdmin && showForm && (
        <form className="voice-form glass-panel" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Arjun K."
                required
                maxLength={50}
              />
            </div>
            <div className="form-group full-width">
              <label>Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your experience, feedback, or ideas for the community..."
                rows={3}
                required
                maxLength={500}
              />
              <span className="char-count">{message.length}/500</span>
            </div>
          </div>
          <button type="submit" className="btn-primary btn-post">
            Submit
          </button>
        </form>
      )}

      {sorted.length === 0 ? (
        <div className="bulletin-empty">
          <span className="empty-icon">💬</span>
          <p>No community voices yet.</p>
          {isAdmin && <p>Be the first to share!</p>}
        </div>
      ) : (
        <div className="voice-grid">
          {sorted.map((entry) => (
            <div key={entry.id} className={`voice-card glass-panel ${entry.pinned ? 'pinned' : ''}`}>
              {entry.pinned && <span className="pin-badge">📌 Pinned</span>}
              <blockquote className="voice-message">"{entry.message}"</blockquote>
              <div className="voice-footer">
                <span className="voice-author">— {entry.author}</span>
                <span className="voice-date">{formatTime(entry.createdAt)}</span>
              </div>
              {isAdmin && (
                <div className="voice-admin-controls">
                  <button onClick={() => handlePin(entry.id)} title={entry.pinned ? 'Unpin' : 'Pin'}>
                    {entry.pinned ? '📌' : '📍'}
                  </button>
                  <button onClick={() => handleDelete(entry.id)} title="Delete">
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
