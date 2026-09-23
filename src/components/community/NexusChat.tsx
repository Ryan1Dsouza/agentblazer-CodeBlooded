import { useState, useRef, useEffect, useCallback } from 'react';

interface ChatMessage {
  id: string;
  author: string;
  content: string;
  isBot: boolean;
  isSystem: boolean;
  timestamp: number;
}

function getStoredMessages(): ChatMessage[] {
  try {
    const todayDate = new Date().toDateString();
    const lastClearDate = localStorage.getItem('nexus_chat_last_clear_date');
    if (lastClearDate !== todayDate) {
      localStorage.removeItem('nexus_chat_messages');
      localStorage.setItem('nexus_chat_last_clear_date', todayDate);
      return [];
    }

    const raw = localStorage.getItem('nexus_chat_messages');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(msgs: ChatMessage[]) {
  // Keep last 200 messages
  const trimmed = msgs.slice(-200);
  localStorage.setItem('nexus_chat_messages', JSON.stringify(trimmed));
}

function getDisplayName(): string {
  const name = sessionStorage.getItem('nexus_display_name');
  const email = sessionStorage.getItem('nexus_user_email');
  // Require both name and email to be present to bypass the gate
  if (name && email) return name;
  
  // If email is missing, force re-registration by returning empty string
  sessionStorage.removeItem('nexus_display_name');
  return '';
}

function setDisplayName(name: string) {
  sessionStorage.setItem('nexus_display_name', name);
}

export default function NexusChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(getStoredMessages);
  const [input, setInput] = useState('');
  const [displayName, setName] = useState(getDisplayName);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [moderationWarning, setModerationWarning] = useState('');
  
  // Mentions state
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const mockUsers = ['agentblazer', 'admin', 'ryan', 'jason_99'];
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll to bottom (block:'nearest' prevents outer page from scrolling)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 100) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 100;
        });
      }, 100);
      return () => {
        if (cooldownRef.current) clearInterval(cooldownRef.current);
      };
    }
  }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for storage changes (cross-tab sync)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'nexus_chat_messages') {
        setMessages(getStoredMessages());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleSetName = (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    setEmailError('');

    // Validate college email
    if (!email.endsWith('@sjec.ac.in')) {
      setEmailError('Please use your college Gmail ending with @sjec.ac.in');
      return;
    }

    // Extract name: part between last '.' and '@'
    // e.g. 24g55.ryan@sjec.ac.in -> ryan
    const localPart = email.split('@')[0]; // "24g55.ryan"
    const dotParts = localPart.split('.');
    const extractedName = dotParts.length > 1
      ? dotParts[dotParts.length - 1]  // last segment after dot -> "ryan"
      : localPart;                      // fallback if no dot

    // Capitalize first letter
    const name = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);

    setDisplayName(name);
    setName(name);
    // Store email for reference
    sessionStorage.setItem('nexus_user_email', email);
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
    if (!input.trim() || cooldown > 0 || isSending) return;

    const text = input.trim();
    setInput('');
    setIsSending(true);
    setModerationWarning('');
    setShowMentionMenu(false);

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      author: displayName,
      content: text,
      isBot: false,
      isSystem: false,
      timestamp: Date.now(),
    };

    setMessages((prev) => {
      const updated = [...prev, userMsg];
      saveMessages(updated);
      return updated;
    });

    // Start 2-second cooldown
    setCooldown(2000);

    // Moderate in background
    moderateMessage(text).then(async (allowed) => {
      if (!allowed) {
        setModerationWarning('⚠️ Message blocked by AgentBlazer AI — please keep it respectful.');
        setMessages((prev) => {
          const filtered = prev.filter(m => m.id !== userMsg.id);
          saveMessages(filtered);
          return filtered;
        });
        setIsSending(false);
        return;
      }

      // Check for @agentblazer mention
      if (text.toLowerCase().includes('@agentblazer')) {
        const reply = await getAIResponse(text);
        const botContent = reply || "Sorry, I'm having trouble connecting to the network right now. Please try again later.";
        
        const botMsg: ChatMessage = {
          id: Date.now().toString(36) + 'bot',
          author: 'AgentBlazer AI',
          content: botContent,
          isBot: true,
          isSystem: false,
          timestamp: Date.now(),
        };
        setMessages((prev) => {
          const withBot = [...prev, botMsg];
          saveMessages(withBot);
          return withBot;
        });
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

  // Email entry screen
  if (!displayName) {
    return (
      <div className="chat-section">
        <div className="chat-name-gate">
          <div className="chat-name-card glass-panel">
            <span className="chat-gate-icon">🤖</span>
            <h3>Welcome to AgentBlazer Chat</h3>
            <p>Link your college Gmail to join the conversation</p>
            <form onSubmit={handleSetName} className="name-form">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => { setEmailInput(e.target.value); setEmailError(''); }}
                placeholder="yourname@sjec.ac.in"
                autoFocus
              />
              <button type="submit" className="btn-primary">Join Chat</button>
            </form>
            {emailError && <p className="email-error">{emailError}</p>}
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
                  localStorage.removeItem('nexus_chat_messages');
                  setMessages([]);
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
