import { onMount, onCleanup } from 'solid-js';
import { createMidnight as createMidnightCore } from './core';
import type { MidnightOptions, MidnightInstance } from './types';

/**
 * Solid primitive for midnight.js (auto mode).
 * Initializes on mount, cleans up on disposal.
 * Cloning happens client-side - safe for SSR.
 */
export function createMidnight(
  elementAccessor: () => HTMLElement | null,
  options?: MidnightOptions,
): () => MidnightInstance | null {
  let instance: MidnightInstance | null = null;

  onMount(() => {
    const el = elementAccessor();
    if (!el) return;
    instance = createMidnightCore(el, options);
  });

  onCleanup(() => {
    instance?.destroy();
    instance = null;
  });

  return () => instance;
}

/**
 * Solid directive for midnight.js (auto mode).
 * Usage: <header use:midnight> or <header use:midnight={{ onChange }}>
 *
 * TypeScript: extend JSX.DirectiveFunctions in your app:
 *   declare module "solid-js" {
 *     namespace JSX {
 *       interface DirectiveFunctions {
 *         midnight: typeof import('midnight.js/solid').midnight;
 *       }
 *     }
 *   }
 */
export function midnight(el: HTMLElement, accessor: () => MidnightOptions | undefined): void {
  const instance = createMidnightCore(el, accessor());

  onCleanup(() => {
    instance.destroy();
  });
}
