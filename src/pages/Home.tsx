import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { siteConfig } from '../data/config';
import StatPanel from '../components/StatPanel';
import Badge from '../components/Badge';
import ParticleLogo from '../components/ParticleLogo';
import OrbitingSocials from '../components/OrbitingSocials';
import FeaturedEvents from '../components/home/FeaturedEvents';
import '../styles/home.css';

export default function Home() {
  const { theme } = useTheme();
  const logoPath = '/AgentBlazer_Logo_V2.png';

  return (
    <>
    <section className="home-hero">
      <div className="container">
        <div className="hero-grid centered-layout">
          <div className="hero-visual">
            <div className="logo-container logo-container-large" style={{ background: "transparent", border: "none" }}>
              {/* Persistent Solid-Powdered Particle Logo */}
              <ParticleLogo logoPath={logoPath} alt="AgentBlazer Logo" theme={theme} />

              {/* Theme Glow Layer */}
              <div className={`logo-glow-${theme === "inferno" ? "inferno" : theme === "frost" ? "frost" : "violet"}`} />

              {/* Continuous Orbiting Social Media Icons */}
              <OrbitingSocials theme={theme} />
            </div>
          </div>

          <div className="hero-content centered-content">
            <div className="hero-badge-wrapper">
              <Badge text={siteConfig.club.badge} />
            </div>

            <h1 className="hero-title">
              Pioneering Autonomous<br />
              <span className="accent-text">and Agentic</span> AI Systems
            </h1>

            <div className="hero-dept-card">
              <div className="dept-indicator" aria-hidden="true" />
              <p className="hero-dept">
                <span className="hero-dept-main">{siteConfig.department.name}</span>
                <span className="hero-dept-sub">{siteConfig.department.college}</span>
              </p>
            </div>

            <p className="hero-description">
              {siteConfig.club.description}
            </p>

            <div className="hero-buttons">
              <Link to="/events" className="btn-primary">
                Explore Workshops & Events
              </Link>
              <Link to="/about" className="btn-secondary">
                Read Club Charter
              </Link>
            </div>

            <StatPanel />
          </div>
        </div>
      </div>
    </section>
    <FeaturedEvents />
    </>
  );
}
