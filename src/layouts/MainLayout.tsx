import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackgroundScene from '../three/BackgroundScene';
import CursorFollower from '../components/CursorFollower';
import NexusFloatingChat from '../components/NexusFloatingChat';

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

  // Track which section is in view on mobile for active nav highlight
  const [activeSection, setActiveSection] = useState('home');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

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
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.pathname, isMobile]);

  // IntersectionObserver: track active section for nav highlight
  useEffect(() => {
    if (!isMobile) return;
    const observers: IntersectionObserver[] = [];

    MOBILE_SECTIONS.filter(s => s.id !== 'events').forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [isMobile]);

  // Mobile nav click handler
  const handleMobileNav = (section: typeof MOBILE_SECTIONS[0]) => {
    if (section.id === 'events') {
      navigate('/events');
      return;
    }
    navigate(section.path, { replace: true });
    const el = sectionRefs.current[section.id];
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Desktop: regular layout ───────────────────────────────────────────────
  if (!isMobile) {
    return (
      <div className="app-layout">
        {!isEventsPage && <BackgroundScene />}
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

      {/* Sticky mobile nav */}
      <header className="mobile-onepage-header">
        <div className="mobile-nav-brand">
          <img src="/AgentBlazer_Logo.png" alt="AgentBlazer" className="header-logo" style={{ width: 28, height: 28 }} />
          <span className="header-title" style={{ fontSize: '0.9rem' }}>AgentBlazer</span>
        </div>
        <nav className="mobile-onepage-nav">
          {MOBILE_SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`mobile-nav-pill ${activeSection === s.id ? 'active' : ''} ${s.id === 'events' ? 'mobile-nav-events-link' : ''}`}
              onClick={() => handleMobileNav(s)}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </header>

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
      {!isEventsPage && <BackgroundScene />}
      <CursorFollower />
      <Header />
      <main className={`main-content ${isEventsPage ? 'events-main-override' : ''}`}>
        {children}
      </main>
      {!isEventsPage && <NexusFloatingChat />}
    </div>
  );
}
