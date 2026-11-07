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

  function init(): void {
    const sections = scanSections(instanceName);
    variants = buildVariants();
    window.addEventListener('click', onClick, true);
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
    window.removeEventListener('click', onClick, true);
    engine?.destroy();
    engine = null;
    extractLiveContent();
    variants = [];
    element.style.overflow = originalOverflow;
  }

  init();

  return { refresh, destroy };
}
