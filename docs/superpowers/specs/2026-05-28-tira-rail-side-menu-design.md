# TIRA Rail Side Menu — Design

A new persistent left sidebar for TIRA views, separate from and additive to the existing slide-over menu.

## Goal

Add a permanent, collapsible left rail to the TIRA homepage (and other TIRA-side views) that surfaces chat-focused navigation (New Chat, Chats, Report Library, Help). Matches the two states shown in the provided designs: expanded labeled panel and collapsed icon rail.

## Scope

**In scope**
- New rail component, mounted at the app shell level
- Visible on: TIRA homepage (`tira` route), chat flow, library view
- Hidden on: Hub view (`hub` route)
- Two states: expanded (260px) and collapsed (56px)
- Toggle button in the rail header switches between states
- State persists across page reloads via `localStorage`
- Main content pushes (reflows) when the rail width changes — no overlap
- Tooltips on icons when collapsed
- All four items are placeholders — no destinations wired yet

**Explicitly out of scope**
- Wiring item clicks to destinations (deferred — items are visual-only)
- Changes to the existing slide-over menu (it stays as-is)
- Changes to the app bar hamburger button (it continues to control the existing slide-over)
- Changes to the Hub view
- Per-user account state on a backend (state is local browser storage only)

## Visual structure

**Expanded state (260px wide, default on first load):**
- Header: "Tyler Reporting" title + collapse toggle button
- Body: three labeled items, each with a leading icon — New Chat, Chats, Report Library
- Footer: Help item (pinned to bottom)

**Collapsed state (56px wide):**
- Header: expand toggle button only
- Body: same three items as icons, no labels
- Footer: Help icon
- Hovering any icon shows a tooltip with the item's label

The rail sits flush against the left edge below the app bar, full height. Main content sits to its right and resizes to fit the remaining width.

## Behavior

| Trigger | Result |
|---|---|
| First load (no saved preference) | Rail mounts in expanded state |
| Click toggle button | Width animates between expanded and collapsed (200ms) |
| Reload page | Last state is restored from `localStorage` |
| Navigate to a TIRA-side view (`tira`, chat flow, library) | Rail visible |
| Navigate to Hub view | Rail hidden |
| Hover icon in collapsed state | Tooltip with label appears |
| Click any rail item | No-op (placeholder) — hover/active styling still fires |

The rail does not unmount when navigating between TIRA views. Its state survives view changes because it lives outside `#view-container`.

## Architecture

The rail is a shell-level concern, mounted once at startup as a sibling to `#view-container`, controlled from `main.js` via the existing `view-changed` event.

```
forge-scaffold > body slot
  ├── <aside id="tira-rail-root"></aside>       (new — rail lives here)
  └── <div id="view-container"></div>            (existing — views render here)
```

The two siblings sit in a horizontal flex layout. The rail's width drives the available width of the view container; no view code is touched.

### Module: `src/tira-rail.js`

Exposes:
- `mountTiraRail(rootEl)` — builds DOM into the given element, wires toggle, restores state from `localStorage`
- `showTiraRail()` / `hideTiraRail()` — toggles visibility (used by `view-changed` handler)
- Internal state: `expanded: boolean`, persisted under key `tira-rail-expanded`

The module owns its DOM. It does not import view modules and does not know about the router beyond receiving show/hide calls.

### Module: `src/tira-rail.css`

Owns:
- Layout (`.tira-rail`, `.tira-rail--collapsed`, `.tira-rail--hidden`)
- Header, body, footer regions
- Item styling (icon, label, hover, focus)
- Tooltip styling for collapsed state
- Width transition

Uses the same Roboto font and Forge primary color (`#3f51b5`) as the rest of the homepage.

### Files

**New**
- `src/tira-rail.js`
- `src/tira-rail.css`

**Modified**
- `index.html` — wrap the body slot in a flex container; add `<aside id="tira-rail-root"></aside>` as a sibling of `#view-container`
- `src/main.js` — import the rail module and CSS; mount on `DOMContentLoaded`; in the existing `view-changed` listener, call `showTiraRail()` for non-Hub views and `hideTiraRail()` for Hub

**Untouched**
- `src/views/tira-view.js`, `src/views/hub-view.js`, `src/chat-flow.js`, all standard report files
- The existing slide-over menu (defined inside `tira-view.js` and styled in `index.html`)
- The app bar markup

## Items and icons

| Item | Forge icon name | Action |
|---|---|---|
| New Chat | `add` (chat bubble + add visual via composite icon, fallback `add`) | Placeholder |
| Chats | `chat` (or closest available — see note) | Placeholder |
| Report Library | `description` | Placeholder |
| Help | `help_outline` | Placeholder |

Note: icon names must come from the registered set in `main.js`. If a designed icon (e.g., the overlapping speech-bubble glyph for "Chats") isn't in the current registry, the implementation plan will either register the closest match from `@tylertech/tyler-icons` or pick the nearest registered substitute. This will be resolved in the implementation plan, not here.

## State persistence

- Key: `tira-rail-expanded`
- Value: `"true"` (expanded) or `"false"` (collapsed)
- Read once on mount; written on every toggle
- Missing or invalid value → default to expanded

## Accessibility

- Toggle button has `aria-label="Collapse menu"` / `aria-label="Expand menu"` switched based on state
- Toggle button has `aria-expanded` reflecting state
- Each item is a `<button>` with descriptive text (label, or `aria-label` matching the label when collapsed)
- Tooltips when collapsed use the native `title` attribute (no custom focus-trap logic required for a prototype)

## Non-goals / explicit deferrals

- No keyboard shortcut for toggling
- No active-route highlighting (items don't navigate yet)
- No badge / unread counters on items
- No nested or expandable items
- No responsive collapse on narrow viewports (out of scope for prototype)
