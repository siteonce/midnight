import { useEffect, useRef } from 'react';
import { createMidnight } from './core';
import type { MidnightOptions, MidnightInstance } from './types';

/**
 * React hook for midnight.js (auto mode).
 * Initializes on mount, destroys on unmount.
 * Cloning happens client-side - safe for SSR.
 */
export function useMidnight(
  elementRef: React.RefObject<HTMLElement | null>,
  options?: MidnightOptions,
): React.RefObject<MidnightInstance | null> {
  const instanceRef = useRef<MidnightInstance | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    instanceRef.current = createMidnight(elementRef.current, options);

    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, []);

  return instanceRef;
}
