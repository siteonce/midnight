import { describe, it, expect, beforeEach } from 'vitest';
import { createMidnight } from '../src/core';
import { mockRect, setScrollY } from './helpers';

function setupDOM(headerAttrs = '', sections: string[] = []) {
  const headerHTML = '<span>Logo</span>';
  document.body.innerHTML = `
    <header ${headerAttrs}>${headerHTML}</header>
    ${sections.join('\n')}
  `;
  const header = document.querySelector('header') as HTMLElement;
  mockRect(header, { top: 0, height: 60, width: 1000, right: 1000, bottom: 60 });

  document.querySelectorAll('[data-midnight-section]').forEach((el) => {
    mockRect(el, { top: 500, height: 400 });
  });
  setScrollY(0);
  return header;
}

describe('createMidnight', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    setScrollY(0);
  });

  it('creates one variant wrapper per unique section + default', () => {
    const header = setupDOM('data-midnight-element', [
      '<section data-midnight-section="dark"></section>',
      '<section data-midnight-section="light"></section>',
    ]);
    createMidnight(header);

    const wrappers = header.querySelectorAll('[data-midnight-variant]');
    expect(wrappers).toHaveLength(3);
    const names = Array.from(wrappers).map((w) =>
      w.getAttribute('data-midnight-variant'),
    );
    expect(names).toContain('default');
    expect(names).toContain('dark');
    expect(names).toContain('light');
  });

  it('default wrapper does NOT have aria-hidden or inert', () => {
    const header = setupDOM('data-midnight-element', [
      '<section data-midnight-section="dark"></section>',
    ]);
    createMidnight(header);

    const defaultWrapper = header.querySelector(
      '[data-midnight-variant="default"]',
    ) as HTMLElement;
    expect(defaultWrapper.getAttribute('aria-hidden')).toBeNull();
    expect(defaultWrapper.hasAttribute('inert')).toBe(false);
  });

  it('clone wrappers have aria-hidden="true", inert, pointer-events: none', () => {
    const header = setupDOM('data-midnight-element', [
      '<section data-midnight-section="dark"></section>',
    ]);
    createMidnight(header);

    const clone = header.querySelector(
      '[data-midnight-variant="dark"]',
    ) as HTMLElement;
    expect(clone.getAttribute('aria-hidden')).toBe('true');
    expect(clone.hasAttribute('inert')).toBe(true);
    expect(clone.style.pointerEvents).toBe('none');
  });

  it('all wrappers have position: absolute overlay styles', () => {
    const header = setupDOM('data-midnight-element', [
      '<section data-midnight-section="dark"></section>',
    ]);
    createMidnight(header);

    const wrappers = header.querySelectorAll('[data-midnight-variant]');
    for (const wrapper of wrappers) {
      const el = wrapper as HTMLElement;
      expect(el.style.position).toBe('absolute');
      expect(el.style.top).toBe('0px');
      expect(el.style.left).toBe('0px');
      expect(el.style.right).toBe('0px');
      expect(el.style.bottom).toBe('0px');
    }
  });

  it('sets header overflow to visible', () => {
    const header = setupDOM('data-midnight-element', [
      '<section data-midnight-section="dark"></section>',
    ]);
    createMidnight(header);
    expect(header.style.overflow).toBe('visible');
  });

  it('destroy() removes all variant wrappers', () => {
    const header = setupDOM('data-midnight-element', [
      '<section data-midnight-section="dark"></section>',
    ]);
    const instance = createMidnight(header);
    instance.destroy();

    const wrappers = header.querySelectorAll('[data-midnight-variant]');
    expect(wrappers).toHaveLength(0);
  });

  it('destroy() restores original innerHTML', () => {
    const header = setupDOM('data-midnight-element', [
      '<section data-midnight-section="dark"></section>',
    ]);
    const originalHTML = header.innerHTML;
    const instance = createMidnight(header);
    instance.destroy();

    expect(header.innerHTML).toBe(originalHTML);
  });

  it('destroy() restores header.style.overflow', () => {
    const header = setupDOM('data-midnight-element', [
      '<section data-midnight-section="dark"></section>',
    ]);
    header.style.overflow = 'hidden';
    const instance = createMidnight(header);
    expect(header.style.overflow).toBe('visible');
    instance.destroy();
    expect(header.style.overflow).toBe('hidden');
  });

  it('refresh() preserves DOM mutations made after init', () => {
    const header = setupDOM('data-midnight-element', [
      '<section data-midnight-section="dark"></section>',
    ]);
    const instance = createMidnight(header);

    // Mutate the live DOM inside the default wrapper
    const defaultWrapper = header.querySelector(
      '[data-midnight-variant="default"]',
    ) as HTMLElement;
    const link = document.createElement('a');
    link.href = '/home';
    link.textContent = 'Home';
    defaultWrapper.appendChild(link);

    instance.refresh();

    // The new element should survive the refresh
    const newDefault = header.querySelector(
      '[data-midnight-variant="default"]',
    ) as HTMLElement;
    expect(newDefault.querySelector('a')?.textContent).toBe('Home');
  });

  it('refresh() rebuilds wrappers with updated sections', () => {
    const header = setupDOM('data-midnight-element', [
      '<section data-midnight-section="dark"></section>',
    ]);
    const instance = createMidnight(header);

    const newSection = document.createElement('section');
    newSection.setAttribute('data-midnight-section', 'light');
    mockRect(newSection, { top: 1000, height: 400 });
    document.body.appendChild(newSection);

    instance.refresh();

    const wrappers = header.querySelectorAll('[data-midnight-variant]');
    expect(wrappers).toHaveLength(3);
    const names = Array.from(wrappers).map((w) =>
      w.getAttribute('data-midnight-variant'),
    );
    expect(names).toContain('light');
  });

  it('options.name takes precedence over data-midnight-element attribute', () => {
    const header = setupDOM('data-midnight-element="nav"', [
      '<section data-midnight-section="dark" data-midnight-target="custom"></section>',
    ]);
    createMidnight(header, { name: 'custom' });

    const wrappers = header.querySelectorAll('[data-midnight-variant]');
    expect(wrappers).toHaveLength(2);
  });

  it('inserts a sizing ghost with visibility: hidden in normal flow', () => {
    const header = setupDOM('data-midnight-element', [
      '<section data-midnight-section="dark"></section>',
    ]);
    createMidnight(header);
    const ghost = header.querySelector('[aria-hidden="true"]:not([data-midnight-variant])') as HTMLElement;
    expect(ghost).not.toBeNull();
    expect(ghost.style.visibility).toBe('hidden');
    expect(ghost.style.pointerEvents).toBe('none');
    // Ghost should NOT be position: absolute (stays in normal flow for sizing)
    expect(ghost.style.position).not.toBe('absolute');
  });

  it('sizing ghost contains a clone of original header content', () => {
    const header = setupDOM('data-midnight-element', [
      '<section data-midnight-section="dark"></section>',
    ]);
    createMidnight(header);
    const ghost = header.querySelector('[aria-hidden="true"]:not([data-midnight-variant])') as HTMLElement;
    expect(ghost.querySelector('span')?.textContent).toBe('Logo');
  });

  it('destroy() removes sizing ghost along with wrappers', () => {
    const header = setupDOM('data-midnight-element', [
      '<section data-midnight-section="dark"></section>',
    ]);
    const instance = createMidnight(header);
    instance.destroy();
    const ghost = header.querySelector('[aria-hidden="true"]:not([data-midnight-variant])');
    expect(ghost).toBeNull();
  });

  it('falls back to data-midnight-element attribute when options.name not set', () => {
    const header = setupDOM('data-midnight-element="nav"', [
      '<section data-midnight-section="dark" data-midnight-target="nav"></section>',
    ]);
    createMidnight(header);

    const wrappers = header.querySelectorAll('[data-midnight-variant]');
    expect(wrappers).toHaveLength(2);
  });
});
