# Tiptap Rich Text Block — Design (Tier 1)

**Date:** 2026-06-09
**Status:** Approved for planning
**Scope:** Replace the report designer's hand-rolled `contentEditable` Rich Text Block with a Tiptap-powered editor offering in-canvas formatting via a bubble menu. This is "Tier 1" of a larger Tiptap integration; live data tokens (Tier 2) and document-mode authoring (Tier 3) are explicitly out of scope.

## Goal

Give the Rich Text Block real rich-text editing (inline marks, headings, lists, color, size) through an in-canvas bubble menu, replacing both the contentEditable block and the properties-panel Typography controls. Editing should feel canvas-native (Notion/Docs-class) while coexisting with the existing grid drag/resize and widget-selection behavior.

## Decisions (from brainstorming)

- **Editing model:** Bubble-menu-only. All formatting happens in-canvas on text selection. The properties-panel Typography section is **removed**.
- **Feature set (v1):** Core inline marks (bold, italic, underline, strikethrough); headings (H1/H2/H3) + lists (bullet, numbered) + blockquote; text color + size presets. **No links** in v1. **No slash menu** in v1.
- **Legacy headers:** Blocks migrated from the old Section Header (legacy `config.bold` + large `config.fontSize`) convert to a real **H2 heading node** on first load.
- **Approach:** Self-contained `RichTextEditor` component, always-editable, using Tiptap's built-in `BubbleMenu` styled with Forge tokens (Approach A).

## Dependencies & Version

Tiptap **v3** (MIT-licensed, supports React 19). Installed at the **repo root** (`report-canvas` deps are root-managed):

- `@tiptap/react`
- `@tiptap/pm`
- `@tiptap/starter-kit` — bold, italic, strike, headings, bullet/ordered lists, blockquote, paragraph, history
- `@tiptap/extension-underline`
- `@tiptap/extension-text-style` + `@tiptap/extension-color` — text color
- A text-size mark built on `TextStyle` (custom `fontSize` attribute) for Small/Normal/Large presets
- `@tiptap/extension-placeholder` — empty-state prompt

> Before installing, confirm the installed React version satisfies Tiptap v3's peer range (repo is React ^19.0.0).

## Component Architecture

Each unit has one clear purpose and a well-defined interface.

### `RichTextEditor.jsx` (new)
`report-canvas/src/components/report-builder/widgets/RichTextEditor.jsx`

- **Does:** Owns the Tiptap `useEditor` instance, extension config, the Forge-styled `BubbleMenu`, and save-on-update logic for a single block of rich text.
- **Interface:** `<RichTextEditor value={htmlString} onChange={(html) => ...} />`.
- **Depends on:** Tiptap packages above; Forge tokens for menu styling.
- **Internally uncontrolled:** Tiptap manages its own document state. The component initializes from `value` once and pushes HTML up via `onChange` (debounced on update, flushed on blur). It does **not** re-seed the doc from `value` on every render (avoids caret churn).

### `TextWidget.jsx` (simplified)
- Becomes a thin wrapper: reads `widget.config.text`, renders `<RichTextEditor value={...} onChange={html => updateWidget(widget.id, { config: { ...widget.config, text: html } })} />`.
- The legacy header migration shim lives here (see Data Flow).
- The old `contentEditable` div, the `useEffect` caret-sync, and the inline `style` block are **deleted** — Tiptap owns the DOM and styling now.

### Styles
`RichTextEditor.css` (or additions to `App.css`): `.ProseMirror` editor styles + bubble-menu container styling using Forge color tokens. The old `.text-widget--editable` rules are replaced/retired.

## Data Flow, Storage & Migration

- **Storage:** Content is an **HTML string** in `widget.config.text` (unchanged field). Tiptap initializes via `content: html` and serializes back with `editor.getHTML()`.
- **Ordinary text blocks:** Existing plain-text `config.text` is valid HTML and loads untouched — no migration needed.
- **Legacy header migration (H2):** On first load, if a block's `config.text` has no HTML block tags **and** legacy `config.bold === true` with `config.fontSize >= 18` (our migrated Section Headers), seed the editor with `<h2>{text}</h2>` instead of a plain paragraph. On first edit, `getHTML()` persists the `<h2>` and the stale `bold` / `fontSize` / `color` config fields are dropped. One-time shim, runs once per block.
- **Save timing:** Tiptap `onUpdate` → debounced `onChange` (~300ms) → `updateWidget`; also flush on `onBlur`. The brittle caret-sync `useEffect` is removed entirely.

## Bubble Menu UX + Properties Panel

- **Bubble menu** appears on text selection, floats above it, Forge-styled. Controls:
  - **B / I / U / S** mark toggles
  - **Heading** control — Normal / H1 / H2 / H3
  - **Lists** — bullet, numbered
  - **Blockquote**
  - **Text color** — swatch picker
  - **Size presets** — Small / Normal / Large (via `TextStyle` font-size mark; headings cover the largest sizes)
  - Controls reflect active state for the current selection.
- **Empty-line behavior:** No slash menu, but Tiptap commands act on the current node, so applying a heading/list with the caret on an empty paragraph works without a selection.
- **Properties panel:** For `text` / `section-header` widgets, the **Typography section is removed**. The Display section shows only the Type row plus a one-line hint: *"Format text directly in the block."* The Layout section stays hidden (resize via canvas corners), as today. Other widget types are unaffected.

## Edge Cases

- **Grid interaction:** The editor root gets `onMouseDown` stop-propagation. Drag remains handle-only (`.widget-drag-handle`); a click still bubbles to `WidgetWrapper` to select the widget so the panel updates.
- **Keyboard delete:** Both canvases already guard `e.target.isContentEditable` in their keydown handlers; Tiptap's editable surface satisfies this, so typing Backspace/Delete won't remove the widget.
- **Both canvases covered:** `PrintCanvas` and `DashboardCanvas` already map both `text` and `section-header` → `TextWidget`; no WIDGET_MAP changes needed.
- **Empty state:** Placeholder extension shows "Click to type…" when empty.
- **Sanitization:** HTML originates from Tiptap's own serializer, not arbitrary script paste. Acceptable for a prototype; **not** hardened against malicious paste — note for any future production hardening.

## Verification

No test runner exists in this prototype. Verification is:

1. **Compile clean** — all edited/new modules return HTTP 200 from the running Vite dev server's transform (`curl` the module URL on `:5173`); no `[vite]` HMR errors in the dev server log.
2. **Manual exercise (user-driven, after a hard reload):**
   - Type into a Rich Text Block; text persists.
   - Select text → bubble menu appears → bold / heading / list / color / size all apply.
   - The legacy "Building Permits by Month" block renders as an H2 heading.
   - The properties panel no longer shows a Typography section for text blocks.
3. The Claude Preview MCP cannot launch in this repo (`getcwd` permission error on the Desktop path), so **final visual confirmation is the user's**; the agent verifies compilation only.

## Out of Scope

- Live data/parameter tokens (Tier 2).
- Document-mode authoring with embedded widget node-views (Tier 3).
- Links, slash menu, tables, mentions.
- Paid Tiptap features: Content AI, comments, version history, DOCX/PDF conversion.
- Production-grade paste sanitization.
