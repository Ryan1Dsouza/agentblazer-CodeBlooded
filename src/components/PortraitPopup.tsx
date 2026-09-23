import { TeamMember } from '../types';

interface Props {
  member: TeamMember | null;
  onClose: () => void;
}

export default function PortraitPopup({ member, onClose }: Props) {
  if (!member) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>×</button>
        <span className={`popup-badge ${member.category.toLowerCase().replace(' ', '-')}`}>
          {member.category}
        </span>
        <img src={member.photoPath} alt={member.name} className="popup-photo" />
        <h3 className="popup-name">{member.name}</h3>
        <p className="popup-role">{member.role}</p>
        {member.quote && (
          <p className="popup-quote">"{member.quote}"</p>
        )}
        {member.organization && (
          <p className="popup-org">{member.organization}</p>
        )}
      </div>
    </div>
  );
}
