# @siteonce/midnight

[![npm version](https://img.shields.io/npm/v/@siteonce/midnight)](https://www.npmjs.com/package/@siteonce/midnight)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@siteonce/midnight)](https://bundlephobia.com/package/@siteonce/midnight)
[![CI](https://github.com/siteonce/midnight/actions/workflows/ci.yml/badge.svg)](https://github.com/siteonce/midnight/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Fixed and sticky headers that change style as page sections scroll beneath them, with a pixel-perfect wipe at every section boundary. Any fixed or sticky bar works the same way, including a navbar.

A modern, dependency-free rewrite inspired by Aerolab's [midnight.js](https://github.com/Aerolab/midnight.js). Not affiliated with or endorsed by Aerolab.

**~2.4 kB gzipped** (auto mode) | TypeScript | Adapters for React, Vue, Svelte and Solid

**[Live Demo](https://siteonce.github.io/midnight/)**

## Why a rewrite

The original midnight.js (2014) introduced the pattern. This package implements it with today's browser APIs:

- **`clip-path: inset()`** for GPU-composited clipping
- **`ResizeObserver`** to track section sizes reactively (no polling)
- **Scroll-triggered `requestAnimationFrame`** that idles when the user is not scrolling
- **Links and buttons that work over every section**, with one tab stop each and cloned variants hidden from assistive tech
- Full **`destroy()` / `refresh()`** lifecycle
- Zero dependencies, no jQuery

## Install

```bash
npm install @siteonce/midnight
```

Or via CDN (UMD, exposes a global `midnight`):

```html
<script src="https://unpkg.com/@siteonce/midnight@0.4/dist/midnight.umd.js"></script>
<!-- or -->
<script src="https://cdn.jsdelivr.net/npm/@siteonce/midnight@0.4/dist/midnight.umd.js"></script>
```

## Usage

### 1. Mark your element and sections

```html
<header data-midnight-element>
  <nav>
    <a href="/" class="logo">Logo</a>
    <a href="/about">About</a>
  </nav>
</header>

<section data-midnight-section="dark">...</section>
<section>No attribute: the header uses its default style.</section>
<section data-midnight-section="accent">...</section>
```

### 2. Initialize

```js
import { midnight } from '@siteonce/midnight';

const instance = midnight(document.querySelector('[data-midnight-element]'));
```

The plugin reads every unique `data-midnight-section` value and clones your element's content once per variant. Each clone is wrapped in a container with `data-midnight-variant="<name>"`. The original content stays in the `default` variant.

### 3. Style each variant

```css
header { position: fixed; top: 0; left: 0; right: 0; z-index: 100; }

[data-midnight-variant="default"] { background: white; color: #111; }
[data-midnight-variant="dark"]    { background: #111;  color: white; }
[data-midnight-variant="accent"]  { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
```

### Multiple instances

Name each element via `data-midnight-element` and scope sections with `data-midnight-target` (space-separated). Sections without a target apply to all instances.

```html
<header data-midnight-element="top">...</header>
<nav data-midnight-element="bottom">...</nav>

<section data-midnight-section="accent" data-midnight-target="top">...</section>
<section data-midnight-section="dark">...</section>
```

The instance name defaults to the `data-midnight-element` value, or set it via `options.name`.

## Headless mode

Bring your own pre-rendered variant elements when you need different markup (not just different styles) per variant. The plugin only manages `clip-path`; nothing is cloned.

```js
import { midnightHeadless } from '@siteonce/midnight';

const instance = midnightHeadless({
  element: document.querySelector('header'),
  variants: {
    default: document.querySelector('.header-default'),
    dark: document.querySelector('.header-dark'),
  },
  defaultVariant: 'default', // optional
  onChange: (variants) => {}, // optional
});
```

In headless mode your site owns its variants and their interaction, and the plugin only clips them, so nothing under [Accessibility and interaction](#accessibility-and-interaction) applies. You position the variant elements absolutely inside the managed element and set `aria-hidden`/`inert` on non-default variants yourself. With SSR, render non-default variants client-side only to avoid duplicate content.

## API

### `midnight(element, options?)`

Auto mode. Returns an instance.

| Option | Type | Description |
| --- | --- | --- |
| `name` | `string` | Instance name for `data-midnight-target` scoping. Defaults to the `data-midnight-element` value. |
| `onChange` | `(variants) => void` | Fires when the set of visible variants changes. `variants` is `Array<{ name: string, progress: number }>`, progress 0 to 1. |

### `midnightHeadless(options)`

Headless mode. Options: `element`, `variants`, `defaultVariant?`, `name?`, `onChange?`.

### Instance methods

```js
instance.refresh(); // rebuild clones and re-scan sections
instance.destroy(); // full teardown: removes clones, listeners and observers
```

Call `refresh()` when sections are added, removed or reordered (for example after an SPA route change), or in auto mode when the element's HTML content changes. CSS-driven size changes are handled automatically.

## Framework adapters

Each adapter is a separate tree-shakable entry point (~0.2 kB gzipped) wrapping auto mode. Cloning happens client-side on mount, so server-rendered HTML stays clean.

### React

```jsx
import { useRef } from 'react';
import { useMidnight } from '@siteonce/midnight/react';

function Header() {
  const ref = useRef(null);
  const instance = useMidnight(ref, { onChange: (v) => console.log(v) });
  return <header ref={ref}><Nav /></header>;
}
```

### Vue

```html
<script setup>
import { ref } from 'vue';
import { useMidnight, vMidnight } from '@siteonce/midnight/vue';

const el = ref(null);
useMidnight(el);
</script>

<template>
  <header ref="el"><Nav /></header>
  <!-- or as a directive: <header v-midnight> -->
</template>
```

### Svelte

```html
<script>
  import { midnight } from '@siteonce/midnight/svelte';
</script>

<header use:midnight={{ onChange: (v) => console.log(v) }}>
  <Nav />
</header>
```

### Solid

```jsx
import { createMidnight, midnight } from '@siteonce/midnight/solid';

function Header() {
  let el;
  createMidnight(() => el);
  return <header ref={el}><Nav /></header>;
  // or as a directive: <header use:midnight>
}
```

## Accessibility and interaction

This section covers auto mode.

- Links and buttons take the mouse over every section. At any point, including mid-wipe, the variant painted there takes hover, cursor and clicks.
- A click on a clone runs your click code on the matching element in the original, once. Listeners on the original, delegated listeners and inline handlers each fire once, and the default action follows unless your code prevents it. The click your code sees has `isTrusted: false`.
- A modified or middle click on a link stays native on the clone, opening a tab or window as any link does, and runs none of your click code.
- Only clicks pass to the original. CSS `:hover` works on clones, but a `mouseenter` listener on the original doesn't run when the mouse is over a clone.
- Each link and button is one tab stop, on the original. Clones take no tab stop and get `aria-hidden="true"`, so screen readers and keyboard users only encounter the content once. Focus landing on a clone moves to the original.
- While the original shows keyboard focus, the matching element in each clone carries `data-midnight-focus-visible` and draws a default ring. A mouse click shows no ring. `:focus-visible` can't match a clone, so a custom focus style names the attribute too, or clones keep the default ring:

  ```css
  header a:focus-visible,
  header a[data-midnight-focus-visible] {
    outline: 3px solid currentColor;
    outline-offset: 4px;
  }
  ```

- A text field isn't usable over a named section, since typing goes to the original and its clone doesn't show it.
- Auto mode is SSR-safe: server HTML contains a single element, so crawlers see one set of links.
- `clip-path` clips all descendants, including dropdown panels. Render panels outside the managed element (or in a portal) and keep only the triggers inside.

## Browser support

Requires `clip-path: inset()`, `ResizeObserver` and `requestAnimationFrame` (all 97%+ global support). Works in all modern evergreen browsers. No IE support. The default focus ring on clones also needs constructed stylesheets (Safari 16.4 or later); without them, everything else still works.

## Development

```bash
pnpm install
pnpm dev        # demo with HMR
pnpm build      # ESM + UMD + .d.ts
pnpm test
```

## License

MIT
