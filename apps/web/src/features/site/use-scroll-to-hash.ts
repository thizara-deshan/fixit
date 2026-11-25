import { useEffect } from 'react';
import { useLocation } from 'react-router';

/** D-5: after render, scroll to `location.hash` if that element exists. The target sets its own `scroll-mt-*`. */
export function useScrollToHash(ready = true): void {
  const { hash, key } = useLocation();
  useEffect(() => {
    if (!ready || !hash) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    el?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }, [hash, key, ready]);
}
