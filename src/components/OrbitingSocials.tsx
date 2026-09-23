import React from 'react';

// Crisp inline SVGs for standard brand social icons (Instagram, LinkedIn, GitHub)
function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedInIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GitHubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

interface OrbitingSocialsProps {
  theme: string;
}

export default function OrbitingSocials({}: OrbitingSocialsProps) {
  const socials = [
    {
      name: 'Instagram',
      icon: InstagramIcon,
      url: 'https://www.instagram.com/agentblazer.sjec?stkn=YTBoZ2xkZWx5MDky',
      angle: 0,
      color: '#E1306C' // Instagram Pink/Red
    },
    {
      name: 'LinkedIn',
      icon: LinkedInIcon,
      url: 'https://www.linkedin.com/in/theagentblazerclubsjec/',
      angle: 120,
      color: '#0A66C2' // LinkedIn Blue
    },
    {
      name: 'GitHub',
      icon: GitHubIcon,
      url: 'https://github.com/AgentBlazer',
      angle: 240,
      color: '#fafafa' // GitHub White
    }
  ];

  return (
    <div className="orbit-system-wrapper" aria-label="Social media links">
      <div className="orbit-track-ring" />
      {socials.map((s, index) => {
        const Icon = s.icon;
        return (
          <div
            key={s.name}
            className={`orbit-item orbit-item-${index}`}
            style={{ '--start-angle': `${s.angle}deg` } as React.CSSProperties}
          >
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="orbit-icon-btn"
              style={{ color: s.color, borderColor: s.color, boxShadow: `0 0 10px ${s.color}66` }}
              aria-label={s.name}
              title={s.name}
            >
              <Icon size={28} />
            </a>
          </div>
        );
      })}
    </div>
  );
}
