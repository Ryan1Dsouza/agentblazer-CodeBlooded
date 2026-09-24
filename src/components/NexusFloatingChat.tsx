import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { Bot, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function NexusFloatingChat() {
  const location = useLocation();
  const { theme } = useTheme();
  
  const isFrostEvent = location.pathname === '/events' && theme === 'frost';
  const bottomPos = isFrostEvent ? '7rem' : '2rem';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I am AgentBlazer AI. I can answer questions about AgentBlazer, our events, and community. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { user, displayName, authError, isAuthenticating, handleSignIn, handleSignOut } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth logic is now handled by useAuth hook

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !user || isAuthenticating) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const apiMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      apiMessages.push({ role: 'user', content: userMsg.content });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      
      const botMsg: ChatMessage = {
        id: Date.now().toString() + '-bot',
        role: 'assistant',
        content: data.reply || 'Sorry, I could not process that request.'
      };
      
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: Date.now().toString() + '-err',
        role: 'assistant',
        content: 'Sorry, I am currently offline or experiencing network issues.'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="nexus-floating-chat" style={{ bottom: bottomPos }}>
      {isOpen && (
        <div
          className="nfc-window"
          style={{
            width: '370px',
            height: '520px',
            maxHeight: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 30px var(--glow)',
            backdropFilter: 'blur(20px)',
            animation: 'nfc-pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        >
          {/* Header */}
          <div className="nfc-header" style={{
            padding: '0.875rem 1.25rem',
            background: 'rgba(0,0,0,0.25)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="nfc-avatar">🤖</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>AgentBlazer AI</h4>
                <p className="nfc-status" style={{ margin: 0 }}>Online {displayName && `• ${displayName}`}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {user && (
                <button 
                  onClick={handleSignOut} 
                  disabled={isAuthenticating}
                  title="Sign Out"
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}
                >
                  <LogOut size={16} />
                </button>
              )}
              <button className="nfc-close" onClick={() => setIsOpen(false)} style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '1.2rem',
                cursor: 'pointer',
              }}>✕</button>
            </div>
          </div>
          
          {!user ? (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <Bot size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Sign In Required</h3>
              <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Sign in with your @sjec.ac.in Google account to chat with the AgentBlazer AI.
              </p>
              
              {authError && (
                <div role="alert" style={{
                  color: '#ff4d4f', background: 'rgba(255, 77, 79, 0.1)',
                  padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem',
                  marginBottom: '1rem', border: '1px solid rgba(255, 77, 79, 0.3)'
                }}>
                  {authError}
                </div>
              )}

              <button 
                type="button"
                onClick={handleSignIn}
                disabled={isAuthenticating}
                style={{
                  background: 'white', color: 'black', padding: '0.75rem 1.5rem',
                  borderRadius: '24px', border: 'none', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  cursor: isAuthenticating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(255,255,255,0.2)',
                  opacity: isAuthenticating ? 0.7 : 1
                }}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: 18, height: 18 }} />
                {isAuthenticating ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
          ) : (
            <>
              {authError && <p className="email-error" role="alert">{authError}</p>}
              {/* Messages — this MUST flex-grow to fill all remaining space */}
              <div
                className="nfc-messages"
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {messages.map((msg) => (
                  <div key={msg.id} className={`nfc-message ${msg.role}`}>
                    <div className="nfc-bubble">{msg.content}</div>
                  </div>
                ))}
                {isTyping && (
                  <div className="nfc-message assistant">
                    <div className="nfc-bubble nfc-typing">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form — stays at the very bottom */}
              <form
                className="nfc-input-form"
                onSubmit={handleSend}
                style={{
                  padding: '0.75rem 1rem',
                  borderTop: '1px solid var(--border)',
                  background: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  gap: '0.5rem',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                }}
              >
                <input 
                  type="text" 
                  placeholder="Ask about AgentBlazer..." 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTyping}
                />
                <button type="submit" disabled={!input.trim() || isTyping}>
                  ➤
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button 
        className={`nfc-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Chat"
        style={{ position: 'relative' }}
      >
        {/* Close Icon (Visible when open) */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="28" height="28" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{
            position: 'absolute',
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'all 0.3s ease'
          }}
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>

        {/* Bot Icon (Visible when closed) */}
        <Bot 
          size={28}
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            opacity: isOpen ? 0 : 1,
            transform: isOpen ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
            transition: 'all 0.3s ease',
            pointerEvents: 'none'
          }} 
        />
      </button>
    </div>
  );
}
