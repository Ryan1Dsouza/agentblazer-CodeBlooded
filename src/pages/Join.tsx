import { useTheme } from '../hooks/useTheme';
import { siteConfig } from '../data/config';
import ParticleLogo from '../components/ParticleLogo';
import OrbitingSocials from '../components/OrbitingSocials';

export default function Join() {
  const { theme } = useTheme();
  const logoPath = '/AgentBlazer_Logo_Ready (1).png';

  return (
    <section className="join-page">
      <div className="container">
        <div className="join-cta">
          {/* Centered Particle Logo & Orbiting Socials Container */}
          <div className="join-logo-wrapper">
            <div className="logo-container join-logo-box" style={{ background: "transparent", border: "none" }}>
              <ParticleLogo logoPath={logoPath} alt="AgentBlazer Logo" theme={theme} />
              <div className={`logo-glow-${theme === "inferno" ? "inferno" : theme === "frost" ? "frost" : "violet"}`} />
              <OrbitingSocials theme={theme} />
            </div>
          </div>

          <span className="join-badge">Become a Member</span>
          <h2 className="join-title">Join AgentBlazer</h2>
          <p className="join-description">
            Be part of a vibrant community of innovators, engineers, and AI enthusiasts. 
            Unlock opportunities, build real projects, and shape the future of technology.
          </p>
          <div className="join-buttons">
              <a href="mailto:agentblazer@sjec.ac.in?subject=AgentBlazer%20Membership%20Application%20-%20%5BYour%20Name%5D&body=Hi%20AgentBlazer%20Team%2C%0D%0AI%20would%20like%20to%20join%20AgentBlazer%20as%20a%20member.%0D%0A%0D%0AWhy%20I%20want%20to%20join%3A%0D%0A%5BPlease%20explain%20why%20you%20want%20to%20join%20AgentBlazer%20and%20what%20you%20are%20interested%20in%20contributing.%5D%0D%0A%0D%0AGitHub%3A%0D%0A%5BPaste%20your%20GitHub%20profile%20link%5D%0D%0A%0D%0ALinkedIn%3A%0D%0A%5BPaste%20your%20LinkedIn%20profile%20link%5D%0D%0A%0D%0AThank%20you%2C%0D%0A%5BYour%20Name%5D" className="btn-primary">Become a Member</a>
              <a href="mailto:cse.dept@sjec.ac.in?subject=AgentBlazer%20CSE%20Department%20Contact" className="btn-secondary">Contact CSE Department</a>
          </div>
        </div>
        
        <div className="contact-card glass-panel-elevated">
          <h3>Department of Computer Science & Engineering</h3>
          <p>{siteConfig.department.college}</p>
          <div className="contact-details">
            <div className="contact-item">
              <span className="contact-label">Email</span>
              <span className="contact-value">{siteConfig.contact.email}</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Phone</span>
              <span className="contact-value">{siteConfig.contact.phone}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
