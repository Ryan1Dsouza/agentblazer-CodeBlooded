import { useState } from 'react';
import { Event } from '../types';
import GalleryPreview from './GalleryPreview';

interface Props {
  event: Event;
  isActive?: boolean;
  onSelect?: () => void;
  waypointIndex?: number;
}

export default function EventCard({ event, isActive = false, onSelect, waypointIndex }: Props) {
  const [showGallery, setShowGallery] = useState(false);

  return (
    <div 
      className={`event-card ${isActive ? 'is-drone-target' : ''}`}
      onClick={onSelect}
      onMouseEnter={() => setShowGallery(true)}
      onMouseLeave={() => setShowGallery(false)}
    >
      {waypointIndex !== undefined && (
        <div className="event-drone-target-tag">
          <span className="drone-tag-dot" />
          <span className="drone-tag-label">
            {isActive ? `DRONE SCANNING WP-0${waypointIndex + 1}` : `WP-0${waypointIndex + 1}`}
          </span>
        </div>
      )}
      <span className="event-date">{event.date}</span>
      <span className="event-category">{event.category}</span>
      <h3 className="event-title">{event.title}</h3>
      <p className="event-description">{event.description}</p>
      <div className="event-meta">
        <span className="event-location">{event.location}</span>
        <span className="event-metric">{event.metric}</span>
      </div>
      {event.gallery.length > 0 && (
        <p className="event-gallery-hint">Hover to inspect gallery</p>
      )}
      {showGallery && event.gallery.length > 0 && (
        <GalleryPreview event={event} />
      )}
    </div>
  );
}
