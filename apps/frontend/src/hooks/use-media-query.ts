'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to track media query matches.
 * SSR-safe: returns false on server, updates on client mount.
 *
 * @param query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Convenience hook to check if viewport is mobile (<768px).
 * SSR-safe: returns false on server (assumes desktop for SSR).
 *
 * @returns boolean - true if viewport width < 768px
 */
export function useIsMobile(): boolean {
  return !useMediaQuery('(min-width: 768px)');
}
