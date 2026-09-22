import { useMemo } from 'react';
import { events } from '../data/events';
import Events3DCanvas from '../components/events3D/Events3DCanvas';
import { useTheme } from '../hooks/useTheme';

export default function Events() {
  const { theme } = useTheme();

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => parseInt(a.id) - parseInt(b.id));
  }, []);

  return (
    <section className="events-viewport-section">
      <Events3DCanvas
        events={sortedEvents}
        theme={theme}
      />
    </section>
  );
}
