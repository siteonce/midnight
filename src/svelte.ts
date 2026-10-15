import { createMidnight } from './core';
import type { MidnightOptions, MidnightInstance } from './types';

/**
 * Svelte action for midnight.js (auto mode).
 * Initializes when the element mounts, destroys when it unmounts.
 * Cloning happens client-side - safe for SSR.
 *
 * Usage: <header use:midnight> or <header use:midnight={{ onChange }}>
 */
export function midnight(
  node: HTMLElement,
  options?: MidnightOptions,
): { update: (opts?: MidnightOptions) => void; destroy: () => void } {
  let instance: MidnightInstance | null = createMidnight(node, options);

  return {
    update(newOptions?: MidnightOptions) {
      if (newOptions !== undefined) {
        instance?.destroy();
        instance = createMidnight(node, newOptions);
      } else {
        instance?.refresh();
      }
    },
    destroy() {
      instance?.destroy();
      instance = null;
    },
  };
}
