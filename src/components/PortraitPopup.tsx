import { useEffect, useRef, useState } from 'react';
import { TeamMember } from '../types';

interface Props {
  member: TeamMember | null;
  onClose: () => void;
}

export default function PortraitPopup({ member, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!member || !dialog) return;
    setImageError(false);
    if (!dialog.open) dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, [member]);

  if (!member) return null;

  return (
    <dialog
      ref={dialogRef}
      className="about-profile-dialog about-surface"
      aria-labelledby="about-profile-name"
      onCancel={onClose}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <button type="button" className="about-dialog-close" onClick={onClose} aria-label="Close profile">×</button>
      <div className="about-profile-layout">
        {member.photoPath && !imageError ? (
          <img src={member.photoPath} alt={member.name} className="about-profile-photo" onError={() => setImageError(true)} />
        ) : (
          <div className="about-profile-initials" aria-hidden="true">
            {member.name.replace(/^(Mr\.|Ms\.|Dr\.)\s*/, '').split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('')}
          </div>
        )}
        <div className="about-profile-copy">
          <p className="about-eyebrow">{member.category}</p>
          <h2 id="about-profile-name">{member.name}</h2>
          <p>{member.role}</p>
          <p>{member.organization || member.department}</p>
          {member.description && <p>{member.description}</p>}
          {member.quote && <blockquote>“{member.quote}”</blockquote>}
        </div>
      </div>
    </dialog>
  );
}
