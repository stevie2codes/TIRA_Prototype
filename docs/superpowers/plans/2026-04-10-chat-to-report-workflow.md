# Chat-to-Report Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-phase right panel workflow (Explore → Configure → Publish) so users can promote a chat query result into a formal, publishable report without leaving the split view.

**Architecture:** The existing `buildReportPanel()` becomes Mode 1 (Explore) with minor changes. Two new builder functions handle Configure and Publish modes. A shared report configuration state object threads through all three modes. Mode transitions are cross-fade animations within the same right panel container.

**Tech Stack:** Vanilla JS, Tyler Forge web components (`forge-tab-bar`, `forge-table`, `forge-icon`, `forge-button`), CSS with Forge design tokens, existing `output-templates.js` for template picker data.

**Spec:** `docs/superpowers/specs/2026-04-10-chat-to-report-workflow-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/report-configure.js` | Create | Configure mode UI builder, Publish mode UI builder, mode transition logic, report config state factory |
| `src/report-configure.css` | Create | All styles for Configure and Publish modes |
| `src/chat-flow.js` | Modify | Update `buildReportPanel()` (remove Save to Library, add Configure as Report button), import and wire `report-configure.js` |
| `src/chat-flow.css` | Modify | Add `.configure-report-btn` style to action bar, add cross-fade transition class |
| `src/main.js` | Modify | Register new icons needed by Configure/Publish modes |

---

### Task 1: Register new icons in main.js

**Files:**
- Modify: `src/main.js`

The Configure and Publish modes need icons not yet registered: `visibility`, `lock`, `label`, `drag_indicator`, `publish`, `check_circle`, `tune`, `toggle_on`, `toggle_off`, `expand_less`. Check which are already imported and add only the missing ones.

- [ ] **Step 1: Add icon imports to main.js**

At the top of `src/main.js`, in the icon import block (around line 15-60), add:

```javascript
import { tylIconVisibility } from '@tylertech/tyler-icons/standard';
import { tylIconLock } from '@tylertech/tyler-icons/standard';
import { tylIconLabel } from '@tylertech/tyler-icons/standard';
import { tylIconDragIndicator } from '@tylertech/tyler-icons/standard';
import { tylIconPublish } from '@tylertech/tyler-icons/standard';
import { tylIconCheckCircle } from '@tylertech/tyler-icons/standard';
import { tylIconTune } from '@tylertech/tyler-icons/standard';
import { tylIconToggleOn } from '@tylertech/tyler-icons/standard';
import { tylIconToggleOff } from '@tylertech/tyler-icons/standard';
import { tylIconExpandLess } from '@tylertech/tyler-icons/standard';
```

- [ ] **Step 2: Register the new icons**

In the `IconRegistry.define([...])` array (line 122), add the new icons before the closing bracket:

```javascript
  tylIconVisibility,
  tylIconLock,
  tylIconLabel,
  tylIconDragIndicator,
  tylIconPublish,
  tylIconCheckCircle,
  tylIconTune,
  tylIconToggleOn,
  tylIconToggleOff,
  tylIconExpandLess,
```

- [ ] **Step 3: Verify dev server starts without errors**

Run: `npm run dev`
Expected: No console errors about missing icons. The page loads normally.

- [ ] **Step 4: Commit**

```bash
git add src/main.js
git commit -m "feat: register icons for Configure and Publish report modes"
```

---

### Task 2: Create report config state factory and mode transition logic

**Files:**
- Create: `src/report-configure.js`

This file exports: `createReportConfig(suggestion)` to build the initial state object, `buildConfigureMode(config, callbacks)` and `buildPublishMode(config, callbacks)` as stubs (implemented in later tasks), and `transitionMode(container, newContent)` for cross-fade animation.

- [ ] **Step 1: Create src/report-configure.js with state factory and transition helper**

```javascript
import { outputTemplates, getTemplateById } from './output-templates.js';
import './report-configure.css';

/**
 * Creates the report configuration state object from a suggestion.
 * This object is passed through all three modes (Explore → Configure → Publish).
 */
export function createReportConfig(suggestion) {
  return {
    name: suggestion.reportTitle || '',
    query: suggestion.sqlCode || '',
    columns: (suggestion.columns || []).map(col => ({
      property: col.property,
      header: col.header,
      displayName: col.header,
      visible: true,
      sortable: col.sortable ?? true,
    })),
    parameters: [
      { id: 'district', label: 'District', value: 'All Districts', fixed: false, defaultValue: 'All Districts' },
      { id: 'month', label: 'Month', value: 'All Months', fixed: false, defaultValue: 'All Months' },
      { id: 'permitType', label: 'Permit Type', value: 'All Types', fixed: false, defaultValue: 'All Types' },
    ],
    template: null,
    description: '',
    category: '',
    tags: [],
    visibility: 'only-me',
    roles: [],
    schedule: null,
    data: suggestion.data || [],
    dataSource: suggestion.dataSource || '',
    freshness: suggestion.freshness || '',
  };
}

/**
 * Cross-fades the right panel content from old to new.
 * @param {HTMLElement} container - The right panel container (forge-split-view-panel or similar)
 * @param {HTMLElement} newContent - The new mode's root element
 */
export function transitionMode(container, newContent) {
  const oldContent = container.firstElementChild;
  if (oldContent) {
    oldContent.style.transition = 'opacity 0.2s ease';
    oldContent.style.opacity = '0';
    setTimeout(() => {
      oldContent.remove();
      newContent.style.opacity = '0';
      container.appendChild(newContent);
      requestAnimationFrame(() => {
        newContent.style.transition = 'opacity 0.2s ease';
        newContent.style.opacity = '1';
      });
    }, 200);
  } else {
    container.appendChild(newContent);
  }
}
```

- [ ] **Step 2: Verify the file is importable**

Run: `npm run dev`
Expected: No errors. The file is created but not yet imported anywhere — just confirm no syntax issues by checking the dev server console.

- [ ] **Step 3: Commit**

```bash
git add src/report-configure.js
git commit -m "feat: add report config state factory and mode transition helper"
```

---

### Task 3: Create the Configure mode CSS

**Files:**
- Create: `src/report-configure.css`

All styles for Configure and Publish modes. Uses Forge spacing tokens and color tokens per CLAUDE.md guidelines.

- [ ] **Step 1: Create src/report-configure.css**

```css
/* ===== Configure Mode ===== */

.configure-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--forge-theme-surface-variant, #fafafa);
}

/* Header with editable report name */
.configure-header {
  display: flex;
  flex-direction: column;
  gap: var(--forge-spacing-xxsmall);
  padding: var(--forge-spacing-small) var(--forge-spacing-medium-large);
  border-bottom: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
  background: #fff;
  flex-shrink: 0;
}

.configure-name-input {
  border: none;
  outline: none;
  font-size: 18px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
  background: transparent;
  padding: var(--forge-spacing-xxsmall) 0;
  border-bottom: 2px solid transparent;
  transition: border-color 0.15s ease;
}

.configure-name-input:focus {
  border-bottom-color: var(--forge-theme-primary, #3f51b5);
}

.configure-name-input::placeholder {
  color: rgba(0, 0, 0, 0.35);
}

.configure-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.54);
}

.configure-meta forge-icon {
  --forge-icon-font-size: 14px;
  color: rgba(0, 0, 0, 0.4);
}

.configure-meta-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
}

/* Tab bar */
.configure-tabs {
  flex-shrink: 0;
  border-bottom: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
  background: #fff;
}

/* Tab content area */
.configure-tab-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--forge-spacing-medium);
  min-height: 0;
}

.configure-tab-panel {
  display: none;
}

.configure-tab-panel--active {
  display: block;
}

/* Query tab */
.configure-sql-editor {
  background: #1e1e1e;
  border-radius: 6px;
  padding: var(--forge-spacing-medium);
  overflow: auto;
  max-height: 300px;
  margin-bottom: var(--forge-spacing-medium);
}

.configure-sql-editor pre {
  margin: 0;
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-break: break-all;
}

.configure-sql-editor textarea {
  width: 100%;
  min-height: 150px;
  background: #1e1e1e;
  color: #d4d4d4;
  border: none;
  outline: none;
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  padding: 0;
}

.configure-run-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--forge-spacing-xxsmall);
  padding: 6px 14px;
  background: var(--forge-theme-primary, #3f51b5);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: filter 0.15s ease;
}

.configure-run-btn:hover {
  filter: brightness(0.9);
}

.configure-run-btn forge-icon {
  --forge-icon-font-size: 16px;
}

/* Columns tab */
.configure-column-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.configure-column-row {
  display: flex;
  align-items: center;
  gap: var(--forge-spacing-xsmall);
  padding: var(--forge-spacing-xsmall) var(--forge-spacing-small);
  background: #fff;
  border: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
  border-radius: 6px;
  transition: background 0.1s ease;
}

.configure-column-row:hover {
  background: #f5f5f5;
}

.configure-column-drag {
  cursor: grab;
  color: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.configure-column-drag forge-icon {
  --forge-icon-font-size: 18px;
}

.configure-column-name {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.87);
  background: transparent;
  padding: var(--forge-spacing-xxsmall) 0;
}

.configure-column-name:focus {
  border-bottom: 1px solid var(--forge-theme-primary, #3f51b5);
}

.configure-column-original {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.35);
  white-space: nowrap;
}

.configure-visibility-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: rgba(0, 0, 0, 0.5);
  transition: color 0.15s ease;
}

.configure-visibility-toggle:hover {
  color: rgba(0, 0, 0, 0.8);
}

.configure-visibility-toggle.hidden {
  color: rgba(0, 0, 0, 0.2);
}

.configure-visibility-toggle forge-icon {
  --forge-icon-font-size: 18px;
}

/* Parameters tab */
.configure-param-list {
  display: flex;
  flex-direction: column;
  gap: var(--forge-spacing-small);
}

.configure-param-card {
  background: #fff;
  border: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
  border-radius: 8px;
  padding: var(--forge-spacing-medium);
}

.configure-param-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--forge-spacing-xsmall);
}

.configure-param-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.configure-param-type-toggle {
  display: flex;
  align-items: center;
  gap: var(--forge-spacing-xxsmall);
  font-size: 12px;
  color: rgba(0, 0, 0, 0.54);
}

.configure-param-type-btn {
  padding: 3px 10px;
  border: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  transition: all 0.15s ease;
}

.configure-param-type-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.configure-param-type-btn:last-child {
  border-radius: 0 4px 4px 0;
}

.configure-param-type-btn.active {
  background: var(--forge-theme-primary, #3f51b5);
  color: #fff;
  border-color: var(--forge-theme-primary, #3f51b5);
}

.configure-param-fields {
  display: flex;
  flex-direction: column;
  gap: var(--forge-spacing-xsmall);
  margin-top: var(--forge-spacing-xsmall);
}

.configure-param-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.configure-param-field label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(0, 0, 0, 0.45);
}

.configure-param-field input {
  border: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.87);
  outline: none;
  transition: border-color 0.15s ease;
}

.configure-param-field input:focus {
  border-color: var(--forge-theme-primary, #3f51b5);
}

/* Template tab */
.configure-template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--forge-spacing-small);
}

.configure-template-card {
  border: 2px solid var(--forge-theme-outline-variant, #e0e0e0);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s ease;
}

.configure-template-card:hover {
  border-color: #bdbdbd;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.configure-template-card.selected {
  border-color: var(--forge-theme-primary, #3f51b5);
  box-shadow: 0 0 0 1px var(--forge-theme-primary, #3f51b5);
}

.configure-template-preview {
  height: 80px;
  display: flex;
  flex-direction: column;
}

.configure-template-preview-header {
  height: 28px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  color: #fff;
  font-size: 10px;
  font-weight: 500;
}

.configure-template-preview-header forge-icon {
  --forge-icon-font-size: 14px;
}

.configure-template-preview-body {
  flex: 1;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.configure-template-preview-row {
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.08);
}

.configure-template-preview-row:first-child {
  width: 100%;
}

.configure-template-preview-row:nth-child(2) {
  width: 80%;
}

.configure-template-preview-row:nth-child(3) {
  width: 60%;
}

.configure-template-info {
  padding: var(--forge-spacing-xsmall) var(--forge-spacing-small);
}

.configure-template-name {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.configure-template-desc {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.5);
  margin-top: 2px;
}

/* No-template option */
.configure-template-card.no-template .configure-template-preview {
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.configure-template-card.no-template .configure-template-preview span {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.35);
}

/* Details tab */
.configure-details-form {
  display: flex;
  flex-direction: column;
  gap: var(--forge-spacing-medium);
}

.configure-field-group {
  display: flex;
  flex-direction: column;
  gap: var(--forge-spacing-xxsmall);
}

.configure-field-group label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
}

.configure-field-group textarea {
  border: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
  border-radius: 6px;
  padding: var(--forge-spacing-xsmall) var(--forge-spacing-small);
  font-size: 13px;
  color: rgba(0, 0, 0, 0.87);
  outline: none;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.15s ease;
}

.configure-field-group textarea:focus {
  border-color: var(--forge-theme-primary, #3f51b5);
}

.configure-field-group select {
  border: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
  border-radius: 6px;
  padding: 8px var(--forge-spacing-small);
  font-size: 13px;
  color: rgba(0, 0, 0, 0.87);
  outline: none;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.configure-field-group select:focus {
  border-color: var(--forge-theme-primary, #3f51b5);
}

.configure-tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  border: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
  border-radius: 6px;
  padding: 6px var(--forge-spacing-xsmall);
  min-height: 36px;
  transition: border-color 0.15s ease;
}

.configure-tags-input:focus-within {
  border-color: var(--forge-theme-primary, #3f51b5);
}

.configure-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #e8eaf6;
  border-radius: 12px;
  font-size: 12px;
  color: var(--forge-theme-primary, #3f51b5);
}

.configure-tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  color: var(--forge-theme-primary, #3f51b5);
  opacity: 0.6;
  padding: 0;
}

.configure-tag-remove:hover {
  opacity: 1;
}

.configure-tags-field {
  border: none;
  outline: none;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.87);
  flex: 1;
  min-width: 80px;
  padding: 2px 0;
}

/* Collapsible data preview */
.configure-preview-section {
  flex-shrink: 0;
  border-top: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
}

.configure-preview-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--forge-spacing-xsmall) var(--forge-spacing-medium);
  cursor: pointer;
  background: #fafafa;
  border: none;
  width: 100%;
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  transition: background 0.15s ease;
}

.configure-preview-toggle:hover {
  background: #f0f0f0;
}

.configure-preview-toggle forge-icon {
  --forge-icon-font-size: 18px;
  transition: transform 0.2s ease;
}

.configure-preview-toggle.expanded forge-icon {
  transform: rotate(180deg);
}

.configure-preview-body {
  display: none;
  overflow: auto;
  max-height: 250px;
  padding: 0 var(--forge-spacing-medium) var(--forge-spacing-medium);
}

.configure-preview-body.open {
  display: block;
}

.configure-preview-body forge-table {
  width: 100%;
}

/* Footer bar (shared by Configure and Publish) */
.configure-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--forge-spacing-small) var(--forge-spacing-medium-large);
  border-top: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
  background: #fff;
  flex-shrink: 0;
}

.configure-footer-back {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  gap: var(--forge-spacing-xxsmall);
  padding: 6px 12px;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.configure-footer-back:hover {
  background: rgba(0, 0, 0, 0.04);
}

.configure-footer-back forge-icon {
  --forge-icon-font-size: 16px;
}

.configure-footer-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--forge-spacing-xxsmall);
  padding: 8px 20px;
  background: var(--forge-theme-primary, #3f51b5);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: filter 0.15s ease;
}

.configure-footer-primary:hover {
  filter: brightness(0.9);
}

.configure-footer-primary:disabled {
  background: #e0e0e0;
  color: rgba(0, 0, 0, 0.35);
  cursor: not-allowed;
  filter: none;
}

.configure-footer-primary forge-icon {
  --forge-icon-font-size: 18px;
}

/* ===== Publish Mode ===== */

.publish-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--forge-theme-surface-variant, #fafafa);
}

.publish-header {
  display: flex;
  flex-direction: column;
  gap: var(--forge-spacing-xxsmall);
  padding: var(--forge-spacing-medium) var(--forge-spacing-medium-large);
  border-bottom: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
  background: #fff;
  flex-shrink: 0;
}

.publish-report-name {
  font-size: 18px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
}

.publish-meta {
  display: flex;
  align-items: center;
  gap: var(--forge-spacing-xsmall);
  flex-wrap: wrap;
}

.publish-meta-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: #e8eaf6;
  color: var(--forge-theme-primary, #3f51b5);
}

.publish-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--forge-spacing-medium-large);
  display: flex;
  flex-direction: column;
  gap: var(--forge-spacing-large);
}

.publish-section {
  background: #fff;
  border: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
  border-radius: 8px;
  padding: var(--forge-spacing-medium);
}

.publish-section-title {
  display: flex;
  align-items: center;
  gap: var(--forge-spacing-xsmall);
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: var(--forge-spacing-small);
}

.publish-section-title forge-icon {
  --forge-icon-font-size: 20px;
  color: rgba(0, 0, 0, 0.5);
}

.publish-visibility-select {
  width: 100%;
  border: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
  border-radius: 6px;
  padding: 8px var(--forge-spacing-small);
  font-size: 13px;
  color: rgba(0, 0, 0, 0.87);
  outline: none;
  background: #fff;
  cursor: pointer;
}

.publish-visibility-select:focus {
  border-color: var(--forge-theme-primary, #3f51b5);
}

.publish-roles-list {
  display: flex;
  flex-direction: column;
  gap: var(--forge-spacing-xsmall);
  margin-top: var(--forge-spacing-small);
}

.publish-role-checkbox {
  display: flex;
  align-items: center;
  gap: var(--forge-spacing-xsmall);
  font-size: 13px;
  color: rgba(0, 0, 0, 0.7);
}

/* Schedule section (collapsed by default) */
.publish-schedule-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  padding: 0;
  text-align: left;
}

.publish-schedule-fields {
  display: none;
  flex-direction: column;
  gap: var(--forge-spacing-small);
  margin-top: var(--forge-spacing-medium);
}

.publish-schedule-fields.open {
  display: flex;
}

.publish-schedule-row {
  display: flex;
  gap: var(--forge-spacing-small);
  align-items: center;
}

.publish-schedule-row select,
.publish-schedule-row input {
  border: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.87);
  outline: none;
  background: #fff;
}

.publish-schedule-row label {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
  white-space: nowrap;
}

/* Post-publish confirmation */
.publish-confirmation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--forge-spacing-medium);
  text-align: center;
  padding: var(--forge-spacing-xlarge);
}

.publish-confirmation-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #e8f5e9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.publish-confirmation-icon forge-icon {
  --forge-icon-font-size: 32px;
  color: #4caf50;
}

.publish-confirmation-title {
  font-size: 20px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
}

.publish-confirmation-name {
  font-size: 14px;
  color: var(--forge-theme-primary, #3f51b5);
  font-weight: 500;
}

.publish-confirmation-actions {
  display: flex;
  gap: var(--forge-spacing-small);
  margin-top: var(--forge-spacing-small);
}

.publish-confirmation-btn {
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.publish-confirmation-btn.primary {
  background: var(--forge-theme-primary, #3f51b5);
  color: #fff;
  border: none;
}

.publish-confirmation-btn.primary:hover {
  filter: brightness(0.9);
}

.publish-confirmation-btn.secondary {
  background: #fff;
  color: rgba(0, 0, 0, 0.7);
  border: 1px solid var(--forge-theme-outline-variant, #e0e0e0);
}

.publish-confirmation-btn.secondary:hover {
  background: #f5f5f5;
}

/* ===== Configure as Report button (added to Explore action bar) ===== */

.configure-report-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--forge-spacing-xxsmall);
  padding: 6px 14px;
  background: var(--forge-theme-primary, #3f51b5);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: filter 0.15s ease;
  white-space: nowrap;
}

.configure-report-btn:hover {
  filter: brightness(0.9);
}

.configure-report-btn forge-icon {
  --forge-icon-font-size: 16px;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/report-configure.css
git commit -m "feat: add CSS for Configure and Publish report modes"
```

---

### Task 4: Build the Configure mode UI

**Files:**
- Modify: `src/report-configure.js`

Add `buildConfigureMode(config, callbacks)` that returns a fully built DOM element. The `callbacks` object has `{ onBack, onPublish, onQueryRun }`.

- [ ] **Step 1: Add buildConfigureMode function to report-configure.js**

After the `transitionMode` function, add:

```javascript
/**
 * Builds the Configure mode panel.
 * @param {Object} config - Report configuration state object
 * @param {Object} callbacks - { onBack: fn, onPublish: fn }
 * @returns {HTMLElement}
 */
export function buildConfigureMode(config, callbacks) {
  const panel = document.createElement('div');
  panel.className = 'configure-panel';

  // === Header: editable name + metadata ===
  const header = document.createElement('div');
  header.className = 'configure-header';
  header.innerHTML = `
    <input class="configure-name-input" type="text" value="${escapeAttr(config.name)}" placeholder="Report name..." />
    <div class="configure-meta">
      <forge-icon name="database_outline"></forge-icon>
      <span>${config.dataSource}</span>
      <span class="configure-meta-dot"></span>
      <span>${config.freshness}</span>
    </div>
  `;
  panel.appendChild(header);

  // Sync name to config
  const nameInput = header.querySelector('.configure-name-input');
  nameInput.addEventListener('input', () => {
    config.name = nameInput.value;
    updatePublishBtn();
  });

  // === Tab bar ===
  const tabBarContainer = document.createElement('div');
  tabBarContainer.className = 'configure-tabs';
  const tabBar = document.createElement('forge-tab-bar');
  tabBar.setAttribute('active-tab', '0');
  tabBar.setAttribute('clustered', '');
  tabBar.innerHTML = `
    <forge-tab>Query</forge-tab>
    <forge-tab>Columns</forge-tab>
    <forge-tab>Parameters</forge-tab>
    <forge-tab>Template</forge-tab>
    <forge-tab>Details</forge-tab>
  `;
  tabBarContainer.appendChild(tabBar);
  panel.appendChild(tabBarContainer);

  // === Tab content ===
  const tabContent = document.createElement('div');
  tabContent.className = 'configure-tab-content';

  // --- Query tab ---
  const queryPanel = document.createElement('div');
  queryPanel.className = 'configure-tab-panel configure-tab-panel--active';
  queryPanel.dataset.tab = '0';
  queryPanel.innerHTML = `
    <div class="configure-sql-editor">
      <textarea spellcheck="false">${escapeHtml(config.query)}</textarea>
    </div>
    <button class="configure-run-btn" type="button">
      <forge-icon name="play_arrow"></forge-icon>
      Run Query
    </button>
  `;
  tabContent.appendChild(queryPanel);

  // Wire query editing
  const sqlTextarea = queryPanel.querySelector('textarea');
  sqlTextarea.addEventListener('input', () => {
    config.query = sqlTextarea.value;
  });

  // Wire Run Query button (simulated)
  const runBtn = queryPanel.querySelector('.configure-run-btn');
  runBtn.addEventListener('click', () => {
    runBtn.innerHTML = '<forge-icon name="check"></forge-icon> Results updated';
    runBtn.style.background = '#4caf50';
    setTimeout(() => {
      runBtn.innerHTML = '<forge-icon name="play_arrow"></forge-icon> Run Query';
      runBtn.style.background = '';
    }, 1500);
  });

  // --- Columns tab ---
  const columnsPanel = document.createElement('div');
  columnsPanel.className = 'configure-tab-panel';
  columnsPanel.dataset.tab = '1';
  const columnList = document.createElement('div');
  columnList.className = 'configure-column-list';
  config.columns.forEach((col, i) => {
    const row = document.createElement('div');
    row.className = 'configure-column-row';
    row.innerHTML = `
      <div class="configure-column-drag"><forge-icon name="drag_indicator"></forge-icon></div>
      <input class="configure-column-name" type="text" value="${escapeAttr(col.displayName)}" data-index="${i}" />
      ${col.displayName !== col.header ? `<span class="configure-column-original">(${escapeHtml(col.header)})</span>` : ''}
      <button class="configure-visibility-toggle ${col.visible ? '' : 'hidden'}" type="button" data-index="${i}" title="${col.visible ? 'Hide column' : 'Show column'}">
        <forge-icon name="${col.visible ? 'visibility' : 'visibility_off'}"></forge-icon>
      </button>
    `;
    columnList.appendChild(row);
  });
  columnsPanel.appendChild(columnList);
  tabContent.appendChild(columnsPanel);

  // Wire column name editing
  columnList.addEventListener('input', (e) => {
    if (e.target.classList.contains('configure-column-name')) {
      const idx = parseInt(e.target.dataset.index);
      config.columns[idx].displayName = e.target.value;
    }
  });

  // Wire visibility toggles
  columnList.addEventListener('click', (e) => {
    const toggle = e.target.closest('.configure-visibility-toggle');
    if (!toggle) return;
    const idx = parseInt(toggle.dataset.index);
    config.columns[idx].visible = !config.columns[idx].visible;
    toggle.classList.toggle('hidden');
    const icon = toggle.querySelector('forge-icon');
    icon.name = config.columns[idx].visible ? 'visibility' : 'visibility_off';
    toggle.title = config.columns[idx].visible ? 'Hide column' : 'Show column';
  });

  // --- Parameters tab ---
  const paramsPanel = document.createElement('div');
  paramsPanel.className = 'configure-tab-panel';
  paramsPanel.dataset.tab = '2';
  const paramList = document.createElement('div');
  paramList.className = 'configure-param-list';
  config.parameters.forEach((param, i) => {
    const card = document.createElement('div');
    card.className = 'configure-param-card';
    card.innerHTML = `
      <div class="configure-param-header">
        <span class="configure-param-name">${escapeHtml(param.label)}</span>
        <div class="configure-param-type-toggle">
          <button class="configure-param-type-btn ${param.fixed ? 'active' : ''}" data-index="${i}" data-type="fixed" type="button">Fixed</button>
          <button class="configure-param-type-btn ${!param.fixed ? 'active' : ''}" data-index="${i}" data-type="adjustable" type="button">User-adjustable</button>
        </div>
      </div>
      <div class="configure-param-fields" style="${!param.fixed ? '' : 'display:none'}">
        <div class="configure-param-field">
          <label>Display Label</label>
          <input type="text" value="${escapeAttr(param.label)}" data-index="${i}" data-field="label" />
        </div>
        <div class="configure-param-field">
          <label>Default Value</label>
          <input type="text" value="${escapeAttr(param.defaultValue)}" data-index="${i}" data-field="default" />
        </div>
      </div>
    `;
    paramList.appendChild(card);
  });
  paramsPanel.appendChild(paramList);
  tabContent.appendChild(paramsPanel);

  // Wire parameter type toggles
  paramList.addEventListener('click', (e) => {
    const btn = e.target.closest('.configure-param-type-btn');
    if (!btn) return;
    const idx = parseInt(btn.dataset.index);
    const type = btn.dataset.type;
    config.parameters[idx].fixed = type === 'fixed';
    const card = btn.closest('.configure-param-card');
    card.querySelectorAll('.configure-param-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const fields = card.querySelector('.configure-param-fields');
    fields.style.display = type === 'fixed' ? 'none' : '';
  });

  // Wire parameter field editing
  paramList.addEventListener('input', (e) => {
    const input = e.target;
    if (!input.dataset.field) return;
    const idx = parseInt(input.dataset.index);
    if (input.dataset.field === 'label') config.parameters[idx].label = input.value;
    if (input.dataset.field === 'default') config.parameters[idx].defaultValue = input.value;
  });

  // --- Template tab ---
  const templatePanel = document.createElement('div');
  templatePanel.className = 'configure-tab-panel';
  templatePanel.dataset.tab = '3';
  const templateGrid = document.createElement('div');
  templateGrid.className = 'configure-template-grid';

  // "No template" option
  const noTplCard = document.createElement('div');
  noTplCard.className = `configure-template-card no-template ${config.template === null ? 'selected' : ''}`;
  noTplCard.dataset.templateId = '';
  noTplCard.innerHTML = `
    <div class="configure-template-preview"><span>No template</span></div>
    <div class="configure-template-info">
      <div class="configure-template-name">Plain data</div>
      <div class="configure-template-desc">No branding applied</div>
    </div>
  `;
  templateGrid.appendChild(noTplCard);

  // Template options from outputTemplates
  outputTemplates.forEach(tpl => {
    const card = document.createElement('div');
    card.className = `configure-template-card ${config.template === tpl.id ? 'selected' : ''}`;
    card.dataset.templateId = tpl.id;
    card.innerHTML = `
      <div class="configure-template-preview">
        <div class="configure-template-preview-header" style="background:${tpl.header.background};">
          <forge-icon name="${tpl.logo}"></forge-icon>
          ${escapeHtml(tpl.name)}
        </div>
        <div class="configure-template-preview-body" style="background:${tpl.theme.surface};">
          <div class="configure-template-preview-row" style="background:${tpl.theme.tableBorder};"></div>
          <div class="configure-template-preview-row" style="background:${tpl.theme.tableStripe};"></div>
          <div class="configure-template-preview-row" style="background:${tpl.theme.tableBorder};"></div>
        </div>
      </div>
      <div class="configure-template-info">
        <div class="configure-template-name">${escapeHtml(tpl.name)}</div>
        <div class="configure-template-desc">${escapeHtml(tpl.description)}</div>
      </div>
    `;
    templateGrid.appendChild(card);
  });
  templatePanel.appendChild(templateGrid);
  tabContent.appendChild(templatePanel);

  // Wire template selection
  templateGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.configure-template-card');
    if (!card) return;
    templateGrid.querySelectorAll('.configure-template-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    config.template = card.dataset.templateId || null;
  });

  // --- Details tab ---
  const detailsPanel = document.createElement('div');
  detailsPanel.className = 'configure-tab-panel';
  detailsPanel.dataset.tab = '4';
  detailsPanel.innerHTML = `
    <div class="configure-details-form">
      <div class="configure-field-group">
        <label>Description</label>
        <textarea placeholder="What does this report show and why?">${escapeHtml(config.description)}</textarea>
      </div>
      <div class="configure-field-group">
        <label>Category</label>
        <select>
          <option value="" ${config.category === '' ? 'selected' : ''}>Select a category...</option>
          <option value="building" ${config.category === 'building' ? 'selected' : ''}>Building</option>
          <option value="public-safety" ${config.category === 'public-safety' ? 'selected' : ''}>Public Safety</option>
          <option value="finance" ${config.category === 'finance' ? 'selected' : ''}>Finance</option>
          <option value="code-enforcement" ${config.category === 'code-enforcement' ? 'selected' : ''}>Code Enforcement</option>
          <option value="planning" ${config.category === 'planning' ? 'selected' : ''}>Planning & Zoning</option>
          <option value="utilities" ${config.category === 'utilities' ? 'selected' : ''}>Utilities</option>
          <option value="general" ${config.category === 'general' ? 'selected' : ''}>General</option>
        </select>
      </div>
      <div class="configure-field-group">
        <label>Tags</label>
        <div class="configure-tags-input">
          <input class="configure-tags-field" type="text" placeholder="Type and press Enter..." />
        </div>
      </div>
    </div>
  `;
  tabContent.appendChild(detailsPanel);

  // Wire details fields
  const descTextarea = detailsPanel.querySelector('textarea');
  descTextarea.addEventListener('input', () => { config.description = descTextarea.value; });

  const categorySelect = detailsPanel.querySelector('select');
  categorySelect.addEventListener('change', () => { config.category = categorySelect.value; });

  // Wire tags
  const tagsContainer = detailsPanel.querySelector('.configure-tags-input');
  const tagsField = detailsPanel.querySelector('.configure-tags-field');

  function renderTags() {
    tagsContainer.querySelectorAll('.configure-tag').forEach(t => t.remove());
    config.tags.forEach((tag, i) => {
      const tagEl = document.createElement('span');
      tagEl.className = 'configure-tag';
      tagEl.innerHTML = `${escapeHtml(tag)} <button class="configure-tag-remove" type="button" data-index="${i}">&times;</button>`;
      tagsContainer.insertBefore(tagEl, tagsField);
    });
  }

  tagsField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && tagsField.value.trim()) {
      e.preventDefault();
      config.tags.push(tagsField.value.trim());
      tagsField.value = '';
      renderTags();
    }
  });

  tagsContainer.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.configure-tag-remove');
    if (!removeBtn) return;
    config.tags.splice(parseInt(removeBtn.dataset.index), 1);
    renderTags();
  });

  panel.appendChild(tabContent);

  // === Wire tab switching ===
  tabBar.addEventListener('forge-tab-bar-change', (e) => {
    const idx = e.detail.index;
    tabContent.querySelectorAll('.configure-tab-panel').forEach(p => p.classList.remove('configure-tab-panel--active'));
    const target = tabContent.querySelector(`.configure-tab-panel[data-tab="${idx}"]`);
    if (target) target.classList.add('configure-tab-panel--active');
  });

  // === Collapsible data preview ===
  const previewSection = document.createElement('div');
  previewSection.className = 'configure-preview-section';
  previewSection.innerHTML = `
    <button class="configure-preview-toggle" type="button">
      <span>Data Preview (${config.data.length} rows)</span>
      <forge-icon name="expand_more"></forge-icon>
    </button>
    <div class="configure-preview-body"></div>
  `;
  panel.appendChild(previewSection);

  const previewToggle = previewSection.querySelector('.configure-preview-toggle');
  const previewBody = previewSection.querySelector('.configure-preview-body');
  previewToggle.addEventListener('click', () => {
    previewToggle.classList.toggle('expanded');
    previewBody.classList.toggle('open');

    // Lazy-load table on first expand
    if (previewBody.classList.contains('open') && !previewBody.querySelector('forge-table')) {
      const table = document.createElement('forge-table');
      table.setAttribute('dense', '');
      table.setAttribute('fixed-headers', '');
      previewBody.appendChild(table);
      requestAnimationFrame(() => {
        table.columnConfigurations = config.columns
          .filter(c => c.visible)
          .map(c => ({ property: c.property, header: c.displayName, sortable: c.sortable }));
        table.data = config.data;
      });
    }
  });

  // === Footer ===
  const footer = document.createElement('div');
  footer.className = 'configure-footer';
  footer.innerHTML = `
    <button class="configure-footer-back" type="button">
      <forge-icon name="arrow_back"></forge-icon>
      Back to Explore
    </button>
    <button class="configure-footer-primary" type="button">
      <forge-icon name="publish"></forge-icon>
      Publish
    </button>
  `;
  panel.appendChild(footer);

  const publishBtn = footer.querySelector('.configure-footer-primary');
  function updatePublishBtn() {
    publishBtn.disabled = !config.name.trim();
  }
  updatePublishBtn();

  footer.querySelector('.configure-footer-back').addEventListener('click', () => {
    if (callbacks.onBack) callbacks.onBack();
  });

  publishBtn.addEventListener('click', () => {
    if (config.name.trim() && callbacks.onPublish) callbacks.onPublish();
  });

  return panel;
}

/** Escapes HTML entities */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Escapes a string for use in an HTML attribute */
function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run dev`
Expected: No import/syntax errors. The function is exported but not yet called.

- [ ] **Step 3: Commit**

```bash
git add src/report-configure.js
git commit -m "feat: build Configure mode UI with all five tabs"
```

---

### Task 5: Build the Publish mode UI

**Files:**
- Modify: `src/report-configure.js`

Add `buildPublishMode(config, callbacks)` that returns the Publish mode DOM element. Callbacks: `{ onBack, onPublish, onClose, onViewLibrary }`.

- [ ] **Step 1: Add buildPublishMode function to report-configure.js**

After `buildConfigureMode`, add:

```javascript
/**
 * Builds the Publish mode panel.
 * @param {Object} config - Report configuration state object
 * @param {Object} callbacks - { onBack, onPublish, onClose, onViewLibrary }
 * @returns {HTMLElement}
 */
export function buildPublishMode(config, callbacks) {
  const panel = document.createElement('div');
  panel.className = 'publish-panel';

  // === Header ===
  const header = document.createElement('div');
  header.className = 'publish-header';
  header.innerHTML = `
    <div class="publish-report-name">${escapeHtml(config.name)}</div>
    <div class="publish-meta">
      ${config.category ? `<span class="publish-meta-badge">${escapeHtml(config.category)}</span>` : ''}
      ${config.template ? `<span class="publish-meta-badge"><forge-icon name="palette"></forge-icon> ${escapeHtml(config.template)}</span>` : ''}
      <span class="publish-meta-badge"><forge-icon name="database_outline"></forge-icon> ${escapeHtml(config.dataSource)}</span>
    </div>
  `;
  panel.appendChild(header);

  // === Body ===
  const body = document.createElement('div');
  body.className = 'publish-body';

  // --- Permissions section ---
  const permSection = document.createElement('div');
  permSection.className = 'publish-section';
  permSection.innerHTML = `
    <div class="publish-section-title">
      <forge-icon name="lock"></forge-icon>
      Permissions
    </div>
    <select class="publish-visibility-select">
      <option value="only-me" ${config.visibility === 'only-me' ? 'selected' : ''}>Only me (draft)</option>
      <option value="everyone" ${config.visibility === 'everyone' ? 'selected' : ''}>Everyone in my organization</option>
      <option value="specific-roles" ${config.visibility === 'specific-roles' ? 'selected' : ''}>Specific roles</option>
    </select>
    <div class="publish-roles-list" style="display:none;">
      <label class="publish-role-checkbox"><input type="checkbox" value="building-dept" /> Building Department</label>
      <label class="publish-role-checkbox"><input type="checkbox" value="planning-dept" /> Planning & Zoning</label>
      <label class="publish-role-checkbox"><input type="checkbox" value="finance-dept" /> Finance</label>
      <label class="publish-role-checkbox"><input type="checkbox" value="public-safety" /> Public Safety</label>
      <label class="publish-role-checkbox"><input type="checkbox" value="admin" /> Administrators</label>
    </div>
  `;
  body.appendChild(permSection);

  // Wire visibility select
  const visSelect = permSection.querySelector('.publish-visibility-select');
  const rolesList = permSection.querySelector('.publish-roles-list');
  visSelect.addEventListener('change', () => {
    config.visibility = visSelect.value;
    rolesList.style.display = visSelect.value === 'specific-roles' ? '' : 'none';
  });

  // Wire role checkboxes
  rolesList.addEventListener('change', () => {
    config.roles = Array.from(rolesList.querySelectorAll('input:checked')).map(cb => cb.value);
  });

  // --- Schedule section ---
  const schedSection = document.createElement('div');
  schedSection.className = 'publish-section';
  schedSection.innerHTML = `
    <div class="publish-schedule-toggle">
      <div class="publish-section-title" style="margin-bottom:0;">
        <forge-icon name="schedule"></forge-icon>
        Recurring Delivery
      </div>
      <forge-icon name="expand_more" class="schedule-expand-icon"></forge-icon>
    </div>
    <div class="publish-schedule-fields">
      <div class="publish-schedule-row">
        <label>Frequency</label>
        <select class="schedule-frequency">
          <option value="daily">Daily</option>
          <option value="weekly" selected>Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div class="publish-schedule-row">
        <label>Day</label>
        <select class="schedule-day">
          <option>Monday</option>
          <option>Tuesday</option>
          <option>Wednesday</option>
          <option>Thursday</option>
          <option>Friday</option>
        </select>
      </div>
      <div class="publish-schedule-row">
        <label>Time</label>
        <input type="time" value="08:00" class="schedule-time" />
      </div>
      <div class="publish-schedule-row">
        <label>Delivery</label>
        <select class="schedule-delivery">
          <option value="email">Email</option>
          <option value="in-app">In-app notification</option>
        </select>
      </div>
    </div>
  `;
  body.appendChild(schedSection);

  // Wire schedule toggle
  const schedToggle = schedSection.querySelector('.publish-schedule-toggle');
  const schedFields = schedSection.querySelector('.publish-schedule-fields');
  const schedIcon = schedSection.querySelector('.schedule-expand-icon');
  let scheduleEnabled = false;

  schedToggle.addEventListener('click', () => {
    scheduleEnabled = !scheduleEnabled;
    schedFields.classList.toggle('open');
    schedIcon.style.transform = scheduleEnabled ? 'rotate(180deg)' : '';
    schedIcon.style.transition = 'transform 0.2s ease';
    if (!scheduleEnabled) {
      config.schedule = null;
    } else {
      config.schedule = {
        frequency: schedSection.querySelector('.schedule-frequency').value,
        day: schedSection.querySelector('.schedule-day').value,
        time: schedSection.querySelector('.schedule-time').value,
        delivery: schedSection.querySelector('.schedule-delivery').value,
      };
    }
  });

  // Wire schedule field changes
  schedFields.addEventListener('change', () => {
    if (scheduleEnabled) {
      config.schedule = {
        frequency: schedSection.querySelector('.schedule-frequency').value,
        day: schedSection.querySelector('.schedule-day').value,
        time: schedSection.querySelector('.schedule-time').value,
        delivery: schedSection.querySelector('.schedule-delivery').value,
      };
    }
  });

  panel.appendChild(body);

  // === Footer ===
  const footer = document.createElement('div');
  footer.className = 'configure-footer';
  footer.innerHTML = `
    <button class="configure-footer-back" type="button">
      <forge-icon name="arrow_back"></forge-icon>
      Back to Configure
    </button>
    <button class="configure-footer-primary" type="button">
      <forge-icon name="publish"></forge-icon>
      Publish to Library
    </button>
  `;
  panel.appendChild(footer);

  footer.querySelector('.configure-footer-back').addEventListener('click', () => {
    if (callbacks.onBack) callbacks.onBack();
  });

  footer.querySelector('.configure-footer-primary').addEventListener('click', () => {
    // Show confirmation
    showPublishConfirmation(panel, config, callbacks);
  });

  return panel;
}

/**
 * Replaces the publish panel content with a success confirmation.
 */
function showPublishConfirmation(panel, config, callbacks) {
  panel.innerHTML = '';
  const confirmation = document.createElement('div');
  confirmation.className = 'publish-confirmation';
  confirmation.innerHTML = `
    <div class="publish-confirmation-icon">
      <forge-icon name="check_circle"></forge-icon>
    </div>
    <div class="publish-confirmation-title">Report published</div>
    <div class="publish-confirmation-name">${escapeHtml(config.name)}</div>
    <div class="publish-confirmation-actions">
      <button class="publish-confirmation-btn secondary" type="button" data-action="close">Close</button>
      <button class="publish-confirmation-btn primary" type="button" data-action="library">View in Library</button>
    </div>
  `;
  panel.appendChild(confirmation);

  confirmation.querySelector('[data-action="close"]').addEventListener('click', () => {
    if (callbacks.onClose) callbacks.onClose();
  });

  confirmation.querySelector('[data-action="library"]').addEventListener('click', () => {
    if (callbacks.onViewLibrary) callbacks.onViewLibrary();
  });
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run dev`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/report-configure.js
git commit -m "feat: build Publish mode UI with permissions, schedule, and confirmation"
```

---

### Task 6: Modify Explore mode and wire all three modes together

**Files:**
- Modify: `src/chat-flow.js` (lines ~1412-1600 and ~1239-1366)

This is the integration task. Changes:
1. Import `report-configure.js` functions at the top
2. Update `buildReportPanel()` to remove "Save to Library" from dropdown, add "Configure as Report" button
3. Wire the "Configure as Report" button to create a report config and transition the right panel to Configure mode
4. Wire Configure → Publish and Publish → back transitions
5. Post-publish: send a system chat message to the left panel

- [ ] **Step 1: Add imports at the top of chat-flow.js**

At the top of `src/chat-flow.js` (after the existing imports, around line 9), add:

```javascript
import { createReportConfig, transitionMode, buildConfigureMode, buildPublishMode } from './report-configure.js';
```

- [ ] **Step 2: Remove "Save to Library" from the Actions dropdown in buildReportPanel**

In `buildReportPanel()` (around line 1484-1490), delete the Save to Library button:

```html
          <button class="canvas-dropdown-item" type="button" data-action="save">
            <div class="dropdown-item-row">
              <forge-icon name="save"></forge-icon>
              <span class="dropdown-item-label">Save to Library</span>
            </div>
            <span class="dropdown-item-desc">Add to your saved reports</span>
          </button>
```

- [ ] **Step 3: Add "Configure as Report" button to the action bar**

In `buildReportPanel()`, after the `.report-action-bar-right` div's closing tag but still inside `actionBar.innerHTML`, add the button. Specifically, change the `report-action-bar-right` div to include both the Actions dropdown and the new button:

Replace the closing of `report-action-bar-right`:

```javascript
    <div class="report-action-bar-right">
      <div class="canvas-action-group">
        <!-- existing Actions dropdown stays -->
      </div>
      <button class="configure-report-btn" type="button">
        <forge-icon name="tune"></forge-icon>
        Configure as Report
      </button>
    </div>
```

- [ ] **Step 4: Wire the "Configure as Report" button**

In the `requestAnimationFrame` callback inside `buildReportPanel()` (after the existing event wiring, around line 1597), add:

```javascript
    // Wire "Configure as Report" button
    const configureBtn = panel.querySelector('.configure-report-btn');
    if (configureBtn) {
      configureBtn.addEventListener('click', () => {
        const rightPanel = panel.parentElement; // the forge-split-view-panel or container
        const config = createReportConfig(suggestion);
        enterConfigureMode(rightPanel, config, suggestion);
      });
    }
```

- [ ] **Step 5: Add the mode orchestration function**

After `buildReportPanel()` and before `closeAllDropdowns()`, add these orchestration functions:

```javascript
/**
 * Enters Configure mode in the right panel.
 * @param {HTMLElement} rightPanel - The right panel container
 * @param {Object} config - Report configuration state
 * @param {Object} suggestion - Original suggestion for rebuilding Explore mode
 */
function enterConfigureMode(rightPanel, config, suggestion) {
  const configPanel = buildConfigureMode(config, {
    onBack: () => {
      // Go back to Explore mode
      const explorePanel = buildReportPanel(suggestion);
      transitionMode(rightPanel, explorePanel);
    },
    onPublish: () => {
      enterPublishMode(rightPanel, config, suggestion);
    },
  });
  transitionMode(rightPanel, configPanel);
}

/**
 * Enters Publish mode in the right panel.
 * @param {HTMLElement} rightPanel - The right panel container
 * @param {Object} config - Report configuration state
 * @param {Object} suggestion - Original suggestion for rebuilding Explore mode
 */
function enterPublishMode(rightPanel, config, suggestion) {
  const publishPanel = buildPublishMode(config, {
    onBack: () => {
      enterConfigureMode(rightPanel, config, suggestion);
    },
    onClose: () => {
      // Return to Explore mode
      const explorePanel = buildReportPanel(suggestion);
      transitionMode(rightPanel, explorePanel);
    },
    onViewLibrary: () => {
      // Stub: show brief feedback
      const explorePanel = buildReportPanel(suggestion);
      transitionMode(rightPanel, explorePanel);
    },
  });
  transitionMode(rightPanel, publishPanel);

  // Post a confirmation message in the chat panel
  const chatMessages = document.querySelector('#chat-messages');
  if (chatMessages) {
    // Will be posted after actual publish (handled inside buildPublishMode confirmation)
  }
}
```

- [ ] **Step 6: Add post-publish chat message**

In the `enterPublishMode` function's `onClose` and `onViewLibrary` callbacks, add a chat message after publish. Modify the Publish mode callbacks to post a system message when the publish confirmation is shown. Add this helper:

```javascript
/**
 * Posts a system message to the chat panel after report publication.
 */
function postPublishChatMessage(config) {
  const chatMessages = document.querySelector('#chat-messages');
  if (!chatMessages) return;
  const msg = document.createElement('forge-ai-response-message');
  msg.innerHTML = `
    <div style="font-size:14px;color:rgba(0,0,0,0.7);line-height:1.5;">
      <forge-icon name="check_circle" style="--forge-icon-font-size:16px;color:#4caf50;vertical-align:middle;margin-right:4px;"></forge-icon>
      Report <strong>"${config.name}"</strong> published to the library.
      ${config.visibility === 'only-me' ? '(Visible only to you — draft mode)' : ''}
    </div>
  `;
  chatMessages.appendChild(msg);
}
```

Then in the `showPublishConfirmation` callback wiring (inside `buildPublishMode` in `report-configure.js`), we need the publish action to call back. Update the `onClose` and `onViewLibrary` handlers in `enterPublishMode`:

Actually, the simplest approach: export `postPublishChatMessage` from `chat-flow.js` is circular. Instead, pass it as a callback. Update `enterPublishMode` to pass an `onPublished` callback:

```javascript
function enterPublishMode(rightPanel, config, suggestion) {
  const publishPanel = buildPublishMode(config, {
    onBack: () => {
      enterConfigureMode(rightPanel, config, suggestion);
    },
    onClose: () => {
      postPublishChatMessage(config);
      const explorePanel = buildReportPanel(suggestion);
      transitionMode(rightPanel, explorePanel);
    },
    onViewLibrary: () => {
      postPublishChatMessage(config);
      const explorePanel = buildReportPanel(suggestion);
      transitionMode(rightPanel, explorePanel);
    },
  });
  transitionMode(rightPanel, publishPanel);
}
```

- [ ] **Step 7: Verify the full flow works**

Run: `npm run dev`

1. Open the chat, ask a question, wait for the query card
2. Click "Explore Results" — split view opens with the report panel
3. Verify "Save to Library" is gone from the Actions dropdown
4. Verify "Configure as Report" button appears in the action bar
5. Click "Configure as Report" — right panel cross-fades to Configure mode
6. Verify all 5 tabs work: Query, Columns, Parameters, Template, Details
7. Edit the report name, click "Publish"
8. Verify Publish mode appears with Permissions and Schedule
9. Click "Publish to Library" — confirmation shows
10. Click "Close" — returns to Explore mode
11. Verify a system message appeared in the chat panel

Expected: Full Explore → Configure → Publish flow works within the right panel.

- [ ] **Step 8: Commit**

```bash
git add src/chat-flow.js
git commit -m "feat: wire Explore → Configure → Publish report workflow in split view"
```

---

### Task 7: Polish and edge cases

**Files:**
- Modify: `src/chat-flow.js`
- Modify: `src/report-configure.css`

Handle edge cases and visual polish.

- [ ] **Step 1: Ensure the "Configure as Report" button is also wired when rebuilding Explore mode after Back**

When `enterConfigureMode.onBack` rebuilds the Explore panel via `buildReportPanel(suggestion)`, the new panel's "Configure as Report" button needs re-wiring. The button is wired inside `buildReportPanel`'s `requestAnimationFrame` callback, but the `enterConfigureMode` function is defined outside. Ensure the wiring works by attaching the click handler after `transitionMode` completes.

Update the `onBack` handler in `enterConfigureMode`:

```javascript
onBack: () => {
  const explorePanel = buildReportPanel(suggestion);
  transitionMode(rightPanel, explorePanel);
  // Re-wire Configure button after transition
  setTimeout(() => {
    const newConfigBtn = explorePanel.querySelector('.configure-report-btn');
    if (newConfigBtn) {
      newConfigBtn.addEventListener('click', () => {
        const freshConfig = createReportConfig(suggestion);
        enterConfigureMode(rightPanel, freshConfig, suggestion);
      });
    }
  }, 250);
},
```

Do the same for the `onClose` and `onViewLibrary` callbacks in `enterPublishMode`.

- [ ] **Step 2: Add keyboard support for tags input**

In `buildConfigureMode`, the tags input already handles Enter. Add Backspace to remove the last tag:

After the existing `tagsField.addEventListener('keydown', ...)` handler, modify it to also handle Backspace:

```javascript
tagsField.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && tagsField.value.trim()) {
    e.preventDefault();
    config.tags.push(tagsField.value.trim());
    tagsField.value = '';
    renderTags();
  } else if (e.key === 'Backspace' && !tagsField.value && config.tags.length) {
    config.tags.pop();
    renderTags();
  }
});
```

- [ ] **Step 3: Test the back-and-forth transitions**

Run: `npm run dev`

1. Go through Explore → Configure → back to Explore
2. Click "Configure as Report" again — should work
3. Go Configure → Publish → back to Configure → back to Explore
4. Verify state is not lost during Configure → Publish → back to Configure

Expected: All transitions work smoothly. Configure state (name, template, etc.) is preserved when going back from Publish.

- [ ] **Step 4: Commit**

```bash
git add src/chat-flow.js src/report-configure.js src/report-configure.css
git commit -m "fix: re-wire Configure button after Back transitions, add tag backspace"
```

---

### Task 8: Final integration test

**Files:** None (testing only)

- [ ] **Step 1: Full end-to-end walkthrough**

Run: `npm run dev`

Complete walkthrough:
1. Homepage → Click a suggestion tile → Chat opens
2. Wait for query card to appear
3. Click "Explore Results" → Split view opens
4. In Explore mode: verify Actions dropdown has Export, Schedule, Share (no Save to Library)
5. Click "Configure as Report"
6. **Query tab:** Edit the SQL, click "Run Query" — see success feedback
7. **Columns tab:** Rename a column, toggle visibility off on one column
8. **Parameters tab:** Switch "District" to "Fixed", switch "Month" to "User-adjustable", edit default value
9. **Template tab:** Select "Justice & Public Safety" template — see it highlighted
10. **Details tab:** Enter a description, select "Building" category, add two tags
11. Expand "Data Preview" — verify table shows
12. Click "Publish"
13. **Publish mode:** Change visibility to "Everyone in my organization"
14. Expand "Recurring Delivery" — set to weekly, Monday, 8:00 AM
15. Click "Publish to Library"
16. Verify confirmation shows with checkmark and report name
17. Click "Close" — back to Explore mode
18. Verify chat panel has system message about published report
19. Chat panel should still accept input — type a question and verify it works

Expected: All steps complete without errors.

- [ ] **Step 2: Commit any final fixes if needed**

If any issues found during testing, fix and commit with descriptive message.

- [ ] **Step 3: Play completion sound**

```bash
afplay /System/Library/Sounds/Glass.aiff
```
