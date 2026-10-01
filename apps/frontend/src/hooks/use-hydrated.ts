'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * false while React hydrates server HTML, true afterwards. Components mounted
 * after hydration (client navigation) get true right away, unlike a
 * useEffect-based flag that would cost every mount an extra render.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
