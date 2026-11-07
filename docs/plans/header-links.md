# Make header links work over every section

Status: in progress
Human: marcwiest
Goal: In auto mode, links and buttons in a managed element work with the mouse and keyboard over every section, with no workaround on the site.
Specs touched: `docs/product/interaction.md` (new), `docs/product/later.md` (new), `docs/product/index.md`, `docs/context.md`
Out of scope: headless mode's behavior, which only gets documented; making text fields work over named sections; site code that runs on hover rather than on click; other demo changes and library bugs; pushing the `v0.4.0` tag, which the human does after the merge.

## Changes

- [x] 1. Spec: `interaction.md` says that in auto mode, links and buttons take the mouse over every section: at any point, including mid-wipe, the variant painted there takes hover, cursor and clicks. A click on a clone runs the site's click code on the matching original element, once, and the original's default action follows unless that code prevents it. A modified or middle click on a link stays native on the clone, opening a tab or window as any link does, and runs no site click code. `docs/context.md` defines original, clone and named section. · Evidence: drive the demo, run from the branch, over a default section, a named section and mid-wipe. Capture a hover screenshot at each, and the cursor read under the mouse. Log how many times a listener on the original, a delegated listener and an inline `onclick` fire on a link click (one each), that a listener calling `preventDefault` stops navigation, that the dropdown toggles once per click, and the tabs opened by cmd, shift and middle clicks.
- [x] 2. Spec: `interaction.md` says each link and button is one tab stop, on the original; clones take no tab stop and stay hidden from assistive tech. Focus landing on a clone moves to the original. While the original shows keyboard focus, the matching element in each clone carries `data-midnight-focus-visible` and draws a default ring, which any site CSS naming that attribute overrides. A mouse click shows no ring. · Evidence: drive the demo from the branch with the keyboard. Capture the tab order in both directions, a ring screenshot over the default variant, over each named variant the header reaches and mid-wipe, one with a site's own focus style, one with no ring after a mouse click, the hash after Enter on a link over a named section, and the accessibility tree's list of header links and buttons (each once).
- [x] 3. Spec: none; the demo's coordinate fallback is gone, and its dropdown works through normal click handling. · Evidence: in the demo from the branch, click every header link and the dropdown over a named section and mid-wipe. Capture a screenshot at each section boundary, a performance trace showing the scroll loop goes idle, and the console, with no errors.
- [x] 4. Spec: `interaction.md` says that in headless mode the site owns its variants and their interaction, and the library only clips them; and that a text field isn't usable over a named section, since typing goes to the original and its clone doesn't show it. `later.md` parks showing typed text in clones until a site needs it. The README's accessibility and headless sections say the same, and show how a custom focus style names the attribute. · Evidence: inject a text field into the demo from the branch, type over a named section, and capture a screenshot and the two fields' values. Apply the README's focus style example to the demo and capture a ring screenshot. Open each link in the spec index.
- [ ] 5. Spec: none; `package.json` says `0.4.0` and the README's CDN links pin `@0.4`, so the human's `v0.4.0` tag publishes the change as a minor release. · Evidence: run `npm pack --dry-run` on the branch and capture that it names `@siteonce/midnight@0.4.0` and includes `dist`.

Every Change's browser evidence comes from Chrome, Firefox and Safari, driven by script. In Safari, keyboard checks use Option-Tab, since its plain Tab skips links by default. Where a script can't drive a check in a browser, the verification line says so, and the human checks it by hand.

## Open questions

## Phases

### Phase 1: Clones take the mouse · delivers Change 1
- [x] Tests: source module exports, run in happy-dom: a clone stays `aria-hidden` but is no longer `inert` or `pointer-events: none`; a plain click on a clone runs a listener on the original, and a delegated listener in the bubble and capture phases, once each, with the target in the original; a `preventDefault` in that code stops the original's default action, and without one it follows; a modified click on a clone's link runs no site click code and isn't prevented; a click still passes after `refresh()` and no longer passes after `destroy()`
- [x] Code: `src/core.ts` drops `inert` and `pointer-events: none` from clones and passes clone clicks to the matching original element, with the listener removed in `destroy()`

Notes: verified: mouse in Chrome, Firefox and Safari on the demo from the branch, over a default section, a named section and mid-wipe, covering hover, clicks, `preventDefault`, the dropdown and modified clicks. Safari reports `cursor: auto` on links, as it does on a real link, so its hand cursor needs a look by hand. Its shift click opened no tab on a clone or on a real link, and ran once, since it adds to the Reading List. Deviations: the listener is on the window, not on each clone, so a site's capture listener also fires once. Safari fires `click` for the middle button, so any non-primary button stays native on a link. One early Safari run missed plain clicks, on real originals too; it didn't recur in the later runs. Inline `onclick` is checked in the browsers only, since happy-dom doesn't run it.

### Phase 2: One tab stop, a mirrored focus ring · delivers Change 2
- [x] Tests: source module exports, run in happy-dom: every focusable element in a clone has `tabindex="-1"`, in the original none is added; focus landing on a clone moves to the matching original element; keyboard focus on the original sets `data-midnight-focus-visible` on the matching element in each clone, and focus leaving clears it; focus without `:focus-visible` sets nothing; the default ring rule is present once while an instance lives, and gone after the last `destroy()`
- [x] Code: `src/core.ts` sets the clones' `tabindex`, moves focus to the original and mirrors keyboard focus; a zero-specificity default ring rule goes in through `adoptedStyleSheets`, so a strict CSP doesn't block it; listeners and the rule are removed in `destroy()`

Notes: verified: keyboard in Chrome, Firefox and Safari on the demo from the branch, covering tab order both ways, the ring over the default, dark, accent, inverted and expanded variants and mid-wipe, a site's own style, no ring after a mouse click, and Enter over a named section. The built library drew the ring with no violations under `default-src 'self'` in all three. Accessibility: Chrome's tree and Firefox's accessibility locator each list 4 links and 1 button. Safari's driver reports a role even for hidden elements, so VoiceOver there needs a check by hand. Deviations: Firefox was driven with `accessibility.tabfocus` set to 7, since on macOS it otherwise tabs only to text fields. `destroy()` now does nothing on a second call, so it can't remove the ring rule from another instance. A browser without constructed stylesheets, Safari before 16.4, keeps working but shows no default ring on clones. `outline: auto` is checked in the browsers only, since happy-dom drops it.

### Phase 3: The demo drops its workaround · delivers Change 3
- [x] Work: `demo/index.html` loses the coordinate fallback and its comment, and keeps the dropdown's direct path. The demo has no test seam, so the browser evidence is the proof, on top of the library tests from Phase 1

Notes: verified: every header link and the dropdown in Chrome, Firefox and Safari over a named section and mid-wipe, with screenshots at all 7 section boundaries. The scroll loop goes idle: Chrome's performance trace shows 80 animation frames while scrolling and none in 3 idle seconds, and in Firefox and Safari, whose drivers give no trace, the library asks for 80 and then none. The console shows no errors from the page; Chrome logs the demo's missing favicon, as the live demo does. Deviations: a click on a header link now also closes an open dropdown, wherever the link is clicked. Before, it closed only over a named section.

### Phase 4: Documented limits and README · delivers Change 4
- [x] Work: spec text for headless mode and text fields in `docs/product/interaction.md`, `docs/product/later.md` and the spec index; the README's accessibility, headless and why-a-rewrite text matches the new behavior, and shows a custom focus style naming the attribute

Notes: verified: in Chrome, Firefox and Safari, typing in an injected text field over a named section reached the original (`abc`) and left the clone empty, and the README's focus style, read from the README, drew on the original and the clone. Each link in the spec index opens. Deviations: the README's heading is now Accessibility and interaction, and it also states that only clicks pass and that the passed click has `isTrusted: false`.

### Phase 5: Version 0.4.0 · delivers Change 5
- [ ] Work: `package.json` says `0.4.0`, and the README's CDN links pin `@0.4`

Notes:
