import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  limit, serverTimestamp, doc, setDoc, deleteDoc, Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ChatMessage {
  id: string;
  author: string;
  authorUid: string;
  content: string;
  isBot: boolean;
  isSystem: boolean;
  timestamp: number;
}

interface OnlineUser {
  uid: string;
  displayName: string;
  lastSeen: number;
}

// How many ms before we consider a user "offline" (heartbeat every 30s, timeout at 90s)
const PRESENCE_TIMEOUT = 90_000;
const HEARTBEAT_INTERVAL = 30_000;

export default function NexusChat() {
  const { user, displayName, authError, isAuthenticating, handleSignIn, handleSignOut } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [input, setInput] = useState('');
  const [moderationWarning, setModerationWarning] = useState('');
  const [chatError, setChatError] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  // ── Presence: write + heartbeat ──────────────────────────────────────────
  useEffect(() => {
    if (!user || !displayName) return;

    const presenceRef = doc(db, 'presence', user.uid);

    const updatePresence = async () => {
      try {
        await setDoc(presenceRef, {
          displayName,
          uid: user.uid,
          lastSeen: Timestamp.now(),
        }, { merge: true });
      } catch { /* silently ignore; presence is cosmetic */ }
    };

    const clearPresence = async () => {
      try { await deleteDoc(presenceRef); } catch { /* ignore */ }
    };

    void updatePresence();
    heartbeatRef.current = setInterval(updatePresence, HEARTBEAT_INTERVAL);

    // Clean up on tab close / navigation away
    const handleVisibilityChange = () => {
      if (document.hidden) {
        void clearPresence();
      } else {
        void updatePresence();
      }
    };
    const handleUnload = () => { void clearPresence(); };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
      void clearPresence();
    };
  }, [user, displayName]);

  // ── Presence: listen ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setOnlineUsers([]); return; }

    const unsub = onSnapshot(collection(db, 'presence'), (snap) => {
      const now = Date.now();
      const active: OnlineUser[] = [];
      snap.forEach((d) => {
        const data = d.data();
        const lastSeen = (data.lastSeen as Timestamp)?.toMillis() ?? 0;
        if (now - lastSeen < PRESENCE_TIMEOUT) {
          active.push({ uid: d.id, displayName: data.displayName, lastSeen });
        }
      });
      // Sort: current user first, then alphabetically
      active.sort((a, b) => {
        if (a.uid === user.uid) return -1;
        if (b.uid === user.uid) return 1;
        return a.displayName.localeCompare(b.displayName);
      });
      setOnlineUsers(active);
    });

    return () => unsub();
  }, [user]);

  // ── Messages: listen ─────────────────────────────────────────────────────
  useEffect(() => {
    setMessages([]);
    setChatError('');
    if (!user) { setInput(''); setShowMentionMenu(false); return; }

    const q = query(collection(db, 'chat_messages'), orderBy('timestamp', 'asc'), limit(200));
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        msgs.push({
          id: d.id,
          author: data.author,
          authorUid: data.authorUid || '',
          content: data.content,
          isBot: data.isBot || false,
          isSystem: data.isSystem || false,
          timestamp: data.timestamp?.toMillis() || Date.now(),
        });
      });
      setMessages(msgs);
      setChatError('');
    }, () => {
      setMessages([]);
      setChatError('Could not load messages. Please try signing in again.');
    });

    return () => unsub();
  }, [user]);

  // ── Moderation ────────────────────────────────────────────────────────────
  const clientSideProfanityCheck = useCallback((text: string): boolean => {
    const blockedPatterns = [
      /\bn[i1!|]gg[ae3]r?s?\b/i, /\bf[a@]gg?[o0]t?s?\b/i, /\bk[i1]ke?s?\b/i,
      /\bch[i1]nk?s?\b/i, /\bsp[i1]c?k?s?\b/i, /\bw[e3]tb[a@]ck?s?\b/i,
      /\bcr[a@]ck[e3]r?s?\b/i, /\bg[o0]{2}k?s?\b/i, /\btr[a@]nn[yi1]e?s?\b/i,
      /\br[e3]t[a@]rd(ed|s)?\b/i,
      /\bf+u+c+k+/i, /\bs+h+i+t+/i, /\ba+s+s+h+o+l+e/i,
      /\bb[i1]tch(es|y)?\b/i, /\bd[i1]ck(head|s)?\b/i, /\bcunt?s?\b/i,
      /\bwh[o0]re?s?\b/i, /\bslut?s?\b/i,
      /\bkill\s+(your|my|him|her|them)self/i, /\bkys\b/i,
    ];
    return blockedPatterns.some((p) => p.test(text.toLowerCase()));
  }, []);

  const moderateMessage = useCallback(async (text: string): Promise<boolean> => {
    if (clientSideProfanityCheck(text)) return false;
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      if (!res.ok) return true;
      const data = await res.json();
      return !data.results?.[0]?.flagged;
    } catch {
      clearTimeout(tid);
      return true;
    }
  }, [clientSideProfanityCheck]);

  // ── AI response ───────────────────────────────────────────────────────────
  const getAIResponse = useCallback(async (userMessage: string) => {
    try {
      const recentMsgs = messages.slice(-6).map((m) => ({
        role: m.isBot ? 'assistant' as const : 'user' as const,
        content: m.isBot ? m.content : `${m.author}: ${m.content}`,
      }));
      recentMsgs.push({ role: 'user', content: `${displayName}: ${userMessage}` });
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: recentMsgs }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.reply || null;
    } catch { return null; }
  }, [messages, displayName]);

  // ── Input handling ────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    const lastAtIdx = val.lastIndexOf('@');
    if (lastAtIdx !== -1 && (lastAtIdx === 0 || val[lastAtIdx - 1] === ' ')) {
      const afterAt = val.slice(lastAtIdx + 1);
      if (!afterAt.includes(' ')) {
        setShowMentionMenu(true);
        setMentionFilter(afterAt.toLowerCase());
        return;
      }
    }
    setShowMentionMenu(false);
  };

  const handleMentionSelect = (username: string) => {
    const lastAtIdx = input.lastIndexOf('@');
    if (lastAtIdx !== -1) setInput(`${input.slice(0, lastAtIdx)}@${username} `);
    setShowMentionMenu(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    const text = input.trim();
    setInput('');
    setModerationWarning('');
    setShowMentionMenu(false);

    (async () => {
      try {
        const allowed = await moderateMessage(text);
        if (!allowed) {
          setModerationWarning('⚠️ Message blocked — please keep it respectful.');
          return;
        }
        await addDoc(collection(db, 'chat_messages'), {
          author: displayName,
          authorUid: user.uid,
          content: text,
          isBot: false,
          isSystem: false,
          timestamp: serverTimestamp(),
        });
        if (text.toLowerCase().includes('@agentblazer')) {
          const reply = await getAIResponse(text);
          await addDoc(collection(db, 'chat_messages'), {
            author: 'AgentBlazer AI',
            authorUid: 'bot',
            content: reply || "Sorry, I'm having trouble connecting right now.",
            isBot: true,
            isSystem: false,
            timestamp: serverTimestamp(),
          });
        }
      } catch (err) { console.error('Send error:', err); }
    })();
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Group messages by date
  const groupedMessages: { date: string; msgs: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.timestamp);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) last.msgs.push(msg);
    else groupedMessages.push({ date, msgs: [msg] });
  });

  // Mention autocomplete list — use real online users + bot
  const mentionableUsers = ['agentblazer', ...onlineUsers.map((u) => u.displayName)];

  // ── Sign-in gate ─────────────────────────────────────────────────────────
  if (!user || !displayName) {
    return (
      <div className="chat-section">
        <div className="chat-name-gate">
          <div className="chat-name-card glass-panel">
            <div className="chat-gate-logo">💬</div>
            <h3>Community Chat</h3>
            <p>Sign in with your college Google account to join the conversation and see who's online.</p>
            <div className="name-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={handleSignIn}
                className="btn-primary"
                disabled={isAuthenticating}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  background: '#fff', color: '#000',
                  opacity: isAuthenticating ? 0.7 : 1,
                  cursor: isAuthenticating ? 'not-allowed' : 'pointer',
                }}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px', height: '18px' }} />
                {isAuthenticating ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
            {authError && <p className="email-error" role="alert">{authError}</p>}
            <p className="email-hint">Only @sjec.ac.in emails are accepted.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Discord-style layout ─────────────────────────────────────────────
  return (
    <div className="community-chat-layout">

      {/* ── LEFT: Chat panel ── */}
      <div className="community-chat-main">

        {/* Header */}
        <div className="chat-header-bar">
          <div className="chat-header-info">
            <h2 className="section-title">
              <span className="chat-channel-hash">#</span> Community Chat
              <span className="chat-live-badge">LIVE</span>
            </h2>
            <span className="chat-header-hint">
              Mention <code>@agentblazer</code> to ask the AI · @sjec.ac.in members only
            </span>
          </div>
          <div className="chat-user-badge">
            <span className="user-dot" />
            {displayName}
            <button
              onClick={handleSignOut}
              disabled={isAuthenticating}
              className="chat-signout-btn"
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Error */}
        {(authError || chatError) && (
          <p className="email-error" role="alert">{authError || chatError}</p>
        )}

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <span className="chat-welcome-icon">👋</span>
              <p>This is the beginning of Community Chat! Say hello or ask <code>@agentblazer</code> anything.</p>
            </div>
          )}
          {groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="chat-date-divider"><span>{group.date}</span></div>
              {group.msgs.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.isBot ? 'bot-message' : ''} ${msg.isSystem ? 'system-message' : ''}`}
                >
                  <div className="chat-msg-avatar" data-bot={msg.isBot}>
                    {msg.isBot ? '🤖' : msg.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="chat-msg-body">
                    <div className="chat-msg-header">
                      <span className={`chat-msg-author ${msg.isBot ? 'bot-author' : ''}`}>
                        {msg.author}
                        {msg.isBot && <span className="bot-tag">BOT</span>}
                        {!msg.isBot && <span className="verified-tag" title="Verified @sjec.ac.in">✓</span>}
                      </span>
                      <span className="chat-msg-time">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="chat-msg-content">{msg.content}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Moderation warning */}
        {moderationWarning && (
          <div className="chat-moderation-warning">{moderationWarning}</div>
        )}

        {/* Input */}
        <div className="chat-input-wrapper" style={{ position: 'relative' }}>
          {showMentionMenu && (
            <div className="mention-menu" style={{
              position: 'absolute', bottom: '100%', left: '2rem',
              background: 'rgba(20, 20, 32, 0.98)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
              marginBottom: '8px', padding: '4px', minWidth: '200px',
              zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
            }}>
              {mentionableUsers.filter((u) => u.toLowerCase().includes(mentionFilter)).length === 0 ? (
                <div style={{ padding: '8px 12px', color: 'var(--text-dim)', fontSize: '0.875rem' }}>No users found</div>
              ) : (
                mentionableUsers.filter((u) => u.toLowerCase().includes(mentionFilter)).map((u) => (
                  <div
                    key={u}
                    onClick={() => handleMentionSelect(u)}
                    style={{
                      padding: '8px 12px', cursor: 'pointer', borderRadius: '4px',
                      color: 'var(--text)', fontSize: '0.875rem',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--surface)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>@</span>
                    {u}
                  </div>
                ))
              )}
            </div>
          )}
          <form className="chat-input-bar" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Message #community-chat"
              maxLength={500}
            />
            <button type="submit" className="btn-send" disabled={!input.trim()}>➤</button>
          </form>
        </div>
      </div>

      {/* ── RIGHT: Online members sidebar ── */}
      <div className="community-members-sidebar">
        <div className="members-sidebar-header">
          <span className="online-dot-indicator" />
          Online — {onlineUsers.length}
        </div>
        <div className="members-list">
          {onlineUsers.map((u) => (
            <div key={u.uid} className={`member-row ${u.uid === user.uid ? 'member-self' : ''}`}>
              <div className="member-avatar">
                {u.displayName.charAt(0).toUpperCase()}
                <span className="member-online-dot" />
              </div>
              <div className="member-info">
                <span className="member-name">
                  {u.displayName}
                  {u.uid === user.uid && <span className="member-you-tag">YOU</span>}
                </span>
                <span className="member-verified">✓ @sjec.ac.in</span>
              </div>
            </div>
          ))}
          {onlineUsers.length === 0 && (
            <div className="members-empty">No one else is online right now.</div>
          )}
        </div>
      </div>
    </div>
  );
}
