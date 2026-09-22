import { useState, useRef, useCallback } from 'react';
import { Advisor } from '../types';

interface AdvisorCardProps {
  advisor: Advisor;
  onSelect?: (advisor: Advisor) => void;
}

export default function AdvisorCard({ advisor, onSelect }: AdvisorCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [side, setSide] = useState<'left' | 'right'>('right');
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const previewWidth = 240;
      const margin = 20;
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

  const hasValidImage = Boolean(advisor.photoPath) && !imageError;

  return (
    <div 
      ref={cardRef}
      className={`advisor-card glass-panel ${hasValidImage ? 'has-photo' : ''}`}
      onClick={() => onSelect?.(advisor)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div>
        <h4>{advisor.name}</h4>
        <p className="advisor-dept">{advisor.department}</p>
      </div>
      <p className="advisor-role">{advisor.role}</p>

      {hasValidImage && (
        <div 
          className={`team-card-floating-preview side-${side} ${isHovered ? 'visible' : ''}`}
          aria-hidden={!isHovered}
        >
          <div className="floating-preview-inner">
            <div className="floating-preview-img-wrapper">
              <img 
                src={advisor.photoPath} 
                alt={advisor.name}
                className="floating-preview-img"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            </div>
            <div className="floating-preview-caption">
              <span className="floating-preview-name">{advisor.name}</span>
              <span className="floating-preview-role">{advisor.role}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
