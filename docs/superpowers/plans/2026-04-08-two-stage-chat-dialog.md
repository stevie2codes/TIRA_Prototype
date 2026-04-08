# Two-Stage Chat Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the always-fullscreen chat dialog with a two-stage pattern: centered modal first, fullscreen on demand.

**Architecture:** Modify the existing `forge-dialog` in `openChatFlow()` to start without the `fullscreen` attribute. Add CSS for centered modal sizing (~65vw x 70vh). Replace the header toolbar buttons (remove kebab + close, add minimize + expand/collapse). Wire three fullscreen triggers: expand button, "Explore Results", and "Open Report".

**Tech Stack:** Vanilla JS, Forge web components (`forge-dialog`, `forge-icon-button`, `forge-icon`), CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-04-08-two-stage-chat-dialog-design.md`

---

### Task 1: Update dialog creation to start as centered modal

**Files:**
- Modify: `src/chat-flow.css:1-27` (dialog sizing rules)
- Modify: `src/chat-flow.js:112-118` (dialog creation in `openChatFlow`)
- Modify: `src/chat-flow.js:973-980` (dialog creation in `openLibraryView`)
- Modify: `src/chat-flow.js:1761-1764` (dialog creation in `openStandardReportInChat`)

- [ ] **Step 1: Add centered modal CSS**

In `src/chat-flow.css`, replace the existing fullscreen overrides (lines 1-27) with styles that support both states. The dialog starts as a centered modal; the `[fullscreen]` selector handles fullscreen mode:

```css
/* Chat flow modal styles */

/* Dialog centered modal (default — no fullscreen attribute) */
forge-dialog.chat-dialog {
  --forge-dialog-padding: 0;
  --forge-dialog-width: 65vw;
  --forge-dialog-height: 70vh;
  --forge-dialog-max-width: 900px;
  --forge-dialog-max-height: 80vh;
  --forge-dialog-border-radius: 12px;
}

forge-dialog.chat-dialog::part(root) {
  width: var(--forge-dialog-width);
  height: var(--forge-dialog-height);
  max-width: var(--forge-dialog-max-width);
  max-height: var(--forge-dialog-max-height);
}

forge-dialog.chat-dialog::part(dialog) {
  width: var(--forge-dialog-width);
  height: var(--forge-dialog-height);
  max-width: var(--forge-dialog-max-width);
  max-height: var(--forge-dialog-max-height);
  border-radius: var(--forge-dialog-border-radius);
  overflow: hidden;
}

/* Dialog fullscreen overrides (when fullscreen attribute is set) */
forge-dialog.chat-dialog[fullscreen] {
  --forge-dialog-width: 100vw;
  --forge-dialog-height: 100vh;
  --forge-dialog-max-width: 100vw;
  --forge-dialog-max-height: 100vh;
  --forge-dialog-border-radius: 0;
}

forge-dialog.chat-dialog[fullscreen]::part(root) {
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
}

forge-dialog.chat-dialog[fullscreen]::part(dialog) {
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  margin: 0;
  border-radius: 0;
}
```

- [ ] **Step 2: Remove `fullscreen` attribute from dialog creation in `openChatFlow`**

In `src/chat-flow.js`, in the `openChatFlow` function (~line 115), remove the line:
```js
dialog.setAttribute('fullscreen', '');
```

The dialog block should now read:
```js
dialog = document.createElement('forge-dialog');
dialog.id = 'chat-dialog';
dialog.className = 'chat-dialog';
dialog.setAttribute('mode', 'modal');
dialog.setAttribute('persistent', '');
dialog.setAttribute('animation-type', 'fade');
document.body.appendChild(dialog);
```

- [ ] **Step 3: Remove `fullscreen` attribute from dialog creation in `openLibraryView`**

In `src/chat-flow.js`, in the `openLibraryView` function (~line 976), remove the line:
```js
dialog.setAttribute('fullscreen', '');
```

- [ ] **Step 4: Remove `fullscreen` attribute from dialog creation in `openStandardReportInChat`**

In `src/chat-flow.js`, in the `openStandardReportInChat` function (~line 1764), remove the line:
```js
dialog.setAttribute('fullscreen', '');
```

- [ ] **Step 5: Verify the dialog opens as a centered modal**

Run: `npm run dev`

Open the app, click a suggestion or type a question. Confirm the dialog appears as a centered modal (~65vw x 70vh) with rounded corners, not fullscreen.

- [ ] **Step 6: Commit**

```bash
git add src/chat-flow.js src/chat-flow.css
git commit -m "feat: start chat dialog as centered modal instead of fullscreen"
```

---

### Task 2: Replace header toolbar with minimize + expand buttons

**Files:**
- Modify: `src/chat-flow.js:123-145` (dialog innerHTML in `openChatFlow`, header markup)
- Modify: `src/chat-flow.js:149-153` (close button handler)
- Modify: `src/chat-flow.css:84-89` (header actions styles)

- [ ] **Step 1: Update header markup in `openChatFlow`**

In `src/chat-flow.js`, replace the header actions block inside `dialog.innerHTML` (~lines 132-138):

Old:
```html
<div class="chat-header-actions">
  <forge-icon-button aria-label="More options">
    <forge-icon name="more_vert"></forge-icon>
  </forge-icon-button>
  <forge-icon-button aria-label="Close" id="chat-close-btn">
    <forge-icon name="close"></forge-icon>
  </forge-icon-button>
</div>
```

New:
```html
<div class="chat-header-actions">
  <forge-icon-button aria-label="Minimize" id="chat-minimize-btn">
    <forge-icon name="remove"></forge-icon>
  </forge-icon-button>
  <forge-icon-button aria-label="Expand" id="chat-expand-btn">
    <forge-icon name="fullscreen"></forge-icon>
  </forge-icon-button>
</div>
```

- [ ] **Step 2: Update the close handler to use minimize button**

In `src/chat-flow.js`, replace the close button handler (~line 151):

Old:
```js
dialog.querySelector('#chat-close-btn').addEventListener('click', () => {
  dialog.open = false;
});
```

New:
```js
// Minimize — close dialog back to homepage
dialog.querySelector('#chat-minimize-btn').addEventListener('click', () => {
  dialog.open = false;
});

// Expand/Collapse — toggle fullscreen
const expandBtn = dialog.querySelector('#chat-expand-btn');
expandBtn.addEventListener('click', () => {
  const isFullscreen = dialog.hasAttribute('fullscreen');
  if (isFullscreen) {
    dialog.removeAttribute('fullscreen');
    expandBtn.querySelector('forge-icon').name = 'fullscreen';
    expandBtn.setAttribute('aria-label', 'Expand');
  } else {
    dialog.setAttribute('fullscreen', '');
    expandBtn.querySelector('forge-icon').name = 'fullscreen_exit';
    expandBtn.setAttribute('aria-label', 'Collapse');
  }
});
```

- [ ] **Step 3: Verify toolbar buttons work**

Run: `npm run dev`

1. Open chat — see minimize (dash) and expand (fullscreen) icons in header
2. Click expand — dialog goes fullscreen, icon changes to `fullscreen_exit`
3. Click collapse — dialog returns to centered modal, icon changes back to `fullscreen`
4. Click minimize — dialog closes, returns to homepage

- [ ] **Step 4: Commit**

```bash
git add src/chat-flow.js
git commit -m "feat: replace header toolbar with minimize and expand/collapse buttons"
```

---

### Task 3: Wire "Explore Results" and "Open Report" as fullscreen triggers

**Files:**
- Modify: `src/chat-flow.js:236-242` (showReportOpenState in `runConversation`)
- Modify: `src/chat-flow.js:748-753` (Explore Results handler for refined cards)
- Modify: `src/chat-flow.js:1601` (openStandardReport function)

- [ ] **Step 1: Create a helper function to enter fullscreen mode**

Add this helper near the top of `src/chat-flow.js` (after the `scrollToBottom` or `markdownToHtml` helper):

```js
/**
 * Ensures the chat dialog is in fullscreen mode.
 * Updates the expand/collapse button icon if present.
 */
function ensureFullscreen(dialog) {
  if (!dialog.hasAttribute('fullscreen')) {
    dialog.setAttribute('fullscreen', '');
    const expandBtn = dialog.querySelector('#chat-expand-btn');
    if (expandBtn) {
      expandBtn.querySelector('forge-icon').name = 'fullscreen_exit';
      expandBtn.setAttribute('aria-label', 'Collapse');
    }
  }
}
```

- [ ] **Step 2: Wire fullscreen into `showReportOpenState` in `runConversation`**

In `src/chat-flow.js`, in the `showReportOpenState` function (~line 236), add `ensureFullscreen(dialog)` before the split view transition:

Old:
```js
function showReportOpenState() {
  openReportBtn.style.display = 'none';
  badge.style.display = '';
  transitionToSplitView(dialog, container, suggestion);
}
```

New:
```js
function showReportOpenState() {
  openReportBtn.style.display = 'none';
  badge.style.display = '';
  ensureFullscreen(dialog);
  transitionToSplitView(dialog, container, suggestion);
}
```

- [ ] **Step 3: Wire fullscreen into refined card "Explore Results" handler**

In `src/chat-flow.js`, in the refinement handler (~line 750), add `ensureFullscreen(dialog)`:

Old:
```js
if (openBtn && dialog) {
  openBtn.addEventListener('click', () => {
    transitionToSplitView(dialog, container, refinedSuggestion);
  });
}
```

New:
```js
if (openBtn && dialog) {
  openBtn.addEventListener('click', () => {
    ensureFullscreen(dialog);
    transitionToSplitView(dialog, container, refinedSuggestion);
  });
}
```

- [ ] **Step 4: Wire fullscreen into `openStandardReport`**

In `src/chat-flow.js`, at the start of the `openStandardReport` function (~line 1601), add `ensureFullscreen(dialog)`:

Old:
```js
function openStandardReport(report, dialog) {
  const content = dialog.querySelector('.chat-dialog-content');
```

New:
```js
function openStandardReport(report, dialog) {
  ensureFullscreen(dialog);
  const content = dialog.querySelector('.chat-dialog-content');
```

- [ ] **Step 5: Verify all three fullscreen triggers**

Run: `npm run dev`

1. Open chat, click "Explore Results" on the query card → dialog goes fullscreen, split view appears
2. Open chat, click expand button → fullscreen. Click collapse → centered modal. Click "Explore Results" → fullscreen again
3. If a standard report match appears, click "Open Report" → fullscreen with report view

- [ ] **Step 6: Commit**

```bash
git add src/chat-flow.js
git commit -m "feat: wire Explore Results and Open Report as fullscreen triggers"
```

---

### Task 4: Update split-view header for fullscreen state

**Files:**
- Modify: `src/chat-flow.js:1216-1230` (split-view left header in `transitionToSplitView`)

- [ ] **Step 1: Update the split-view chat header toolbar**

In `src/chat-flow.js`, in the `buildSplitView` function inside `transitionToSplitView` (~line 1218), update the left panel header to use the same minimize + collapse buttons instead of the kebab menu:

Old:
```js
leftHeader.innerHTML = `
  <div class="ai-header-icon">
    <div class="ai-icon-wrapper">
      <forge-icon name="auto_awesome"></forge-icon>
    </div>
  </div>
  <span class="chat-header-title">Report Assistant</span>
  <div class="chat-header-actions">
    <forge-icon-button aria-label="More options">
      <forge-icon name="more_vert"></forge-icon>
    </forge-icon-button>
  </div>
`;
```

New:
```js
leftHeader.innerHTML = `
  <div class="ai-header-icon">
    <div class="ai-icon-wrapper">
      <forge-icon name="auto_awesome"></forge-icon>
    </div>
  </div>
  <span class="chat-header-title">Report Assistant</span>
  <div class="chat-header-actions">
    <forge-icon-button aria-label="Minimize" id="chat-minimize-btn">
      <forge-icon name="remove"></forge-icon>
    </forge-icon-button>
    <forge-icon-button aria-label="Collapse" id="chat-expand-btn">
      <forge-icon name="fullscreen_exit"></forge-icon>
    </forge-icon-button>
  </div>
`;
```

- [ ] **Step 2: Wire the split-view header buttons**

After the `leftHeader.innerHTML` assignment, add event handlers:

```js
// Wire split-view header buttons
leftHeader.querySelector('#chat-minimize-btn').addEventListener('click', () => {
  dialog.open = false;
});
leftHeader.querySelector('#chat-expand-btn').addEventListener('click', () => {
  const isFullscreen = dialog.hasAttribute('fullscreen');
  if (isFullscreen) {
    dialog.removeAttribute('fullscreen');
    leftHeader.querySelector('#chat-expand-btn forge-icon').name = 'fullscreen';
    leftHeader.querySelector('#chat-expand-btn').setAttribute('aria-label', 'Expand');
  } else {
    dialog.setAttribute('fullscreen', '');
    leftHeader.querySelector('#chat-expand-btn forge-icon').name = 'fullscreen_exit';
    leftHeader.querySelector('#chat-expand-btn').setAttribute('aria-label', 'Collapse');
  }
});
```

- [ ] **Step 3: Verify split-view toolbar**

Run: `npm run dev`

Open chat → click "Explore Results" → in split view, verify minimize and collapse buttons work in the left panel header.

- [ ] **Step 4: Commit**

```bash
git add src/chat-flow.js
git commit -m "feat: update split-view header with minimize and expand/collapse buttons"
```
