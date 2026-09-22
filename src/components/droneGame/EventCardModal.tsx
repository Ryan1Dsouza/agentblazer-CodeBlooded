import { useEffect } from 'react';
import { Event } from '../../types';
import GalleryPreview from '../GalleryPreview';
import { useState } from 'react';

interface Props {
  event: Event;
  onClose: () => void;
}

export default function EventCardModal({ event, onClose }: Props) {
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <span className="modal-category">{event.category}</span>
          <span className="modal-date">{event.date}</span>
        </div>

        <h2 className="modal-title">{event.title}</h2>
        <p className="modal-description">{event.description}</p>

        <div className="modal-meta">
          <div className="modal-meta-item">
            <span className="meta-label">Location</span>
            <span className="meta-value">{event.location}</span>
          </div>
          <div className="modal-meta-item">
            <span className="meta-label">Attendees</span>
            <span className="meta-value">{event.metric}</span>
          </div>
        </div>

        {event.gallery.length > 0 && (
          <>
            <p className="modal-gallery-hint">Hover to inspect gallery</p>
            <div 
              className="modal-gallery-wrapper"
              onMouseEnter={() => setShowGallery(true)}
              onMouseLeave={() => setShowGallery(false)}
            >
              {showGallery && (
                <GalleryPreview event={event} />
              )}
            </div>
          </>
        )}

        <div className="modal-footer">
          <button className="modal-continue-btn" onClick={onClose}>
            Continue Exploring
          </button>
        </div>
      </div>
    </div>
  );
}
