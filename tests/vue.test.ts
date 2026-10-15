import { describe, it, expect, beforeEach, vi } from 'vitest';

let mountedCb: (() => void) | null = null;
let unmountedCb: (() => void) | null = null;

vi.mock('vue', () => ({
  onMounted: vi.fn((cb: () => void) => {
    mountedCb = cb;
  }),
  onUnmounted: vi.fn((cb: () => void) => {
    unmountedCb = cb;
  }),
  shallowRef: vi.fn((initial: unknown) => ({ value: initial })),
}));

import { useMidnight, vMidnight } from '../src/vue';
import { mockRect, setScrollY } from './helpers';

function setupHeader(): HTMLElement {
  const header = document.createElement('header');
  header.innerHTML = '<span>Logo</span>';
  mockRect(header, { top: 0, height: 60, bottom: 60, width: 1000, right: 1000 });
  document.body.appendChild(header);

  const section = document.createElement('section');
  section.setAttribute('data-midnight-section', 'dark');
  mockRect(section, { top: 500, height: 400 });
  document.body.appendChild(section);

  return header;
}

describe('vue adapter - useMidnight composable', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    setScrollY(0);
    mountedCb = null;
    unmountedCb = null;
  });

  it('registers onMounted and onUnmounted hooks', () => {
    const header = setupHeader();
    useMidnight({ value: header } as any);

    expect(mountedCb).toBeTypeOf('function');
    expect(unmountedCb).toBeTypeOf('function');
  });

  it('creates instance in onMounted', () => {
    const header = setupHeader();
    const instance = useMidnight({ value: header } as any);

    mountedCb!();

    expect(instance.value).not.toBeNull();
    expect(
      header.querySelectorAll('[data-midnight-variant]').length,
    ).toBeGreaterThan(0);
  });

  it('skips init when elementRef is null', () => {
    const instance = useMidnight({ value: null } as any);
    mountedCb!();
    expect(instance.value).toBeNull();
  });

  it('destroys instance in onUnmounted', () => {
    const header = setupHeader();
    const instance = useMidnight({ value: header } as any);

    mountedCb!();
    expect(instance.value).not.toBeNull();

    unmountedCb!();
    expect(instance.value).toBeNull();
  });
});

describe('vue adapter - vMidnight directive', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    setScrollY(0);
  });

  it('creates instance in mounted hook', () => {
    const header = setupHeader();
    vMidnight.mounted!(header, { value: undefined } as any, null as any, null as any);

    expect(
      header.querySelectorAll('[data-midnight-variant]').length,
    ).toBeGreaterThan(0);
  });

  it('updated hook calls refresh and picks up new sections', () => {
    const header = setupHeader();
    vMidnight.mounted!(header, { value: undefined } as any, null as any, null as any);

    expect(header.querySelectorAll('[data-midnight-variant]')).toHaveLength(2);

    // Add a new section to the DOM
    const section = document.createElement('section');
    section.setAttribute('data-midnight-section', 'light');
    mockRect(section, { top: 200, height: 400 });
    document.body.appendChild(section);

    // Simulate Vue's updated hook
    vMidnight.updated!(header, {} as any, null as any, null as any);

    expect(header.querySelectorAll('[data-midnight-variant]')).toHaveLength(3);
    expect(
      header.querySelector('[data-midnight-variant="light"]'),
    ).not.toBeNull();
  });

  it('destroys instance in unmounted hook', () => {
    const header = setupHeader();
    vMidnight.mounted!(header, { value: undefined } as any, null as any, null as any);
    vMidnight.unmounted!(header, {} as any, null as any, null as any);

    expect(header.querySelectorAll('[data-midnight-variant]')).toHaveLength(0);
  });
});
