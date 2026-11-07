import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMidnight } from '../src/core';
import { mockRect, setScrollY } from './helpers';

const HEADER = `
  <a href="#about" id="about-link"><span>About</span></a>
  <button>More</button>
  <label><input type="checkbox"> Remember</label>
`;

function setup() {
  document.body.innerHTML = `
    <header data-midnight-element>${HEADER}</header>
    <section data-midnight-section="dark"></section>
  `;
  const header = document.querySelector('header') as HTMLElement;
  mockRect(header, { top: 0, height: 60, width: 1000, right: 1000, bottom: 60 });
  mockRect(document.querySelector('section') as Element, { top: 0, height: 400 });
  setScrollY(0);
  return header;
}

function inVariant(header: HTMLElement, variant: string, selector: string) {
  return header.querySelector(
    `[data-midnight-variant="${variant}"] ${selector}`,
  ) as HTMLElement;
}

function click(target: Element, init: MouseEventInit = {}) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe('clones and the mouse', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.location.hash = '';
  });

  it('a clone stays aria-hidden, without inert or pointer-events: none', () => {
    const header = setup();
    createMidnight(header);

    const clone = header.querySelector('[data-midnight-variant="dark"]') as HTMLElement;
    expect(clone.getAttribute('aria-hidden')).toBe('true');
    expect(clone.hasAttribute('inert')).toBe(false);
    expect(clone.style.pointerEvents).toBe('');
  });

  it('a click on a clone runs each kind of site listener once, on the original', () => {
    const header = setup();
    const seen = { direct: 0, bubble: 0, capture: 0 };
    const targets: EventTarget[] = [];
    const onBubble = (e: Event) => { seen.bubble++; targets.push(e.target!); };
    const onCapture = (e: Event) => { seen.capture++; targets.push(e.target!); };
    header.querySelector('a')!.addEventListener('click', (e) => {
      seen.direct++;
      targets.push(e.target!);
      e.preventDefault();
    });
    document.addEventListener('click', onBubble);
    document.addEventListener('click', onCapture, true);

    createMidnight(header);
    const original = inVariant(header, 'default', 'span');
    click(inVariant(header, 'dark', 'span'));

    document.removeEventListener('click', onBubble);
    document.removeEventListener('click', onCapture, true);

    expect(seen).toEqual({ direct: 1, bubble: 1, capture: 1 });
    expect(targets.every((t) => t === original)).toBe(true);
  });

  it('a click on a clone runs the matching original element, not its neighbor', () => {
    const header = setup();
    let buttonClicks = 0;
    let linkClicks = 0;
    header.querySelector('button')!.addEventListener('click', () => { buttonClicks++; });
    header.querySelector('a')!.addEventListener('click', (e) => { linkClicks++; e.preventDefault(); });

    createMidnight(header);
    click(inVariant(header, 'dark', 'button'));

    expect(buttonClicks).toBe(1);
    expect(linkClicks).toBe(0);
  });

  it('the click keeps its modifiers and position on a button', () => {
    const header = setup();
    let seen: MouseEvent | undefined;
    header.querySelector('button')!.addEventListener('click', (e) => { seen = e as MouseEvent; });

    createMidnight(header);
    click(inVariant(header, 'dark', 'button'), { shiftKey: true, clientX: 42, clientY: 7 });

    expect(seen?.shiftKey).toBe(true);
    expect(seen?.clientX).toBe(42);
    expect(seen?.clientY).toBe(7);
  });

  it("the original's default action follows, on the original and not the clone", () => {
    const header = setup();
    createMidnight(header);

    const event = click(inVariant(header, 'dark', 'input'));

    expect((inVariant(header, 'default', 'input') as HTMLInputElement).checked).toBe(true);
    expect((inVariant(header, 'dark', 'input') as HTMLInputElement).checked).toBe(false);
    expect(event.defaultPrevented).toBe(true);
  });

  it("site code calling preventDefault stops the original's default action", () => {
    const header = setup();
    header.querySelector('input')!.addEventListener('click', (e) => e.preventDefault());
    createMidnight(header);

    click(inVariant(header, 'dark', 'input'));

    expect((inVariant(header, 'default', 'input') as HTMLInputElement).checked).toBe(false);
  });

  it.each([
    ['meta', { metaKey: true }],
    ['ctrl', { ctrlKey: true }],
    ['shift', { shiftKey: true }],
    ['alt', { altKey: true }],
    // Safari fires click, not auxclick, for the middle button.
    ['middle', { button: 1 }],
  ])('a %s click on a clone link stays native and runs no site click code', (_name, init) => {
    const header = setup();
    let siteClicks = 0;
    const onDoc = () => { siteClicks++; };
    header.querySelector('a')!.addEventListener('click', onDoc);
    document.addEventListener('click', onDoc);
    document.addEventListener('click', onDoc, true);

    createMidnight(header);
    const event = click(inVariant(header, 'dark', 'a'), init);

    document.removeEventListener('click', onDoc);
    document.removeEventListener('click', onDoc, true);

    expect(siteClicks).toBe(0);
    expect(event.defaultPrevented).toBe(false);
  });

  it('clicks on the original are left alone', () => {
    const header = setup();
    let clicks = 0;
    header.querySelector('button')!.addEventListener('click', () => { clicks++; });

    createMidnight(header);
    const event = click(inVariant(header, 'default', 'button'));

    expect(clicks).toBe(1);
    expect(event.defaultPrevented).toBe(false);
  });

  it('a click event dispatched on the document does not throw or pass anywhere', () => {
    const header = setup();
    let clicks = 0;
    header.querySelector('button')!.addEventListener('click', () => { clicks++; });

    createMidnight(header);
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(clicks).toBe(0);
  });

  it('a click still passes after refresh(), once', () => {
    const header = setup();
    let clicks = 0;
    header.querySelector('button')!.addEventListener('click', () => { clicks++; });

    const instance = createMidnight(header);
    instance.refresh();
    click(inVariant(header, 'dark', 'button'));

    expect(clicks).toBe(1);
  });

  it('a click in the managed element no longer passes after destroy()', () => {
    const header = setup();
    let clicks = 0;
    const button = header.querySelector('button')!;
    button.addEventListener('click', () => { clicks++; });

    const instance = createMidnight(header);
    const clone = inVariant(header, 'dark', 'button');
    instance.destroy();
    header.appendChild(clone);
    click(clone);

    expect(clicks).toBe(0);
  });
});

describe('clones and the keyboard', () => {
  const ATTR = 'data-midnight-focus-visible';

  beforeEach(() => {
    document.body.innerHTML = '';
    document.adoptedStyleSheets = [];
  });

  function ringSheets() {
    return document.adoptedStyleSheets.filter((sheet) =>
      Array.from(sheet.cssRules).some((rule) => rule.cssText.includes(ATTR)),
    );
  }

  it('every focusable element in a clone leaves the tab order, in the original none', () => {
    const header = setup();
    const extra = document.createElement('div');
    extra.setAttribute('tabindex', '0');
    header.appendChild(extra);
    createMidnight(header);

    const clone = header.querySelector('[data-midnight-variant="dark"]') as HTMLElement;
    expect(clone.querySelector('a')!.getAttribute('tabindex')).toBe('-1');
    expect(clone.querySelector('button')!.getAttribute('tabindex')).toBe('-1');
    expect(clone.querySelector('input')!.getAttribute('tabindex')).toBe('-1');
    expect(clone.querySelector('div')!.getAttribute('tabindex')).toBe('-1');

    const original = header.querySelector('[data-midnight-variant="default"]') as HTMLElement;
    expect(original.querySelector('a')!.hasAttribute('tabindex')).toBe(false);
    expect(original.querySelector('button')!.hasAttribute('tabindex')).toBe(false);
    expect(original.querySelector('div')!.getAttribute('tabindex')).toBe('0');
  });

  it('a clone rebuilt by refresh() also leaves the tab order', () => {
    const header = setup();
    createMidnight(header).refresh();

    expect(inVariant(header, 'dark', 'a').getAttribute('tabindex')).toBe('-1');
  });

  it('focus landing on a clone moves to the matching original element', () => {
    const header = setup();
    createMidnight(header);

    inVariant(header, 'dark', 'button').focus();

    expect(document.activeElement).toBe(inVariant(header, 'default', 'button'));
  });

  it('keyboard focus on the original marks the matching element in the clone only', () => {
    const header = setup();
    createMidnight(header);

    inVariant(header, 'default', 'a').focus();

    expect(inVariant(header, 'dark', 'a').hasAttribute(ATTR)).toBe(true);
    expect(inVariant(header, 'dark', 'button').hasAttribute(ATTR)).toBe(false);
    expect(inVariant(header, 'default', 'a').hasAttribute(ATTR)).toBe(false);
  });

  it('focus leaving clears the mark, and the next focus sets its own', () => {
    const header = setup();
    createMidnight(header);

    inVariant(header, 'default', 'a').focus();
    inVariant(header, 'default', 'button').focus();

    expect(inVariant(header, 'dark', 'a').hasAttribute(ATTR)).toBe(false);
    expect(inVariant(header, 'dark', 'button').hasAttribute(ATTR)).toBe(true);

    inVariant(header, 'default', 'button').blur();

    expect(inVariant(header, 'dark', 'button').hasAttribute(ATTR)).toBe(false);
  });

  it('focus without :focus-visible, as from a mouse click, marks nothing', () => {
    const header = setup();
    createMidnight(header);

    // Which focus counts as visible is the browser's call, so it's stubbed here.
    const original = inVariant(header, 'default', 'a');
    const matches = vi.spyOn(original, 'matches').mockReturnValue(false);
    original.focus();
    matches.mockRestore();

    expect(inVariant(header, 'dark', 'a').hasAttribute(ATTR)).toBe(false);
  });

  it('after destroy() focus handling is gone', () => {
    const header = setup();
    const instance = createMidnight(header);
    const clone = inVariant(header, 'dark', 'button');
    instance.destroy();

    header.appendChild(clone);
    clone.focus();

    expect(document.activeElement).toBe(clone);
  });

  it('the default ring rule has zero specificity and exists once across instances', () => {
    const first = setup();
    const a = createMidnight(first);
    const second = document.createElement('nav');
    second.innerHTML = '<a href="#x">X</a>';
    mockRect(second, { top: 0, height: 60, width: 1000, right: 1000, bottom: 60 });
    document.body.appendChild(second);
    const b = createMidnight(second);

    expect(ringSheets()).toHaveLength(1);
    expect(ringSheets()[0].cssRules[0].cssText).toContain(`:where([${ATTR}])`);
    expect(ringSheets()[0].cssRules[0].cssText).toContain('outline: auto');

    a.destroy();
    expect(ringSheets()).toHaveLength(1);

    b.destroy();
    expect(ringSheets()).toHaveLength(0);
  });
});
