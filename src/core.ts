import type {
  MidnightOptions,
  MidnightInstance,
  VariantState,
  Engine,
} from './types';
import { scanSections } from './utils';
import { createEngine } from './engine';

const VARIANT_ATTR = 'data-midnight-variant';
const DEFAULT_NAME = 'default';
const FOCUS_ATTR = 'data-midnight-focus-visible';
const FOCUSABLE = 'a[href],button,input,select,textarea,summary,[tabindex],[contenteditable]';

// One shared rule for the default ring. Zero specificity lets any site rule naming
// the attribute win, and a constructed sheet isn't blocked by a strict CSP.
let ringSheet: CSSStyleSheet | null = null;
let ringUsers = 0;

function addRingRule(): void {
  // Without constructed sheets (Safari before 16.4), a clone shows no default ring.
  if (ringUsers++ > 0 || !document.adoptedStyleSheets) return;
  ringSheet = new CSSStyleSheet();
  ringSheet.replaceSync(`:where([${FOCUS_ATTR}]) { outline: auto; }`);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ringSheet];
}

function removeRingRule(): void {
  if (--ringUsers > 0 || !ringSheet) return;
  document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== ringSheet);
  ringSheet = null;
}

/** The element at the same place in `to` as `el` is in `from`. */
function matchingElement(el: Element, from: Element, to: Element): Element | undefined {
  const path: number[] = [];
  for (let node = el; node !== from; node = node.parentElement!) {
    path.unshift(Array.prototype.indexOf.call(node.parentElement!.children, node));
  }
  return path.reduce<Element | undefined>((node, i) => node?.children[i], to);
}

export function createMidnight(
  element: HTMLElement,
  options: MidnightOptions = {},
): MidnightInstance {
  const { onChange } = options;
  const instanceName = options.name ?? (element.getAttribute('data-midnight-element') || undefined);

  const originalOverflow = element.style.overflow;

  let engine: Engine | null = null;
  let variants: VariantState[] = [];

  function buildVariants(): VariantState[] {
    const sections = scanSections(instanceName);
    const variantNames = new Set<string>();
    for (const s of sections) {
      variantNames.add(s.variant);
    }

    element.style.overflow = 'visible';

    const template = document.createDocumentFragment();
    while (element.firstChild) {
      template.appendChild(element.firstChild);
    }

    // Build clone wrappers first (while template nodes are intact for cloning)
    const clones: VariantState[] = [];
    for (const name of variantNames) {
      clones.push(createWrapper(name, template, true));
    }

    // Sizing ghost: invisible clone in normal flow that drives the element's
    // height. Responds to media queries, font loading, etc. without JS
    // re-measurement. The absolute variant wrappers overlay it.
    // Must clone before the default wrapper moves the template nodes.
    const ghost = document.createElement('div');
    ghost.style.visibility = 'hidden';
    ghost.style.pointerEvents = 'none';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.appendChild(template.cloneNode(true));
    element.appendChild(ghost);

    // Build default wrapper last - uses original nodes (preserves event listeners)
    const defaultVariant = createWrapper(DEFAULT_NAME, template, false);

    element.appendChild(defaultVariant.wrapper);

    const allVariants = [defaultVariant];
    for (const clone of clones) {
      element.appendChild(clone.wrapper);
      allVariants.push(clone);
    }

    return allVariants;
  }

  function createWrapper(
    name: string,
    template: DocumentFragment,
    isClone: boolean,
  ): VariantState {
    const wrapper = document.createElement('div');
    wrapper.setAttribute(VARIANT_ATTR, name);
    wrapper.style.position = 'absolute';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.right = '0';
    wrapper.style.bottom = '0';
    wrapper.style.willChange = 'clip-path';
    wrapper.style.clipPath = 'inset(0 0 100% 0)';

    if (isClone) {
      wrapper.setAttribute('aria-hidden', 'true');
      wrapper.appendChild(template.cloneNode(true));
      for (const el of wrapper.querySelectorAll(FOCUSABLE)) {
        el.setAttribute('tabindex', '-1');
      }
    } else {
      wrapper.appendChild(template);
    }

    return { wrapper, name };
  }

  // Listening on the window, in the capture phase, stops a clone's click before
  // any site listener sees it, so site code only ever sees the passed click.
  function onClick(event: MouseEvent): void {
    const { target } = event;
    if (!(target instanceof Element)) return;
    const [original, ...clones] = variants;
    const clone = clones.find((c) => c.wrapper.contains(target));
    if (!clone) return;

    event.stopImmediatePropagation();

    // Safari fires click, not auxclick, for the middle button.
    const native = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
    if (native && target.closest('a[href]')) return;

    const match = matchingElement(target, clone.wrapper, original.wrapper);
    if (!match) return;

    event.preventDefault();
    match.dispatchEvent(new MouseEvent('click', event));
  }

  function onFocusIn(event: FocusEvent): void {
    const target = event.target as Element;
    const [original, ...clones] = variants;

    const clone = clones.find((c) => c.wrapper.contains(target));
    if (clone) {
      const match = matchingElement(target, clone.wrapper, original.wrapper) as HTMLElement | undefined;
      match?.focus({ preventScroll: true });
      return;
    }

    if (!original.wrapper.contains(target) || !target.matches(':focus-visible')) return;
    for (const c of clones) {
      matchingElement(target, original.wrapper, c.wrapper)?.setAttribute(FOCUS_ATTR, '');
    }
  }

  function onFocusOut(): void {
    for (const el of element.querySelectorAll(`[${FOCUS_ATTR}]`)) {
      el.removeAttribute(FOCUS_ATTR);
    }
  }

  function init(): void {
    const sections = scanSections(instanceName);
    variants = buildVariants();
    window.addEventListener('click', onClick, true);
    element.addEventListener('focusin', onFocusIn);
    element.addEventListener('focusout', onFocusOut);
    addRingRule();
    engine = createEngine({
      element,
      variants,
      defaultName: DEFAULT_NAME,
      sections,
      onChange,
    });
  }

  function extractLiveContent(): void {
    const defaultWrapper = element.querySelector(
      `[${VARIANT_ATTR}="${DEFAULT_NAME}"]`,
    );

    const wrappers = element.querySelectorAll(`[${VARIANT_ATTR}]`);
    for (const w of wrappers) {
      w.remove();
    }

    // Clear remaining children (the sizing ghost)
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }

    // Move the default wrapper's live child nodes back into element
    if (defaultWrapper) {
      while (defaultWrapper.firstChild) {
        element.appendChild(defaultWrapper.firstChild);
      }
    }
  }

  function refresh(): void {
    extractLiveContent();
    const sections = scanSections(instanceName);
    variants = buildVariants();
    engine?.update(variants, sections);
  }

  function destroy(): void {
    if (!engine) return;
    window.removeEventListener('click', onClick, true);
    element.removeEventListener('focusin', onFocusIn);
    element.removeEventListener('focusout', onFocusOut);
    removeRingRule();
    engine.destroy();
    engine = null;
    extractLiveContent();
    variants = [];
    element.style.overflow = originalOverflow;
  }

  init();

  return { refresh, destroy };
}
