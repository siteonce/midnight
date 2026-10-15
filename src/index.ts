import { createMidnight } from './core';
import { createMidnightHeadless } from './headless';
import type {
  MidnightOptions,
  MidnightHeadlessOptions,
  MidnightInstance,
  ActiveVariant,
} from './types';

/**
 * Auto mode - Initialize midnight.js on a fixed element.
 * Automatically clones element content for each variant and manages the DOM.
 *
 * @param element - The fixed/sticky element marked with data-midnight-element
 * @param options - Optional configuration
 * @returns Instance with refresh() and destroy() methods
 *
 * @example
 * ```js
 * const instance = midnight(document.querySelector('[data-midnight-element]'));
 * ```
 */
export function midnight(
  element: HTMLElement,
  options?: MidnightOptions,
): MidnightInstance {
  return createMidnight(element, options);
}

/**
 * Headless mode - Bring your own variant elements.
 * Manages only clip-paths on pre-rendered elements. No DOM cloning.
 *
 * @param options - Header, variant elements, and optional config
 * @returns Instance with refresh() and destroy() methods
 */
export function midnightHeadless(
  options: MidnightHeadlessOptions,
): MidnightInstance {
  return createMidnightHeadless(options);
}

export type { MidnightOptions, MidnightHeadlessOptions, MidnightInstance, ActiveVariant };
