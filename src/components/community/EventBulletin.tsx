import { useState } from 'react';

interface BulletinPost {
  id: string;
  title: string;
  date: string;
  description: string;
  location: string;
  imageUrl: string;
  videoUrl: string;
  createdAt: number;
}

interface Props {
  isAdmin: boolean;
}

function getStoredPosts(): BulletinPost[] {
  try {
    const raw = localStorage.getItem('nexus_bulletin_posts');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePosts(posts: BulletinPost[]) {
  localStorage.setItem('nexus_bulletin_posts', JSON.stringify(posts));
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  // Handle youtube.com/watch?v=ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  // Handle youtu.be/ID
  const shortMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // Handle youtube.com/embed/ID
  if (url.includes('youtube.com/embed/')) return url;
  // Treat as direct video URL
  return null;
}

export default function EventBulletin({ isAdmin }: Props) {
  const [posts, setPosts] = useState<BulletinPost[]>(getStoredPosts);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: '',
    description: '',
    location: '',
    imageUrl: '',
    videoUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date.trim()) return;

    const newPost: BulletinPost = {
      id: Date.now().toString(36),
      ...form,
      createdAt: Date.now(),
    };
    const updated = [newPost, ...posts];
    setPosts(updated);
    savePosts(updated);
    setForm({ title: '', date: '', description: '', location: '', imageUrl: '', videoUrl: '' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    const updated = posts.filter((p) => p.id !== id);
    setPosts(updated);
    savePosts(updated);
  };

  const isDirectVideo = (url: string) => {
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  };

  return (
    <div className="bulletin-section">
      <div className="bulletin-header">
        <div>
          <h2 className="section-title">
            <span className="section-icon">📡</span> Event Bulletin Board
          </h2>
          <p className="section-subtitle">Upcoming events, workshops & announcements</p>
        </div>
        {isAdmin && (
          <button
            className="btn-admin-action"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancel' : '＋ New Post'}
          </button>
        )}
      </div>

      {/* Admin Post Form */}
      {isAdmin && showForm && (
        <form className="bulletin-form glass-panel" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Event Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. AI Hackathon 2026"
                required
              />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. SJEC Auditorium"
              />
            </div>
            <div className="form-group">
              <label>Poster Image URL</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="form-group full-width">
              <label>Video URL (YouTube or direct .mp4/.webm)</label>
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=... or https://...video.mp4"
              />
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Event details, registration info, etc."
                rows={3}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary btn-post">
            Publish Event Post
          </button>
        </form>
      )}

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="bulletin-empty">
          <span className="empty-icon">📭</span>
          <p>No events posted yet.</p>
          {isAdmin && <p className="empty-hint">Click "New Post" to create the first bulletin.</p>}
        </div>
      ) : (
        <div className="bulletin-grid">
          {posts.map((post) => {
            const ytEmbed = getYouTubeEmbedUrl(post.videoUrl);
            return (
              <div key={post.id} className="bulletin-card glass-panel">
                {/* Media */}
                {post.imageUrl && (
                  <div className="bulletin-media">
                    <img src={post.imageUrl} alt={post.title} loading="lazy" />
                  </div>
                )}
                {post.videoUrl && (
                  <div className="bulletin-media bulletin-video">
                    {ytEmbed ? (
                      <iframe
                        src={ytEmbed}
                        title={post.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : isDirectVideo(post.videoUrl) ? (
                      <video controls preload="metadata">
                        <source src={post.videoUrl} />
                      </video>
                    ) : null}
                  </div>
                )}

                {/* Content */}
                <div className="bulletin-content">
                  <div className="bulletin-meta">
                    <span className="bulletin-date">
                      📅 {new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                    {post.location && (
                      <span className="bulletin-location">📍 {post.location}</span>
                    )}
                  </div>
                  <h3 className="bulletin-title">{post.title}</h3>
                  {post.description && (
                    <p className="bulletin-desc">{post.description}</p>
                  )}
                </div>

                {/* Admin Controls */}
                {isAdmin && (
                  <button
                    className="btn-delete-post"
                    onClick={() => handleDelete(post.id)}
                    title="Delete post"
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
