# Standard Reports in Chat — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Tyler-published standard reports that surface in the AI chat experience via contextual matching or library browsing, with a split-view report viewer and saved view system.

**Architecture:** Extend the existing vanilla JS main app with 5 new modules (standard-reports.js, saved-views.js, report-matcher.js, standard-report-viewer.js, standard-report-card.js) and modify 3 existing modules (chat-flow.js, tira-view.js, user-context.js). No changes to the React report-canvas app.

**Tech Stack:** Vanilla JS, Forge web components (`<forge-table>`, `<forge-select>`, `<forge-button>`, `<forge-dialog>`, `<forge-chip>`), Forge AI chat components, CSS custom properties for theming.

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `src/standard-reports.js` | Standard report definitions (4 reports) with metadata, parameters, sections, data, match keywords, suggestions. Exports `standardReports` array and `getStandardReportById(id)` helper. |
| `src/saved-views.js` | In-memory + sessionStorage CRUD for saved views. Exports `getViewsForReport(reportId)`, `saveView(reportId, name, overrides)`, `deleteView(viewId)`, `applyView(report, view)`. |
| `src/report-matcher.js` | Keyword matching engine. Exports `matchStandardReports(query, visibleReports)` returning `{ confidence, report }` sorted by score. |
| `src/standard-report-viewer.js` | Right-panel renderer for split-view. Exports `buildStandardReportPanel(report, options)` and `wireStandardReportPanel(panel, report, callbacks)`. Renders filter bar, view dropdown, KPI rows, charts, tables. |
| `src/standard-report-card.js` | Chat card for standard report recommendations. Exports `buildStandardReportCard(report, confidence)` returning HTML string. |
| `src/standard-report-viewer.css` | Styles for the report viewer panel (filter bar, KPI cards, section layout, view dropdown). |
| `src/standard-report-card.css` | Styles for the standard report chat card (indigo border, badge, metadata chips). |

### Modified Files

| File | Changes |
|------|---------|
| `src/chat-flow.js` | Add import of report-matcher and standard-report-card. In `runConversation()`, call matcher before building query card. Add `openStandardReport(report, dialog)` function for split-view with StandardReportViewer. |
| `src/views/tira-view.js` | Add "Standard Reports" menu item to side menu Library section. Add `renderStandardReportsLibrary()` function for library list view. Wire "Open in Chat" buttons. |
| `src/user-context.js` | Add `getVisibleStandardReports(user)` function that filters standard reports by department/domain visibility. Add domain-to-department mapping. |
| `src/main.js` | Register any additional Forge components needed (forge-select if not already registered). Add `?state=standard-report` query param handler. |

---

## Task 1: Standard Report Definitions (`standard-reports.js`)

**Files:**
- Create: `src/standard-reports.js`

This is the data foundation. All other modules depend on it.

- [ ] **Step 1: Create the standard reports data module**

Create `src/standard-reports.js` with 4 complete report definitions. Each report has: id, name, description, domain, badge, freshness, parameters (with type/options/default), sections (kpi-row, chart, table), data, matchKeywords, and suggestions.

```js
// src/standard-reports.js

export const standardReports = [
  {
    id: 'quarterly-permit-summary',
    name: 'Quarterly Building Permit Summary',
    description: 'Permit counts, processing times, and revenue by district. Covers all permit types with quarterly breakdowns.',
    domain: 'permits-licensing',
    badge: 'Standard Report',
    freshness: 'Updated daily',
    parameters: [
      { id: 'quarter', label: 'Quarter', type: 'select',
        options: ['Q1 2026', 'Q4 2025', 'Q3 2025', 'Q2 2025'], default: 'Q1 2026' },
      { id: 'district', label: 'District', type: 'select',
        options: ['All Districts', 'Downtown', 'Westside', 'Eastside', 'North County'], default: 'All Districts' },
      { id: 'permitType', label: 'Permit Type', type: 'select',
        options: ['All Types', 'Residential', 'Commercial', 'Industrial'], default: 'All Types' },
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
      { type: 'table', title: 'District Breakdown', dataKey: 'districtData',
        columns: [
          { property: 'district', header: 'District' },
          { property: 'permits', header: 'Permits' },
          { property: 'avgDays', header: 'Avg Days' },
          { property: 'revenue', header: 'Revenue' }
        ]
      }
    ],
    data: {
      monthlyPermits: [
        { month: 'Jan', value: 95 }, { month: 'Feb', value: 112 },
        { month: 'Mar', value: 134 }, { month: 'Apr', value: 98 },
        { month: 'May', value: 145 }, { month: 'Jun', value: 128 },
        { month: 'Jul', value: 108 }, { month: 'Aug', value: 87 },
        { month: 'Sep', value: 76 }, { month: 'Oct', value: 68 }
      ],
      districtData: [
        { district: 'Downtown', permits: 234, avgDays: 10.2, revenue: '$680K' },
        { district: 'Westside', permits: 198, avgDays: 11.8, revenue: '$542K' },
        { district: 'Eastside', permits: 178, avgDays: 14.1, revenue: '$498K' },
        { district: 'North County', permits: 237, avgDays: 13.0, revenue: '$680K' }
      ]
    },
    matchKeywords: ['building permit', 'permit activity', 'permit summary', 'quarterly permits', 'permit counts', 'permit revenue', 'permit processing'],
    suggestions: ['Filter to my district', 'Show only residential', 'Compare to last quarter', 'Add trend line', 'Export to Excel']
  },

  {
    id: 'monthly-code-violations',
    name: 'Monthly Code Violation Trends',
    description: 'Violation counts by type and neighborhood with trend analysis and resolution rates.',
    domain: 'code-enforcement',
    badge: 'Standard Report',
    freshness: 'Updated weekly',
    parameters: [
      { id: 'dateRange', label: 'Date Range', type: 'select',
        options: ['Last 30 Days', 'Last 90 Days', 'Last 6 Months', 'Last 12 Months'], default: 'Last 90 Days' },
      { id: 'violationType', label: 'Violation Type', type: 'select',
        options: ['All Types', 'Property Maintenance', 'Zoning', 'Building Code', 'Health & Safety'], default: 'All Types' },
      { id: 'neighborhood', label: 'Neighborhood', type: 'select',
        options: ['All Neighborhoods', 'Downtown', 'Riverside', 'Oak Park', 'Hillcrest'], default: 'All Neighborhoods' },
      { id: 'resolution', label: 'Resolution Status', type: 'select',
        options: ['All', 'Open', 'Resolved', 'In Progress'], default: 'All' }
    ],
    sections: [
      { type: 'kpi-row', items: [
        { label: 'Total Violations', value: '1,243', color: 'primary' },
        { label: 'Resolution Rate', value: '72%', color: 'success' },
        { label: 'Avg Days to Resolve', value: '18.5', color: 'primary' }
      ]},
      { type: 'chart', chartType: 'bar', title: 'Violations by Type', dataKey: 'violationsByType' },
      { type: 'table', title: 'Neighborhood Summary', dataKey: 'neighborhoodData',
        columns: [
          { property: 'neighborhood', header: 'Neighborhood' },
          { property: 'violations', header: 'Violations' },
          { property: 'resolved', header: 'Resolved' },
          { property: 'avgDays', header: 'Avg Days' }
        ]
      }
    ],
    data: {
      violationsByType: [
        { month: 'Property Maintenance', value: 456 },
        { month: 'Zoning', value: 312 },
        { month: 'Building Code', value: 289 },
        { month: 'Health & Safety', value: 186 }
      ],
      neighborhoodData: [
        { neighborhood: 'Downtown', violations: 389, resolved: 298, avgDays: 15.2 },
        { neighborhood: 'Riverside', violations: 312, resolved: 218, avgDays: 19.8 },
        { neighborhood: 'Oak Park', violations: 287, resolved: 201, avgDays: 21.3 },
        { neighborhood: 'Hillcrest', violations: 255, resolved: 178, avgDays: 17.1 }
      ]
    },
    matchKeywords: ['code violation', 'violation trends', 'code enforcement', 'violations by type', 'violation summary', 'property maintenance'],
    suggestions: ['Show only open violations', 'Filter to my neighborhood', 'Show trend over time', 'Compare violation types', 'Show resolution timeline']
  },

  {
    id: 'budget-vs-actuals',
    name: 'Budget vs. Actuals',
    description: 'Year-to-date budget comparison with variance analysis by department and fund.',
    domain: 'financial',
    badge: 'Standard Report',
    freshness: 'Updated monthly',
    parameters: [
      { id: 'fiscalYear', label: 'Fiscal Year', type: 'select',
        options: ['FY 2025-2026', 'FY 2024-2025', 'FY 2023-2024'], default: 'FY 2025-2026' },
      { id: 'department', label: 'Department', type: 'select',
        options: ['All Departments', 'Public Works', 'Community Development', 'Police', 'Fire', 'Parks & Recreation'], default: 'All Departments' },
      { id: 'fund', label: 'Fund', type: 'select',
        options: ['All Funds', 'General Fund', 'Enterprise Fund', 'Capital Projects'], default: 'All Funds' },
      { id: 'category', label: 'Category', type: 'select',
        options: ['All Categories', 'Personnel', 'Operations', 'Capital'], default: 'All Categories' }
    ],
    sections: [
      { type: 'kpi-row', items: [
        { label: 'Total Budget', value: '$48.2M', color: 'primary' },
        { label: 'YTD Actuals', value: '$32.1M', color: 'primary' },
        { label: 'Variance', value: '-$1.8M', color: 'danger' }
      ]},
      { type: 'chart', chartType: 'bar', title: 'Budget vs. Actuals by Department', dataKey: 'deptComparison' },
      { type: 'table', title: 'Department Detail', dataKey: 'departmentData',
        columns: [
          { property: 'department', header: 'Department' },
          { property: 'budget', header: 'Budget' },
          { property: 'actuals', header: 'Actuals' },
          { property: 'variance', header: 'Variance' }
        ]
      }
    ],
    data: {
      deptComparison: [
        { month: 'Public Works', value: 8200 },
        { month: 'Community Dev', value: 5400 },
        { month: 'Police', value: 12100 },
        { month: 'Fire', value: 9800 },
        { month: 'Parks & Rec', value: 3600 }
      ],
      departmentData: [
        { department: 'Public Works', budget: '$12.4M', actuals: '$8.2M', variance: '-$0.4M' },
        { department: 'Community Development', budget: '$6.8M', actuals: '$5.4M', variance: '+$0.2M' },
        { department: 'Police', budget: '$15.2M', actuals: '$12.1M', variance: '-$1.2M' },
        { department: 'Fire', budget: '$11.8M', actuals: '$9.8M', variance: '-$0.3M' },
        { department: 'Parks & Recreation', budget: '$5.0M', actuals: '$3.6M', variance: '-$0.1M' }
      ]
    },
    matchKeywords: ['budget', 'actuals', 'budget vs actuals', 'variance', 'fiscal year', 'spending', 'expenditure', 'department budget'],
    suggestions: ['Show my department only', 'Show personnel costs', 'Compare to last fiscal year', 'Show quarterly trend', 'Highlight over-budget items']
  },

  {
    id: 'active-cases-by-status',
    name: 'Active Cases by Status',
    description: 'Case workload overview with status distribution, aging analysis, and assignment tracking.',
    domain: 'justice',
    badge: 'Standard Report',
    freshness: 'Updated daily',
    parameters: [
      { id: 'caseType', label: 'Case Type', type: 'select',
        options: ['All Types', 'Felony', 'Misdemeanor', 'Traffic', 'Civil'], default: 'All Types' },
      { id: 'status', label: 'Status', type: 'select',
        options: ['All Active', 'Filed', 'Arraigned', 'Pre-Trial', 'In Trial'], default: 'All Active' },
      { id: 'assignedTo', label: 'Assigned To', type: 'select',
        options: ['All Attorneys', 'Judge Martinez', 'Judge Thompson', 'Judge Lee', 'Unassigned'], default: 'All Attorneys' },
      { id: 'ageRange', label: 'Case Age', type: 'select',
        options: ['All Ages', '< 30 Days', '30-90 Days', '90-180 Days', '> 180 Days'], default: 'All Ages' }
    ],
    sections: [
      { type: 'kpi-row', items: [
        { label: 'Active Cases', value: '2,341', color: 'primary' },
        { label: 'Avg Case Age', value: '67 days', color: 'primary' },
        { label: 'Cases > 180 Days', value: '312', color: 'danger' }
      ]},
      { type: 'chart', chartType: 'bar', title: 'Cases by Status', dataKey: 'casesByStatus' },
      { type: 'table', title: 'Assignment Overview', dataKey: 'assignmentData',
        columns: [
          { property: 'judge', header: 'Assigned To' },
          { property: 'active', header: 'Active' },
          { property: 'avgAge', header: 'Avg Age (days)' },
          { property: 'overdue', header: '> 180 Days' }
        ]
      }
    ],
    data: {
      casesByStatus: [
        { month: 'Filed', value: 567 },
        { month: 'Arraigned', value: 489 },
        { month: 'Pre-Trial', value: 712 },
        { month: 'In Trial', value: 341 },
        { month: 'Sentencing', value: 232 }
      ],
      assignmentData: [
        { judge: 'Judge Martinez', active: 423, avgAge: 58, overdue: 45 },
        { judge: 'Judge Thompson', active: 389, avgAge: 72, overdue: 67 },
        { judge: 'Judge Lee', active: 512, avgAge: 61, overdue: 78 },
        { judge: 'Unassigned', active: 156, avgAge: 34, overdue: 12 }
      ]
    },
    matchKeywords: ['active cases', 'case status', 'case workload', 'case aging', 'caseload', 'court cases', 'case disposition'],
    suggestions: ['Show only felonies', 'Show cases over 180 days', 'Filter to my judge', 'Show filing trends', 'Compare case types']
  }
];

export function getStandardReportById(id) {
  return standardReports.find(r => r.id === id) || null;
}
```

- [ ] **Step 2: Verify the module loads**

Run: `npm run dev`

Open browser console on the TIRA page and run:
```js
import('/src/standard-reports.js').then(m => console.log(m.standardReports.length, m.standardReports.map(r => r.name)))
```

Expected: `4` and an array of 4 report names.

- [ ] **Step 3: Commit**

```bash
git add src/standard-reports.js
git commit -m "feat: add standard report definitions for 4 domains"
```

---

## Task 2: Saved Views Store (`saved-views.js`)

**Files:**
- Create: `src/saved-views.js`

Thin CRUD layer for saved views with sessionStorage persistence.

- [ ] **Step 1: Create the saved views module**

```js
// src/saved-views.js

const STORAGE_KEY = 'tira-saved-views';

let views = loadFromStorage();

function loadFromStorage() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getDefaultViews();
  } catch {
    return getDefaultViews();
  }
}

function persist() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(views));
}

function getDefaultViews() {
  return [
    {
      id: 'view-demo-1',
      reportId: 'quarterly-permit-summary',
      name: 'Downtown Residential Only',
      createdBy: 'sarah.webb',
      parameterOverrides: { district: 'Downtown', permitType: 'Residential' }
    },
    {
      id: 'view-demo-2',
      reportId: 'monthly-code-violations',
      name: 'Open Violations - Riverside',
      createdBy: 'sarah.webb',
      parameterOverrides: { neighborhood: 'Riverside', resolution: 'Open' }
    }
  ];
}

export function getViewsForReport(reportId) {
  return views.filter(v => v.reportId === reportId);
}

export function saveView(reportId, name, parameterOverrides) {
  const view = {
    id: `view-${Date.now()}`,
    reportId,
    name,
    createdBy: 'sarah.webb',
    parameterOverrides: { ...parameterOverrides }
  };
  views.push(view);
  persist();
  return view;
}

export function deleteView(viewId) {
  views = views.filter(v => v.id !== viewId);
  persist();
}

export function applyView(report, view) {
  const params = {};
  for (const param of report.parameters) {
    params[param.id] = view && view.parameterOverrides[param.id] !== undefined
      ? view.parameterOverrides[param.id]
      : param.default;
  }
  return params;
}

export function getCurrentOverrides(report, currentParams) {
  const overrides = {};
  for (const param of report.parameters) {
    if (currentParams[param.id] !== param.default) {
      overrides[param.id] = currentParams[param.id];
    }
  }
  return overrides;
}
```

- [ ] **Step 2: Verify in browser console**

```js
import('/src/saved-views.js').then(m => {
  console.log('Views for permits:', m.getViewsForReport('quarterly-permit-summary'));
  const v = m.saveView('quarterly-permit-summary', 'Test View', { district: 'Eastside' });
  console.log('Saved:', v);
  console.log('Now has:', m.getViewsForReport('quarterly-permit-summary').length, 'views');
  m.deleteView(v.id);
  console.log('After delete:', m.getViewsForReport('quarterly-permit-summary').length, 'views');
})
```

Expected: Shows 1 default view, creates a new one (2 total), deletes it (back to 1).

- [ ] **Step 3: Commit**

```bash
git add src/saved-views.js
git commit -m "feat: add saved views store with sessionStorage persistence"
```

---

## Task 3: Report Matcher (`report-matcher.js`)

**Files:**
- Create: `src/report-matcher.js`

- [ ] **Step 1: Create the matcher module**

```js
// src/report-matcher.js

export function matchStandardReports(query, visibleReports) {
  if (!query || !visibleReports.length) return [];

  const queryWords = normalize(query).split(/\s+/).filter(w => w.length > 2);

  const scored = visibleReports.map(report => {
    const targetWords = [
      ...report.matchKeywords.map(k => normalize(k)),
      normalize(report.name),
      normalize(report.description)
    ].join(' ').split(/\s+/);

    let matchCount = 0;
    for (const qw of queryWords) {
      if (targetWords.some(tw => tw.includes(qw) || qw.includes(tw))) {
        matchCount++;
      }
    }

    const confidence = queryWords.length > 0
      ? Math.round((matchCount / queryWords.length) * 100)
      : 0;

    return { report, confidence };
  });

  return scored
    .filter(s => s.confidence >= 40)
    .sort((a, b) => b.confidence - a.confidence);
}

export function getConfidenceTier(confidence) {
  if (confidence >= 70) return 'high';
  if (confidence >= 40) return 'medium';
  return 'low';
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '');
}
```

- [ ] **Step 2: Verify matching in browser console**

```js
import('/src/report-matcher.js').then(matcher => {
  import('/src/standard-reports.js').then(({ standardReports }) => {
    console.log('High match:', matcher.matchStandardReports('quarterly building permit summary', standardReports));
    console.log('Medium match:', matcher.matchStandardReports('how many permits this year', standardReports));
    console.log('No match:', matcher.matchStandardReports('weather forecast', standardReports));
  });
});
```

Expected: First returns high confidence for permits report. Second returns medium. Third returns empty array.

- [ ] **Step 3: Commit**

```bash
git add src/report-matcher.js
git commit -m "feat: add keyword matching engine for standard reports"
```

---

## Task 4: Standard Report Card for Chat (`standard-report-card.js`)

**Files:**
- Create: `src/standard-report-card.js`
- Create: `src/standard-report-card.css`

The card that appears in chat when a standard report is matched or recommended.

- [ ] **Step 1: Create the CSS file**

```css
/* src/standard-report-card.css */

.standard-report-card {
  background: #fff;
  border: 2px solid var(--forge-theme-primary, #3f51b5);
  border-radius: 8px;
  padding: 16px;
  margin-top: 8px;
}

.standard-report-card__badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.standard-report-card__badge {
  background: var(--forge-theme-primary, #3f51b5);
  color: #fff;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.standard-report-card__domain {
  color: #666;
  font-size: 12px;
}

.standard-report-card__name {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
  color: #1a1a1a;
}

.standard-report-card__description {
  color: #666;
  font-size: 13px;
  margin-bottom: 12px;
  line-height: 1.4;
}

.standard-report-card__meta {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.standard-report-card__chip {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.standard-report-card__chip--info {
  background: #e8eaf6;
  color: var(--forge-theme-primary, #3f51b5);
}

.standard-report-card__chip--fresh {
  background: #e8f5e9;
  color: #2e7d32;
}

.standard-report-card__open-btn {
  background: var(--forge-theme-primary, #3f51b5);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  width: 100%;
  font-weight: 500;
  transition: background 0.15s;
}

.standard-report-card__open-btn:hover {
  background: #303f9f;
}

.standard-report-card__recommendation {
  font-size: 13px;
  color: #555;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  border-left: 3px solid var(--forge-theme-primary, #3f51b5);
}
```

- [ ] **Step 2: Create the card builder module**

```js
// src/standard-report-card.js
import './standard-report-card.css';

export function buildStandardReportCard(report, confidence) {
  const tier = confidence >= 70 ? 'high' : 'medium';
  const paramCount = report.parameters.length;
  const sectionCount = report.sections.length;

  let preamble = '';
  if (tier === 'high') {
    preamble = `<div style="font-size: 14px; margin-bottom: 12px;">I found a standard report that covers this exactly:</div>`;
  } else {
    preamble = `<div class="standard-report-card__recommendation">There's also a standard report that may be relevant:</div>`;
  }

  return `
    ${preamble}
    <div class="standard-report-card" data-report-id="${report.id}">
      <div class="standard-report-card__badge-row">
        <span class="standard-report-card__badge">Standard Report</span>
        <span class="standard-report-card__domain">${getDomainLabel(report.domain)}</span>
      </div>
      <div class="standard-report-card__name">${report.name}</div>
      <div class="standard-report-card__description">${report.description}</div>
      <div class="standard-report-card__meta">
        <span class="standard-report-card__chip standard-report-card__chip--info">${paramCount} parameters</span>
        <span class="standard-report-card__chip standard-report-card__chip--info">${sectionCount} sections</span>
        <span class="standard-report-card__chip standard-report-card__chip--fresh">${report.freshness}</span>
      </div>
      <button class="standard-report-card__open-btn" data-action="open-standard-report" data-report-id="${report.id}">
        Open Report
      </button>
    </div>
  `;
}

function getDomainLabel(domain) {
  const labels = {
    'permits-licensing': 'Permits & Licensing',
    'code-enforcement': 'Code Enforcement',
    'financial': 'Financial Management',
    'justice': 'Justice & Public Safety',
    'gis': 'GIS & Mapping',
    'utilities': 'Utilities & Billing',
    'hr-payroll': 'HR & Payroll'
  };
  return labels[domain] || domain;
}

export { getDomainLabel };
```

- [ ] **Step 3: Commit**

```bash
git add src/standard-report-card.js src/standard-report-card.css
git commit -m "feat: add standard report card component for chat"
```

---

## Task 5: Standard Report Viewer (`standard-report-viewer.js`)

**Files:**
- Create: `src/standard-report-viewer.js`
- Create: `src/standard-report-viewer.css`

The right-panel component for the split-view experience. This is the largest task — it renders the full report with filter bar, view dropdown, KPI rows, charts, tables, and the save view dialog.

- [ ] **Step 1: Create the CSS file**

```css
/* src/standard-report-viewer.css */

.sr-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: #fff;
  font-family: var(--forge-font-family, 'Roboto', sans-serif);
}

.sr-viewer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.sr-viewer__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sr-viewer__title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

.sr-viewer__badge {
  background: var(--forge-theme-primary, #3f51b5);
  color: #fff;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.sr-viewer__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sr-viewer__view-select {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  background: #fff;
  cursor: pointer;
  min-width: 160px;
}

.sr-viewer__save-btn {
  background: var(--forge-theme-primary, #3f51b5);
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
}

.sr-viewer__save-btn:hover {
  background: #303f9f;
}

.sr-viewer__filters {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  flex-wrap: wrap;
  flex-shrink: 0;
  align-items: center;
}

.sr-viewer__filter-select {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  background: #fff;
  cursor: pointer;
}

.sr-viewer__filter-label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.sr-viewer__body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* KPI Row */
.sr-viewer__kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.sr-viewer__kpi {
  background: #f8f9ff;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.sr-viewer__kpi-value {
  font-size: 26px;
  font-weight: 700;
}

.sr-viewer__kpi-value--primary { color: var(--forge-theme-primary, #3f51b5); }
.sr-viewer__kpi-value--success { color: #2e7d32; }
.sr-viewer__kpi-value--danger { color: #c62828; }

.sr-viewer__kpi-label {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

/* Chart */
.sr-viewer__chart {
  margin-bottom: 20px;
}

.sr-viewer__chart-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.sr-viewer__chart-container {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 160px;
}

.sr-viewer__bar {
  flex: 1;
  background: var(--forge-theme-primary, #3f51b5);
  border-radius: 3px 3px 0 0;
  min-width: 20px;
  position: relative;
  transition: opacity 0.2s;
}

.sr-viewer__bar:hover {
  opacity: 0.85;
}

.sr-viewer__bar-label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  color: #666;
  white-space: nowrap;
}

.sr-viewer__bar-value {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #333;
  font-weight: 600;
}

/* Table */
.sr-viewer__table-section {
  margin-bottom: 20px;
}

.sr-viewer__table-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.sr-viewer__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.sr-viewer__table th {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 2px solid #ddd;
  background: #f5f5f5;
  font-weight: 600;
  font-size: 12px;
  color: #333;
}

.sr-viewer__table td {
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  color: #444;
}

.sr-viewer__table tr:hover {
  background: #f8f9ff;
}

/* Save View Dialog */
.sr-viewer__save-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.sr-viewer__save-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  min-width: 340px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.sr-viewer__save-dialog h3 {
  margin: 0 0 16px;
  font-size: 16px;
}

.sr-viewer__save-dialog input {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  margin-bottom: 8px;
  box-sizing: border-box;
}

.sr-viewer__save-dialog-hint {
  font-size: 12px;
  color: #888;
  margin-bottom: 16px;
}

.sr-viewer__save-dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.sr-viewer__save-dialog-actions button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid #ddd;
  background: #fff;
}

.sr-viewer__save-dialog-actions button.primary {
  background: var(--forge-theme-primary, #3f51b5);
  color: #fff;
  border: none;
}
```

- [ ] **Step 2: Create the viewer module**

```js
// src/standard-report-viewer.js
import './standard-report-viewer.css';
import { getViewsForReport, saveView, applyView, getCurrentOverrides } from './saved-views.js';

export function buildStandardReportPanel(report) {
  const views = getViewsForReport(report.id);
  const defaultParams = {};
  for (const p of report.parameters) {
    defaultParams[p.id] = p.default;
  }

  return `
    <div class="sr-viewer" data-report-id="${report.id}">
      ${buildHeader(report, views)}
      ${buildFilterBar(report, defaultParams)}
      <div class="sr-viewer__body">
        ${report.sections.map(s => buildSection(s, report)).join('')}
      </div>
    </div>
  `;
}

function buildHeader(report, views) {
  const viewOptions = [
    `<option value="">Default View</option>`,
    ...views.map(v => `<option value="${v.id}">${v.name}</option>`)
  ].join('');

  return `
    <div class="sr-viewer__header">
      <div class="sr-viewer__title-row">
        <span class="sr-viewer__title">${report.name}</span>
        <span class="sr-viewer__badge">Standard</span>
      </div>
      <div class="sr-viewer__actions">
        <select class="sr-viewer__view-select" data-action="view-select">
          ${viewOptions}
        </select>
        <button class="sr-viewer__save-btn" data-action="save-view">Save View</button>
      </div>
    </div>
  `;
}

function buildFilterBar(report, currentParams) {
  const filters = report.parameters.map(p => {
    const options = p.options.map(opt =>
      `<option value="${opt}" ${currentParams[p.id] === opt ? 'selected' : ''}>${opt}</option>`
    ).join('');
    return `
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span class="sr-viewer__filter-label">${p.label}</span>
        <select class="sr-viewer__filter-select" data-param-id="${p.id}">
          ${options}
        </select>
      </div>
    `;
  }).join('');

  return `<div class="sr-viewer__filters">${filters}</div>`;
}

function buildSection(section, report) {
  switch (section.type) {
    case 'kpi-row': return buildKpiRow(section);
    case 'chart': return buildChart(section, report);
    case 'table': return buildTable(section, report);
    default: return '';
  }
}

function buildKpiRow(section) {
  const kpis = section.items.map(item => `
    <div class="sr-viewer__kpi">
      <div class="sr-viewer__kpi-value sr-viewer__kpi-value--${item.color || 'primary'}">${item.value}</div>
      <div class="sr-viewer__kpi-label">${item.label}</div>
    </div>
  `).join('');
  return `<div class="sr-viewer__kpi-row">${kpis}</div>`;
}

function buildChart(section, report) {
  const chartData = report.data[section.dataKey] || [];
  const maxVal = Math.max(...chartData.map(d => d.value));
  const bars = chartData.map(d => {
    const heightPct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
    return `
      <div class="sr-viewer__bar" style="height: ${heightPct}%;" title="${d.month}: ${d.value}">
        <span class="sr-viewer__bar-value">${d.value}</span>
        <span class="sr-viewer__bar-label">${d.month}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="sr-viewer__chart">
      <div class="sr-viewer__chart-title">${section.title}</div>
      <div class="sr-viewer__chart-container">${bars}</div>
    </div>
  `;
}

function buildTable(section, report) {
  const data = report.data[section.dataKey] || [];
  const columns = section.columns || [];

  const thead = columns.map(c => `<th>${c.header}</th>`).join('');
  const tbody = data.map(row => {
    const cells = columns.map(c => `<td>${row[c.property] ?? ''}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
    <div class="sr-viewer__table-section">
      <div class="sr-viewer__table-title">${section.title}</div>
      <table class="sr-viewer__table">
        <thead><tr>${thead}</tr></thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>
  `;
}

export function wireStandardReportPanel(panelEl, report, callbacks = {}) {
  let currentParams = {};
  for (const p of report.parameters) {
    currentParams[p.id] = p.default;
  }

  // Wire filter dropdowns
  const filterSelects = panelEl.querySelectorAll('.sr-viewer__filter-select');
  filterSelects.forEach(select => {
    select.addEventListener('change', () => {
      const paramId = select.dataset.paramId;
      currentParams[paramId] = select.value;
      if (callbacks.onFilterChange) {
        callbacks.onFilterChange(paramId, select.value, { ...currentParams });
      }
    });
  });

  // Wire view dropdown
  const viewSelect = panelEl.querySelector('[data-action="view-select"]');
  if (viewSelect) {
    viewSelect.addEventListener('change', () => {
      const viewId = viewSelect.value;
      const views = getViewsForReport(report.id);
      const view = views.find(v => v.id === viewId) || null;
      currentParams = applyView(report, view);

      // Update filter dropdowns to reflect view
      filterSelects.forEach(select => {
        const paramId = select.dataset.paramId;
        if (currentParams[paramId] !== undefined) {
          select.value = currentParams[paramId];
        }
      });

      if (callbacks.onViewChange) {
        callbacks.onViewChange(view, { ...currentParams });
      }
    });
  }

  // Wire save view button
  const saveBtn = panelEl.querySelector('[data-action="save-view"]');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      showSaveViewDialog(report, currentParams, (newView) => {
        // Add new option to view dropdown
        if (viewSelect) {
          const option = document.createElement('option');
          option.value = newView.id;
          option.textContent = newView.name;
          viewSelect.appendChild(option);
          viewSelect.value = newView.id;
        }
        if (callbacks.onViewSaved) {
          callbacks.onViewSaved(newView);
        }
      });
    });
  }

  // Return a function to update filters programmatically (for AI chat sync)
  return {
    setParam(paramId, value) {
      currentParams[paramId] = value;
      const select = panelEl.querySelector(`.sr-viewer__filter-select[data-param-id="${paramId}"]`);
      if (select) select.value = value;
    },
    getParams() {
      return { ...currentParams };
    }
  };
}

function showSaveViewDialog(report, currentParams, onSave) {
  const overrides = getCurrentOverrides(report, currentParams);
  const overrideLabels = Object.entries(overrides).map(([key, val]) => {
    const param = report.parameters.find(p => p.id === key);
    return param ? `${param.label}: ${val}` : `${key}: ${val}`;
  });

  const overlay = document.createElement('div');
  overlay.className = 'sr-viewer__save-dialog-overlay';
  overlay.innerHTML = `
    <div class="sr-viewer__save-dialog">
      <h3>Save View</h3>
      <input type="text" placeholder="View name (e.g., My Q1 Downtown View)" autofocus />
      <div class="sr-viewer__save-dialog-hint">
        ${overrideLabels.length > 0
          ? `Saves: ${overrideLabels.join(', ')}`
          : 'No filter changes from default — adjust filters first.'}
      </div>
      <div class="sr-viewer__save-dialog-actions">
        <button data-action="cancel">Cancel</button>
        <button data-action="confirm" class="primary">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const input = overlay.querySelector('input');
  const cancelBtn = overlay.querySelector('[data-action="cancel"]');
  const confirmBtn = overlay.querySelector('[data-action="confirm"]');

  cancelBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  confirmBtn.addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    const view = saveView(report.id, name, overrides);
    overlay.remove();
    onSave(view);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmBtn.click();
    if (e.key === 'Escape') overlay.remove();
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/standard-report-viewer.js src/standard-report-viewer.css
git commit -m "feat: add standard report viewer with filters, charts, tables, and save view"
```

---

## Task 6: Update User Context for Standard Report Visibility (`user-context.js`)

**Files:**
- Modify: `src/user-context.js`

Add the ability to filter standard reports by the current user's department.

- [ ] **Step 1: Add domain-to-department mapping and visibility function**

At the end of `src/user-context.js` (after the `recentActivity` export), add:

```js
// Domain → departments mapping for standard report visibility
const domainDepartments = {
  'permits-licensing': ['Community Development', 'Planning', 'Code Enforcement', 'Public Works'],
  'code-enforcement': ['Code Enforcement', 'Community Development', 'Planning'],
  'financial': ['Finance', 'Community Development', 'Public Works', 'Police', 'Fire', 'Parks & Recreation', 'Administration'],
  'justice': ['Police', 'Courts', 'District Attorney', 'Public Defender'],
  'gis': ['Community Development', 'Planning', 'Public Works', 'GIS'],
  'utilities': ['Utilities', 'Public Works', 'Finance'],
  'hr-payroll': ['Human Resources', 'Administration', 'Finance']
};

export function getVisibleStandardReports(reports, user = currentUser) {
  return reports.filter(report => {
    const allowedDepts = domainDepartments[report.domain] || [];
    return allowedDepts.includes(user.department);
  });
}
```

- [ ] **Step 2: Verify in browser console**

```js
import('/src/user-context.js').then(uc => {
  import('/src/standard-reports.js').then(({ standardReports }) => {
    const visible = uc.getVisibleStandardReports(standardReports);
    console.log('Visible reports for', uc.currentUser.department + ':', visible.map(r => r.name));
  });
});
```

Expected: Sarah Webb (Community Development) should see: Quarterly Building Permit Summary, Monthly Code Violation Trends, Budget vs. Actuals. Should NOT see Active Cases by Status (justice domain).

- [ ] **Step 3: Commit**

```bash
git add src/user-context.js
git commit -m "feat: add standard report visibility by department"
```

---

## Task 7: Integrate Matching & Standard Report Card into Chat Flow (`chat-flow.js`)

**Files:**
- Modify: `src/chat-flow.js`

This is the core integration: add matching logic to `runConversation()`, render the standard report card, and wire the "Open Report" button to open the split-view with the StandardReportViewer.

- [ ] **Step 1: Add imports at the top of `chat-flow.js`**

Add these imports alongside the existing ones at the top of the file:

```js
import { standardReports, getStandardReportById } from './standard-reports.js';
import { matchStandardReports, getConfidenceTier } from './report-matcher.js';
import { buildStandardReportCard } from './standard-report-card.js';
import { buildStandardReportPanel, wireStandardReportPanel } from './standard-report-viewer.js';
import { getVisibleStandardReports } from './user-context.js';
```

- [ ] **Step 2: Add `openStandardReport()` function**

Add this function in `chat-flow.js` (after the existing `transitionToSplitView` function, around line 1375):

```js
export function openStandardReport(report, dialog, options = {}) {
  const container = dialog.querySelector('.chat-body') || dialog.querySelector('.chat-messages');

  // Build the split-view layout
  const existingHeader = dialog.querySelector('.chat-header');
  const existingBody = dialog.querySelector('.chat-body');
  const existingFooter = dialog.querySelector('.chat-footer');

  // Fade out existing content
  [existingHeader, existingBody, existingFooter].forEach(el => {
    if (el) {
      el.style.transition = 'opacity 0.3s';
      el.style.opacity = '0';
    }
  });

  setTimeout(() => {
    [existingHeader, existingBody, existingFooter].forEach(el => {
      if (el) el.remove();
    });

    // Create split container
    const splitContainer = document.createElement('div');
    splitContainer.style.cssText = 'display: flex; height: 100%; width: 100%;';

    // Left panel: Chat
    const leftPanel = document.createElement('div');
    leftPanel.style.cssText = 'width: 38%; border-right: 2px solid #e0e0e0; display: flex; flex-direction: column; background: #fafafa;';
    leftPanel.innerHTML = buildStandardReportChatPanel(report);

    // Right panel: Report viewer
    const rightPanel = document.createElement('div');
    rightPanel.style.cssText = 'width: 62%; display: flex; flex-direction: column; overflow: hidden;';
    rightPanel.innerHTML = buildStandardReportPanel(report);

    splitContainer.appendChild(leftPanel);
    splitContainer.appendChild(rightPanel);
    dialog.appendChild(splitContainer);

    // Wire the report viewer
    const viewerEl = rightPanel.querySelector('.sr-viewer');
    const viewerControls = wireStandardReportPanel(viewerEl, report, {
      onFilterChange: (paramId, value, allParams) => {
        const param = report.parameters.find(p => p.id === paramId);
        addChatMessage(leftPanel, 'ai', `${param ? param.label : paramId} changed to <strong>${value}</strong>.`);
      },
      onViewChange: (view, allParams) => {
        const label = view ? view.name : 'Default View';
        addChatMessage(leftPanel, 'ai', `Switched to <strong>${label}</strong>.`);
      },
      onViewSaved: (view) => {
        addChatMessage(leftPanel, 'ai', `View "<strong>${view.name}</strong>" saved. You can select it anytime from the view dropdown.`);
      }
    });

    // Wire chat input for conversational filter changes
    wireChatInput(leftPanel, report, viewerControls);

    // Wire suggestion chips
    wireSuggestionChips(leftPanel, report, viewerControls);

  }, 300);
}

function buildStandardReportChatPanel(report) {
  const suggestionsHtml = report.suggestions.map(s =>
    `<span class="sr-chat-chip" data-suggestion="${s}">${s}</span>`
  ).join('');

  return `
    <div style="padding: 16px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;">
      <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">AI Assistant</div>
      <div class="sr-chat-messages">
        <div style="background: #fff; border-radius: 8px; padding: 12px; border: 1px solid #e0e0e0;">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px;">${report.name}</div>
          <div style="font-size: 12px; color: #555; line-height: 1.5;">This report shows ${report.description.toLowerCase()} Currently showing default filters. ${report.freshness}.</div>
        </div>
      </div>
      <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Suggestions</div>
      <div class="sr-chat-suggestions" style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${suggestionsHtml}
      </div>
    </div>
    <div class="sr-chat-input-area" style="padding: 12px 16px; border-top: 1px solid #e0e0e0; display: flex; gap: 8px;">
      <input class="sr-chat-input" style="flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 10px 12px; font-size: 13px;" placeholder="Ask about this report..." />
      <button class="sr-chat-send" style="background: var(--forge-theme-primary, #3f51b5); color: #fff; border: none; border-radius: 8px; padding: 8px 14px; cursor: pointer; font-size: 13px;">Send</button>
    </div>
    <style>
      .sr-chat-chip {
        background: #e8eaf6;
        color: var(--forge-theme-primary, #3f51b5);
        font-size: 11px;
        padding: 6px 10px;
        border-radius: 16px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .sr-chat-chip:hover { background: #c5cae9; }
      .sr-chat-msg { background: #fff; border-radius: 8px; padding: 10px 12px; border: 1px solid #e0e0e0; font-size: 12px; line-height: 1.5; }
      .sr-chat-msg--user { background: #e8eaf6; border-color: #c5cae9; text-align: right; }
    </style>
  `;
}

function addChatMessage(leftPanel, type, html) {
  const msgContainer = leftPanel.querySelector('.sr-chat-messages');
  if (!msgContainer) return;
  const msg = document.createElement('div');
  msg.className = `sr-chat-msg ${type === 'user' ? 'sr-chat-msg--user' : ''}`;
  msg.innerHTML = html;
  msgContainer.appendChild(msg);
  msgContainer.scrollTop = msgContainer.scrollHeight;
}

function wireChatInput(leftPanel, report, viewerControls) {
  const input = leftPanel.querySelector('.sr-chat-input');
  const sendBtn = leftPanel.querySelector('.sr-chat-send');
  if (!input || !sendBtn) return;

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addChatMessage(leftPanel, 'user', text);

    // Simple keyword matching for filter changes
    setTimeout(() => {
      const response = processConversationalFilter(text, report, viewerControls);
      addChatMessage(leftPanel, 'ai', response);
    }, 600);
  }

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSend(); });
}

function wireSuggestionChips(leftPanel, report, viewerControls) {
  const chips = leftPanel.querySelectorAll('.sr-chat-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.dataset.suggestion;
      addChatMessage(leftPanel, 'user', text);
      chip.style.display = 'none';
      setTimeout(() => {
        const response = processConversationalFilter(text, report, viewerControls);
        addChatMessage(leftPanel, 'ai', response);
      }, 600);
    });
  });
}

function processConversationalFilter(text, report, viewerControls) {
  const lower = text.toLowerCase();

  for (const param of report.parameters) {
    for (const option of param.options) {
      if (option === param.options[0]) continue; // skip "All" options
      if (lower.includes(option.toLowerCase())) {
        viewerControls.setParam(param.id, option);
        return `Filtered <strong>${param.label}</strong> to <strong>${option}</strong>. The report has been updated.`;
      }
    }
  }

  // Check for common patterns
  if (lower.includes('my district') || lower.includes('my neighborhood')) {
    const districtParam = report.parameters.find(p => p.id === 'district' || p.id === 'neighborhood');
    if (districtParam) {
      const value = districtParam.options[1]; // Pick first non-All option as "my" area
      viewerControls.setParam(districtParam.id, value);
      return `Filtered to <strong>${value}</strong> (your assigned area). The report has been updated.`;
    }
  }

  if (lower.includes('residential')) {
    const typeParam = report.parameters.find(p => p.id === 'permitType' || p.id === 'violationType' || p.id === 'caseType');
    if (typeParam) {
      const match = typeParam.options.find(o => o.toLowerCase().includes('residential'));
      if (match) {
        viewerControls.setParam(typeParam.id, match);
        return `Filtered to <strong>${match}</strong>. The report has been updated.`;
      }
    }
  }

  return `I understand you'd like to "${text}". In a production system, I'd adjust the report accordingly. For now, you can use the filter controls on the right to make changes directly.`;
}
```

- [ ] **Step 3: Modify `runConversation()` to add matching step**

In the existing `runConversation()` function (around line 98), the current flow is:
1. Render user message
2. Show thinking (500ms)
3. Show query card (2000ms)

Modify the function so that when `options.query` is provided (typed prompt, not a suggestion click), it runs matching first. Find the section in `runConversation` where the thinking indicator is replaced with the query card response (around the `setTimeout` that calls `buildQueryCard`). Wrap that section with matching logic:

Before the existing query card rendering (inside the 2000ms timeout), add:

```js
// Check for standard report matches (only for typed queries, not suggestion clicks)
const queryText = options.query || suggestion?.query || '';
if (queryText && !options.suggestionIndex && options.suggestionIndex !== 0) {
  const visibleReports = getVisibleStandardReports(standardReports);
  const matches = matchStandardReports(queryText, visibleReports);

  if (matches.length > 0) {
    const topMatch = matches[0];
    const tier = getConfidenceTier(topMatch.confidence);

    if (tier === 'high') {
      // Replace ad-hoc response entirely with standard report card
      thinkingEl.remove();
      const responseMsg = document.createElement('forge-ai-response-message');
      responseMsg.innerHTML = buildStandardReportCard(topMatch.report, topMatch.confidence);
      container.appendChild(responseMsg);

      // Wire the "Open Report" button
      const openBtn = responseMsg.querySelector('[data-action="open-standard-report"]');
      if (openBtn) {
        openBtn.addEventListener('click', () => {
          openStandardReport(topMatch.report, dialog);
        });
      }
      return; // Skip normal query card flow
    }

    if (tier === 'medium') {
      // Will append recommendation after the normal query card — store for later
      container._pendingReportRecommendation = topMatch;
    }
  }
}
```

Then, after the existing query card is rendered and wired (after `wireQueryCard` is called), add:

```js
// Append standard report recommendation if medium confidence match exists
if (container._pendingReportRecommendation) {
  const match = container._pendingReportRecommendation;
  delete container._pendingReportRecommendation;
  const recMsg = document.createElement('forge-ai-response-message');
  recMsg.innerHTML = buildStandardReportCard(match.report, match.confidence);
  container.appendChild(recMsg);

  const openBtn = recMsg.querySelector('[data-action="open-standard-report"]');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      openStandardReport(match.report, dialog);
    });
  }
}
```

- [ ] **Step 4: Add `openStandardReportInChat()` for library "Open in Chat"**

Add this exported function that can be called from tira-view.js:

```js
export function openStandardReportInChat(reportId) {
  const report = getStandardReportById(reportId);
  if (!report) return;

  // Create the fullscreen dialog (same pattern as openChatFlow)
  const existingDialog = document.querySelector('.chat-dialog');
  if (existingDialog) existingDialog.remove();

  const dialog = document.createElement('forge-dialog');
  dialog.className = 'chat-dialog';
  dialog.setAttribute('fullscreen', '');
  dialog.setAttribute('moveable', 'false');

  dialog.innerHTML = `
    <div class="chat-header" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid #e0e0e0;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <forge-icon name="auto_awesome" style="color: var(--forge-theme-primary, #3f51b5);"></forge-icon>
        <span class="forge-typography--subtitle1">${report.name}</span>
        <span style="background: var(--forge-theme-primary, #3f51b5); color: #fff; font-size: 9px; padding: 2px 6px; border-radius: 3px; text-transform: uppercase;">Standard</span>
      </div>
      <forge-icon-button data-action="close-dialog">
        <button><forge-icon name="close"></forge-icon></button>
      </forge-icon-button>
    </div>
    <div class="chat-body" style="flex: 1; overflow-y: auto; padding: 20px;">
      <forge-ai-response-message>
        <div style="font-size: 14px; color: #555;">Opened standard report: <strong>${report.name}</strong></div>
      </forge-ai-response-message>
    </div>
  `;

  document.body.appendChild(dialog);
  dialog.open = true;

  // Close button
  const closeBtn = dialog.querySelector('[data-action="close-dialog"]');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => { dialog.open = false; dialog.remove(); });
  }

  // Immediately transition to split-view with the standard report
  setTimeout(() => {
    openStandardReport(report, dialog);
  }, 400);
}
```

- [ ] **Step 5: Verify end-to-end in browser**

Run `npm run dev`. Open the app:
1. Type "building permit summary" in the TIRA prompt → should see a Standard Report Card (high confidence match)
2. Click "Open Report" → should open split-view with report viewer on right, chat on left
3. Change a filter on the right → chat should show a confirmation message
4. Click a suggestion chip on the left → should trigger filter change
5. Click "Save View" → should show dialog, let you name and save
6. Saved view should appear in the dropdown

- [ ] **Step 6: Commit**

```bash
git add src/chat-flow.js
git commit -m "feat: integrate standard report matching and split-view into chat flow"
```

---

## Task 8: Library Integration in TIRA View (`tira-view.js`)

**Files:**
- Modify: `src/views/tira-view.js`

Add "Standard Reports" to the side menu and build the library list view.

- [ ] **Step 1: Add imports**

At the top of `tira-view.js`, add alongside existing imports:

```js
import { standardReports } from '../standard-reports.js';
import { getVisibleStandardReports } from '../user-context.js';
import { openStandardReportInChat } from '../chat-flow.js';
import { getViewsForReport } from '../saved-views.js';
import { getDomainLabel } from '../standard-report-card.js';
```

- [ ] **Step 2: Add "Standard Reports" menu item to side menu**

In the `render()` function, find the Library section of the side menu HTML (the section with "Templates" and "Data Sources"). Add a "Standard Reports" item before "Templates":

```html
<button class="side-menu-item" data-nav="standard-reports">
  <forge-icon name="assignment"></forge-icon>
  <span>Standard Reports</span>
</button>
```

The full Library section should now be:

```html
<div class="menu-section-label">LIBRARY</div>
<button class="side-menu-item" data-nav="standard-reports">
  <forge-icon name="assignment"></forge-icon>
  <span>Standard Reports</span>
</button>
<button class="side-menu-item" data-nav="templates">
  <forge-icon name="file_copy"></forge-icon>
  <span>Templates</span>
</button>
<button class="side-menu-item" data-nav="data-sources">
  <forge-icon name="database"></forge-icon>
  <span>Data Sources</span>
</button>
```

- [ ] **Step 3: Add `renderStandardReportsLibrary()` function**

Add this function to `tira-view.js`:

```js
function renderStandardReportsLibrary() {
  const container = document.querySelector('.suggestions-container') || document.querySelector('.home-body');
  if (!container) return;

  const visibleReports = getVisibleStandardReports(standardReports);

  // Group by domain
  const grouped = {};
  for (const report of visibleReports) {
    const domain = getDomainLabel(report.domain);
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push(report);
  }

  const html = `
    <div class="standard-reports-library" style="padding: 0 4px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <h2 class="forge-typography--heading5" style="margin: 0;">Standard Reports</h2>
          <p style="color: #666; font-size: 13px; margin: 4px 0 0;">Pre-built reports maintained by Tyler. Open in chat to explore and customize.</p>
        </div>
      </div>
      ${Object.entries(grouped).map(([domain, reports]) => `
        <div style="margin-bottom: 24px;">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; font-weight: 600; margin-bottom: 8px;">${domain}</div>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            ${reports.map(report => {
              const savedViews = getViewsForReport(report.id);
              const viewsBadge = savedViews.length > 0
                ? `<span style="background: #e8eaf6; color: var(--forge-theme-primary, #3f51b5); font-size: 10px; padding: 2px 6px; border-radius: 10px;">${savedViews.length} saved view${savedViews.length > 1 ? 's' : ''}</span>`
                : '';
              return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: #fff; border-radius: 8px; border: 1px solid #eee; transition: border-color 0.15s;" onmouseover="this.style.borderColor='#c5cae9'" onmouseout="this.style.borderColor='#eee'">
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-weight: 600; font-size: 14px;">${report.name}</span>
                      ${viewsBadge}
                    </div>
                    <div style="color: #666; font-size: 12px; margin-top: 2px;">${report.description} &middot; ${report.freshness} &middot; ${report.parameters.length} parameters</div>
                  </div>
                  <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: 16px;">
                    <button class="std-report-open-btn" data-report-id="${report.id}" style="background: var(--forge-theme-primary, #3f51b5); color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 500;">Open in Chat</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.innerHTML = html;

  // Wire "Open in Chat" buttons
  container.querySelectorAll('.std-report-open-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const reportId = btn.dataset.reportId;
      openStandardReportInChat(reportId);
    });
  });
}
```

- [ ] **Step 4: Wire the side menu navigation**

In `wireEvents()`, find the section that handles side menu item clicks (look for `data-nav` handling). Add a case for `standard-reports`:

```js
// Inside the side menu click handler
if (nav === 'standard-reports') {
  renderStandardReportsLibrary();
  // Close side menu on mobile
  const sideMenu = document.querySelector('.side-menu');
  const overlay = document.querySelector('.side-menu-overlay');
  if (sideMenu) sideMenu.classList.remove('open');
  if (overlay) overlay.classList.remove('visible');
}
```

- [ ] **Step 5: Verify library view**

Run `npm run dev`. Open the TIRA page:
1. Open the side menu
2. Click "Standard Reports" under Library
3. Should see reports grouped by domain with "Open in Chat" buttons
4. Click "Open in Chat" on any report → should open chat dialog and transition to split-view

- [ ] **Step 6: Commit**

```bash
git add src/views/tira-view.js
git commit -m "feat: add standard reports library to TIRA side menu"
```

---

## Task 9: Register Icons and Add Query Param Handler (`main.js`)

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Add `assignment` icon if not already registered**

Check the existing `IconRegistry.define()` call in `main.js`. If `tylIconAssignment` is not already imported and registered, add it:

```js
import { tylIconAssignment } from '@tylertech/tyler-icons/standard';
```

And add it to the `IconRegistry.define([...])` array.

- [ ] **Step 2: Add `?state=standard-report` handler**

In the `DOMContentLoaded` handler where other `?state=` params are handled, add:

```js
if (state === 'standard-report') {
  const reportId = params.get('reportId');
  if (reportId) {
    import('./chat-flow.js').then(({ openStandardReportInChat }) => {
      openStandardReportInChat(reportId);
    });
  }
}
```

This allows deep-linking to a specific standard report: `?state=standard-report&reportId=quarterly-permit-summary`

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "feat: add standard report icon and deep-link handler"
```

---

## Task 10: End-to-End Verification

**Files:** None (verification only)

- [ ] **Step 1: Test contextual matching — high confidence**

Run `npm run dev`. On the TIRA homepage:
1. Type "quarterly building permit summary" in the prompt
2. Expected: Standard Report Card appears with "I found a standard report that covers this exactly"
3. Click "Open Report"
4. Expected: Split-view with report on right, chat on left

- [ ] **Step 2: Test contextual matching — medium confidence**

1. Type "how is the budget looking" in the prompt
2. Expected: Normal ad-hoc query card appears first, followed by "There's also a standard report that may be relevant" with the Budget vs. Actuals card

- [ ] **Step 3: Test contextual matching — no match**

1. Type "weather forecast for tomorrow"
2. Expected: Normal ad-hoc flow, no standard report recommendation

- [ ] **Step 4: Test library browse**

1. Open side menu → click "Standard Reports"
2. Expected: Library view with reports grouped by domain
3. Sarah Webb should see 3 reports (not Active Cases by Status since she's Community Development)
4. Click "Open in Chat" on any report
5. Expected: Chat dialog opens and transitions to split-view

- [ ] **Step 5: Test filter interaction**

In split-view:
1. Change a filter dropdown on the right
2. Expected: Chat message confirms the change
3. Type a filter command in chat (e.g., "show downtown only")
4. Expected: Filter updates on the right, chat confirms

- [ ] **Step 6: Test save view**

1. Adjust filters to non-default values
2. Click "Save View"
3. Expected: Dialog appears asking for a name, shows which filters will be saved
4. Enter a name and save
5. Expected: New view appears in the view dropdown
6. Switch to "Default View" in dropdown
7. Expected: Filters reset to defaults
8. Switch back to saved view
9. Expected: Filters restore to saved values

- [ ] **Step 7: Test deep link**

Navigate to: `http://localhost:5173/?state=standard-report&reportId=quarterly-permit-summary`
Expected: App loads and opens directly into the standard report split-view.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete standard reports in chat — matching, library, viewer, saved views"
```
