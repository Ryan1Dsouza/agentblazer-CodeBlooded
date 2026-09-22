import { siteConfig } from '../data/config';

export default function Join() {
  return (
    <section className="join-page">
      <div className="container">
        <div className="join-cta">
          <img src={siteConfig.club.logoPath} alt="AgentBlazer" className="join-logo" />
          <span className="join-badge">Become a Member</span>
          <h2 className="join-title">Join AgentBlazer</h2>
          <p className="join-description">
            Be part of a vibrant community of innovators, engineers, and AI enthusiasts. 
            Unlock opportunities, build real projects, and shape the future of technology.
          </p>
          <div className="join-buttons">
            <button className="btn-primary">Become a Member</button>
            <button className="btn-secondary">Contact CSE Department</button>
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
