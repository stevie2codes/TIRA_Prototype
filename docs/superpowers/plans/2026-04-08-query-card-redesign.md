# Query Card Redesign — Artifact + Data Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current query card (forge-card with expansion panels) with a `forge-ai-artifact` shell containing a tab bar (Data Preview | SQL Query | Transparency) where the Data Preview tab uses `forge-ai-tool-data-table`.

**Architecture:** The `buildQueryCard()` function in `chat-flow.js` will be rewritten to produce a `forge-ai-artifact` with a `forge-tab-bar` for content switching. The Data Preview tab embeds `forge-ai-tool-data-table` with its outer border suppressed via CSS. The SQL and Transparency tabs are custom panels. The expansion panels are removed entirely.

**Tech Stack:** `@tylertech/forge` (tab-bar, tab), `@tylertech/forge-ai` (ai-artifact, ai-tool-data-table, ai-paginator), vanilla JS, CSS.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/main.js` | Modify | Register `forge-tab-bar`/`forge-tab` components and import `forge-ai-artifact`/`forge-ai-tool-data-table` |
| `src/chat-flow.js` | Modify | Rewrite `buildQueryCard()` and simplify `wireQueryCard()` |
| `src/chat-flow.css` | Modify | Replace `.qc-disclosure*` styles with tab and artifact styles |

---

### Task 1: Register New Components

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Add tab-bar imports to main.js**

In `src/main.js`, add the tab-bar component imports to the existing Forge import block (line 7-28):

```js
// Add to the existing import block from '@tylertech/forge':
  defineTabBarComponent,
  defineTabComponent,
```

Then call the define functions after the existing defines (after line 112):

```js
defineTabBarComponent();
defineTabComponent();
```

- [ ] **Step 2: Add forge-ai artifact and data-table imports**

At the bottom of the forge-ai imports section (after line 185), add:

```js
import '@tylertech/forge-ai/ai-artifact';
import '@tylertech/forge-ai/tools';
```

- [ ] **Step 3: Verify dev server starts without errors**

Run: `npm run dev`
Expected: Dev server starts, no console errors about missing component definitions.

- [ ] **Step 4: Commit**

```bash
git add src/main.js
git commit -m "Register forge-tab-bar, forge-tab, forge-ai-artifact, and forge-ai data-table components"
```

---

### Task 2: Rewrite `buildQueryCard()` in chat-flow.js

**Files:**
- Modify: `src/chat-flow.js:287-461`

The current `buildQueryCard()` returns HTML using `forge-card` with expansion panels. Replace it with `forge-ai-artifact` + `forge-tab-bar` + `forge-ai-tool-data-table`.

- [ ] **Step 1: Replace the `buildQueryCard` function**

Replace the entire `buildQueryCard` function (lines 287-461) with:

```js
function buildQueryCard(suggestion) {
  const uid = ++qcIdCounter;
  const t = suggestion.transparency;
  const totalRows = suggestion.data ? suggestion.data.length : 0;
  const totalCols = suggestion.columns ? suggestion.columns.length : 0;

  // Build transparency content (consolidated: Data Source + Assumptions + Citations)
  let transparencyHtml = '';
  if (t) {
    const assumptionsList = t.assumptions.map(a => `<li>${a}</li>`).join('');
    const citationsList = t.citations.map(c =>
      `<div class="qc-citation-item">
        <span class="qc-citation-label">${c.label}</span>
        <span class="qc-citation-detail">${c.detail}</span>
      </div>`
    ).join('');

    transparencyHtml = `
      <div class="qc-transparency-section">
        <div class="qc-transparency-group">
          <div class="qc-transparency-group-title">
            <forge-icon name="database_outline"></forge-icon>
            Data Source
          </div>
          <div class="qc-info-row"><span class="qc-info-label">Source</span><span class="qc-info-value">${t.dataSourceDetail}</span></div>
          <div class="qc-info-row"><span class="qc-info-label">System</span><span class="qc-info-value">${t.system}</span></div>
          <div class="qc-info-row"><span class="qc-info-label">Total Records</span><span class="qc-info-value">${t.totalRecords}</span></div>
          <div class="qc-info-row"><span class="qc-info-label">Last Updated</span><span class="qc-info-value">${t.lastUpdated}</span></div>
        </div>
        ${t.assumptions.length ? `
        <div class="qc-transparency-group">
          <div class="qc-transparency-group-title">
            <forge-icon name="info_outline"></forge-icon>
            Assumptions (${t.assumptions.length})
          </div>
          <ul class="qc-assumptions-list">${assumptionsList}</ul>
        </div>` : ''}
        ${t.citations.length ? `
        <div class="qc-transparency-group">
          <div class="qc-transparency-group-title">
            <forge-icon name="link"></forge-icon>
            Data Citations (${t.citations.length})
          </div>
          ${citationsList}
        </div>` : ''}
      </div>
    `;
  }

  // Preview columns/rows for the "more" link
  const previewCols = 4;
  const previewRows = 3;
  const moreCols = totalCols > previewCols ? totalCols - previewCols : 0;
  const moreRows = totalRows > previewRows ? totalRows - previewRows : 0;

  return `
    <div class="qc-summary">
      ${markdownToHtml(suggestion.aiSummary)}
    </div>

    ${buildRefinementChips(suggestion)}

    <forge-ai-artifact class="query-card" id="qc-artifact-${uid}">
      <span slot="start" class="qc-title">${suggestion.reportTitle}</span>
      <div slot="actions" class="qc-header-actions">
        <forge-icon-button density="small" class="copy-summary-btn" type="button" aria-label="Copy summary">
          <forge-icon name="content_copy"></forge-icon>
        </forge-icon-button>
      </div>

      <div class="qc-meta-row">
        <span class="qc-meta-item">
          <forge-icon name="database_outline"></forge-icon>
          ${suggestion.dataSource}
        </span>
        <span class="qc-meta-dot"></span>
        <span class="qc-meta-item qc-freshness">
          <span class="qc-freshness-dot"></span>
          ${suggestion.freshness}
        </span>
        <span class="qc-meta-dot"></span>
        <span class="qc-meta-item">${totalRows} rows · ${totalCols} columns</span>
      </div>

      <forge-tab-bar class="qc-tab-bar" active-tab="0" clustered>
        <forge-tab>Data Preview</forge-tab>
        <forge-tab>SQL Query</forge-tab>
        <forge-tab>Transparency details</forge-tab>
      </forge-tab-bar>

      <div class="qc-tab-panels">
        <!-- Data Preview tab -->
        <div class="qc-tab-panel qc-tab-panel--active" data-tab="0">
          <forge-ai-tool-data-table class="qc-data-table"></forge-ai-tool-data-table>
          ${moreRows > 0 || moreCols > 0 ? `
          <div class="qc-preview-more">
            ${moreRows > 0 ? `${moreRows} more rows` : ''}${moreRows > 0 && moreCols > 0 ? ' · ' : ''}${moreCols > 0 ? `${moreCols} more columns` : ''}
          </div>` : ''}
        </div>

        <!-- SQL Query tab -->
        <div class="qc-tab-panel" data-tab="1">
          <div class="qc-sql-panel">
            <pre class="qc-sql-code"><code>${suggestion.sqlCode}</code></pre>
            <div class="qc-sql-actions">
              <forge-button variant="outlined" dense class="copy-sql-btn" type="button">
                <forge-icon slot="start" name="content_copy"></forge-icon>
                Copy SQL
              </forge-button>
            </div>
          </div>
        </div>

        <!-- Transparency details tab -->
        <div class="qc-tab-panel" data-tab="2">
          ${transparencyHtml}
        </div>
      </div>

      <div class="qc-actions">
        <forge-button variant="raised" class="qc-open-report-btn" id="open-report-btn" type="button">
          <forge-icon slot="start" name="insert_chart"></forge-icon>
          Explore Results In-Depth
        </forge-button>
      </div>
    </forge-ai-artifact>
  `;
}
```

- [ ] **Step 2: Verify the HTML renders (visual check)**

Run: `npm run dev`, open the app, trigger a chat flow.
Expected: The query card renders with the artifact shell, tab bar visible. Data table may not show data yet (wired in next task).

- [ ] **Step 3: Commit**

```bash
git add src/chat-flow.js
git commit -m "Rewrite buildQueryCard to use forge-ai-artifact with tab bar layout"
```

---

### Task 3: Rewrite `wireQueryCard()` to Wire Tabs and Data Table

**Files:**
- Modify: `src/chat-flow.js:468-505`

- [ ] **Step 1: Replace the `wireQueryCard` function**

Replace the entire `wireQueryCard` function (lines 468-505) with:

```js
function wireQueryCard(responseMsg, container, suggestion, dialog) {
  // --- Wire forge-ai-tool-data-table ---
  const dataTable = responseMsg.querySelector('.qc-data-table');
  if (dataTable && suggestion.columns && suggestion.data) {
    const previewCols = suggestion.columns.slice(0, 4);
    const previewRows = suggestion.data.slice(0, 3);
    dataTable.toolCall = {
      id: 'query-card-table',
      name: 'data_table',
      args: {
        headers: previewCols.map(c => c.header),
        rows: previewRows.map(row => previewCols.map(c => row[c.property] ?? '')),
        maxNumberOfRows: 10,
      },
    };
  }

  // --- Wire tab switching ---
  const tabBar = responseMsg.querySelector('.qc-tab-bar');
  const panels = responseMsg.querySelectorAll('.qc-tab-panel');
  if (tabBar && panels.length) {
    tabBar.addEventListener('forge-tab-bar-change', (e) => {
      const idx = e.detail.index;
      panels.forEach(p => p.classList.remove('qc-tab-panel--active'));
      const target = responseMsg.querySelector(`.qc-tab-panel[data-tab="${idx}"]`);
      if (target) target.classList.add('qc-tab-panel--active');
    });
  }

  // --- Wire Copy SQL ---
  const copyBtn = responseMsg.querySelector('.copy-sql-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sql = responseMsg.querySelector('.qc-sql-code code')?.textContent;
      if (sql) {
        navigator.clipboard.writeText(sql).then(() => {
          copyBtn.innerHTML = '<forge-icon slot="start" name="check"></forge-icon> Copied!';
          setTimeout(() => {
            copyBtn.innerHTML = '<forge-icon slot="start" name="content_copy"></forge-icon> Copy SQL';
          }, 2000);
        });
      }
    });
  }

  // --- Wire Copy Summary ---
  const copySummaryBtn = responseMsg.querySelector('.copy-summary-btn');
  if (copySummaryBtn) {
    copySummaryBtn.addEventListener('click', () => {
      const summaryText = responseMsg.querySelector('.qc-summary')?.textContent?.trim();
      if (summaryText) {
        navigator.clipboard.writeText(summaryText).then(() => {
          const icon = copySummaryBtn.querySelector('forge-icon');
          if (icon) {
            icon.name = 'check';
            setTimeout(() => { icon.name = 'content_copy'; }, 2000);
          }
        });
      }
    });
  }

  // --- Wire refinement chips ---
  wireRefinementChips(responseMsg, container, suggestion, dialog);
}
```

- [ ] **Step 2: Verify data table and tabs work**

Run: `npm run dev`, trigger a chat flow.
Expected: Data Preview tab shows the table with 3 rows and 4 columns. Clicking "SQL Query" tab shows the SQL code. Clicking "Transparency details" shows consolidated info. Copy buttons work.

- [ ] **Step 3: Commit**

```bash
git add src/chat-flow.js
git commit -m "Wire tab switching, data-table toolCall, and copy actions for query card"
```

---

### Task 4: Update `collapseQueryCard()` for New Structure

**Files:**
- Modify: `src/chat-flow.js:664-693`

The collapse function references `.query-card` (now on `forge-ai-artifact` instead of `forge-card`) and old selectors. Update it.

- [ ] **Step 1: Update `collapseQueryCard`**

Replace the `collapseQueryCard` function with:

```js
function collapseQueryCard(card) {
  if (!card || card.classList.contains('qc-collapsed')) return;
  card.classList.add('qc-collapsed');

  const title = card.querySelector('.qc-title')?.textContent || 'Previous result';
  const meta = card.querySelector('.qc-meta-row');
  const metaText = meta ? meta.textContent.trim().replace(/\s+/g, ' ') : '';

  const collapsed = document.createElement('div');
  collapsed.className = 'qc-collapsed-bar';
  collapsed.innerHTML = `
    <span class="qc-collapsed-accent"></span>
    <span class="qc-collapsed-title">${title}</span>
    <span class="qc-collapsed-meta">${metaText}</span>
    <forge-icon name="expand_more" class="qc-collapsed-expand"></forge-icon>
  `;
  card.prepend(collapsed);

  collapsed.addEventListener('click', () => {
    card.classList.remove('qc-collapsed');
    collapsed.remove();
  });
}
```

- [ ] **Step 2: Update the collapse selector in `simulateRefinement`**

In `simulateRefinement` (around line 890), the selector `'.query-card:not(.qc-collapsed)'` should still work since we keep `class="query-card"` on the artifact. Verify this selector matches `forge-ai-artifact.query-card`. If not, update to:

```js
container.querySelectorAll('forge-ai-artifact.query-card:not(.qc-collapsed)').forEach(card => {
  collapseQueryCard(card);
});
```

- [ ] **Step 3: Commit**

```bash
git add src/chat-flow.js
git commit -m "Update collapseQueryCard for forge-ai-artifact structure"
```

---

### Task 5: Replace Query Card CSS Styles

**Files:**
- Modify: `src/chat-flow.css`

Replace the expansion-panel disclosure styles with tab-based styles and artifact overrides.

- [ ] **Step 1: Find and replace the query card CSS block**

Locate the query card styles starting at the `.qc-header` rule (around line 2112). Replace everything from `.qc-header` through `.qc-collapsed-bar:hover .qc-collapsed-expand` with the new styles below.

Remove these style blocks entirely (they are no longer needed):
- `.qc-header` through `.qc-header-actions forge-icon-button:hover`
- `.qc-disclosure*` (all disclosure-related rules)
- `forge-card.query-card*` (the old forge-card rules)

Add these new styles:

```css
/* ========================================
   Query Card — Artifact Shell
   ======================================== */

forge-ai-artifact.query-card {
  max-width: 720px;
  margin-top: 8px;
}

/* Suppress nested artifact border inside data-table */
forge-ai-artifact.query-card forge-ai-tool-data-table {
  --forge-ai-artifact-content-padding: 0;
}
forge-ai-artifact.query-card forge-ai-tool-data-table::part(container) {
  border: none;
}
forge-ai-artifact.query-card .qc-data-table {
  border: none;
  box-shadow: none;
}

/* Title in artifact toolbar */
forge-ai-artifact.query-card .qc-title {
  font-weight: 600;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.87);
}

/* Header actions (copy button) */
forge-ai-artifact.query-card .qc-header-actions {
  display: flex;
  align-items: center;
}

/* ========================================
   Metadata Row
   ======================================== */

.qc-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 0 12px 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.54);
  flex-wrap: wrap;
}

.qc-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.qc-meta-item forge-icon {
  --forge-icon-font-size: 14px;
  color: rgba(0, 0, 0, 0.4);
}

.qc-meta-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.qc-freshness {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.qc-freshness-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4caf50;
  flex-shrink: 0;
}

/* ========================================
   Tab Bar
   ======================================== */

.qc-tab-bar {
  --forge-tab-bar-divider-color: rgba(0, 0, 0, 0.08);
  margin-bottom: 0;
}

/* ========================================
   Tab Panels
   ======================================== */

.qc-tab-panels {
  min-height: 80px;
}

.qc-tab-panel {
  display: none;
}

.qc-tab-panel--active {
  display: block;
}

/* ========================================
   Data Preview Tab
   ======================================== */

.qc-preview-more {
  padding: 10px 16px;
  font-size: 13px;
  color: var(--forge-theme-primary, #3f51b5);
  cursor: pointer;
  font-weight: 500;
}

.qc-preview-more:hover {
  text-decoration: underline;
}

/* ========================================
   SQL Query Tab
   ======================================== */

.qc-sql-panel {
  padding: 12px 0;
}

.qc-sql-code {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  margin: 0 0 12px 0;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.qc-sql-code code {
  font-family: 'Roboto Mono', monospace;
  white-space: pre;
}

.qc-sql-actions {
  display: flex;
  gap: 8px;
}

/* ========================================
   Transparency Tab (Consolidated)
   ======================================== */

.qc-transparency-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 0;
}

.qc-transparency-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qc-transparency-group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(0, 0, 0, 0.5);
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.qc-transparency-group-title forge-icon {
  --forge-icon-font-size: 14px;
  color: rgba(0, 0, 0, 0.4);
}

.qc-info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}

.qc-info-label {
  color: rgba(0, 0, 0, 0.5);
  font-weight: 500;
}

.qc-info-value {
  color: rgba(0, 0, 0, 0.87);
  text-align: right;
}

.qc-assumptions-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.6;
}

.qc-citation-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}

.qc-citation-label {
  color: rgba(0, 0, 0, 0.87);
  font-weight: 500;
}

.qc-citation-detail {
  color: rgba(0, 0, 0, 0.5);
  text-align: right;
}

/* ========================================
   Actions Row
   ======================================== */

.qc-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}

forge-button.qc-open-report-btn {
  --forge-button-primary-color: var(--forge-theme-primary, #3f51b5);
}

/* ========================================
   Summary (above card, unchanged)
   ======================================== */

.qc-summary {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.8);
  margin-bottom: 12px;
}

.qc-summary p { margin: 0 0 8px; }
.qc-summary p:last-child { margin-bottom: 0; }
.qc-summary ul { margin: 8px 0; padding-left: 20px; }
.qc-summary li { margin-bottom: 4px; }
.qc-summary strong { color: rgba(0, 0, 0, 0.87); }

/* ========================================
   Refinement Row (unchanged)
   ======================================== */

.qc-refinement-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

/* ========================================
   Collapsed State
   ======================================== */

forge-ai-artifact.query-card.qc-collapsed {
  max-height: 48px;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

forge-ai-artifact.query-card.qc-collapsed:hover {
  opacity: 1;
}

.qc-collapsed-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
}

.qc-collapsed-accent {
  width: 3px;
  height: 20px;
  border-radius: 2px;
  background: var(--forge-theme-primary, #3f51b5);
  flex-shrink: 0;
}

.qc-collapsed-title {
  font-weight: 600;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qc-collapsed-meta {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: auto;
}

.qc-collapsed-expand {
  --forge-icon-font-size: 18px;
  color: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

/* ========================================
   Split view overrides
   ======================================== */

.split-chat-messages .qc-meta-row {
  flex-wrap: wrap;
}
```

- [ ] **Step 2: Remove old disclosure/expansion-panel styles**

Make sure the following old style blocks are removed from `chat-flow.css`:
- All `.qc-disclosure*` rules
- All `forge-card.query-card*` rules (replaced by `forge-ai-artifact.query-card`)
- `.qc-mini-table*` rules (replaced by data-table component)
- `.qc-header` through `.qc-header-actions` (now handled by artifact toolbar)
- `.qc-meta-pipe` rules (replaced by `.qc-meta-dot`)

Keep: `.qc-summary`, `.qc-refinement-row` styles if not already included in the new block above.

- [ ] **Step 3: Verify visual appearance**

Run: `npm run dev`, trigger a chat flow.
Expected: The query card looks like the design screenshot — artifact border, title in toolbar, metadata row with dots, tab bar with underline indicator, data table in preview tab, "Explore Results In-Depth" button at bottom.

- [ ] **Step 4: Commit**

```bash
git add src/chat-flow.css
git commit -m "Replace query card CSS: remove expansion panels, add artifact/tab/data-table styles"
```

---

### Task 6: Verify Refinement and Collapse Flows

**Files:**
- No new changes expected — this is verification and bug-fixing.

- [ ] **Step 1: Test refinement chip flow**

1. Open chat, trigger a suggestion
2. Click a refinement chip (e.g. "Break down by permit type")
3. Verify: previous query card collapses, new query card renders with artifact shell and tabs
4. Verify: new card's Data Preview tab shows data, tabs switch, copy works

- [ ] **Step 2: Test "Explore Results In-Depth" button**

1. Click "Explore Results In-Depth" on a query card
2. Verify: split view opens with report panel on the right
3. Close the canvas, verify the button reappears

- [ ] **Step 3: Test collapsed card expand**

1. After a refinement, click the collapsed previous card
2. Verify: it expands back to full view with tabs working

- [ ] **Step 4: Fix any issues found and commit**

```bash
git add -u
git commit -m "Fix query card redesign integration issues"
```

---

### Task 7: Clean Up Dead Code

**Files:**
- Modify: `src/chat-flow.js`

- [ ] **Step 1: Remove unused `buildTransparencyPanel` function**

The `buildTransparencyPanel` function (around line 510-584) and `wireTransparencyToggle` function (around line 598-635) are no longer used by the query card. Check if they're used elsewhere:

```bash
grep -n 'buildTransparencyPanel\|wireTransparencyToggle' src/chat-flow.js
```

If only defined but never called, remove both functions.

- [ ] **Step 2: Remove unused CSS for old transparency panel**

Check if `.transparency-toggle`, `.transparency-panel`, `.transparency-section`, `.transparency-section-header`, `.transparency-section-body`, `.transparency-row` styles are still used. If not, remove them from `chat-flow.css`.

- [ ] **Step 3: Commit**

```bash
git add src/chat-flow.js src/chat-flow.css
git commit -m "Remove unused transparency panel and disclosure code"
```
