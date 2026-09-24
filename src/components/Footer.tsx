import { siteConfig } from '../data/config';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo-wrapper">
              <img src="/AgentBlazer_Logo.png" alt="AgentBlazer" className="footer-logo" />
            </div>
            <div className="footer-brand-info">
              <h3>{siteConfig.club.name}</h3>
              <p className="footer-brand-dept">{siteConfig.department.name}</p>
              <p className="footer-brand-college">{siteConfig.department.college}</p>
            </div>
          </div>
          <div className="footer-links">
            <h4>Quick Links</h4>
            <a href="/">Home</a>
            <a href="/about">About Us</a>
            <a href="/events">Events</a>
            <a href="/join">Join & Connect</a>
          </div>
          <div className="footer-contact">
            <h4>Contact</h4>
            <p className="footer-contact-item">
              <span className="contact-label">Email:</span> {siteConfig.contact.email}
            </p>
            <p className="footer-contact-item">
              <span className="contact-label">Phone:</span> {siteConfig.contact.phone}
            </p>
            <p className="footer-contact-item">
              <span className="contact-label">Location:</span> {siteConfig.department.college}
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 {siteConfig.club.name} - CodeBlooded. All rights reserved.</p>
          <p className="footer-bottom-sub">Organized by {siteConfig.department.name} in collaboration with Cipher (CSE Association)</p>
        </div>
      </div>
    </footer>
  );
}
