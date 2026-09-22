import { NavLink } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types';
import { siteConfig } from '../data/config';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About Us' },
  { path: '/events', label: 'Events & Workshops' },
  { path: '/join', label: 'Join & Connect' }
];

const themes: { id: Theme; label: string }[] = [
  { id: 'violet', label: 'Violet' },
  { id: 'inferno', label: 'Inferno' },
  { id: 'frost', label: 'Frost' }
];

export default function Header() {
  const { theme, switchTheme } = useTheme();
  const logoPath = '/assets/logos/logo_clean.png';

  return (
    <header className="header">
      <div className="header-left">
        <img 
          src={logoPath || '/assets/AgentBlazer_Logo_Transparent.png'} 
          alt="AgentBlazer" 
          className="header-logo"
        />
        <div className="header-brand">
          <span className="header-title">{siteConfig.club.name}</span>
          <span className="header-subtitle">collective</span>
        </div>
        <span className="header-dept">{siteConfig.department.name}</span>
      </div>
      
      <nav className="header-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
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
            onClick={() => switchTheme(t.id)}
            className={`theme-btn ${theme === t.id ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </header>
  );
}
