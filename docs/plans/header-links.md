# Make header links work over every section

Status: ready
Human: marcwiest
Goal: In auto mode, links and buttons in a managed element work with the mouse and keyboard over every section, with no workaround on the site.
Specs touched: `docs/product/interaction.md` (new), `docs/product/later.md` (new), `docs/product/index.md`, `docs/context.md`
Out of scope: headless mode's behavior, which only gets documented; making text fields work over named sections; site code that runs on hover rather than on click; other demo changes and library bugs; pushing the `v0.4.0` tag, which the human does after the merge.

## Changes

- [ ] 1. Spec: `interaction.md` says that in auto mode, links and buttons take the mouse over every section: at any point, including mid-wipe, the variant painted there takes hover, cursor and clicks. A click on a clone runs the site's click code on the matching original element, once, and the original's default action follows unless that code prevents it. A modified or middle click on a link stays native on the clone, opening a tab or window as any link does, and runs no site click code. `docs/context.md` defines original, clone and named section. · Evidence: drive the demo, run from the branch, over a default section, a named section and mid-wipe. Capture a hover screenshot at each, and the cursor read under the mouse. Log how many times a listener on the original, a delegated listener and an inline `onclick` fire on a link click (one each), that a listener calling `preventDefault` stops navigation, that the dropdown toggles once per click, and the tabs opened by cmd, shift and middle clicks.
- [ ] 2. Spec: `interaction.md` says each link and button is one tab stop, on the original; clones take no tab stop and stay hidden from assistive tech. Focus landing on a clone moves to the original. While the original shows keyboard focus, the matching element in each clone carries `data-midnight-focus-visible` and draws a default ring, which any site CSS naming that attribute overrides. A mouse click shows no ring. · Evidence: drive the demo from the branch with the keyboard. Capture the tab order in both directions, a ring screenshot over the default variant, over each named variant the header reaches and mid-wipe, one with a site's own focus style, one with no ring after a mouse click, the hash after Enter on a link over a named section, and the accessibility tree's list of header links and buttons (each once).
- [ ] 3. Spec: none; the demo's coordinate fallback is gone, and its dropdown works through normal click handling. · Evidence: in the demo from the branch, click every header link and the dropdown over a named section and mid-wipe. Capture a screenshot at each section boundary, a performance trace showing the scroll loop goes idle, and the console, with no errors.
- [ ] 4. Spec: `interaction.md` says that in headless mode the site owns its variants and their interaction, and the library only clips them; and that a text field isn't usable over a named section, since typing goes to the original and its clone doesn't show it. `later.md` parks showing typed text in clones until a site needs it. The README's accessibility and headless sections say the same, and show how a custom focus style names the attribute. · Evidence: inject a text field into the demo from the branch, type over a named section, and capture a screenshot and the two fields' values. Apply the README's focus style example to the demo and capture a ring screenshot. Open each link in the spec index.
- [ ] 5. Spec: none; `package.json` says `0.4.0` and the README's CDN links pin `@0.4`, so the human's `v0.4.0` tag publishes the change as a minor release. · Evidence: run `npm pack --dry-run` on the branch and capture that it names `@siteonce/midnight@0.4.0` and includes `dist`.

Every Change's browser evidence comes from Chrome, Firefox and Safari, driven by script. In Safari, keyboard checks use Option-Tab, since its plain Tab skips links by default. Where a script can't drive a check in a browser, the verification line says so, and the human checks it by hand.

## Open questions

## Phases

Added before building starts, by whoever builds the plan. Until then, it holds only this note and the example below, which the phases replace. A phase that changes code has Tests and Code boxes; any other phase has one Work box:

```
### Phase 1: <name> · delivers Change 1
- [ ] Tests: <seam>: <behavior the tests assert>
- [ ] Code: <what makes them pass>

Notes: <added when the phase is done: verification line, deviations, blockers>

### Phase 2: <name> · delivers Change 2
- [ ] Work: <what it changes, such as docs, config or content>

Notes: <...>
```
