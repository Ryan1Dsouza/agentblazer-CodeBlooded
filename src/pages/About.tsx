import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { officers } from '../data/team';
import { committeeMembers } from '../data/committee';
import { siteConfig } from '../data/config';
import { TeamMember } from '../types';
import PortraitPopup from '../components/PortraitPopup';
import AboutPortraitPreview from '../components/AboutPortraitPreview';
import testcaseImg from '../../assets/Photos/testcase.jpg';
import '../styles/about.css';

const honoredMembers: TeamMember[] = [
  {
    id: 'honored-santosh', name: 'Mr. Santosh Rebello', role: 'Guest of Honor',
    organization: 'Salesforce', department: 'Keynote Speaker', category: 'Leadership',
    photoPath: '/Photos/santhoshRebello.jpg',
    quote: "A language that doesn't affect the way you think about programming is not worth knowing.",
  },
  {
    id: 'honored-stephen', name: 'Mr. Stephen Pinto', role: 'Technical Mentor',
    organization: 'Salesforce & SJEC Alumnus', department: 'Alumni Guide', category: 'Leadership',
    photoPath: '',
    quote: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.',
  },
  {
    id: 'honored-rio', name: "Dr. Rio D'Souza", role: 'Presidential Address',
    organization: 'Principal, SJEC', department: 'Patron', category: 'Leadership',
    photoPath: '/Photos/principal.jpg',
    quote: "One man's crappy software is another man's full-time job.",
  },
  {
    id: 'honored-melwyn', name: "Dr. Melwyn D'Souza", role: 'Program Chair',
    organization: 'HOD, Computer Science & Engineering', department: 'Department Head', category: 'Leadership',
    photoPath: '/Photos/Melwyn.jpg', quote: 'Make it work, make it right, make it fast.',
  },
];

const facultyMembers: TeamMember[] = [
  {
    id: 'faculty-nisha', name: 'Ms. Nisha Roche',
    role: 'Assistant Professor, CSE · Faculty Coordinator',
    department: 'CSE', category: 'Faculty', organization: siteConfig.department.college,
    photoPath: '/Photos/ms-nisha-jenifer-roche.jpg',
    quote: 'If debugging is the process of removing software bugs, then programming must be the process of putting them in.',
  },
  {
    id: 'faculty-keith', name: 'Mr. Keith Fernandes',
    role: 'Assistant Professor, CSE · Faculty Coordinator',
    department: 'CSE', category: 'Faculty', organization: siteConfig.department.college,
    photoPath: '/Photos/mr-keith-raymond-fernandes.jpg',
    quote: 'Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday’s code.',
  },
];

const peopleSections = [
  { id: 'honored', title: 'Honored guests & college leadership', members: honoredMembers, wide: true },
  { id: 'faculty', title: 'Faculty advisory council', members: facultyMembers, wide: true },
  { id: 'officers', title: 'Student core team & officers', members: officers, wide: false },
  { id: 'committee', title: 'Core working committee', members: committeeMembers, wide: false },
];

function PersonCard({ member, onSelect, isSelected, onPreview, onPreviewEnd }: {
  member: TeamMember;
  onSelect: (member: TeamMember) => void;
  isSelected: boolean;
  onPreview: (member: TeamMember, anchor: HTMLButtonElement) => void;
  onPreviewEnd: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const initials = member.name.replace(/^(Mr\.|Ms\.|Dr\.)\s*/, '').split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('');
  const showPreview = (anchor: HTMLButtonElement) => {
    if (member.photoPath && !imageError && !isSelected) onPreview(member, anchor);
    else onPreviewEnd();
  };

  return (
    <button
      type="button"
      className="about-person about-surface"
      onClick={() => onSelect(member)}
      onPointerEnter={event => { if (event.pointerType !== 'touch') showPreview(event.currentTarget); }}
      onPointerLeave={onPreviewEnd}
      onFocus={event => { if (event.currentTarget.matches(':focus-visible')) showPreview(event.currentTarget); }}
      onBlur={onPreviewEnd}
      data-selected={isSelected}
      aria-label={`View ${member.name}'s profile`}
      aria-haspopup="dialog"
    >
      <span className="about-person__portrait" aria-hidden="true">
        {member.photoPath && !imageError ? (
          <img src={member.photoPath} alt="" loading="lazy" onError={() => setImageError(true)} />
        ) : (
          <span className="about-person__initials">{initials}</span>
        )}
      </span>
      <span className="about-person__body">
        <span className="about-person__category">{member.category === 'Leadership' ? member.department : member.category}</span>
        <span className="about-person__name">{member.name}</span>
        <span className="about-person__role">{member.role}</span>
        <span className="about-person__detail">{member.organization || member.department}</span>
      </span>
      {member.quote && <span className="about-person__quote">“{member.quote}”</span>}
      <span className="about-person__action">View profile <span aria-hidden="true">↗</span></span>
    </button>
  );
}

function BehindTheScenes({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      const scrollY = window.scrollY;
      dialog.showModal();
      dialog.focus({ preventScroll: true });
      window.scrollTo(0, scrollY);
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    }
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  const dialogContent = (
    <dialog
      ref={dialogRef}
      className="about-secret-dialog about-surface about-low-poly"
      aria-labelledby="about-secret-title"
      onCancel={onClose}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <button type="button" className="about-dialog-close" onClick={onClose} aria-label="Close behind the scenes">×</button>
      <p className="about-eyebrow">A hidden corner of the club</p>
      <h2 id="about-secret-title">Behind the scenes</h2>
      <img src={testcaseImg} alt="Core developers" />
      <p>You found the Easter egg created by <strong>Ryan</strong> and <strong>Kevin</strong>. Welcome to the people behind AgentBlazer.</p>
    </dialog>
  );
  
  return createPortal(dialogContent, document.body);
}

export default function About() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [preview, setPreview] = useState<{ member: TeamMember; anchor: HTMLButtonElement } | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [easterEggClicks, setEasterEggClicks] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  const keepPreviewOpen = useCallback(() => {
    if (previewTimer.current !== null) clearTimeout(previewTimer.current);
    previewTimer.current = null;
  }, []);
  const closePreview = useCallback(() => {
    keepPreviewOpen();
    setPreview(null);
  }, [keepPreviewOpen]);
  const schedulePreviewClose = () => {
    keepPreviewOpen();
    // Allow the pointer to cross the gap between a card and its portrait.
    previewTimer.current = setTimeout(closePreview, 140);
  };
  const showPreview = (member: TeamMember, anchor: HTMLButtonElement) => {
    keepPreviewOpen();
    setPreview({ member, anchor });
  };
  const selectMember = (member: TeamMember) => {
    closePreview();
    setSelectedMember(member);
  };
  useEffect(() => keepPreviewOpen, [keepPreviewOpen]);

  const revealBehindTheScenes = () => {
    const count = easterEggClicks + 1;
    setEasterEggClicks(count >= 3 ? 0 : count);
    if (count >= 3) {
      closePreview();
      setShowEasterEgg(true);
    }
  };

  return (
    <section className="about-page about-low-poly" aria-labelledby="about-heading">
      <div className="about-shell">
        <header className="about-intro">
          <p className="about-eyebrow">People & purpose</p>
          <h1 id="about-heading">About AgentBlazer</h1>
          <p className="about-lead">A student-led AI community bringing students and mentors together to learn, build, and share.</p>
        </header>

        <article className="about-inauguration about-surface" aria-labelledby="club-charter">
          <div className="about-inauguration__copy">
            <p className="about-eyebrow">Established <time dateTime="2025-08-25">25 August 2025</time></p>
            <h2 id="club-charter">Inauguration & mentorship</h2>
            <p>The club supports hands-on learning in AI and machine learning. Our mentorship council guides students as they explore and build autonomous and agentic AI systems.</p>
            <p className="about-affiliation">{siteConfig.department.name}<br />{siteConfig.department.college}</p>
          </div>
          <figure className="about-inauguration__photo">
            <img
              src="/Photos/inauguration.jpeg"
              alt="Guests on stage at the AgentBlazer Club inauguration"
              width={1080}
              height={730}
              decoding="async"
            />
            <figcaption>Club inauguration · <time dateTime="2025-08-25">25 August 2025</time></figcaption>
          </figure>
        </article>

        {peopleSections.map((section, index) => (
          <section key={section.id} className="about-people-section" aria-labelledby={`about-${section.id}-title`}>
            <div className="about-section-head">
              <span className="about-section-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <h2 id={`about-${section.id}-title`}>
                {section.id === 'committee' ? (
                  <button type="button" className="about-section-trigger" onClick={revealBehindTheScenes}>{section.title}</button>
                ) : section.title}
              </h2>
            </div>
            <div className={`about-people-grid ${section.wide ? 'about-people-grid--wide' : ''}`}>
              {section.members.map(member => (
                <PersonCard key={member.id} member={member} onSelect={selectMember} isSelected={selectedMember?.id === member.id} onPreview={showPreview} onPreviewEnd={schedulePreviewClose} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {preview && !selectedMember && !showEasterEgg && (
        <AboutPortraitPreview key={preview.member.id} member={preview.member} anchor={preview.anchor} onClose={closePreview} onPointerEnter={keepPreviewOpen} onPointerLeave={schedulePreviewClose} />
      )}
      <PortraitPopup member={selectedMember} onClose={() => setSelectedMember(null)} />
      {showEasterEgg && <BehindTheScenes onClose={() => setShowEasterEgg(false)} />}
    </section>
  );
}
