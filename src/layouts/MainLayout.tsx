import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CursorFollower from '../components/CursorFollower';
import NexusFloatingChat from '../components/NexusFloatingChat';

import { lazy, Suspense } from 'react';
const BackgroundScene = lazy(() => import('../three/BackgroundScene'));

import Home from '../pages/Home';
import About from '../pages/About';
import Join from '../pages/Join';
import Community from '../pages/Community';

const MOBILE_SECTIONS = [
  { id: 'home',      label: 'Home',            path: '/' },
  { id: 'about',     label: 'About Us',        path: '/about' },
  { id: 'events',    label: 'Events',          path: '/events' },  // link-out
  { id: 'join',      label: 'Join',            path: '/join' },
  { id: 'community', label: 'AgentBlazer Hub', path: '/community' },
];

function useMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const isEventsPage = location.pathname === '/events';

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [deferBackground, setDeferBackground] = useState(true);

  useEffect(() => {
    let interactionFired = false;
    const enableBackground = () => {
      if (!interactionFired) {
        interactionFired = true;
        setDeferBackground(false);
      }
    };
    window.addEventListener('mousemove', enableBackground, { once: true });
    window.addEventListener('scroll', enableBackground, { once: true });
    window.addEventListener('touchstart', enableBackground, { once: true });
    
    return () => {
      window.removeEventListener('mousemove', enableBackground);
      window.removeEventListener('scroll', enableBackground);
      window.removeEventListener('touchstart', enableBackground);
    };
  }, []);

  useEffect(() => {
    document.title = 'AgentBlazer - CodeBlooded';
  }, []);

  // On mobile: when user navigates via router, scroll to that section instead
  useEffect(() => {
    if (!isMobile) return;
    const matched = MOBILE_SECTIONS.find(s => s.path === location.pathname);
    if (matched && matched.id !== 'events') {
      const el = sectionRefs.current[matched.id];
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        });
      }
    }
  }, [location.pathname, isMobile]);

  // ── Desktop: regular layout ───────────────────────────────────────────────
  if (!isMobile) {
    return (
      <div className="app-layout">
        {!isEventsPage && !deferBackground && (
          <Suspense fallback={null}>
            <BackgroundScene />
          </Suspense>
        )}
        <CursorFollower />
        <Header />
        <main className={`main-content ${isEventsPage ? 'events-main-override' : ''}`}>
          {children}
        </main>
        {location.pathname === '/' && <Footer />}
        {!isEventsPage && <NexusFloatingChat />}
      </div>
    );
  }

  // ── Mobile: one-page scrolling layout ─────────────────────────────────────
  // Only use this layout for the core site pages; standalone tools like /events and /admin should render normally.
  if (isMobile && location.pathname !== '/events' && location.pathname !== '/admin') {
    return (
      <div className="app-layout mobile-onepage">
      <CursorFollower />

      {/* Standard Header provides the hamburger menu on mobile */}
      <Header />

      {/* All sections stacked */}
      <main className="mobile-onepage-main">
        <section
          id="home"
          ref={(el) => { sectionRefs.current['home'] = el; }}
          className="mobile-page-section"
        >
          <Home />
        </section>

        <div className="mobile-section-divider" />

        <section
          id="about"
          ref={(el) => { sectionRefs.current['about'] = el; }}
          className="mobile-page-section"
        >
          <About />
        </section>

        <div className="mobile-section-divider" />

        {/* Events: teaser card with link-out (3D canvas too heavy for scroll embed) */}
        <section
          id="events"
          ref={(el) => { sectionRefs.current['events'] = el; }}
          className="mobile-page-section mobile-events-teaser"
        >
          <div className="mobile-events-card">
            <div className="mobile-events-icon">🚀</div>
            <h2>Events &amp; Workshops</h2>
            <p>Our interactive 3D event experience is best viewed in full screen mode. Tap below to explore!</p>
            <button className="btn-primary" onClick={() => navigate('/events')}>
              Open 3D Events Hall →
            </button>
          </div>
        </section>

        <div className="mobile-section-divider" />

        <section
          id="join"
          ref={(el) => { sectionRefs.current['join'] = el; }}
          className="mobile-page-section"
        >
          <Join />
        </section>

        <div className="mobile-section-divider" />

        <section
          id="community"
          ref={(el) => { sectionRefs.current['community'] = el; }}
          className="mobile-page-section"
        >
          <Community />
        </section>

        <Footer />
      </main>

        <NexusFloatingChat />
      </div>
    );
  }

  // Fallback if none of the above conditions are met (e.g., /events or /admin on mobile)
  return (
    <div className="app-layout">
      {!isEventsPage && !deferBackground && (
        <Suspense fallback={null}>
          <BackgroundScene />
        </Suspense>
      )}
      <CursorFollower />
      <Header />
      <main className={`main-content ${isEventsPage ? 'events-main-override' : ''}`}>
        {children}
      </main>
      {!isEventsPage && <NexusFloatingChat />}
    </div>
  );
}
