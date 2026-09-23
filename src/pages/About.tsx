import { useState, useRef, useCallback } from 'react';
import { officers } from '../data/team';
import { committeeMembers } from '../data/committee';
import { siteConfig } from '../data/config';
import { TeamMember } from '../types';
import TeamCard from '../components/TeamCard';
import PortraitPopup from '../components/PortraitPopup';

// Mini component for adding hover previews to non-TeamCard elements
function FloatingPreview({ member, isHovered, side }: { member: any, isHovered: boolean, side: string }) {
  const [imageError, setImageError] = useState(false);
  const hasValidImage = Boolean(member.photoPath) && !imageError;
  
  if (!hasValidImage) return null;

  return (
    <div 
      className={`team-card-floating-preview side-${side} ${isHovered ? 'visible' : ''}`}
      aria-hidden={!isHovered}
    >
      <div className="floating-preview-inner">
        <div className="floating-preview-img-wrapper">
          <img 
            src={member.photoPath} 
            alt={member.name}
            className="floating-preview-img"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </div>
        <div className="floating-preview-caption">
          <span className="floating-preview-name">{member.name}</span>
          <span className="floating-preview-role">{member.role}</span>
        </div>
      </div>
    </div>
  );
}

function HoverableHonoredCard({ p, onSelect }: { p: any, onSelect: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const [side, setSide] = useState<'left' | 'right'>('right');
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setSide(rect.right + 260 <= window.innerWidth ? 'right' : 'left');
    }
    setIsHovered(true);
  }, []);

  return (
    <div 
      ref={cardRef}
      className="honored-card hud-panel"
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <div className="honored-avatar">
        {p.photoPath ? (
          <img src={p.photoPath} alt={p.name} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'12px'}} />
        ) : (
          <span className="honored-initials">{p.name.split(' ').slice(-1)[0][0]}{p.name.split(' ').slice(0, -1).pop()?.[0] || 'D'}</span>
        )}
      </div>
      <div className="honored-body">
        <h4 className="honored-name">{p.name}</h4>
        <p className="honored-org">{p.org}</p>
        <div className="honored-footer">
          <span className="honored-designation">{p.design}</span>
          <span className="honored-tag hud-status-tag">{p.tag}</span>
        </div>
      </div>
      <FloatingPreview member={{ name: p.name, role: p.design, photoPath: p.photoPath }} isHovered={isHovered} side={side} />
    </div>
  );
}

function HoverableFacultyCard({ p, onSelect }: { p: any, onSelect: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const [side, setSide] = useState<'left' | 'right'>('right');
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setSide(rect.right + 260 <= window.innerWidth ? 'right' : 'left');
    }
    setIsHovered(true);
  }, []);

  return (
    <div 
      ref={cardRef}
      className="faculty-card hud-panel" 
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <div className="faculty-avatar">
        {p.photoPath ? (
          <img src={p.photoPath} alt={p.name} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'10px'}} />
        ) : (
          <span className="faculty-initials">{p.initials}</span>
        )}
      </div>
      <div className="faculty-body">
        <h4 className="faculty-name">{p.name}</h4>
        <p className="faculty-designation">{p.role}</p>
      </div>
      <FloatingPreview member={{ name: p.name, role: p.role, photoPath: p.photoPath }} isHovered={isHovered} side={side} />
    </div>
  );
}

export default function About() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const handleAdvisorSelect = (name: string, role: string, photo: string) => {
    setSelectedMember({
      id: `faculty-${name}`,
      name,
      role,
      department: 'CSE',
      category: 'Faculty',
      photoPath: photo,
      organization: siteConfig.department.college
    });
  };
  
  const handleHonoredSelect = (name: string, role: string, org: string, photo: string, tag: string) => {
    setSelectedMember({
      id: `honored-${name}`,
      name,
      role,
      department: tag,
      category: 'Honored Guest',
      photoPath: photo,
      organization: org
    });
  };

  return (
    <section className="about-page">
      <div className="container">
        <div className="hud-section-header">
          <div className="drone-beacon-indicator" aria-hidden="true" />
          <h2 className="hud-section-label">Foundations & Leadership</h2>
        </div>
        
        <div className="inauguration-card glass-panel-elevated">
          <h3>Inauguration & Mentorship Council</h3>
          <p>AgentBlazer was inaugurated with the mission of fostering a culture of innovation in AI and machine learning. Our mentorship council guides students through their journey in building autonomous and agentic AI systems.</p>
          <p>{siteConfig.department.name}<br />{siteConfig.department.college}</p>
        </div>
        
        <div className="hud-section-header">
          <div className="drone-beacon-indicator" aria-hidden="true" />
          <h3 className="hud-section-label">Honored Guests & College Leadership</h3>
        </div>
        <div className="honored-grid">
          {[
            { name: 'Mr. Santosh Rebello', org: 'Salesforce', design: 'Guest of Honor', tag: 'Keynote Speaker', photoPath: '/modes/santhoshRebello.jpg' },
            { name: 'Mr. Stephen Pinto', org: 'Salesforce & SJEC Alumnus', design: 'Technical Mentor', tag: 'Alumni Guide', photoPath: '' },
            { name: "Dr. Rio D'Souza", org: 'Principal, SJEC', design: 'Presidential Address', tag: 'Patron', photoPath: '/modes/principal.jpg' },
            { name: "Dr. Melwyn D'Souza", org: 'HOD, Computer Science & Engineering', design: 'Program Chair', tag: 'Department Head', photoPath: '/modes/Melwyn.jpg' },
          ].map((p, i) => (
            <HoverableHonoredCard 
              key={i} 
              p={p} 
              onSelect={() => handleHonoredSelect(p.name, p.design, p.org, p.photoPath, p.tag)} 
            />
          ))}
        </div>
        
        <div className="hud-section-header">
          <div className="drone-beacon-indicator" aria-hidden="true" />
          <h3 className="hud-section-label">Faculty Advisory Council</h3>
        </div>
        <div className="faculty-council">
          <div className="faculty-row">
            {[
              { name: 'Ms. Nisha Roche', role: 'Assistant Professor, CSE • Faculty Coordinator', initials: 'NR', photoPath: '/modes/nishaRoche.jpg' },
              { name: 'Mr. Keith Fernandes', role: 'Assistant Professor, CSE • Faculty Coordinator', initials: 'KF', photoPath: '/Photos/mr-keith-raymond-fernandes.jpg' }
            ].map((p, i) => (
              <HoverableFacultyCard 
                key={i} 
                p={p} 
                onSelect={() => handleAdvisorSelect(p.name, p.role, p.photoPath)} 
              />
            ))}
          </div>
        </div>
        
        <div className="hud-section-header">
          <div className="drone-beacon-indicator" aria-hidden="true" />
          <h3 className="hud-section-label">Student Core Team & Officers</h3>
        </div>
        <div className="team-grid">
          {officers.map((member) => (
            <TeamCard 
              key={member.id} 
              member={{ ...member, category: 'Officer' }} 
              onSelect={setSelectedMember} 
              isSelected={selectedMember?.id === member.id}
            />
          ))}
        </div>

        <div className="hud-section-header">
          <div className="drone-beacon-indicator" aria-hidden="true" />
          <h3 className="hud-section-label">Core Working Committee</h3>
        </div>
        <div className="committee-grid">
          {committeeMembers.map((member) => (
            <TeamCard 
              key={member.id} 
              member={{ ...member, category: 'Committee' }} 
              onSelect={() => {}} 
              isSelected={false}
            />
          ))}
        </div>
      </div>
      
      <PortraitPopup 
        member={selectedMember} 
        onClose={() => setSelectedMember(null)} 
      />
    </section>
  );
}
