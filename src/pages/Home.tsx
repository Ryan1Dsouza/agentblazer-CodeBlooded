import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { siteConfig } from '../data/config';
import StatPanel from '../components/StatPanel';
import ParticleLogo from '../components/ParticleLogo';
import OrbitingSocials from '../components/OrbitingSocials';
import FeaturedEvents from '../components/home/FeaturedEvents';
import '../styles/home.css';

export default function Home() {
  const { theme } = useTheme();
  const logoPath = '/AgentBlazer_Logo_V2.png';

  return (
    <>
    <section className="home-hero" aria-labelledby="home-heading">
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
            <p className="hero-eyebrow">{siteConfig.club.badge}</p>

            <h1 id="home-heading" className="hero-title">
              Pioneering autonomous and agentic AI systems
            </h1>

            <p className="hero-affiliation">
              <span>{siteConfig.department.name}</span>
              <span>{siteConfig.department.college}</span>
            </p>

            <p className="hero-description">
              We bring engineering students together to learn about autonomous and agentic AI
              through practical workshops, collaborative projects, and mentorship.
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
