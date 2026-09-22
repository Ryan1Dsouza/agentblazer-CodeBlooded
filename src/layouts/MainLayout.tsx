import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackgroundScene from '../three/BackgroundScene';
import CursorFollower from '../components/CursorFollower';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isEventsPage = location.pathname === '/events';

  useEffect(() => {
    document.title = 'AgentBlazer - CodeBlooded';
  }, []);

  return (
    <div className="app-layout">
      {!isEventsPage && <BackgroundScene />}
      <CursorFollower />
      <Header />
      <main className={`main-content ${isEventsPage ? 'events-main-override' : ''}`}>
        {children}
      </main>
      {!isEventsPage && <Footer />}
    </div>
  );
}
