import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TeamMember } from '../types';

interface Props {
  member: TeamMember;
  anchor: HTMLButtonElement;
  onClose: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

interface Placement {
  left: number;
  top: number;
  maxHeight: number;
  side: 'left' | 'right';
}

export default function AboutPortraitPreview({ member, anchor, onClose, onPointerEnter, onPointerLeave }: Props) {
  const frameRef = useRef<HTMLElement>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    // Touch users open the full profile by tapping the card.
    if (!window.matchMedia('(min-width: 761px) and (hover: hover) and (pointer: fine)').matches) {
      onClose();
      return;
    }

    const positionFrame = () => {
      const card = anchor.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
      const gap = 16;
      const edge = 16;
      const headerBottom = document.querySelector('.header')?.getBoundingClientRect().bottom ?? 0;
      const topEdge = Math.max(edge, headerBottom + edge);
      const maxHeight = viewportHeight - topEdge - edge;
      const frameWidth = frame.offsetWidth;
      const frameHeight = Math.min(frame.offsetHeight, maxHeight);
      const fitsRight = card.right + gap + frameWidth <= viewportWidth - edge;
      const fitsLeft = card.left - gap - frameWidth >= edge;

      if ((!fitsRight && !fitsLeft) || card.bottom <= topEdge || card.top >= viewportHeight - edge || maxHeight <= 0) {
        onClose();
        return;
      }

      setPlacement({
        side: fitsRight ? 'right' : 'left',
        left: fitsRight ? card.right + gap : card.left - gap - frameWidth,
        top: Math.max(topEdge, Math.min(card.top + (card.height - frameHeight) / 2, viewportHeight - frameHeight - edge)),
        maxHeight,
      });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    positionFrame();
    // Dismiss on page movement so a preview never stays behind after its card moves.
    const onScroll = (event: Event) => {
      if (!(event.target instanceof Node) || !frame.contains(event.target)) onClose();
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onClose);
    window.addEventListener('keydown', onKeyDown);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(positionFrame);
    observer?.observe(frame);

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onClose);
      window.removeEventListener('keydown', onKeyDown);
      observer?.disconnect();
    };
  }, [anchor, onClose]);

  return createPortal(
    <aside
      ref={frameRef}
      className="about-low-poly about-portrait-preview about-surface"
      aria-hidden="true"
      data-side={placement?.side}
      style={{ left: placement?.left ?? 0, top: placement?.top ?? 0, maxHeight: placement?.maxHeight, visibility: placement ? 'visible' : 'hidden' }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <img className="about-portrait-preview__photo" src={member.photoPath} alt="" onError={onClose} />
      <div className="about-portrait-preview__caption">
        <p className="about-eyebrow">{member.category === 'Leadership' ? member.department : member.category}</p>
        <p className="about-portrait-preview__name">{member.name}</p>
        <p className="about-portrait-preview__role">{member.role}</p>
        {member.quote && <p className="about-portrait-preview__quote">“{member.quote}”</p>}
      </div>
    </aside>,
    document.body,
  );
}
