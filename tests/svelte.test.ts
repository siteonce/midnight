import { describe, it, expect, beforeEach } from 'vitest';
import { midnight } from '../src/svelte';
import { mockRect, setScrollY } from './helpers';

function setupHeader(): HTMLElement {
  const header = document.createElement('header');
  header.innerHTML = '<span>Logo</span>';
  mockRect(header, { top: 0, height: 60, bottom: 60, width: 1000, right: 1000 });
  document.body.appendChild(header);
  return header;
}

function addSection(variant: string) {
  const section = document.createElement('section');
  section.setAttribute('data-midnight-section', variant);
  mockRect(section, { top: 500, height: 400 });
  document.body.appendChild(section);
  return section;
}

describe('svelte adapter - midnight action', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    setScrollY(0);
  });

  it('creates instance on call', () => {
    const header = setupHeader();
    addSection('dark');
    const action = midnight(header);

    expect(
      header.querySelectorAll('[data-midnight-variant]').length,
    ).toBeGreaterThan(0);
    action.destroy();
  });

  it('update() destroys old instance and recreates', () => {
    const header = setupHeader();
    addSection('dark');
    const action = midnight(header);

    expect(header.querySelectorAll('[data-midnight-variant]')).toHaveLength(2);

    // Add another section, then update
    addSection('light');
    action.update();

    expect(header.querySelectorAll('[data-midnight-variant]')).toHaveLength(3);
    action.destroy();
  });

  it('update() passes new options', () => {
    const header = setupHeader();
    addSection('dark');
    const onChange = () => {};
    const action = midnight(header);

    // Should not throw when updating with new options
    action.update({ onChange });
    action.destroy();
  });

  it('update() without args preserves DOM mutations via refresh()', () => {
    const header = setupHeader();
    addSection('dark');
    const action = midnight(header);

    // Initial: default + dark
    expect(header.querySelectorAll('[data-midnight-variant]')).toHaveLength(2);

    // Mutate element content before refresh
    header.querySelector('[data-midnight-variant="default"]')!.innerHTML =
      '<span>Updated Logo</span>';

    // Add another section, then update without args (triggers refresh)
    addSection('light');
    action.update();

    // Should pick up the new section
    expect(header.querySelectorAll('[data-midnight-variant]')).toHaveLength(3);
    action.destroy();
  });

  it('destroy() removes variant wrappers', () => {
    const header = setupHeader();
    addSection('dark');
    const action = midnight(header);

    expect(
      header.querySelectorAll('[data-midnight-variant]').length,
    ).toBeGreaterThan(0);

    action.destroy();
    expect(header.querySelectorAll('[data-midnight-variant]')).toHaveLength(0);
  });
});
