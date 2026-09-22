import { Link } from 'react-router-dom';
import { siteConfig } from '../data/config';
import StatPanel from '../components/StatPanel';
import Badge from '../components/Badge';

export default function Home() {
  return (
    <section className="home-hero">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            <Badge text={siteConfig.club.badge} />
            
            <h1 className="hero-title">
              Pioneering Autonomous<br />
              <span className="accent-text">and Agentic</span> AI Systems
            </h1>
            
            <p className="hero-dept">
              {siteConfig.department.name}<br />
              {siteConfig.department.college}
            </p>
            
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
          
          <div className="hero-visual">
            <div className="logo-container">
              <img 
                src={siteConfig.club.logoPath} 
                alt="AgentBlazer Logo" 
                className="hero-logo"
              />
              <div className="logo-glow" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
