import type { SectionData } from './types';

/**
 * Get a section's position relative to the document.
 * Uses getBoundingClientRect + scrollY for accuracy.
 */
export function getSectionBounds(el: Element): { top: number; height: number } {
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    height: rect.height,
  };
}

/**
 * Get the element's current viewport-relative bounding rect.
 * This accounts for CSS transforms, sticky offsets, etc.
 */
export function getElementBounds(el: HTMLElement): { top: number; height: number } {
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top,
    height: rect.height,
  };
}

/**
 * Calculate cached bounds for all tracked sections.
 */
export function cacheSectionBounds(sections: SectionData[]): void {
  for (const section of sections) {
    const bounds = getSectionBounds(section.el);
    section.top = bounds.top;
    section.height = bounds.height;
  }
}

const SECTION_SELECTOR = '[data-midnight-section]';
const SECTION_ATTR = 'data-midnight-section';
const TARGET_ATTR = 'data-midnight-target';

/**
 * Scan the document for sections, optionally filtered by instance name.
 * - Sections without data-midnight-target apply to ALL instances.
 * - Sections with data-midnight-target apply only to the listed instance(s) (space-separated).
 */
export function scanSections(instanceName?: string): SectionData[] {
  const els = document.querySelectorAll(SECTION_SELECTOR);
  const sections: SectionData[] = [];

  for (const el of els) {
    const variant = el.getAttribute(SECTION_ATTR);
    if (!variant) continue;

    const target = el.getAttribute(TARGET_ATTR);
    if (target) {
      // Section is targeted - only include if this instance is listed
      if (!instanceName || !target.split(' ').includes(instanceName)) continue;
    }

    sections.push({ el, variant, top: 0, height: 0 });
  }

  cacheSectionBounds(sections);
  return sections;
}
