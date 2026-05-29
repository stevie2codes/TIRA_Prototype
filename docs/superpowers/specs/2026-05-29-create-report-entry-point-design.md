# Create Report — Sidebar Entry Point & Guided Setup

**Date:** 2026-05-29
**Status:** Draft for review

## Summary

Add a direct way to create a report from the persistent left rail, so users no
longer have to discover the report designer through a nested AI chat. A new
**＋ Create** button in the rail opens a small popover with two paths:

1. **Create from scratch** — opens the report designer immediately on an empty,
   print-ready-table canvas.
2. **Create with AI** — opens the chat interface seeded to run a short **guided
   stepper** that helps the user set up the report. When setup is complete, the
   conversation surfaces an **"Open in report designer"** affordance; clicking it
   swaps the chat surface over to the designer, pre-seeded with the user's
   choices.

Both paths land in the **report designer rendered inside `#view-container`**
(the body), with the rail still visible and **no "Back to Chat" chrome** — a
single-page-application feel. Refinement after landing happens via the
designer's own AI panel.

## Goals

- A discoverable, top-level "create a report" affordance in the rail.
- An AI-guided pre-configuration that talks in plain report terms (no
  analytics/"measure" jargon) and **proposes** a report the user chooses to open
  — never force-redirects.
- A "from scratch" path with a proper print-ready-table empty state.
- Reuse existing infrastructure (in-body chat surface, `tira-handoff-context`
  pre-seed, `mountReportDesigner`) rather than building parallel machinery.

## Non-Goals (for now)

- Output formats other than **print-ready table** (dashboards, interactive,
  Excel, scheduling). Format/delivery selection is explicitly deferred.
- Template-based creation ("Start from a template"). The guided setup is
  expected to evolve toward templates later; the popover leaves room for it.
- Persisting created reports to a real store; this remains a prototype with
  mock data.

## Background / Current State

- The **report designer** is a React app in `report-canvas/`, mounted via
  `mountDesigner(element)` (`report-canvas/src/mount.jsx`).
- It reads an optional `tira-handoff-context` object from `sessionStorage`
  (`report-canvas/src/context/ReportContext.jsx`) to pre-seed sources, widgets,
  and the active tab. **With no handoff context it already initializes empty**
  (empty canvas, starts on the Data Layer tab) — the foundation for "from
  scratch."
- Today the designer is only mounted **inside the chat dialog** via
  `mountReportDesigner(dialog)` in `src/chat-flow.js`, which swaps the chat
  content for the designer and adds a **"Back to Chat"** bar.
- The chat surface itself now mounts **in-body** in `#view-container`
  (`openChatFlow`), with the rail persistent — the pattern we extend here.
- The rail (`src/tira-rail.js`) has items New Chat / Chats / Report Library and
  is wired to navigate; clicks currently route via `navigateTo` / `openLibraryView`.
- The designer already includes its own `AIChatPanel.jsx`, so users can keep
  refining with AI after landing — no need to return to the setup chat.

## UX Flow

```
＋ Create (rail)
   └─ popover ─┬─ Create from scratch ─────────────► Report Designer (empty)
              └─ Create with AI ─► Chat surface (seeded)
                                     └─ guided stepper (2 steps, hybrid)
                                          └─ proposal + "Open in report designer"
                                               └─ swap in place ► Report Designer (pre-seeded)
```

### Step language (guided stepper)

- **Step 1 — "What's this report about?"** Subject & data source. Quick-pick
  chips for known datasets/domains (Permits, Budgets, Code Violations, …) plus
  free-text ("or just describe it") via the chat input.
- **Step 2 — "What should it include?"** The information to show and how to
  organize it ("Show" chips for fields; "Organize by" chips like District /
  Month / Permit type) plus free text.
- **Proposal turn** — the assistant summarizes the proposed report (e.g.
  "Building Permits by District — print-ready table") and renders an
  **"Open in report designer"** button. The user decides when to proceed.

Each step is **hybrid**: chips are rendered in an assistant message; the chat
input handles the free-text answer. Selecting chips or sending text advances the
stepper.

## Components & Architecture

### 1. Rail — ＋ Create button + popover
- Add a `create` entry at the top of the rail in `src/tira-rail.js` (visually
  primary, paired with New Chat). It does **not** navigate; it toggles a small
  popover anchored to the button.
- Popover: a lightweight, custom anchored element (consistent with the
  prototype's hand-rolled UI) containing two items: **Create from scratch** and
  **Create with AI**. Dismiss on outside-click / Escape.
- Collapsed-rail and expanded-rail both support it (popover anchors to the
  button in either state).

### 2. Create with AI → seeded guided stepper (new)
- A new entry point (e.g. `openGuidedReportSetup()` in `src/chat-flow.js`) mounts
  the **same in-body chat host** used by `openChatFlow` (id `chat-dialog` in
  `#view-container`), reusing `chatHeaderHTML()` / `chatInputHTML()`.
- The chat opens with a seed user message that initiates the stepper. **Seed
  prompt text is an open question (see below).**
- A new stepper module drives the two steps as assistant messages with chip sets
  + free-text handling, tracking answers in a small state object.
- On completion, render a proposal message containing the
  **"Open in report designer"** button.

### 3. Open in report designer → swap in place
- Map the collected answers to a `tira-handoff-context` object
  (`reportTitle`, `dataSource`, `columns`, `data`, plus an
  `outputFormat: 'print-table'` hint) and write it to `sessionStorage`.
- Reuse the existing content-swap mechanism (`mountReportDesigner`), **modified
  to omit the "Back to Chat" bar** when launched from the create flow. The chat
  host's content is replaced by the designer in the same `#view-container`.

### 4. Create from scratch → designer directly (empty)
- A new entry point (e.g. `openReportDesigner({ seed: null })`) clears
  `#view-container`, clears any stale `tira-handoff-context`, and mounts the
  designer directly (no chat host, no back-to-chat bar).
- Relies on the designer's existing empty initialization. **We will ensure the
  empty state is "proper"**: a print-ready report shell with clear guidance to
  pick a data source / add a table (polish pass in `report-canvas` empty states).

### 5. Report Designer as an in-body surface
- The designer is an imperatively-mounted surface in `#view-container` (like the
  chat), not a router view. Leaving it happens via the rail (New Chat / Chats /
  Report Library), which calls `navigateTo` and lets the router clear and render
  the destination view.
- No "Back to Chat" chrome in any create-initiated mount.

### Print-ready table scope
- The handoff hint `outputFormat: 'print-table'` biases the designer to open in
  print layout with a table. This may require a small addition in
  `ReportContext.jsx` to honor the hint (open Print canvas + seed a table
  widget). Charts/dashboard widgets are out of scope for the seeded output.

## Data Flow

1. Guided answers → in-memory stepper state.
2. On "Open in report designer": stepper state → `tira-handoff-context`
   (sessionStorage) → designer reads it on mount and pre-seeds.
3. From scratch: no handoff context → designer mounts empty.

## Files to Create / Modify

**Modify**
- `src/tira-rail.js` — add ＋ Create item + popover; wire the two paths.
- `src/tira-rail.css` — Create button (primary) + popover styles.
- `src/chat-flow.js` — add `openGuidedReportSetup()`; add the guided stepper
  rendering + state; add `openReportDesigner()` for the scratch path; make
  `mountReportDesigner` able to omit the Back-to-Chat bar.
- `src/chat-flow.css` — stepper chip/step styles; designer surface without
  back-bar.
- `report-canvas/src/context/ReportContext.jsx` — honor `outputFormat`
  hint; ensure a polished empty (from-scratch) state.

**Possibly add**
- `src/report-setup-stepper.js` (+ `.css`) — if the stepper logic is large
  enough to warrant its own module rather than living in `chat-flow.js`.

## Empty States

- From scratch: print-ready report shell, empty table placeholder, a clear
  call-to-action to choose a data source / add fields. No errors or blank voids.

## Edge Cases / Error Handling

- Designer fails to load → existing error UI in `mountReportDesigner` (retry).
- User dismisses the popover without choosing → no-op.
- User navigates away mid-stepper (rail click) → router clears the surface;
  stepper state is discarded (acceptable for prototype).
- Re-entering Create while a chat/designer is already mounted → the new mount
  clears `#view-container` first (matches existing chat behavior).

## Verification (prototype)

Manual verification via the Vite dev server / preview:
1. Rail ＋ Create shows the popover with both options.
2. Create from scratch opens the designer empty with a proper print-ready state.
3. Create with AI opens the seeded chat, runs both steps with chips + free text,
   and surfaces "Open in report designer."
4. Clicking it swaps to the designer pre-seeded with the chosen subject/source
   and fields, in print-ready-table form, rail still visible, no back-to-chat.
5. Rail navigation cleanly exits the designer.

## Resolved Decisions

1. **Seed prompt text** for the Create-with-AI chat: **"Create a new report"**
   (kicks off the stepper).
2. **Exit affordance**: **rail-only** navigation for now; no explicit Close/Done
   control in the designer.
3. **Interaction**: a small **anchored popover** off the ＋ Create button.
