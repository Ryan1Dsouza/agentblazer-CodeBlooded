import { useState, useEffect } from 'react';
import { Event } from '../types';

interface Props {
  event: Event;
}

export default function GalleryPreview({ event }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % event.gallery.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [event.gallery.length]);

  const currentImage = event.gallery[currentIndex];

  return (
    <div className="gallery-preview">
      <img src={currentImage} alt={`${event.title} - ${currentIndex + 1}`} />
      <div className="gallery-info">
        <span className="gallery-counter">{currentIndex + 1}/{event.gallery.length}</span>
        <div className="gallery-meta">
          <h4>{event.title}</h4>
          <p>{event.category}</p>
          <p className="gallery-date">{event.date}</p>
        </div>
      </div>
      <div className="gallery-progress">
        <div className="progress-bar" style={{
          width: `${((currentIndex + 1) / event.gallery.length) * 100}%`
        }} />
      </div>
    </div>
  );
}
