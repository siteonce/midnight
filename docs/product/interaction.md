# Interaction

How links and buttons in a managed element respond to people.

## Auto mode: mouse

- Links and buttons take the mouse over every section. At any point, including mid-wipe, the variant painted there takes hover, cursor and clicks.
- A click on a clone runs the site's click code on the matching original element, once. The original's default action follows unless that code prevents it.
- A modified or middle click on a link stays native on the clone, opening a tab or window as any link does, and runs no site click code.

## Auto mode: keyboard and assistive tech

- Each link and button is one tab stop, on the original. Clones take no tab stop and stay hidden from assistive tech.
- Focus landing on a clone moves to the original.
- While the original shows keyboard focus, the matching element in each clone carries `data-midnight-focus-visible` and draws a default ring, which any site CSS naming that attribute overrides. A mouse click shows no ring.

## Auto mode: text fields

- A text field isn't usable over a named section, since typing goes to the original and its clone doesn't show it.

## Headless mode

- The site owns its variants and their interaction. The library only clips them.
