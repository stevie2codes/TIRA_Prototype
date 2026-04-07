# Standard Reports in Chat — Design Spec

## Overview

Add the ability for Tyler-published standard/canned reports to surface in the chat experience. Users can discover these reports contextually (AI recommends them when a query matches) or by browsing a library and clicking "Open in Chat." Reports open in the existing split-view layout with full filter/parameter controls and a saved view system.

## Goals

- Surface pre-built, production-ready standard reports inside the AI chat workflow
- Let users adjust filters/parameters and save named views on top of standard reports
- Maintain a linked relationship: saved views are filter deltas on a Tyler-maintained master report
- Two entry points converging on one unified experience

## Non-Goals

- No changes to the React report-canvas app — standard report viewing is handled entirely in the main vanilla JS app
- No modifications to existing mock-data.js suggestions — standard reports are a separate data layer
- No server-side persistence — prototype uses in-memory + sessionStorage for saved views

---

## Data Model

### Standard Report Definition (`standard-reports.js`)

Each standard report is a self-contained object:

```js
{
  id: 'quarterly-permit-summary',
  name: 'Quarterly Building Permit Summary',
  description: 'Permit counts, processing times, and revenue by district.',
  domain: 'permits-licensing',
  badge: 'Standard Report',
  freshness: 'Updated daily',

  parameters: [
    { id: 'quarter', label: 'Quarter', type: 'select',
      options: ['Q1 2026', 'Q4 2025', 'Q3 2025'], default: 'Q1 2026' },
    { id: 'district', label: 'District', type: 'select',
      options: ['All Districts', 'Downtown', 'Westside', 'Eastside'], default: 'All Districts' },
    { id: 'permitType', label: 'Permit Type', type: 'select',
      options: ['All Types', 'Residential', 'Commercial'], default: 'All Types' },
    { id: 'status', label: 'Status', type: 'select',
      options: ['All Statuses', 'Approved', 'Pending', 'Denied'], default: 'All Statuses' }
  ],

  sections: [
    { type: 'kpi-row', items: [
        { label: 'Total Permits', value: '847', color: 'primary' },
        { label: 'Avg Days to Process', value: '12.3', color: 'primary' },
        { label: 'Revenue', value: '$2.4M', color: 'success' }
    ]},
    { type: 'chart', chartType: 'bar', title: 'Permits by Month', dataKey: 'monthlyPermits' },
    { type: 'table', title: 'District Breakdown', dataKey: 'districtData' }
  ],

  data: {
    monthlyPermits: [...],
    districtData: [...]
  },

  matchKeywords: ['building permit', 'permit activity', 'permit summary', 'quarterly permits'],
  suggestions: [
    'Filter to my district', 'Show only residential',
    'Compare to last quarter', 'Add trend line'
  ]
}
```

### Saved View (`saved-views.js`)

Views store only the delta from the master report's defaults:

```js
{
  id: 'view-001',
  reportId: 'quarterly-permit-summary',
  name: 'My Q1 Downtown View',
  createdBy: 'sarah.webb',
  parameterOverrides: {
    district: 'Downtown',
    permitType: 'Residential'
  }
}
```

When a saved view is selected, the report renders with overrides applied on top of the master report's default parameter values. If Tyler updates the report structure (adds parameters, changes sections), saved views continue to work — unrecognized overrides are ignored, new parameters use their defaults.

### Prototype Sample Reports

Four standard reports to demonstrate the concept across domains:

1. **Quarterly Building Permit Summary** — Permits & Licensing
2. **Monthly Code Violation Trends** — Code Enforcement
3. **Budget vs. Actuals** — Financial Management
4. **Active Cases by Status** — Justice & Public Safety

---

## Chat Integration

### Matching Logic (`report-matcher.js`)

Before generating an ad-hoc query card response, the chat flow runs the user's query through a keyword matching step against all standard reports visible to the current user.

Matching compares the query against each report's `matchKeywords`, `name`, and `description`. A simple keyword overlap score produces a confidence level:

- **High confidence (>= 70%)** — AI responds with a Standard Report Card directly. No ad-hoc query card generated. Message: "I found a standard report that covers this exactly."
- **Medium confidence (40-69%)** — AI generates the normal ad-hoc query card, then appends a Standard Report Card below as a recommendation: "There's also a standard report that may be relevant."
- **Low confidence (< 40%)** — Normal ad-hoc flow. No mention of standard reports.

### Standard Report Card (`standard-report-card.js`)

A new chat card component, visually distinct from the existing query card:

- Indigo border (matches brand)
- "Standard Report" badge
- Report name, description, domain, freshness
- Metadata chips: parameter count, section count, data freshness
- Single primary action: **"Open Report"** button
- Clicking "Open Report" triggers the split-view transition

### Entry Point: Library "Open in Chat"

When clicked from the Standard Reports library:

1. Opens the chat dialog
2. Inserts a system message: "Opened standard report: [Report Name]"
3. Immediately transitions to split-view — no intermediate chat step

Both entry points (contextual match and library browse) converge on the same split-view experience.

---

## Split-View Experience

### Left Panel: Chat

- AI summary of the report's current state (active filters, key takeaways from the data)
- Suggestion chips from the report's `suggestions` array
- Full chat input for conversational refinement ("show me just Q1", "filter to my district")
- When AI processes a filter change request, it updates the parameter state on the right panel and confirms: "Filtered to Downtown. Permits dropped from 847 to 234."
- Chat history persists in the session

### Right Panel: Standard Report Viewer (`standard-report-viewer.js`)

- **Header bar**: Report title + "Standard" badge + View dropdown + Save View button
- **Filter bar**: Renders from the report's `parameters` array as native Forge form controls. Changing a filter updates the report immediately.
- **Report body**: Renders from the report's `sections` array in order. Section type renderers:
  - `kpi-row`: Horizontal row of metric cards
  - `chart`: Bar/line chart (using simple CSS/SVG for the prototype)
  - `table`: Forge table component with sortable columns
- **View dropdown**: Lists "Default" plus all saved views for this report. Selecting a view applies `parameterOverrides` to the filter bar and re-renders.

### Bidirectional Filter Sync

Chat and filter bar share a single parameter state object:

- User changes a filter dropdown on the right → chat receives a message confirming the change, AI updates its summary
- User asks AI to change a filter on the left → filter dropdown on the right updates to reflect the change
- Both paths write to the same state, keeping everything in sync

### Save View Flow

1. User adjusts filters to desired state
2. Clicks "Save View" button
3. Small dialog/popover asks for a view name
4. Saves to the saved-views store (in-memory + sessionStorage for prototype persistence across navigations)
5. New view appears in the view dropdown immediately
6. View is accessible anytime the user opens this standard report

---

## Library Integration

### Side Menu Update (`tira-view.js`)

The TIRA side menu Library section gains a new entry:

- **Standard Reports** | Templates | Data Sources

### Library View

When "Standard Reports" is clicked, the main content area shows:

- List of standard reports grouped by domain
- Each row: report name, domain, freshness, parameter count
- Actions per report: **Preview** (quick inline look) and **Open in Chat** (launches split-view)
- Saved view indicator if the user has views on that report (e.g., "2 saved views")
- Filtered by department visibility via `user-context.js` — users only see reports relevant to their role

---

## Module Summary

### New Modules (5)

| Module | Purpose |
|--------|---------|
| `src/standard-reports.js` | Report definitions: metadata, parameters, sections, data, match keywords, suggestions |
| `src/saved-views.js` | View store: CRUD for named parameter overrides per report. In-memory + sessionStorage |
| `src/report-matcher.js` | Keyword matching engine: scores user queries against standard reports, returns confidence + matches |
| `src/standard-report-viewer.js` | Right-panel renderer: filter bar, view dropdown, section renderers, save view dialog |
| `src/standard-report-card.js` | Chat card component: "Standard Report" badge, description, Open Report button |

### Modified Modules (3)

| Module | Changes |
|--------|---------|
| `src/chat-flow.js` | Add matching step before ad-hoc response. Render standard report card at high/medium confidence. Handle "Open Report" → split-view with StandardReportViewer |
| `src/views/tira-view.js` | Add "Standard Reports" to side menu Library section. Render library list view in main content area |
| `src/user-context.js` | Add mapping of data sources → available standard reports (department-based visibility) |

### Unchanged

| Module | Rationale |
|--------|-----------|
| `report-canvas/` (React app) | Stays as the deep-edit designer. Standard report viewing is in the main app. |
| `src/mock-data.js` | Existing suggestions unchanged. Standard reports are a separate concept. |
| `src/output-templates.js` | Output templates are for report-canvas styling. Standard reports have their own rendering. |
