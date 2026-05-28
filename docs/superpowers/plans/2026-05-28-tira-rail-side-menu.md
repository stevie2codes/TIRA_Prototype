# TIRA Rail Side Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent, collapsible left rail (260px expanded / 56px collapsed) to all TIRA-side views (homepage, chat flow, library), additive to the existing slide-over menu, with state persisted to `localStorage` and push-content layout.

**Architecture:** Shell-level rail mounted once in `index.html` as a sibling of `#view-container` inside a horizontal flex wrapper. A single module (`src/tira-rail.js`) owns the markup, toggle behavior, and `localStorage` persistence. Visibility is controlled from `src/main.js` via the existing `view-changed` event — shown on every view except `hub`.

**Tech Stack:** Vanilla JS, Vite, `@tylertech/forge` (web components), `@tylertech/tyler-icons`. No test framework in this repo — verification is manual via `npm run dev` and browser observation, matching project convention (see CLAUDE.md).

**Spec:** [docs/superpowers/specs/2026-05-28-tira-rail-side-menu-design.md](../specs/2026-05-28-tira-rail-side-menu-design.md)

---

## File Plan

**New files**
- `src/tira-rail.js` — module exporting `mountTiraRail(rootEl)`, `showTiraRail()`, `hideTiraRail()`. Owns DOM, toggle handler, `localStorage` read/write.
- `src/tira-rail.css` — layout, expanded/collapsed states, hover, transitions, tooltip styling.

**Modified files**
- `index.html` — wrap the `slot="body"` div in a flex container; add `<aside id="tira-rail-root"></aside>` as a sibling of `#view-container`.
- `src/main.js` — register four new icons (`tylIconChatPlus`, `tylIconForum`, `tylIconLocalLibrary`, `tylIconMenuOpen`); import the rail module and CSS; call `mountTiraRail()` on `DOMContentLoaded`; in the existing `view-changed` listener, call `showTiraRail()` for non-Hub views, `hideTiraRail()` for `hub`.

**Untouched**
- `src/views/tira-view.js`, `src/views/hub-view.js`, `src/chat-flow.js`, the existing slide-over menu, the app bar markup.

---

## Icon mapping (resolved against `@tylertech/tyler-icons`)

| Item | Icon name (Forge) | Tyler import |
|---|---|---|
| Toggle button | `menu_open` | `tylIconMenuOpen` |
| New Chat | `chat_plus` | `tylIconChatPlus` |
| Chats | `forum` | `tylIconForum` |
| Report Library | `local_library` | `tylIconLocalLibrary` |
| Help | `help_outline` | `tylIconHelpOutline` (already registered) |

All confirmed present in `node_modules/@tylertech/tyler-icons/tyler-icons.d.ts` at the time of writing.

---

### Task 1: Register new icons in main.js

**Files:**
- Modify: `src/main.js` (icon imports block ~lines 28-86 and `IconRegistry.define([...])` block ~lines 108-166)

- [ ] **Step 1: Add the four new icon imports**

In `src/main.js`, find the `import { ... } from '@tylertech/tyler-icons';` block and add these four names alongside the existing ones:

```js
tylIconChatPlus,
tylIconForum,
tylIconLocalLibrary,
tylIconMenuOpen,
```

Place them in the import list (order does not matter for runtime; group them near related icons or at the end of the destructuring block).

- [ ] **Step 2: Add the four new icons to the IconRegistry.define array**

In the same file, find the `IconRegistry.define([...])` call and add the same four identifiers to the array:

```js
tylIconChatPlus,
tylIconForum,
tylIconLocalLibrary,
tylIconMenuOpen,
```

- [ ] **Step 3: Verify the dev server still boots without errors**

Run: `npm run dev`
Expected: Vite starts cleanly, browser opens, no console errors about missing imports. Existing TIRA homepage still renders.

Stop the dev server (`Ctrl-C`) before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/main.js
git commit -m "feat(rail): register icons for new side rail"
```

---

### Task 2: Create the rail stylesheet

**Files:**
- Create: `src/tira-rail.css`

- [ ] **Step 1: Create the file with the full stylesheet**

Create `src/tira-rail.css` with the following content (do not abbreviate — paste exactly):

```css
/* ── TIRA Rail — persistent left sidebar ─────────────────────────────── */

/* Shell wrapper sits inside <forge-scaffold slot="body"> and lays out
   the rail + view-container horizontally. */
.tira-shell {
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
}

#tira-rail-root {
  flex-shrink: 0;
}

#view-container {
  flex: 1;
  min-width: 0;
  height: 100%;
}

/* ── Rail container ──────────────────────────────────────────────────── */
.tira-rail {
  display: flex;
  flex-direction: column;
  width: 260px;
  height: 100%;
  background: #fff;
  border-right: 1px solid #e0e0e0;
  font-family: 'Roboto', sans-serif;
  transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.tira-rail--collapsed {
  width: 56px;
}

.tira-rail--hidden {
  display: none;
}

/* ── Header ──────────────────────────────────────────────────────────── */
.tira-rail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  min-height: 56px;
  box-sizing: border-box;
}

.tira-rail__title {
  font-size: 15px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  letter-spacing: 0.15px;
  white-space: nowrap;
  overflow: hidden;
}

.tira-rail--collapsed .tira-rail__title {
  display: none;
}

.tira-rail__toggle {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.6);
  transition: background 0.15s ease;
  flex-shrink: 0;
}

.tira-rail__toggle:hover {
  background: rgba(63, 81, 181, 0.08);
  color: #3f51b5;
}

.tira-rail__toggle forge-icon {
  --forge-icon-font-size: 20px;
}

.tira-rail--collapsed .tira-rail__toggle forge-icon {
  transform: scaleX(-1);
}

/* ── Body / Footer ──────────────────────────────────────────────────── */
.tira-rail__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.tira-rail__footer {
  border-top: 1px solid #f0f0f0;
  padding: 8px 0;
  flex-shrink: 0;
}

/* ── Item ───────────────────────────────────────────────────────────── */
.tira-rail__item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.78);
  letter-spacing: 0.25px;
  text-align: left;
  transition: background 0.12s ease, color 0.12s ease;
  box-sizing: border-box;
  min-height: 44px;
}

.tira-rail__item:hover {
  background: rgba(63, 81, 181, 0.08);
  color: #3f51b5;
}

.tira-rail__item:focus-visible {
  outline: 2px solid #3f51b5;
  outline-offset: -2px;
}

.tira-rail__item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.tira-rail__item-icon forge-icon {
  --forge-icon-font-size: 20px;
  color: rgba(0, 0, 0, 0.6);
  transition: color 0.12s ease;
}

.tira-rail__item:hover .tira-rail__item-icon forge-icon {
  color: #3f51b5;
}

.tira-rail__item-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Collapsed: hide labels, center icons */
.tira-rail--collapsed .tira-rail__item {
  justify-content: center;
  padding: 10px 0;
  gap: 0;
}

.tira-rail--collapsed .tira-rail__item-label {
  display: none;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/tira-rail.css
git commit -m "feat(rail): add tira-rail stylesheet"
```

---

### Task 3: Create the rail module

**Files:**
- Create: `src/tira-rail.js`

- [ ] **Step 1: Create the file with the full module**

Create `src/tira-rail.js` with the following content (paste exactly):

```js
/**
 * TIRA Rail — persistent left sidebar mounted at the app shell level.
 *
 * Public API:
 *   mountTiraRail(rootEl)  — builds DOM, wires toggle, restores state
 *   showTiraRail()         — shows the rail (used on TIRA-side views)
 *   hideTiraRail()         — hides the rail (used on Hub view)
 */

import './tira-rail.css';

const STORAGE_KEY = 'tira-rail-expanded';

let railEl = null;

const items = [
  { id: 'new-chat',       icon: 'chat_plus',     label: 'New Chat' },
  { id: 'chats',          icon: 'forum',         label: 'Chats' },
  { id: 'report-library', icon: 'local_library', label: 'Report Library' },
];

const footerItems = [
  { id: 'help', icon: 'help_outline', label: 'Help' },
];

function readExpanded() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return true; // default: expanded
}

function writeExpanded(expanded) {
  localStorage.setItem(STORAGE_KEY, expanded ? 'true' : 'false');
}

function renderItem({ id, icon, label }) {
  return `
    <button class="tira-rail__item" type="button" data-action="${id}" title="${label}" aria-label="${label}">
      <span class="tira-rail__item-icon"><forge-icon name="${icon}"></forge-icon></span>
      <span class="tira-rail__item-label">${label}</span>
    </button>
  `;
}

export function mountTiraRail(rootEl) {
  if (!rootEl) return;

  const expanded = readExpanded();

  rootEl.innerHTML = `
    <nav class="tira-rail ${expanded ? '' : 'tira-rail--collapsed'}" aria-label="Tyler Reporting navigation">
      <div class="tira-rail__header">
        <span class="tira-rail__title">Tyler Reporting</span>
        <button
          class="tira-rail__toggle"
          type="button"
          aria-label="${expanded ? 'Collapse menu' : 'Expand menu'}"
          aria-expanded="${expanded ? 'true' : 'false'}"
        >
          <forge-icon name="menu_open"></forge-icon>
        </button>
      </div>
      <div class="tira-rail__body">
        ${items.map(renderItem).join('')}
      </div>
      <div class="tira-rail__footer">
        ${footerItems.map(renderItem).join('')}
      </div>
    </nav>
  `;

  railEl = rootEl.querySelector('.tira-rail');
  const toggleBtn = rootEl.querySelector('.tira-rail__toggle');

  toggleBtn.addEventListener('click', () => {
    const nowCollapsed = railEl.classList.toggle('tira-rail--collapsed');
    const nowExpanded = !nowCollapsed;
    writeExpanded(nowExpanded);
    toggleBtn.setAttribute('aria-expanded', nowExpanded ? 'true' : 'false');
    toggleBtn.setAttribute('aria-label', nowExpanded ? 'Collapse menu' : 'Expand menu');
  });

  // Placeholder click handler — no destinations wired yet.
  rootEl.addEventListener('click', (e) => {
    const item = e.target.closest('.tira-rail__item[data-action]');
    if (!item) return;
    // Intentional no-op for prototype. Hover/active styling still fires.
  });
}

export function showTiraRail() {
  if (railEl) railEl.classList.remove('tira-rail--hidden');
}

export function hideTiraRail() {
  if (railEl) railEl.classList.add('tira-rail--hidden');
}
```

- [ ] **Step 2: Commit**

```bash
git add src/tira-rail.js
git commit -m "feat(rail): add tira-rail module with toggle + persistence"
```

---

### Task 4: Add the rail mount point to index.html

**Files:**
- Modify: `index.html` (the body slot inside `<forge-scaffold>`, around line 881)

- [ ] **Step 1: Wrap the view-container in a shell flex wrapper and add the rail mount point**

In `index.html`, find this existing line inside `<forge-scaffold>`:

```html
      <div slot="body" id="view-container" style="height: 100%;"></div>
```

Replace it with:

```html
      <div slot="body" class="tira-shell">
        <aside id="tira-rail-root"></aside>
        <div id="view-container"></div>
      </div>
```

Notes:
- The `tira-shell` class is defined in `src/tira-rail.css` (Task 2) and lays out the rail + view-container horizontally with full height.
- The inline `style="height: 100%;"` is removed because `.tira-shell` and `#view-container` rules in `tira-rail.css` handle height/flex.

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat(rail): add tira-rail mount point in app shell"
```

---

### Task 5: Wire the rail into main.js (mount + view-change visibility)

**Files:**
- Modify: `src/main.js` (imports section and `DOMContentLoaded` handler around lines 178-237)

- [ ] **Step 1: Import the rail module**

In `src/main.js`, find the existing block of view/router imports (around lines 177-185):

```js
// Router
import { registerView, startRouter, navigateTo, getCurrentView } from './router.js';

// Views
import * as tiraView from './views/tira-view.js';
import * as hubView from './views/hub-view.js';
```

Add this import immediately after the views imports (before the `App switcher` import):

```js
// TIRA rail (persistent left sidebar)
import { mountTiraRail, showTiraRail, hideTiraRail } from './tira-rail.js';
```

- [ ] **Step 2: Mount the rail on DOMContentLoaded**

Still in `src/main.js`, find the `DOMContentLoaded` listener (starts around line 193). At the top of the listener body — immediately after the existing `// Register views` block — add:

```js
  // Mount the persistent rail (hidden by default until first view-changed fires)
  const railRoot = document.querySelector('#tira-rail-root');
  if (railRoot) mountTiraRail(railRoot);
```

- [ ] **Step 3: Toggle rail visibility in the view-changed listener**

In `src/main.js`, find the existing `view-changed` listener (around lines 202-205):

```js
  document.addEventListener('view-changed', (e) => {
    const view = e.detail.view;
    updateAppBar(view);
  });
```

Replace it with:

```js
  document.addEventListener('view-changed', (e) => {
    const view = e.detail.view;
    updateAppBar(view);
    if (view === 'hub') hideTiraRail();
    else showTiraRail();
  });
```

- [ ] **Step 4: Commit**

```bash
git add src/main.js
git commit -m "feat(rail): mount tira-rail and toggle visibility per view"
```

---

### Task 6: Manual verification

This project has no automated test framework — verification is by running the dev server and observing the UI. Match the verification list against the spec.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Vite boots, browser opens to the TIRA homepage with no console errors.

- [ ] **Step 2: Verify default state — expanded rail on homepage**

In the browser, on the default `/` route (TIRA homepage):
- Rail is visible on the left, 260px wide
- Header shows "Tyler Reporting" + toggle button
- Body shows three items with icons + labels: New Chat, Chats, Report Library
- Footer shows Help item at the bottom with icon + label
- Main content (greeting, prompt input, suggestions) sits to the right of the rail and is not overlapped

If anything is wrong, fix it in the file responsible (likely `src/tira-rail.css` or `src/tira-rail.js`) and re-verify. Do not proceed until this step passes.

- [ ] **Step 3: Verify the collapse toggle**

Click the toggle button in the rail header.
Expected:
- Width animates smoothly from 260px to 56px (~200ms)
- Item labels disappear; icons remain centered
- The "Tyler Reporting" title in the header disappears; the toggle button stays
- Main content area grows to fill the new space

Click the toggle button again.
Expected: animates back to 260px, labels reappear.

- [ ] **Step 4: Verify tooltips when collapsed**

Collapse the rail. Hover each item.
Expected: native browser tooltip appears showing "New Chat", "Chats", "Report Library", or "Help".

- [ ] **Step 5: Verify state persistence**

Collapse the rail, then reload the page (Cmd-R / Ctrl-R).
Expected: rail loads in collapsed state.

Expand the rail, then reload.
Expected: rail loads in expanded state.

Open DevTools → Application → Local Storage → confirm key `tira-rail-expanded` exists with value `"true"` or `"false"`.

- [ ] **Step 6: Verify per-view visibility**

From the TIRA homepage, navigate to the Hub view by appending `#/hub` to the URL (or click the app switcher → Hub).
Expected: rail disappears entirely. Hub view's own narrow icon rail is the only sidebar visible.

Navigate back to TIRA by going to `#/tira`.
Expected: rail reappears in whatever state it was last in (expanded or collapsed).

- [ ] **Step 7: Verify the existing slide-over menu is unaffected**

On the TIRA homepage, click the hamburger button in the app bar (top-left, just left of "TIRA" title).
Expected: the existing slide-over menu opens over everything (Reports / Library / Settings / Help sections), unchanged. The new rail is still visible underneath it (covered by the slide-over's backdrop).

Close the slide-over.
Expected: it dismisses cleanly. The new rail is still in its previous state.

- [ ] **Step 8: Verify the chat flow keeps the rail**

From the TIRA homepage, click any "Ask a question" suggestion or type a question and press Enter to open the chat flow dialog.
Expected: the chat flow opens (full-screen Forge dialog). The rail remains visible at the left edge if the dialog is non-modal, OR the dialog covers the entire viewport (including the rail). Note: the chat flow uses `forge-dialog fullscreen mode="modal"`, so it covers the rail when active. This is acceptable — the rail is still mounted, just visually overlaid by the modal.

Close the chat flow. Expected: rail visible in its prior state.

- [ ] **Step 9: Verify Item clicks are no-ops**

Click each rail item (New Chat, Chats, Report Library, Help).
Expected: hover styling fires, click feels responsive, but nothing else happens (no navigation, no console errors). This is the intended placeholder behavior.

- [ ] **Step 10: Final commit if any fixes were made**

If Steps 2-9 required any edits, commit them:

```bash
git add -A
git commit -m "fix(rail): adjustments from manual verification"
```

If no fixes were needed, no commit is necessary — the feature is complete.

---

## Done criteria

Every checkbox in Tasks 1-6 is checked. The TIRA homepage shows the new expanded rail on first load, the toggle collapses/expands smoothly, state survives reloads, the rail hides on Hub and shows elsewhere, and the existing slide-over menu is undisturbed.
