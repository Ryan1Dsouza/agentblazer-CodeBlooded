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
              <label>Poster Image (Upload or URL)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>OR</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const img = new Image();
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          let width = img.width;
                          let height = img.height;
                          const MAX_WIDTH = 800;
                          
                          if (width > MAX_WIDTH) {
                            height = Math.round((height * MAX_WIDTH) / width);
                            width = MAX_WIDTH;
                          }
                          
                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            ctx.drawImage(img, 0, 0, width, height);
                            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                            setForm({ ...form, imageUrl: compressedBase64 });
                          }
                        };
                        img.src = reader.result as string;
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ 
                    flex: 1, 
                    fontSize: '12px', 
                    color: '#fff',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(168, 85, 247, 0.44)',
                    borderRadius: '10px',
                    cursor: 'pointer'
                  }}
                />
              </div>
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
