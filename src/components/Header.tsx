import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types';
import { siteConfig } from '../data/config';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About Us' },
  { path: '/events', label: 'Events & Workshops' },
  { path: '/join', label: 'Join & Connect' },
  { path: '/community', label: 'AgentBlazer Hub' }
];

const themes: { id: Theme; label: string }[] = [
  { id: 'violet', label: 'Violet' },
  { id: 'inferno', label: 'Inferno' },
  { id: 'frost', label: 'Frost' }
];

export default function Header() {
  const { theme, switchTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const logoPath = '/AgentBlazer_Logo_V2.png';

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={`header ${isMenuOpen ? 'menu-open' : ''}`}>
      <div className="header-top">
        <div className="header-left">
          <img
            src={logoPath}
            alt="AgentBlazer"
            className="header-logo"
          />
          <span className="header-dept">{siteConfig.department.name}</span>
        </div>
        
        <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Toggle navigation menu">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={`header-content ${isMenuOpen ? 'show' : ''}`}>
        <nav className="header-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMenu}
              className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-themes">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => { switchTheme(t.id); closeMenu(); }}
              className={`theme-btn ${theme === t.id ? 'active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
