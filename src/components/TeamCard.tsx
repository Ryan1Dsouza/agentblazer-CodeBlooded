import { useState, useRef, useCallback } from 'react';
import { TeamMember } from '../types';

interface Props {
  member: TeamMember;
  onSelect: (member: TeamMember) => void;
  isSelected: boolean;
}

export default function TeamCard({ member, onSelect, isSelected }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [side, setSide] = useState<'left' | 'right'>('right');
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const previewWidth = 240;
      const margin = 20;
      // Choose side based on available screen space so preview doesn't go off-screen
      if (rect.right + previewWidth + margin <= window.innerWidth) {
        setSide('right');
      } else {
        setSide('left');
      }
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Do not add placeholder images if person has no image or image failed to load
  const hasValidImage = Boolean(member.photoPath) && !imageError;

  return (
    <div 
      ref={cardRef}
      className={`team-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(member)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className={`team-badge ${member.category.toLowerCase().replace(/\s+/g, '-')}`}>
        {member.category}
      </span>
      <h3 className="team-name">{member.name}</h3>
      <p className="team-role">{member.role}</p>
      <p className="team-dept">{member.department}</p>

      {hasValidImage && (
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
      )}
      
      <div className="hud-telemetry-footer" aria-hidden="true" />
    </div>
  );
}
