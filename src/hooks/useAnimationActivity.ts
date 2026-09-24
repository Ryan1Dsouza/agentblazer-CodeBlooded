import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/** Avoid running decorative animation behind the loader, offscreen, or in a hidden tab. */
export function useAnimationActivity(ref: RefObject<HTMLElement>, enabled = true) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) { setVisible(false); return; }
    let intersecting = false;
    const update = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      update();
    }, { threshold: 0.05 });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, [ref, enabled]);
  return enabled && visible;
}
