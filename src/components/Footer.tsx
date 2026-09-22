import { siteConfig } from '../data/config';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <img src={siteConfig.club.logoPath} alt="AgentBlazer" className="footer-logo" />
            <div>
              <h3>{siteConfig.club.name}</h3>
              <p>{siteConfig.department.name}</p>
              <p>{siteConfig.department.college}</p>
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
            <p>{siteConfig.contact.email}</p>
            <p>{siteConfig.contact.phone}</p>
            <p>{siteConfig.department.college}</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2026 {siteConfig.club.name} - CodeBlooded. All rights reserved.</p>
          <p>Organized by {siteConfig.department.name} in collaboration with Cipher (CSE Association)</p>
        </div>
      </div>
    </footer>
  );
}
