import { useState, useRef, useEffect, useCallback } from 'react';
import { signInWithRedirect, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, limit, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../lib/firebase';

interface ChatMessage {
  id: string;
  author: string;
  content: string;
  isBot: boolean;
  isSystem: boolean;
  timestamp: number;
}

export default function NexusChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [moderationWarning, setModerationWarning] = useState('');
  
  // Mentions state
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const mockUsers = ['agentblazer', 'admin', 'ryan', 'jason_99'];
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const email = currentUser.email || '';
        if (email.endsWith('@sjec.ac.in')) {
          setUser(currentUser);
          const localPart = email.split('@')[0];
          const dotParts = localPart.split('.');
          const extractedName = dotParts.length > 1 ? dotParts[dotParts.length - 1] : localPart;
          setDisplayName(extractedName.charAt(0).toUpperCase() + extractedName.slice(1));
        } else {
          signOut(auth);
          setAuthError('Please use your college Gmail ending with @sjec.ac.in');
        }
      } else {
        setUser(null);
        setDisplayName('');
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore Messages
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'chat_messages'), orderBy('timestamp', 'asc'), limit(200));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          author: data.author,
          content: data.content,
          isBot: data.isBot || false,
          isSystem: data.isSystem || false,
          timestamp: data.timestamp?.toMillis() || Date.now(),
        });
      });
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSignIn = async () => {
    setAuthError('');
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      setAuthError('Failed to sign in. Please try again.');
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  // Client-side profanity filter (fallback when API is unreachable)
  const clientSideProfanityCheck = useCallback((text: string): boolean => {
    const blockedPatterns = [
      // Slurs & hate speech
      /\bn[i1!|]gg[ae3]r?s?\b/i, /\bf[a@]gg?[o0]t?s?\b/i, /\bk[i1]ke?s?\b/i,
      /\bch[i1]nk?s?\b/i, /\bsp[i1]c?k?s?\b/i, /\bw[e3]tb[a@]ck?s?\b/i,
      /\bcr[a@]ck[e3]r?s?\b/i, /\bg[o0]{2}k?s?\b/i, /\btr[a@]nn[yi1]e?s?\b/i,
      /\br[e3]t[a@]rd(ed|s)?\b/i,
      // Common swear words
      /\bf+u+c+k+/i, /\bs+h+i+t+/i, /\ba+s+s+h+o+l+e/i,
      /\bb[i1]tch(es|y)?\b/i, /\bd[i1]ck(head|s)?\b/i, /\bcunt?s?\b/i,
      /\bwh[o0]re?s?\b/i, /\bslut?s?\b/i,
      // Threats
      /\bkill\s+(your|my|him|her|them)self/i, /\bkys\b/i,
    ];
    const lower = text.toLowerCase();
    return blockedPatterns.some((pattern) => pattern.test(lower));
  }, []);

  const moderateMessage = useCallback(async (text: string): Promise<boolean> => {
    // Always run client-side filter first
    if (clientSideProfanityCheck(text)) {
      return false;
    }

    try {
      const res = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      
      if (!res.ok) return true; // Allow if moderation service is down
      const data = await res.json();
      const result = data.results?.[0];
      if (result?.flagged) {
        return false;
      }
      return true;
    } catch {
      return true; // Allow if network error (client filter already ran)
    }
  }, [clientSideProfanityCheck]);

  const getAIResponse = useCallback(async (userMessage: string) => {
    try {
      // Build context from recent messages
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
    } catch {
      return null;
    }
  }, [messages, displayName]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    
    // Look for mention trigger
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
    if (lastAtIdx !== -1) {
      const beforeAt = input.slice(0, lastAtIdx);
      setInput(`${beforeAt}@${username} `);
    }
    setShowMentionMenu(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || cooldown > 0 || isSending || !user) return;

    const text = input.trim();
    setInput('');
    setIsSending(true);
    setModerationWarning('');
    setShowMentionMenu(false);

    // Start 2-second cooldown
    setCooldown(2000);

    // Moderate in background
    moderateMessage(text).then(async (allowed) => {
      if (!allowed) {
        setModerationWarning('⚠️ Message blocked by AgentBlazer AI — please keep it respectful.');
        setIsSending(false);
        return;
      }

      try {
        await addDoc(collection(db, 'chat_messages'), {
          author: displayName,
          content: text,
          isBot: false,
          isSystem: false,
          timestamp: serverTimestamp(),
        });

        // Check for @agentblazer mention
        if (text.toLowerCase().includes('@agentblazer')) {
          const reply = await getAIResponse(text);
          const botContent = reply || "Sorry, I'm having trouble connecting to the network right now. Please try again later.";
          
          await addDoc(collection(db, 'chat_messages'), {
            author: 'AgentBlazer AI',
            content: botContent,
            isBot: true,
            isSystem: false,
            timestamp: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
      setIsSending(false);
    });
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.timestamp);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === date) {
      lastGroup.msgs.push(msg);
    } else {
      groupedMessages.push({ date, msgs: [msg] });
    }
  });

  // Email entry screen (Google Auth)
  if (!user || !displayName) {
    return (
      <div className="chat-section">
        <div className="chat-name-gate">
          <div className="chat-name-card glass-panel">
            <span className="chat-gate-icon">🤖</span>
            <h3>Welcome to AgentBlazer Chat</h3>
            <p>Link your college Gmail to join the conversation</p>
            <div className="name-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                onClick={handleSignIn} 
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#fff', color: '#000' }}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px', height: '18px' }} />
                Sign in with sjec.ac.in
              </button>
            </div>
            {authError && <p className="email-error">{authError}</p>}
            <p className="email-hint">Only @sjec.ac.in emails are accepted. Your name will be auto-detected.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-section">
      <div className="chat-header-bar">
        <div className="chat-header-info">
          <h2 className="section-title">
            <span className="section-icon">💬</span> AgentBlazer Chat
          </h2>
          <span className="chat-header-hint">
            Type <code>@agentblazer</code> to ask the AI • Monitored by AgentBlazer AI
          </span>
        </div>
        <div className="chat-user-badge">
          {sessionStorage.getItem('isAdmin') === 'true' && (
            <button 
              onClick={() => {
                if(window.confirm('Are you sure you want to clear the entire chat log?')) {
                  // TODO: Firebase clear logic could go here if needed
                }
              }}
              style={{ 
                background: 'rgba(255, 77, 79, 0.1)', 
                color: '#ff4d4f', 
                border: '1px solid #ff4d4f', 
                padding: '0.2rem 0.5rem', 
                borderRadius: '4px', 
                fontSize: '0.75rem', 
                marginRight: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Clear Logs (Admin)
            </button>
          )}
          <span className="user-dot" />
          {displayName}
          <button 
            onClick={handleSignOut}
            style={{ 
              marginLeft: '0.75rem', 
              background: 'transparent', 
              border: '1px solid rgba(255,255,255,0.2)', 
              color: 'var(--text-dim)',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              fontSize: '0.65rem',
              cursor: 'pointer'
            }}
            title="Sign Out"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <span className="chat-welcome-icon">🚀</span>
            <p>Welcome to AgentBlazer Chat! Say hello or ask <code>@agentblazer</code> anything.</p>
          </div>
        )}
        {groupedMessages.map((group) => (
          <div key={group.date}>
            <div className="chat-date-divider">
              <span>{group.date}</span>
            </div>
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

      {/* Moderation Warning */}
      {moderationWarning && (
        <div className="chat-moderation-warning">
          {moderationWarning}
        </div>
      )}

      {/* Input */}
      <div className="chat-input-wrapper" style={{ position: 'relative' }}>
        {showMentionMenu && (
          <div className="mention-menu" style={{ 
            position: 'absolute', 
            bottom: '100%', 
            left: '2rem', 
            background: 'rgba(20, 20, 32, 0.98)', 
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: '8px',
            marginBottom: '8px',
            padding: '4px',
            minWidth: '200px',
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
          }}>
            {mockUsers.filter(u => u.includes(mentionFilter)).length === 0 ? (
               <div style={{ padding: '8px 12px', color: 'var(--text-dim)', fontSize: '0.875rem' }}>No users found</div>
            ) : (
               mockUsers.filter(u => u.includes(mentionFilter)).map(u => (
                 <div 
                   key={u} 
                   onClick={() => handleMentionSelect(u)}
                   style={{
                     padding: '8px 12px',
                     cursor: 'pointer',
                     borderRadius: '4px',
                     color: 'var(--text)',
                     fontSize: '0.875rem',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '8px'
                   }}
                   onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'}
                   onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
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
            placeholder={
              cooldown > 0
                ? `Cooldown... ${(cooldown / 1000).toFixed(1)}s`
                : 'Type a message...'
            }
            disabled={cooldown > 0 || isSending}
            maxLength={500}
          />
          <button
            type="submit"
            className="btn-send"
            disabled={cooldown > 0 || isSending || !input.trim()}
          >
            {isSending ? (
              <span className="send-spinner" />
            ) : cooldown > 0 ? (
              <span className="cooldown-ring">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <circle
                    cx="12" cy="12" r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${(1 - cooldown / 2000) * 63} 63`}
                    strokeLinecap="round"
                    transform="rotate(-90 12 12)"
                  />
                </svg>
              </span>
            ) : (
              '➤'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
