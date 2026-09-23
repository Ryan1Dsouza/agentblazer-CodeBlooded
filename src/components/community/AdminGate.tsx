import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminGate() {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.setItem('isAdmin', 'true');
    navigate('/community', { replace: true });
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      color: 'var(--accent-primary)',
      fontFamily: 'monospace',
      fontSize: '1.1rem'
    }}>
      Authenticating... Redirecting to AgentBlazer Hub.
    </div>
  );
}
