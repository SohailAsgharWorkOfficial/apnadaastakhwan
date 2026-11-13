import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Restores scroll position on route change and honours in-page hashes.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    if (previousPath.current !== pathname) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
      previousPath.current = pathname;
    }
  }, [pathname, hash]);

  return null;
}
