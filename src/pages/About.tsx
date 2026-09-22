import { useState } from 'react';
import { officers } from '../data/team';
import { committeeMembers } from '../data/committee';
import { siteConfig } from '../data/config';
import { TeamMember } from '../types';
import TeamCard from '../components/TeamCard';
import PortraitPopup from '../components/PortraitPopup';

export default function About() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const handleAdvisorSelect = (name: string, role: string) => {
    const photoMap: Record<string, string> = {
      'Mr. Keith Fernandes': '/assets/Photos/mr-keith-raymond-fernandes.jpg',
    };
    const photo = photoMap[name] || '';
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

  return (
    <section className="about-page">
      <div className="container">
        <h2 className="section-title">Foundations & Leadership</h2>
        
        <div className="inauguration-card glass-panel-elevated">
          <h3>Inauguration & Mentorship Council</h3>
          <p>AgentBlazer was inaugurated with the mission of fostering a culture of innovation in AI and machine learning. Our mentorship council guides students through their journey in building autonomous and agentic AI systems.</p>
          <p>{siteConfig.department.name}<br />{siteConfig.department.college}</p>
        </div>
        
        <h3 className="section-subtitle">Honored Guests & College Leadership</h3>
        <div className="honored-grid">
          {[
            { name: 'Mr. Santosh Rebello', org: 'Salesforce', design: 'Guest of Honor', tag: 'Keynote Speaker' },
            { name: 'Mr. Stephen Pinto', org: 'Salesforce & SJEC Alumnus', design: 'Technical Mentor', tag: 'Alumni Guide' },
            { name: "Dr. Rio D'Souza", org: 'Principal, SJEC', design: 'Presidential Address', tag: 'Patron' },
            { name: "Dr. Melwyn D'Souza", org: 'HOD, Computer Science & Engineering', design: 'Program Chair', tag: 'Department Head' },
          ].map((p, i) => (
            <div key={i} className="honored-card glass-panel-elevated">
              <div className="honored-avatar">
                <span className="honored-initials">{p.name.split(' ').slice(-1)[0][0]}{p.name.split(' ').slice(0, -1).pop()?.[0] || 'D'}</span>
              </div>
              <div className="honored-body">
                <h4 className="honored-name">{p.name}</h4>
                <p className="honored-org">{p.org}</p>
                <div className="honored-footer">
                  <span className="honored-designation">{p.design}</span>
                  <span className="honored-tag">{p.tag}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <h3 className="section-subtitle">Faculty Advisory Council</h3>
        <div className="faculty-council">
          <div className="faculty-row">
            <div className="faculty-card glass-panel" onClick={() => handleAdvisorSelect('Ms. Nisha Roche', 'Assistant Professor, CSE • Faculty Coordinator')}>
              <div className="faculty-avatar">
                <span className="faculty-initials">NR</span>
              </div>
              <div className="faculty-body">
                <h4 className="faculty-name">Ms. Nisha Roche</h4>
                <p className="faculty-designation">Assistant Professor, CSE • Faculty Coordinator</p>
              </div>
            </div>
            <div className="faculty-card glass-panel" onClick={() => handleAdvisorSelect('Mr. Keith Fernandes', 'Assistant Professor, CSE • Faculty Coordinator')}>
              <div className="faculty-avatar">
                <span className="faculty-initials">KF</span>
              </div>
              <div className="faculty-body">
                <h4 className="faculty-name">Mr. Keith Fernandes</h4>
                <p className="faculty-designation">Assistant Professor, CSE • Faculty Coordinator</p>
              </div>
            </div>
          </div>
        </div>
        
        <h3 className="section-subtitle">Student Core Team & Officers</h3>
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

        <h3 className="section-subtitle">Core Working Committee</h3>
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
