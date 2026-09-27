import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

// Using the optimized webp images Codex generated
import promptopsImg from '../../../assets/home/promptops.webp';
import llmImg from '../../../assets/home/llm-workshop.webp';
import cyberImg from '../../../assets/home/cybersecurity.webp';

const events = [
  {
    id: 'promptops',
    title: 'PromptOps 2026',
    description: 'Master advanced prompt engineering and LLM orchestration workflows in this intensive workshop.',
    image: promptopsImg,
    date: 'Oct 12, 2026',
    tag: 'WORKSHOP'
  },
  {
    id: 'llm-workshop',
    title: 'GSoc & LLM Workshop',
    description: 'Learn how to contribute to open source AI projects effectively and build modern language models.',
    image: llmImg,
    date: 'Nov 05, 2026',
    tag: 'MENTORSHIP'
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity & AI',
    description: 'Defending against and utilizing AI in modern cybersecurity landscapes.',
    image: cyberImg,
    date: 'Dec 01, 2026',
    tag: 'SEMINAR'
  }
];

export default function FeaturedEvents() {
  const { theme } = useTheme();

  return (
    <section className="featured-events-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title text-center">Featured Workshops</h2>
          <p className="section-subtitle text-center">Explore our most popular past and upcoming events.</p>
        </div>
        
        <div className="featured-events-grid">
          {events.map(event => (
            <div key={event.id} className="featured-event-card">
              <div className="event-card-image">
                <img src={event.image} alt={event.title} loading="lazy" />
                <div className={`event-card-overlay theme-${theme}`} />
                <span className={`event-card-tag theme-${theme}`}>{event.tag}</span>
              </div>
              <div className="event-card-content">
                <div className="event-card-date">{event.date}</div>
                <h3 className="event-card-title">{event.title}</h3>
                <p className="event-card-desc">{event.description}</p>
                <Link to={`/events`} className="event-card-link">
                  View in 3D Gallery &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="featured-events-footer">
          <Link to="/events" className={`btn-primary theme-${theme}`}>
            Browse All Events
          </Link>
        </div>
      </div>
    </section>
  );
}
