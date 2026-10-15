import { onMounted, onUnmounted, shallowRef, type Ref, type ObjectDirective } from 'vue';
import { createMidnight } from './core';
import type { MidnightOptions, MidnightInstance } from './types';

/**
 * Vue composable for midnight.js (auto mode).
 * Initializes on mount, destroys on unmount.
 * Cloning happens client-side - safe for SSR.
 */
export function useMidnight(
  elementRef: Ref<HTMLElement | null>,
  options?: MidnightOptions,
): Ref<MidnightInstance | null> {
  const instance = shallowRef<MidnightInstance | null>(null);

  onMounted(() => {
    if (!elementRef.value) return;
    instance.value = createMidnight(elementRef.value, options);
  });

  onUnmounted(() => {
    instance.value?.destroy();
    instance.value = null;
  });

  return instance;
}

/**
 * Vue custom directive for midnight.js (auto mode).
 * Usage: <header v-midnight> or <header v-midnight="{ onChange }">
 * In <script setup>, import as `vMidnight` for auto-registration.
 */
export const vMidnight: ObjectDirective<HTMLElement, MidnightOptions | undefined> = {
  mounted(el, binding) {
    const instance = createMidnight(el, binding.value);
    (el as any).__midnightInstance = instance;
  },
  updated(el) {
    (el as any).__midnightInstance?.refresh();
  },
  unmounted(el) {
    (el as any).__midnightInstance?.destroy();
    delete (el as any).__midnightInstance;
  },
};
