# Create Report — Sidebar Entry Point & Guided Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a ＋ Create entry point to the left rail that lets a user create a report either from scratch (empty designer) or via an AI-guided stepper that proposes a print-ready table report and lets them open it in the designer.

**Architecture:** Reuse the existing in-body chat surface (`#view-container`) and the `tira-handoff-context` sessionStorage pre-seed. The report designer (React app in `report-canvas/`) is mounted as an in-body surface — empty for "from scratch", pre-seeded for the AI path — with no "Back to Chat" chrome. A small popover off the rail's Create button selects the path; a new stepper module drives the 2-step guided setup inside the chat surface.

**Tech Stack:** Vanilla JS + Vite, Forge web components, the report-canvas React 19 app (mounted via `mountDesigner`). No test framework — verification is manual via the dev server (`npm run dev`).

---

## Verification Note

This repo has no automated test runner. Each task ends with a **manual verification** step (run `npm run dev`, open the app, observe) and a commit. Keep changes small and verify in the browser before committing.

## File Structure

- `src/chat-flow.js` — add `mountDesignerReact()` (shared React mount helper), `openReportDesigner()` (from-scratch), `openGuidedReportSetup()` (AI path); make `mountReportDesigner()` accept a `backToChat` option.
- `src/report-setup-stepper.js` (new) — the 2-step guided stepper logic (chips + free text), renders into the chat messages container, calls back with the collected config.
- `src/report-setup-stepper.css` (new) — stepper chip/step styles.
- `src/tira-rail.js` — add the ＋ Create button + popover and wire the two paths.
- `src/tira-rail.css` — Create button + popover styles.
- `report-canvas/src/context/ReportContext.jsx` — honor `outputFormat: 'print-table'` (header + table only, no chart).

---

## Task 1: Shared React mount helper + `openReportDesigner()` (from-scratch path)

**Files:**
- Modify: `src/chat-flow.js`

- [ ] **Step 1: Add the shared mount helper.** In `src/chat-flow.js`, just above the existing `async function mountReportDesigner(dialog)`, add:

```js
/**
 * Lazily loads and mounts the report-canvas React app into `hostEl`.
 * Shared by the in-chat swap (mountReportDesigner) and the standalone
 * from-scratch designer (openReportDesigner). Returns the React root.
 */
async function mountDesignerReact(hostEl) {
  // Forge components are already registered by main.js; forge-react tries to
  // re-register them, so skip any already-defined element during this import.
  const originalDefine = customElements.define.bind(customElements);
  customElements.define = function (name, ctor, options) {
    if (customElements.get(name)) return;
    originalDefine(name, ctor, options);
  };
  try {
    const { mountDesigner } = await import('../report-canvas/src/mount.jsx');
    return mountDesigner(hostEl);
  } finally {
    customElements.define = originalDefine;
  }
}
```

- [ ] **Step 2: Add `openReportDesigner()` for the from-scratch path.** Add this exported function near `openChatFlow`:

```js
/**
 * Opens the report designer directly in the body (no chat, no back-to-chat).
 * Used by the rail's "Create from scratch" action. Clears any stale handoff
 * context so the designer initializes to its empty/from-scratch state.
 */
export async function openReportDesigner() {
  const viewContainer = document.querySelector('#view-container');
  if (!viewContainer) return;

  sessionStorage.removeItem('tira-handoff-context'); // ensure empty state

  document.getElementById('chat-dialog')?.remove();
  if (_reactRoot) { _reactRoot.unmount(); _reactRoot = null; }
  viewContainer.innerHTML = '';

  const surface = document.createElement('div');
  surface.id = 'report-designer-surface';
  surface.className = 'designer-surface';
  surface.innerHTML = `
    <div id="report-designer-root" style="height:100%;overflow:hidden;"></div>
  `;
  viewContainer.appendChild(surface);

  const root = surface.querySelector('#report-designer-root');
  try {
    _reactRoot = await mountDesignerReact(root);
  } catch (err) {
    console.error('Failed to load Report Designer:', err);
    surface.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px;">
        <forge-icon name="error_outline" style="--forge-icon-font-size:48px;color:#e57373;"></forge-icon>
        <span style="font-size:16px;color:rgba(0,0,0,0.6);">Failed to load Report Designer</span>
      </div>`;
  }
}
```

- [ ] **Step 3: Add the surface style.** In `src/chat-flow.css`, add:

```css
/* Standalone report designer surface (from-scratch / SPA mount) */
.designer-surface {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
```

- [ ] **Step 4: Manual verification.** Temporarily call `openReportDesigner()` from the browser console after `import`… simplest: run `npm run dev`, open the app, and in the console run:
  `window.__openDesigner && window.__openDesigner()` — but since it's not exposed, instead verify wiring in Task 5. For now, confirm `npm run build` succeeds:

Run: `npm run build`
Expected: builds with no errors (pre-existing dynamic-import warning is fine).

- [ ] **Step 5: Commit.**

```bash
git add src/chat-flow.js src/chat-flow.css
git commit -m "feat(designer): standalone in-body report designer mount (from-scratch)"
```

---

## Task 2: `mountReportDesigner` — optional back-to-chat (AI swap uses no bar)

**Files:**
- Modify: `src/chat-flow.js`

- [ ] **Step 1: Make the back-to-chat bar conditional.** Change the signature of `mountReportDesigner` and the two places it renders the nav bar. Update the signature line:

```js
async function mountReportDesigner(dialog, { backToChat = true } = {}) {
```

- [ ] **Step 2: Gate the loading-state back button.** In the loading-state template inside `mountReportDesigner`, wrap the `#designer-back-btn` markup so it only renders when `backToChat` is true. Replace the loading header block with:

```js
  content.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;background:#f0f1f4;">
      <div style="display:flex;align-items:center;gap:12px;padding:16px;background:#fff;border-bottom:1px solid #e0e0e0;">
        ${backToChat ? `
        <button type="button" id="designer-back-btn" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid #dadce0;border-radius:6px;background:#fff;cursor:pointer;font-size:13px;font-weight:500;color:rgba(0,0,0,0.7);">
          <forge-icon name="arrow_back"></forge-icon>
          Back to Chat
        </button>` : ''}
        <span style="font-size:14px;font-weight:500;color:rgba(0,0,0,0.87);">Loading Report Designer...</span>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;">
        <forge-ai-thinking-indicator></forge-ai-thinking-indicator>
      </div>
    </div>
  `;
```

- [ ] **Step 3: Guard the loading back-button listener.** The existing line wiring `#designer-back-btn` in the loading state must not throw when the button is absent. Replace it with:

```js
  content.querySelector('#designer-back-btn')?.addEventListener('click', () => {
    if (_reactRoot) { _reactRoot.unmount(); _reactRoot = null; }
    content.className = chatClassName;
    content.innerHTML = chatSnapshot;
  });
```

- [ ] **Step 4: Gate the final designer nav bar.** In the post-load template, replace the `.designer-nav-bar` block so it only renders with `backToChat`, and use the shared mount helper. Replace the `content.innerHTML = ...` designer template and the mount call with:

```js
    content.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;">
        ${backToChat ? `
        <div class="designer-nav-bar">
          <button type="button" id="designer-back-btn" class="designer-back-btn">
            <forge-icon name="arrow_back"></forge-icon>
            Back to Chat
          </button>
        </div>` : ''}
        <div id="report-designer-root" style="flex:1;overflow:hidden;"></div>
      </div>
    `;

    content.querySelector('#designer-back-btn')?.addEventListener('click', () => {
      if (_reactRoot) { _reactRoot.unmount(); _reactRoot = null; }
      content.className = chatClassName;
      content.innerHTML = chatSnapshot;
    });

    const mountPoint = content.querySelector('#report-designer-root');
    _reactRoot = await mountDesignerReact(mountPoint);
```

(Delete the old inline `customElements.define` patch + `import('../report-canvas/src/mount.jsx')` block here — it's now in `mountDesignerReact`.)

- [ ] **Step 5: Manual verification.** Run `npm run build`.
Expected: builds with no errors. Existing in-chat handoff (canned chat) still passes no options, so it keeps the Back-to-Chat bar.

- [ ] **Step 6: Commit.**

```bash
git add src/chat-flow.js
git commit -m "refactor(designer): optional back-to-chat bar; share React mount helper"
```

---

## Task 3: Report setup stepper module

**Files:**
- Create: `src/report-setup-stepper.js`
- Create: `src/report-setup-stepper.css`

- [ ] **Step 1: Create the stepper styles.** Create `src/report-setup-stepper.css`:

```css
.rss-step { display: flex; flex-direction: column; gap: 10px; }
.rss-step-meta {
  font-size: 11px; font-weight: 600; letter-spacing: 0.6px;
  text-transform: uppercase; color: rgba(0,0,0,0.4);
}
.rss-step-q { font-size: 16px; font-weight: 600; color: rgba(0,0,0,0.87); }
.rss-step-hint { font-size: 13px; color: rgba(0,0,0,0.55); margin-top: -4px; }
.rss-group-label {
  font-size: 12px; color: rgba(0,0,0,0.5); margin-top: 6px;
}
.rss-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.rss-chip {
  padding: 7px 14px; border-radius: 16px; border: 1px solid #d0d4f7;
  background: #fff; color: #3f51b5; font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.12s ease;
}
.rss-chip:hover { background: #f3f4ff; }
.rss-chip--selected { background: #3f51b5; color: #fff; border-color: #3f51b5; }
.rss-proposal {
  border: 1px solid #e6e6ee; border-radius: 12px; padding: 16px; background: #fff;
}
.rss-proposal-title { font-size: 15px; font-weight: 600; color: rgba(0,0,0,0.87); }
.rss-proposal-meta { font-size: 13px; color: rgba(0,0,0,0.6); margin-top: 4px; }
.rss-open-designer-btn {
  margin-top: 14px; display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 18px; border: none; border-radius: 8px; background: #3f51b5;
  color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
}
.rss-open-designer-btn:hover { background: #3949ab; }
```

- [ ] **Step 2: Create the stepper module.** Create `src/report-setup-stepper.js`:

```js
/**
 * Report setup stepper — runs the 2-step, hybrid (chips + free text),
 * report-centric guided flow inside the chat surface. Renders steps as
 * assistant messages into `messagesEl`. Free-text answers arrive via
 * submitText() (wired to the chat input by the caller).
 *
 * Usage:
 *   const stepper = createReportSetupStepper({ messagesEl, onOpenDesigner });
 *   // wire chat input send -> stepper.submitText(text)
 */
import './report-setup-stepper.css';

const SUBJECT_CHIPS = ['Building permits', 'Department budgets', 'Code violations', 'Inspections'];
const SHOW_CHIPS = ['Permits issued', 'Fees collected', 'Applicant & address', 'Inspector'];
const ORGANIZE_CHIPS = ['District', 'Month', 'Permit type'];

export function createReportSetupStepper({ messagesEl, onOpenDesigner }) {
  const config = { subject: '', show: [], organizeBy: '' };
  let step = 1;

  function assistant(html) {
    const msg = document.createElement('forge-ai-response-message');
    const content = document.createElement('div');
    content.className = 'ai-response-content';
    content.innerHTML = html;
    msg.appendChild(content);
    messagesEl.appendChild(msg);
    scroll();
    return content;
  }

  function userBubble(text) {
    const msg = document.createElement('forge-ai-user-message');
    msg.textContent = text;
    messagesEl.appendChild(msg);
    scroll();
  }

  function scroll() {
    const c = messagesEl.closest('.chat-container') || messagesEl.parentElement;
    if (c) requestAnimationFrame(() => { c.scrollTop = c.scrollHeight; });
  }

  function chipRow(chips, { multi = false } = {}) {
    return `<div class="rss-chips">${chips
      .map(c => `<button class="rss-chip" type="button" data-chip="${c}">${c}</button>`)
      .join('')}</div>`;
  }

  function renderStep1() {
    const el = assistant(`
      <div class="rss-step">
        <span class="rss-step-meta">Step 1 of 2</span>
        <span class="rss-step-q">What's this report about?</span>
        <span class="rss-step-hint">Pick a subject or just describe it below.</span>
        ${chipRow(SUBJECT_CHIPS)}
      </div>
    `);
    el.querySelectorAll('.rss-chip').forEach(chip => {
      chip.addEventListener('click', () => answerStep1(chip.dataset.chip));
    });
  }

  function answerStep1(value) {
    config.subject = value;
    userBubble(value);
    step = 2;
    renderStep2();
  }

  function renderStep2() {
    const el = assistant(`
      <div class="rss-step">
        <span class="rss-step-meta">Step 2 of 2</span>
        <span class="rss-step-q">What should this report include?</span>
        <span class="rss-step-hint">Pick the details to show and how to organize them, or describe it.</span>
        <span class="rss-group-label">Show</span>
        ${chipRow(SHOW_CHIPS, { multi: true })}
        <span class="rss-group-label">Organize by</span>
        ${chipRow(ORGANIZE_CHIPS)}
        <div style="margin-top:6px;"><button class="rss-open-designer-btn" type="button" data-done>Build report →</button></div>
      </div>
    `);
    const showChips = Array.from(el.querySelectorAll('.rss-group-label'))[0]
      .nextElementSibling.querySelectorAll('.rss-chip');
    const organizeChips = Array.from(el.querySelectorAll('.rss-group-label'))[1]
      .nextElementSibling.querySelectorAll('.rss-chip');

    showChips.forEach(chip => chip.addEventListener('click', () => {
      const v = chip.dataset.chip;
      chip.classList.toggle('rss-chip--selected');
      if (config.show.includes(v)) config.show = config.show.filter(x => x !== v);
      else config.show.push(v);
    }));
    organizeChips.forEach(chip => chip.addEventListener('click', () => {
      organizeChips.forEach(c => c.classList.remove('rss-chip--selected'));
      chip.classList.add('rss-chip--selected');
      config.organizeBy = chip.dataset.chip;
    }));
    el.querySelector('[data-done]').addEventListener('click', () => finish());
  }

  function finish() {
    if (!config.subject) config.subject = 'New report';
    const title = config.organizeBy
      ? `${config.subject} by ${config.organizeBy}`
      : config.subject;
    const el = assistant(`
      <div class="rss-proposal">
        <div class="rss-proposal-title">${title}</div>
        <div class="rss-proposal-meta">Print-ready table${config.show.length ? ' · ' + config.show.join(', ') : ''}</div>
        <button class="rss-open-designer-btn" type="button" data-open>
          <forge-icon name="bar_chart"></forge-icon> Open in report designer
        </button>
      </div>
    `);
    el.querySelector('[data-open]').addEventListener('click', () => {
      onOpenDesigner({ ...config, title });
    });
  }

  // Free-text answers from the chat input feed the current step.
  function submitText(text) {
    const t = (text || '').trim();
    if (!t) return;
    if (step === 1) answerStep1(t);
    else { userBubble(t); /* refine: treat as extra context, no-op for prototype */ }
  }

  renderStep1();
  return { submitText };
}
```

- [ ] **Step 3: Manual verification.** Run `npm run build`.
Expected: builds with no errors (module is imported in Task 4; building alone confirms syntax).

- [ ] **Step 4: Commit.**

```bash
git add src/report-setup-stepper.js src/report-setup-stepper.css
git commit -m "feat(report-setup): 2-step guided report stepper module"
```

---

## Task 4: `openGuidedReportSetup()` — seeded chat + stepper + open-in-designer

**Files:**
- Modify: `src/chat-flow.js`

- [ ] **Step 1: Import the stepper and mock seed data.** At the top of `src/chat-flow.js`, add to the imports:

```js
import { createReportSetupStepper } from './report-setup-stepper.js';
```

(`suggestions` is already imported from `./mock-data.js` at the top of the file — reused below for seed table data.)

- [ ] **Step 2: Add `openGuidedReportSetup()`.** Add near `openChatFlow`:

```js
/**
 * Create-with-AI entry: opens the in-body chat surface seeded with a prompt and
 * runs the report setup stepper. When the user clicks "Open in report designer",
 * builds handoff context from their choices and swaps the chat -> designer
 * (no back-to-chat).
 */
export function openGuidedReportSetup() {
  const viewContainer = document.querySelector('#view-container');
  if (!viewContainer) return;
  document.getElementById('chat-dialog')?.remove();
  viewContainer.innerHTML = '';

  const dialog = document.createElement('div');
  dialog.id = 'chat-dialog';
  dialog.className = 'chat-dialog chat-surface';
  viewContainer.appendChild(dialog);

  const title = 'New report';
  dialog.dataset.chatTitle = title;
  dialog.innerHTML = `
    <div class="chat-dialog-content">
      <div class="chat-header">${chatHeaderHTML(title)}</div>
      <div class="chat-body">
        <div class="chat-container">
          <div class="chat-messages-spacer"></div>
          <div class="chat-messages" id="chat-messages"></div>
        </div>
      </div>
      <div class="chat-footer">${chatInputHTML()}</div>
    </div>
  `;

  dialog.querySelector('#chat-close-btn')?.addEventListener('click', () => closeChat(dialog));

  const messagesEl = dialog.querySelector('#chat-messages');

  // Seed user message that kicks off the guided setup
  const seed = document.createElement('forge-ai-user-message');
  seed.textContent = 'Create a new report';
  messagesEl.appendChild(seed);

  const stepper = createReportSetupStepper({
    messagesEl,
    onOpenDesigner: (cfg) => {
      const sample = suggestions[0]; // prototype seed data for a populated table
      const handoff = {
        reportTitle: cfg.title,
        dataSource: sample?.dataSource || 'Permits dataset',
        freshness: sample?.freshness || 'Updated daily',
        columns: sample?.columns || [],
        data: sample?.data || [],
        query: cfg.subject,
        outputFormat: 'print-table',
      };
      sessionStorage.setItem('tira-handoff-context', JSON.stringify(handoff));
      mountReportDesigner(dialog, { backToChat: false });
    },
  });

  // Wire the chat input's send to the stepper (free-text / hybrid)
  const input = dialog.querySelector('.chat-input-field');
  const sendBtn = dialog.querySelector('.chat-send-btn');
  const submit = () => {
    const v = input.value;
    input.value = '';
    stepper.submitText(v);
  };
  sendBtn?.addEventListener('click', submit);
  input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
}
```

- [ ] **Step 3: Manual verification.** Run `npm run dev`, then in the browser console run:

```js
import('/src/chat-flow.js').then(m => m.openGuidedReportSetup());
```

Expected: the chat surface opens with "Create a new report", Step 1 chips appear; clicking a subject advances to Step 2; selecting show/organize chips and clicking "Build report →" shows the proposal with "Open in report designer"; clicking it swaps to the designer (populated table, no Back-to-Chat bar), rail still visible.

- [ ] **Step 4: Commit.**

```bash
git add src/chat-flow.js
git commit -m "feat(report-setup): create-with-AI guided flow that opens the designer"
```

---

## Task 5: Rail — ＋ Create button + popover

**Files:**
- Modify: `src/tira-rail.js`
- Modify: `src/tira-rail.css`

- [ ] **Step 1: Import the new entry points.** At the top of `src/tira-rail.js`, extend the chat-flow import:

```js
import { openLibraryView, openReportDesigner, openGuidedReportSetup } from './chat-flow.js';
```

- [ ] **Step 2: Render the Create button + popover.** In `mountTiraRail`, inside the `.tira-rail__body`, render the Create affordance before the items. Replace the `<div class="tira-rail__body">…</div>` block with:

```js
      <div class="tira-rail__body">
        <div class="tira-rail__create-wrap">
          <button class="tira-rail__create" type="button" aria-haspopup="true" aria-expanded="false" title="Create a report">
            <span class="tira-rail__item-icon"><forge-icon name="add"></forge-icon></span>
            <span class="tira-rail__item-label">Create</span>
          </button>
          <div class="tira-rail__popover" role="menu" hidden>
            <button class="tira-rail__popover-item" type="button" role="menuitem" data-create="scratch">
              <forge-icon name="description"></forge-icon><span>Create from scratch</span>
            </button>
            <button class="tira-rail__popover-item" type="button" role="menuitem" data-create="ai">
              <forge-icon name="auto_awesome"></forge-icon><span>Create with AI</span>
            </button>
          </div>
        </div>
        ${items.map(renderItem).join('')}
      </div>
```

- [ ] **Step 3: Wire the popover.** In `mountTiraRail`, after the existing navigation click handler, add:

```js
  const createBtn = rootEl.querySelector('.tira-rail__create');
  const popover = rootEl.querySelector('.tira-rail__popover');

  const closePopover = () => {
    popover.hidden = true;
    createBtn.setAttribute('aria-expanded', 'false');
  };
  const togglePopover = () => {
    const willOpen = popover.hidden;
    popover.hidden = !willOpen;
    createBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  };

  createBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePopover(); });

  popover.addEventListener('click', (e) => {
    const item = e.target.closest('.tira-rail__popover-item');
    if (!item) return;
    closePopover();
    if (item.dataset.create === 'scratch') openReportDesigner();
    else openGuidedReportSetup();
  });

  document.addEventListener('click', (e) => {
    if (!popover.hidden && !e.target.closest('.tira-rail__create-wrap')) closePopover();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopover(); });
```

- [ ] **Step 4: Add styles.** In `src/tira-rail.css`, add:

```css
/* ── Create button + popover ─────────────────────────────────────────── */
.tira-rail__create-wrap { position: relative; padding: 4px 8px 8px; }

.tira-rail__create {
  display: flex; align-items: center; gap: 14px; width: 100%;
  padding: 10px 12px; border: none; border-radius: 8px;
  background: #3f51b5; color: #fff; cursor: pointer;
  font-family: 'Roboto', sans-serif; font-size: 14px; font-weight: 600;
  letter-spacing: 0.25px; transition: background 0.15s ease;
}
.tira-rail__create:hover { background: #3949ab; }
.tira-rail__create .tira-rail__item-icon forge-icon { color: #fff; }

.tira-rail--collapsed .tira-rail__create { justify-content: center; padding: 10px 0; gap: 0; }
.tira-rail--collapsed .tira-rail__create .tira-rail__item-label { display: none; }

.tira-rail__popover {
  position: absolute; top: 8px; left: calc(100% - 4px); z-index: 50;
  min-width: 210px; background: #fff; border: 1px solid #e0e0e0;
  border-radius: 10px; box-shadow: 0 8px 28px rgba(0,0,0,0.16); padding: 6px;
}
.tira-rail__popover-item {
  display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 10px 12px; border: none; background: transparent; border-radius: 6px;
  cursor: pointer; text-align: left; font-family: 'Roboto', sans-serif;
  font-size: 14px; font-weight: 500; color: rgba(0,0,0,0.82);
}
.tira-rail__popover-item:hover { background: rgba(63,81,181,0.08); color: #3f51b5; }
.tira-rail__popover-item forge-icon { --forge-icon-font-size: 20px; color: rgba(0,0,0,0.55); }
.tira-rail__popover-item:hover forge-icon { color: #3f51b5; }
```

- [ ] **Step 5: Manual verification.** Run `npm run dev`. Confirm:
  - The ＋ Create button shows at the top of the rail (expanded shows "Create"; collapsed shows just ＋).
  - Clicking it opens a popover with "Create from scratch" / "Create with AI"; outside-click and Escape close it.
  - "Create from scratch" opens the empty designer in the body (rail visible, no back-to-chat).
  - "Create with AI" opens the seeded guided chat; completing it and clicking "Open in report designer" swaps to the populated designer.

- [ ] **Step 6: Commit.**

```bash
git add src/tira-rail.js src/tira-rail.css
git commit -m "feat(rail): + Create button with from-scratch / with-AI popover"
```

---

## Task 6: Designer honors print-table output (header + table, no chart)

**Files:**
- Modify: `report-canvas/src/context/ReportContext.jsx`

- [ ] **Step 1: Skip the chart widget for print-table.** In `buildHandoffWidgets(ctx)`, guard the chart-widget block so it is skipped when `ctx.outputFormat === 'print-table'`. Change the chart condition from:

```js
  if (firstDim && firstMeasure) {
```

to:

```js
  if (firstDim && firstMeasure && ctx.outputFormat !== 'print-table') {
```

- [ ] **Step 2: Manual verification.** Run `npm run dev`. Run the Create-with-AI flow through to "Open in report designer". Confirm the seeded designer shows a section header + table only (no chart widget). Then run Create-from-scratch and confirm the designer opens empty (Data Layer tab, empty canvas) without errors.

- [ ] **Step 3: Commit.**

```bash
git add report-canvas/src/context/ReportContext.jsx
git commit -m "feat(designer): honor print-table output (header + table, no chart)"
```

---

## Task 7: Full flow verification + spec commit

**Files:** none (verification) + commit the spec/plan docs.

- [ ] **Step 1: End-to-end manual check.** Run `npm run dev` and verify the whole spec flow:
  1. Rail ＋ Create → popover with both options.
  2. Create from scratch → empty print-ready designer, rail visible, no back-to-chat.
  3. Create with AI → seeded chat → Step 1 (subject) → Step 2 (show + organize) → proposal → "Open in report designer".
  4. Open in report designer → populated table designer (no chart, no back-to-chat).
  5. Rail nav (New Chat / Chats / Report Library) cleanly exits the designer.

- [ ] **Step 2: Build check.** Run: `npm run build` — Expected: no errors.

- [ ] **Step 3: Commit the design + plan docs.**

```bash
git add docs/superpowers/specs/2026-05-29-create-report-entry-point-design.md docs/superpowers/plans/2026-05-29-create-report-entry-point.md
git commit -m "docs: create-report entry point spec + plan"
```

---

## Self-Review Notes

- **Spec coverage:** rail affordance (Task 5), popover (Task 5), AI-guided pre-config (Tasks 3–4), from-scratch → empty designer (Task 1), designer as in-body surface w/o back-to-chat (Tasks 1–2, 4), print-table scope (Task 6), exit via rail (existing router behavior, verified Task 7). ✓
- **Seed data:** the AI path reuses `suggestions[0]` (already imported in `chat-flow.js`) for a populated table — prototype-acceptable per spec's mock-data constraint.
- **Naming consistency:** `mountDesignerReact`, `openReportDesigner`, `openGuidedReportSetup`, `mountReportDesigner(dialog, { backToChat })`, `createReportSetupStepper({ messagesEl, onOpenDesigner })`, handoff key `tira-handoff-context`, hint `outputFormat: 'print-table'` — used consistently across tasks.
