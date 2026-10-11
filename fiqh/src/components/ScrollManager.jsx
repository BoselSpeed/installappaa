import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Scroll positions are remembered per history entry so a back navigation lands
// exactly where the user left off, while forward navigations start at the top.
// The map lives module-scope (not in component state) because the component
// remounts; the shared history doesn't.
const positions = new Map();

const ScrollManager = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const locationKey = location.key;
  const ref = useRef({ locationKey: null });

  useEffect(() => {
    const previousKey = ref.current.locationKey;

    if (navigationType === 'POP' && previousKey && positions.has(locationKey)) {
      // Restore the previous scroll exactly.
      const { x, y } = positions.get(locationKey);
      window.scrollTo(x, y);
    } else {
      // A fresh page starts at the top.
      window.scrollTo(0, 0);
    }

    ref.current.locationKey = locationKey;
  }, [locationKey, navigationType]);

  useEffect(() => {
    const onScroll = () => {
      positions.set(locationKey, { x: window.scrollX, y: window.scrollY });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [locationKey]);

  return null;
};

export { ScrollManager, positions };