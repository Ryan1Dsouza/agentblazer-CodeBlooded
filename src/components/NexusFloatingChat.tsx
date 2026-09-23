import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

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
      content: 'Hi! I am Nexus AI. I can answer questions about AgentBlazer, our events, and community. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Convert local state messages to API format
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
        <div className="nfc-window glass-panel-elevated" style={{ height: '500px', display: 'flex', flexDirection: 'column', position: 'relative', padding: 0 }}>
          <div className="nfc-header">
            <div className="nfc-header-info">
              <span className="nfc-avatar">🤖</span>
              <div>
                <h4>Nexus AI</h4>
                <p className="nfc-status">Online</p>
              </div>
            </div>
            <button className="nfc-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          
          <div className="nfc-messages" style={{ flex: '1 1 0%', minHeight: 0, paddingBottom: '80px', overflowY: 'auto' }}>
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

          <form className="nfc-input-form" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', margin: 0, boxSizing: 'border-box' }} onSubmit={handleSend}>
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

        {/* Logo Icon (Visible when closed) */}
        <img 
          src="/logos/chatbot-logo.png" 
          alt="AgentBlazer AI" 
          style={{
            position: 'absolute',
            width: '100%', 
            height: '100%', 
            borderRadius: '50%', 
            objectFit: 'cover',
            opacity: isOpen ? 0 : 1,
            transform: isOpen ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
            transition: 'all 0.3s ease',
            padding: '2px' // slight inset so the glass border shows around it
          }} 
        />
      </button>
    </div>
  );
}
