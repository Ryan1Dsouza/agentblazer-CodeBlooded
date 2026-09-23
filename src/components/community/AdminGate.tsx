import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

const ADMIN_PASSWORD = 'agent@2025';

export default function AdminGate() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const themeAccent =
    theme === 'inferno' ? '#ff6b35' : theme === 'frost' ? '#0ea5e9' : '#a855f7';
  const themeGlow =
    theme === 'inferno'
      ? 'rgba(255, 107, 53, 0.3)'
      : theme === 'frost'
      ? 'rgba(14, 165, 233, 0.3)'
      : 'rgba(168, 85, 247, 0.3)';

  // If already authenticated in this session, redirect immediately
  useEffect(() => {
    if (sessionStorage.getItem('isAdmin') === 'true') {
      navigate('/community', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticating(true);
      sessionStorage.setItem('isAdmin', 'true');
      setTimeout(() => {
        navigate('/community', { replace: true });
      }, 1200);
    } else {
      setShake(true);
      setError('ACCESS DENIED — Invalid credentials');
      setPassword('');
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      background: 'var(--bg-primary, #0a0a12)',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    }}>
      {/* Scanline overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        maxWidth: '420px',
        padding: '0 24px',
      }}>
        {/* Terminal header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          opacity: 0.6,
        }}>
          <span style={{ color: '#ef4444', fontSize: '10px' }}>●</span>
          <span style={{ color: '#eab308', fontSize: '10px' }}>●</span>
          <span style={{ color: '#22c55e', fontSize: '10px' }}>●</span>
          <span style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: '11px',
            marginLeft: '8px',
            letterSpacing: '1px',
          }}>
            ADMIN_TERMINAL v2.0
          </span>
        </div>

        {/* Main card */}
        <div style={{
          border: `1px solid ${themeAccent}44`,
          borderRadius: '16px',
          padding: '40px 32px',
          background: 'rgba(10, 10, 18, 0.9)',
          backdropFilter: 'blur(20px)',
          boxShadow: `0 0 60px ${themeGlow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}>
          {/* Lock icon */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: `2px solid ${themeAccent}66`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: `0 0 30px ${themeGlow}`,
              animation: isAuthenticating ? 'none' : undefined,
            }}>
              {isAuthenticating ? '✓' : '🔒'}
            </div>
          </div>

          {/* Title */}
          <h2 style={{
            textAlign: 'center',
            color: '#fff',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            margin: '0 0 8px 0',
            textShadow: `0 0 10px ${themeAccent}`,
          }}>
            {isAuthenticating ? 'ACCESS GRANTED' : 'RESTRICTED ACCESS'}
          </h2>

          <p style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '11px',
            letterSpacing: '2px',
            margin: '0 0 32px 0',
          }}>
            {isAuthenticating
              ? 'Redirecting to command center...'
              : 'ADMIN AUTHENTICATION REQUIRED'}
          </p>

          {!isAuthenticating && (
            <form onSubmit={handleSubmit}>
              {/* Password field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  color: themeAccent,
                  fontSize: '10px',
                  letterSpacing: '2px',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                }}>
                  ▸ ENTER ACCESS KEY
                </label>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${error ? '#ef4444' : themeAccent + '44'}`,
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '16px',
                    letterSpacing: '4px',
                    fontFamily: "'JetBrains Mono', monospace",
                    outline: 'none',
                    transition: 'border-color 0.3s, box-shadow 0.3s',
                    boxShadow: error ? '0 0 15px rgba(239,68,68,0.2)' : 'none',
                    boxSizing: 'border-box',
                    animation: shake ? 'adminShake 0.4s ease' : undefined,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = themeAccent;
                    e.target.style.boxShadow = `0 0 20px ${themeGlow}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error ? '#ef4444' : themeAccent + '44';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Error message */}
              {error && (
                <div style={{
                  color: '#ef4444',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  marginBottom: '16px',
                  textAlign: 'center',
                  animation: 'adminFadeIn 0.3s ease',
                }}>
                  ⚠ {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  background: `linear-gradient(135deg, ${themeAccent}cc, ${themeAccent}88)`,
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: 'all 0.3s ease',
                  boxShadow: `0 4px 20px ${themeGlow}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 30px ${themeGlow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 20px ${themeGlow}`;
                }}
              >
                AUTHENTICATE
              </button>
            </form>
          )}

          {/* Authenticating spinner */}
          {isAuthenticating && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '8px',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: `2px solid ${themeAccent}33`,
                borderTopColor: themeAccent,
                borderRadius: '50%',
                animation: 'adminSpin 0.8s linear infinite',
              }} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.2)',
          fontSize: '10px',
          letterSpacing: '1px',
          marginTop: '20px',
        }}>
          AgentBlazer Admin Terminal • Authorized Personnel Only
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes adminShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes adminFadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes adminSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
