# Data Layer → Design Layer Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the Report Designer's Data Layer + Report Builder tabs so a technical builder can configure a semantic model (sources, fields, joins, calculated measures, parameters) and then drag those fields onto widgets in the Report Builder — completing the bridge between the two tabs.

**Architecture:** All state lives in `ReportContext` (shared across both tabs — no publish step). The Data Layer tab gets a new three-column layout (Source Catalog | Canvas | Inspector) plus a bottom data preview drawer. The Report Builder gains a "Fields" tab in its left palette, a parameter strip above the canvas, and a field-binding-based config panel for widgets.

**Tech Stack:** React 19 (in `report-canvas/`), `@xyflow/react` for the data-layer graph, `@tylertech/forge-react` for design-system components, native HTML5 drag-and-drop for cross-component data transfer.

**Project conventions:**
- This is a prototype, no test framework is configured. Verification = run `npm run dev` and visually confirm.
- Forge web components self-register on import in `src/main.js`.
- BEM-style CSS naming for component styles.
- Each task ends with a commit. Use the form: `feat(designer): <change>` or `refactor(designer): <change>`.

**Spec reference:** `docs/superpowers/specs/2026-05-27-data-layer-to-design-layer-flow-design.md`

---

## File Structure

**New files:**
- `report-canvas/src/data/sourceCatalog.js` — hardcoded catalog of known sources (EPL, ERP, Courts)
- `report-canvas/src/data/sourceSchemas.js` — per-source field definitions with dim/measure tags
- `report-canvas/src/components/data-layer/SourceCatalog.jsx` — new left palette (replaces SourcePalette in data-layer tab)
- `report-canvas/src/components/data-layer/SourceCatalog.css`
- `report-canvas/src/components/data-layer/Inspector.jsx` — right panel with SELECTION/MODEL modes
- `report-canvas/src/components/data-layer/Inspector.css`
- `report-canvas/src/components/data-layer/DataPreviewDrawer.jsx` — bottom drawer with 3 preview modes
- `report-canvas/src/components/data-layer/DataPreviewDrawer.css`
- `report-canvas/src/components/report-builder/FieldsTab.jsx` — Fields tab content for left palette
- `report-canvas/src/components/report-builder/FieldsTab.css`
- `report-canvas/src/components/report-builder/ParameterStrip.jsx` — yellow band above canvas
- `report-canvas/src/components/report-builder/ParameterStrip.css`
- `report-canvas/src/utils/fieldLibrary.js` — pure helpers to derive Field Library from semantic-model state

**Modified files:**
- `report-canvas/src/context/ReportContext.jsx` — add semantic-model state: `selectedSources`, `relationships`, `measures`, `parameters`
- `report-canvas/src/components/data-layer/DataLayerCanvas.jsx` — restructure to use new three-column layout
- `report-canvas/src/components/data-layer/nodes/SourceNode.jsx` — render embedded selected-field list
- `report-canvas/src/components/AppShell.jsx` — swap SourcePalette → SourceCatalog in data-layer tab; mount Inspector instead of PropertiesPanel when on data-layer tab
- `report-canvas/src/components/report-builder/WidgetPalette.jsx` — add Widgets / Fields / Layers tab switcher
- `report-canvas/src/components/report-builder/WidgetConfigPanel.jsx` — replace single dataset dropdown with per-slot field bindings
- `report-canvas/src/components/report-builder/PrintCanvas.jsx` — render ParameterStrip above canvas; accept field-drop on widgets

---

## Task 1: Build the source catalog data files

**Files:**
- Create: `report-canvas/src/data/sourceCatalog.js`
- Create: `report-canvas/src/data/sourceSchemas.js`

- [ ] **Step 1: Create the source catalog metadata**

Create `report-canvas/src/data/sourceCatalog.js` with the list of known sources grouped by system. This is the data the new Source Catalog palette will render.

```javascript
// Hardcoded source catalog for the Data Layer's left palette.
// Mirrors the domain catalog in /src/user-context.js but adds source type + identifier.

export const sourceCatalog = [
  {
    system: 'EPL',
    sources: [
      { id: 'permit_applications', label: 'permit_applications', type: 'table', rowCount: 24128, description: 'All permit application records' },
      { id: 'inspection_results',  label: 'inspection_results',  type: 'table', rowCount: 8912,  description: 'Inspection outcomes per permit' },
      { id: 'citizen_complaints',  label: 'citizen_complaints',  type: 'view',  rowCount: 3210,  description: 'Citizen-filed complaint records' },
      { id: 'code_violations',     label: 'code_violations',     type: 'table', rowCount: 1845,  description: 'Recorded code violations' },
    ],
  },
  {
    system: 'ERP',
    sources: [
      { id: 'department_budgets',  label: 'department_budgets',  type: 'stored_proc', rowCount: 124, description: 'Department budget allocations' },
      { id: 'budget_actuals',      label: 'budget_actuals',      type: 'table',       rowCount: 5230, description: 'Actual spend per budget line' },
      { id: 'employee_roster',     label: 'employee_roster',     type: 'view',        rowCount: 412,  description: 'Active employees' },
    ],
  },
  {
    system: 'Courts',
    sources: [
      { id: 'court_cases',         label: 'court_cases',         type: 'table', rowCount: 18402, description: 'Filed court cases' },
      { id: 'court_dockets',       label: 'court_dockets',       type: 'view',  rowCount: 9120,  description: 'Active dockets' },
    ],
  },
];

export function findSource(sourceId) {
  for (const group of sourceCatalog) {
    const hit = group.sources.find(s => s.id === sourceId);
    if (hit) return { ...hit, system: group.system };
  }
  return null;
}
```

- [ ] **Step 2: Create the source schemas (field metadata)**

Create `report-canvas/src/data/sourceSchemas.js`. This provides the field definitions each source exposes, with dim/measure tags. The Inspector consumes this when a source is selected.

```javascript
// Field schemas per source. Each field carries: name, displayName, type, role, description.
// role: 'dimension' | 'measure'
// type: 'string' | 'number' | 'date' | 'currency' | 'enum'

export const sourceSchemas = {
  permit_applications: [
    { name: 'id',              displayName: 'Permit ID',         type: 'string',   role: 'dimension', description: 'Unique permit identifier' },
    { name: 'type',            displayName: 'Permit Type',       type: 'enum',     role: 'dimension', description: 'Residential, commercial, etc.' },
    { name: 'value',           displayName: 'Permit Value',      type: 'currency', role: 'measure',   description: 'Declared project value in USD' },
    { name: 'issued_date',     displayName: 'Issued Date',       type: 'date',     role: 'dimension', description: 'Date permit was issued' },
    { name: 'applied_date',    displayName: 'Applied Date',      type: 'date',     role: 'dimension', description: 'Date permit was applied for' },
    { name: 'department_id',   displayName: 'Department ID',     type: 'string',   role: 'dimension', description: 'FK to department' },
    { name: 'status',          displayName: 'Status',            type: 'enum',     role: 'dimension', description: 'Application status' },
    { name: 'fee',             displayName: 'Permit Fee',        type: 'currency', role: 'measure',   description: 'Fee collected at issuance' },
  ],
  department_budgets: [
    { name: 'id',              displayName: 'Department ID',     type: 'string',   role: 'dimension', description: 'Unique department identifier' },
    { name: 'name',            displayName: 'Department Name',   type: 'string',   role: 'dimension', description: 'Department display name' },
    { name: 'budget_amount',   displayName: 'Budget Amount',     type: 'currency', role: 'measure',   description: 'Allocated budget for the fiscal year' },
    { name: 'population',      displayName: 'Population Served', type: 'number',   role: 'measure',   description: 'Population in service area' },
    { name: 'fiscal_year',     displayName: 'Fiscal Year',       type: 'number',   role: 'dimension', description: 'Fiscal year' },
  ],
  inspection_results: [
    { name: 'id',              displayName: 'Inspection ID',     type: 'string',   role: 'dimension', description: 'Unique inspection identifier' },
    { name: 'permit_id',       displayName: 'Permit ID',         type: 'string',   role: 'dimension', description: 'FK to permit' },
    { name: 'result',          displayName: 'Result',            type: 'enum',     role: 'dimension', description: 'Pass / fail / re-inspect' },
    { name: 'inspection_date', displayName: 'Inspection Date',   type: 'date',     role: 'dimension', description: 'Date of inspection' },
  ],
  citizen_complaints: [
    { name: 'id',              displayName: 'Complaint ID',      type: 'string',   role: 'dimension', description: 'Unique complaint identifier' },
    { name: 'status',          displayName: 'Status',            type: 'enum',     role: 'dimension', description: 'Open / closed / in-progress' },
    { name: 'filed_date',      displayName: 'Filed Date',        type: 'date',     role: 'dimension', description: 'Date complaint was filed' },
    { name: 'department_id',   displayName: 'Department ID',     type: 'string',   role: 'dimension', description: 'FK to department' },
  ],
  code_violations: [
    { name: 'id',              displayName: 'Violation ID',      type: 'string',   role: 'dimension', description: 'Unique violation identifier' },
    { name: 'category',        displayName: 'Category',          type: 'enum',     role: 'dimension', description: 'Violation category' },
    { name: 'fine_amount',     displayName: 'Fine Amount',       type: 'currency', role: 'measure',   description: 'Fine assessed' },
    { name: 'issued_date',     displayName: 'Issued Date',       type: 'date',     role: 'dimension', description: 'Date violation issued' },
  ],
  budget_actuals: [
    { name: 'id',              displayName: 'Line ID',           type: 'string',   role: 'dimension', description: 'Budget line identifier' },
    { name: 'department_id',   displayName: 'Department ID',     type: 'string',   role: 'dimension', description: 'FK to department' },
    { name: 'actual_amount',   displayName: 'Actual Amount',     type: 'currency', role: 'measure',   description: 'Spend to date' },
    { name: 'period',          displayName: 'Period',            type: 'date',     role: 'dimension', description: 'Reporting period' },
  ],
  employee_roster: [
    { name: 'id',              displayName: 'Employee ID',       type: 'string',   role: 'dimension', description: 'Unique employee identifier' },
    { name: 'department_id',   displayName: 'Department ID',     type: 'string',   role: 'dimension', description: 'FK to department' },
    { name: 'role',            displayName: 'Role',              type: 'string',   role: 'dimension', description: 'Job title' },
  ],
  court_cases: [
    { name: 'id',              displayName: 'Case ID',           type: 'string',   role: 'dimension', description: 'Case identifier' },
    { name: 'status',          displayName: 'Status',            type: 'enum',     role: 'dimension', description: 'Open / closed / appealed' },
    { name: 'filed_date',      displayName: 'Filed Date',        type: 'date',     role: 'dimension', description: 'Date case filed' },
  ],
  court_dockets: [
    { name: 'id',              displayName: 'Docket ID',         type: 'string',   role: 'dimension', description: 'Docket identifier' },
    { name: 'case_id',         displayName: 'Case ID',           type: 'string',   role: 'dimension', description: 'FK to case' },
    { name: 'scheduled_date',  displayName: 'Scheduled Date',    type: 'date',     role: 'dimension', description: 'Scheduled hearing date' },
  ],
};

export function getSchemaFor(sourceId) {
  return sourceSchemas[sourceId] || [];
}
```

- [ ] **Step 3: Verify imports work in a smoke check**

Run: `cd /Users/stephenwebb/Desktop/TIRA && npm run dev`
Expected: dev server starts without errors. Open the browser, navigate to the designer, no console errors. (These files aren't imported yet — this just confirms they're syntactically valid.)

- [ ] **Step 4: Commit**

```bash
git add report-canvas/src/data/sourceCatalog.js report-canvas/src/data/sourceSchemas.js
git commit -m "feat(designer): add source catalog and per-source field schemas"
```

---

## Task 2: Extend ReportContext with semantic-model state

**Files:**
- Modify: `report-canvas/src/context/ReportContext.jsx`
- Create: `report-canvas/src/utils/fieldLibrary.js`

This task adds the new state shapes (`selectedSources`, `relationships`, `measures`, `parameters`) and exposes them via context. It does NOT remove existing `nodes`/`edges`/`generatedData` — they stay; new state runs alongside.

- [ ] **Step 1: Create the field-library helper**

Create `report-canvas/src/utils/fieldLibrary.js`:

```javascript
import { getSchemaFor } from '../data/sourceSchemas.js';

/**
 * Derive the unified Field Library from semantic-model state.
 * Returns an array of field entries that widgets and the chat AI consume.
 *
 * Each entry: { id, qualifiedName, displayName, role, type, sourceId, kind }
 * kind: 'field' (from source) | 'measure' (calculated)
 */
export function buildFieldLibrary(selectedSources, measures) {
  const fields = [];

  for (const sourceEntry of selectedSources) {
    const { sourceId, includedFields } = sourceEntry;
    const schema = getSchemaFor(sourceId);
    for (const field of schema) {
      if (!includedFields.includes(field.name)) continue;
      fields.push({
        id: `${sourceId}.${field.name}`,
        qualifiedName: `${sourceId}.${field.name}`,
        displayName: field.displayName,
        role: field.role,
        type: field.type,
        sourceId,
        kind: 'field',
      });
    }
  }

  for (const measure of measures) {
    fields.push({
      id: `measure.${measure.name}`,
      qualifiedName: measure.name,
      displayName: measure.displayName || measure.name,
      role: 'measure',
      type: measure.type || 'number',
      sourceId: null,
      kind: 'measure',
      expression: measure.expression,
    });
  }

  return fields;
}

/**
 * Group field-library entries by source for grouped display.
 * Calculated measures land in a synthetic 'measures' group.
 */
export function groupFieldsBySource(library) {
  const groups = {};
  for (const f of library) {
    const key = f.kind === 'measure' ? 'CALCULATED MEASURES' : f.sourceId;
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  }
  return groups;
}
```

- [ ] **Step 2: Add semantic-model state to ReportContext**

Open `report-canvas/src/context/ReportContext.jsx`. Add the following imports near the top, after the existing imports on lines 1-3:

```javascript
import { findSource } from '../data/sourceCatalog.js';
import { getSchemaFor } from '../data/sourceSchemas.js';
import { buildFieldLibrary } from '../utils/fieldLibrary.js';
```

Inside `ReportProvider`, after the existing state declarations (after `const [loadingNodes, setLoadingNodes] = useState(new Set());` on line 158) add:

```javascript
  // Semantic-model state (new — runs alongside existing nodes/edges for now)
  // selectedSources: [{ sourceId, includedFields: [fieldName, ...] }]
  const [selectedSources, setSelectedSources] = useState([]);

  // relationships: [{ id, leftSourceId, leftField, rightSourceId, rightField, joinType, cardinality }]
  const [relationships, setRelationships] = useState([]);

  // measures: [{ id, name, displayName, expression, type }]
  const [measures, setMeasures] = useState([]);

  // parameters: [{ id, name, displayName, type, defaultValue, options? }]
  const [parameters, setParameters] = useState([
    { id: 'param-date-range', name: 'date_range',  displayName: 'Date Range',  type: 'date_range', defaultValue: 'last_90d' },
    { id: 'param-department', name: 'department',  displayName: 'Department',  type: 'multi_select', defaultValue: ['all'] },
  ]);

  // Inspector mode in the Data Layer tab: 'selection' | 'model'
  const [inspectorMode, setInspectorMode] = useState('model');

  // Add a source from catalog to the model (idempotent on sourceId).
  const addSourceFromCatalog = useCallback((sourceId) => {
    setSelectedSources(prev => {
      if (prev.some(s => s.sourceId === sourceId)) return prev;
      const schema = getSchemaFor(sourceId);
      // Default: include all fields
      const includedFields = schema.map(f => f.name);
      return [...prev, { sourceId, includedFields }];
    });
  }, []);

  const removeSource = useCallback((sourceId) => {
    setSelectedSources(prev => prev.filter(s => s.sourceId !== sourceId));
    setRelationships(prev => prev.filter(r => r.leftSourceId !== sourceId && r.rightSourceId !== sourceId));
  }, []);

  const toggleSourceField = useCallback((sourceId, fieldName) => {
    setSelectedSources(prev => prev.map(s => {
      if (s.sourceId !== sourceId) return s;
      const included = s.includedFields.includes(fieldName)
        ? s.includedFields.filter(f => f !== fieldName)
        : [...s.includedFields, fieldName];
      return { ...s, includedFields: included };
    }));
  }, []);

  const addMeasure = useCallback((measure) => {
    setMeasures(prev => [...prev, { id: `measure-${Date.now()}`, ...measure }]);
  }, []);

  const removeMeasure = useCallback((id) => {
    setMeasures(prev => prev.filter(m => m.id !== id));
  }, []);

  const addParameter = useCallback((param) => {
    setParameters(prev => [...prev, { id: `param-${Date.now()}`, ...param }]);
  }, []);

  const updateParameter = useCallback((id, updates) => {
    setParameters(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const removeParameter = useCallback((id) => {
    setParameters(prev => prev.filter(p => p.id !== id));
  }, []);

  // Derived: the unified Field Library
  const fieldLibrary = useMemo(
    () => buildFieldLibrary(selectedSources, measures),
    [selectedSources, measures]
  );
```

- [ ] **Step 3: Expose the new state in the context value**

In the same file, find the `return ( <ReportContext.Provider value={{ ... }}>` block (around lines 219-238). Add the new entries inside the value object, after the existing entries but before the closing `}}`:

```javascript
      // Semantic-model state
      selectedSources, setSelectedSources,
      addSourceFromCatalog, removeSource, toggleSourceField,
      relationships, setRelationships,
      measures, setMeasures, addMeasure, removeMeasure,
      parameters, setParameters, addParameter, updateParameter, removeParameter,
      inspectorMode, setInspectorMode,
      fieldLibrary,
```

- [ ] **Step 4: Verify in dev server**

Run: `npm run dev`
Open: the Report Designer in the browser (via the homepage AI flow or `?state=designer`).
Expected: No console errors. Existing behavior unchanged. Open React DevTools, find the ReportProvider, confirm new context entries (`selectedSources: []`, `parameters: [2]`, `fieldLibrary: []`, etc.) are present.

- [ ] **Step 5: Commit**

```bash
git add report-canvas/src/context/ReportContext.jsx report-canvas/src/utils/fieldLibrary.js
git commit -m "feat(designer): add semantic-model state to ReportContext"
```

---

## Task 3: Build the new SourceCatalog left palette

**Files:**
- Create: `report-canvas/src/components/data-layer/SourceCatalog.jsx`
- Create: `report-canvas/src/components/data-layer/SourceCatalog.css`

This is the new left palette for the Data Layer tab. It renders the hardcoded source catalog grouped by system. Click adds a source to `selectedSources`.

- [ ] **Step 1: Create the SourceCatalog component**

Create `report-canvas/src/components/data-layer/SourceCatalog.jsx`:

```jsx
// Forge components: ForgeExpansionPanel, ForgeIcon, ForgeTextField
import { useState, useMemo } from 'react';
import { ForgeExpansionPanel, ForgeIcon, ForgeTextField } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { sourceCatalog } from '../../data/sourceCatalog.js';
import './SourceCatalog.css';

const SYSTEM_ICONS = {
  EPL:    { icon: 'description',      color: '#2563eb' },
  ERP:    { icon: 'account_balance',  color: '#16a34a' },
  Courts: { icon: 'shield',           color: '#db2777' },
};

const TYPE_LABELS = {
  table:       'table',
  view:        'view',
  stored_proc: 'stored proc',
};

export default function SourceCatalog() {
  const { selectedSources, addSourceFromCatalog } = useReport();
  const [query, setQuery] = useState('');

  const onCanvas = useMemo(
    () => new Set(selectedSources.map(s => s.sourceId)),
    [selectedSources]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sourceCatalog;
    return sourceCatalog
      .map(group => ({
        ...group,
        sources: group.sources.filter(s =>
          s.label.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
        ),
      }))
      .filter(group => group.sources.length > 0);
  }, [query]);

  const onDragStart = (event, source) => {
    event.dataTransfer.setData('application/x-tira-source', JSON.stringify({ sourceId: source.id }));
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="source-catalog">
      <div className="source-catalog__header">
        <div className="source-catalog__label">SOURCE CATALOG</div>
        <ForgeTextField density="small">
          <input
            type="text"
            placeholder="Search sources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </ForgeTextField>
      </div>

      <div className="source-catalog__list">
        {filtered.map(group => {
          const sys = SYSTEM_ICONS[group.system] || SYSTEM_ICONS.EPL;
          return (
            <ForgeExpansionPanel key={group.system} open>
              <div slot="header" className="source-catalog__group-header">
                <ForgeIcon name={sys.icon} style={{ color: sys.color, fontSize: 16 }} />
                <span>{group.system}</span>
                <span className="source-catalog__group-count">{group.sources.length}</span>
              </div>
              <div className="source-catalog__items">
                {group.sources.map(source => {
                  const added = onCanvas.has(source.id);
                  return (
                    <div
                      key={source.id}
                      className={`source-catalog__item ${added ? 'is-added' : ''}`}
                      draggable={!added}
                      onDragStart={(e) => onDragStart(e, source)}
                      onClick={() => !added && addSourceFromCatalog(source.id)}
                      title={source.description}
                    >
                      <div className="source-catalog__item-main">
                        <div className="source-catalog__item-name">{source.label}</div>
                        <div className="source-catalog__item-meta">
                          {group.system} · {TYPE_LABELS[source.type] || source.type} · {source.rowCount.toLocaleString()} rows
                        </div>
                      </div>
                      {added && (
                        <ForgeIcon name="check_circle" style={{ color: '#16a34a', fontSize: 16 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </ForgeExpansionPanel>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the SourceCatalog styles**

Create `report-canvas/src/components/data-layer/SourceCatalog.css`:

```css
.source-catalog {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fafbfc;
  border-right: 1px solid #e3e8ee;
  overflow: hidden;
}

.source-catalog__header {
  padding: 12px;
  border-bottom: 1px solid #e3e8ee;
}

.source-catalog__label {
  font-size: 10px;
  font-weight: 600;
  color: #3b6ea5;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.source-catalog__list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;
}

.source-catalog__group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #3a4a5c;
}

.source-catalog__group-count {
  margin-left: auto;
  background: #e8edf3;
  color: #6c7a8c;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.source-catalog__items {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
}

.source-catalog__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 9px;
  background: #fff;
  border: 1px solid #d4dae3;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.source-catalog__item:hover:not(.is-added) {
  border-color: #3b6ea5;
  box-shadow: 0 1px 3px rgba(59, 110, 165, 0.12);
}

.source-catalog__item.is-added {
  cursor: default;
  background: #f4f9f4;
  border-color: #c8e0c8;
}

.source-catalog__item-main {
  flex: 1;
  min-width: 0;
}

.source-catalog__item-name {
  font-weight: 600;
  color: #1f2937;
  font-family: 'Menlo', 'Monaco', monospace;
  font-size: 11px;
}

.source-catalog__item-meta {
  color: #6c7a8c;
  font-size: 10px;
  margin-top: 2px;
}
```

- [ ] **Step 3: Wire SourceCatalog into AppShell**

Open `report-canvas/src/components/AppShell.jsx`. Change the import on line 10:

```javascript
import SourcePalette from './data-layer/SourcePalette.jsx';
```

to:

```javascript
import SourceCatalog from './data-layer/SourceCatalog.jsx';
```

Then find the JSX that renders `<SourcePalette />` (in the left sidebar when `activeTab === 0`) and replace it with `<SourceCatalog />`. The exact location is in the left sidebar render block — search for `SourcePalette` and replace.

- [ ] **Step 4: Verify in dev server**

Run: `npm run dev`
Open: the Report Designer, switch to the Data Layer tab.
Expected: Left palette now shows the new Source Catalog with EPL / ERP / Courts groups. Each source shows name, type, row count. Search works. Clicking a source marks it with a green checkmark (added to `selectedSources` — even though it doesn't yet appear on the canvas, that's the next task).

- [ ] **Step 5: Commit**

```bash
git add report-canvas/src/components/data-layer/SourceCatalog.jsx \
        report-canvas/src/components/data-layer/SourceCatalog.css \
        report-canvas/src/components/AppShell.jsx
git commit -m "feat(designer): replace SourcePalette with SourceCatalog of known sources"
```

---

## Task 4: Sync source-catalog selections to the canvas

**Files:**
- Modify: `report-canvas/src/components/data-layer/DataLayerCanvas.jsx`
- Modify: `report-canvas/src/components/data-layer/nodes/SourceNode.jsx`

We want sources added via the new catalog to appear on the canvas as source nodes that display their selected fields. The legacy `nodes` state is what ReactFlow renders; we'll sync `selectedSources` → `nodes` so canvas rendering keeps working.

- [ ] **Step 1: Sync selectedSources to canvas nodes**

Open `report-canvas/src/components/data-layer/DataLayerCanvas.jsx`. After the existing hooks at the top of `DataLayerCanvasInner` (around line 40-43), add:

```javascript
  const { selectedSources, removeSource } = useReport();
  // Layout: arrange new source nodes in a horizontal row, 220px apart
  const SOURCE_NODE_SPACING = 240;
  const SOURCE_NODE_Y = 120;
```

Then after the existing `onConnect` callback (around line 70), add an effect that syncs catalog selections to nodes:

```javascript
  // Sync selectedSources (semantic-model state) → ReactFlow nodes
  useEffect(() => {
    setNodes(prevNodes => {
      const prevById = new Map(prevNodes.map(n => [n.id, n]));
      const next = [];

      selectedSources.forEach((sel, idx) => {
        const nodeId = `source-${sel.sourceId}`;
        const existing = prevById.get(nodeId);
        next.push({
          id: nodeId,
          type: 'source',
          position: existing?.position || { x: 80 + idx * SOURCE_NODE_SPACING, y: SOURCE_NODE_Y },
          data: {
            sourceId: sel.sourceId,
            includedFields: sel.includedFields,
            configured: true,
          },
        });
      });

      // Preserve any non-catalog nodes (output, handoff, transforms) by keeping
      // anything that didn't have an id starting with "source-" matching a catalog source.
      prevNodes.forEach(n => {
        const isCatalogSource = selectedSources.some(s => `source-${s.sourceId}` === n.id);
        if (!isCatalogSource && !n.id.startsWith('source-')) next.push(n);
      });

      return next;
    });
  }, [selectedSources, setNodes]);
```

Make sure `useEffect` is imported (add to the top of the file alongside `useCallback, useRef, useState`):

```javascript
import { useCallback, useEffect, useRef, useState } from 'react';
```

- [ ] **Step 2: Wire drag-from-catalog onto canvas**

In the same file's `onDrop` callback (around line 84), add support for the new drag type `application/x-tira-source`. Replace the body of `onDrop` with:

```javascript
  const onDrop = useCallback((event) => {
    event.preventDefault();

    // New semantic-model source drag
    const sourceRaw = event.dataTransfer.getData('application/x-tira-source');
    if (sourceRaw) {
      const { sourceId } = JSON.parse(sourceRaw);
      addSourceFromCatalog(sourceId);
      return;
    }

    // Legacy palette drag (kept for compatibility while we transition)
    const raw = event.dataTransfer.getData('application/reactflow');
    if (!raw) return;

    const config = JSON.parse(raw);
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const isSource = config.type === 'source';
    const newNode = {
      id: `${config.type}-${Date.now()}`,
      type: config.type,
      position,
      data: {
        label: config.label || 'Source',
        icon: config.icon,
        subtype: config.subtype,
        fields: [],
        configured: !isSource,
        configSummary: isSource ? '' : 'Configure in properties panel',
      },
    };

    setNodes(nds => [...nds, newNode]);
    if (isSource) setSelectedNodeId(newNode.id);
  }, [screenToFlowPosition, setNodes, setSelectedNodeId, addSourceFromCatalog]);
```

You'll need to destructure `addSourceFromCatalog` from `useReport()`. Update the top destructure:

```javascript
  const { nodes, setNodes, edges, setEdges, setSelectedNodeId, selectedSources, addSourceFromCatalog } = useReport();
```

- [ ] **Step 3: Update SourceNode to render the field list**

Read the current `report-canvas/src/components/data-layer/nodes/SourceNode.jsx` to understand its shape, then rewrite it to render a catalog-backed source card. Replace its entire contents with:

```jsx
// Forge components: ForgeIcon
import { Handle, Position } from '@xyflow/react';
import { ForgeIcon } from '@tylertech/forge-react';
import { findSource } from '../../../data/sourceCatalog.js';
import { getSchemaFor } from '../../../data/sourceSchemas.js';

const ROLE_COLORS = {
  dimension: '#3b6ea5',
  measure:   '#2d8659',
};

const ROLE_ICONS = {
  dimension: '▦',
  measure:   '∑',
};

export default function SourceNode({ data, selected }) {
  // New catalog-driven source
  if (data.sourceId) {
    const meta = findSource(data.sourceId);
    const schema = getSchemaFor(data.sourceId);
    const includedSet = new Set(data.includedFields || []);
    const includedFieldDefs = schema.filter(f => includedSet.has(f.name));
    const previewFields = includedFieldDefs.slice(0, 4);
    const overflow = includedFieldDefs.length - previewFields.length;

    return (
      <div className={`source-node ${selected ? 'is-selected' : ''}`}>
        <Handle type="target" position={Position.Left} />
        <div className="source-node__header">
          <div className="source-node__title">{meta?.label || data.sourceId}</div>
          <div className="source-node__meta">{meta?.system} · {meta?.rowCount?.toLocaleString()} rows</div>
        </div>
        <div className="source-node__fields">
          {previewFields.map(f => (
            <div key={f.name} className="source-node__field">
              <span style={{ color: ROLE_COLORS[f.role], width: 14, display: 'inline-block', textAlign: 'center' }}>
                {ROLE_ICONS[f.role]}
              </span>
              <span>{f.name}</span>
            </div>
          ))}
          {overflow > 0 && (
            <div className="source-node__field source-node__field--more">+{overflow} more</div>
          )}
          {includedFieldDefs.length === 0 && (
            <div className="source-node__field source-node__field--empty">No fields selected</div>
          )}
        </div>
        <Handle type="source" position={Position.Right} />
      </div>
    );
  }

  // Legacy (chat-handoff) source — keep working
  return (
    <div className={`source-node ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="source-node__header">
        <ForgeIcon name={data.icon || 'database'} style={{ fontSize: 16, color: '#3b6ea5' }} />
        <div>
          <div className="source-node__title">{data.label}</div>
          {data.configSummary && (
            <div className="source-node__meta">{data.configSummary}</div>
          )}
        </div>
      </div>
      {data.fields && data.fields.length > 0 && (
        <div className="source-node__fields">
          {data.fields.slice(0, 4).map(f => (
            <div key={f} className="source-node__field">{f}</div>
          ))}
          {data.fields.length > 4 && (
            <div className="source-node__field source-node__field--more">+{data.fields.length - 4} more</div>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
```

- [ ] **Step 4: Add CSS for the source node**

The existing CSS for source-node is likely in a global stylesheet. Find it by searching for `.source-node` in the codebase. If existing styles are present, add/merge the following rules in the same file. If no file is found, append to `report-canvas/src/components/data-layer/SourceCatalog.css`:

```css
.source-node {
  background: #fff;
  border: 2px solid #3b6ea5;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 11px;
  min-width: 180px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.06);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.source-node.is-selected {
  border-color: #c44569;
  box-shadow: 0 4px 8px rgba(196, 69, 105, 0.18);
}

.source-node__header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #eef2f7;
}

.source-node__title {
  font-weight: 600;
  color: #1f2937;
  font-family: 'Menlo', 'Monaco', monospace;
  font-size: 11px;
}

.source-node__meta {
  color: #6c7a8c;
  font-size: 10px;
}

.source-node__fields {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.source-node__field {
  font-size: 10px;
  color: #3a4a5c;
  display: flex;
  align-items: center;
  gap: 4px;
}

.source-node__field--more {
  color: #6c7a8c;
  font-style: italic;
}

.source-node__field--empty {
  color: #c44569;
  font-style: italic;
}
```

- [ ] **Step 5: Verify in dev server**

Run: `npm run dev`
Open: the Report Designer → Data Layer tab.
Steps to verify:
1. Click `permit_applications` in the Source Catalog. Expected: a source card appears on the canvas showing its name, "EPL · 24,128 rows", and 4 sample fields with "▦"/"∑" icons + "+4 more".
2. Drag `department_budgets` from the catalog onto the canvas. Expected: another source card appears.
3. Connect them by dragging from one handle to the other. Expected: the existing JoinConfigPopover appears.

No console errors expected.

- [ ] **Step 6: Commit**

```bash
git add report-canvas/src/components/data-layer/DataLayerCanvas.jsx \
        report-canvas/src/components/data-layer/nodes/SourceNode.jsx \
        report-canvas/src/components/data-layer/SourceCatalog.css
git commit -m "feat(designer): sync source-catalog selections to canvas nodes with embedded fields"
```

---

## Task 5: Build the Inspector panel (SELECTION + MODEL modes)

**Files:**
- Create: `report-canvas/src/components/data-layer/Inspector.jsx`
- Create: `report-canvas/src/components/data-layer/Inspector.css`
- Modify: `report-canvas/src/components/AppShell.jsx`

The Inspector replaces the existing `PropertiesPanel` on the Data Layer tab. It has two modes at the top (segmented control), and routes content based on selection.

- [ ] **Step 1: Create Inspector.jsx**

Create `report-canvas/src/components/data-layer/Inspector.jsx`:

```jsx
// Forge components: ForgeIcon, ForgeIconButton, ForgeButton, ForgeTextField, ForgeSelect, ForgeOption
import {
  ForgeIcon, ForgeIconButton, ForgeButton, ForgeTextField, ForgeSelect, ForgeOption,
} from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { findSource } from '../../data/sourceCatalog.js';
import { getSchemaFor } from '../../data/sourceSchemas.js';
import { groupFieldsBySource } from '../../utils/fieldLibrary.js';
import './Inspector.css';

function SelectionMode() {
  const {
    nodes, selectedNodeId, selectedSources, toggleSourceField, removeSource,
  } = useReport();
  const node = nodes.find(n => n.id === selectedNodeId);

  if (!node || !node.data.sourceId) {
    return (
      <div className="inspector__empty">
        <ForgeIcon name="touch_app" style={{ fontSize: 28, color: '#9ca3af' }} />
        <p>Click a source on the canvas to configure it.</p>
      </div>
    );
  }

  const sourceId = node.data.sourceId;
  const meta = findSource(sourceId);
  const schema = getSchemaFor(sourceId);
  const sel = selectedSources.find(s => s.sourceId === sourceId);
  const includedSet = new Set(sel?.includedFields || []);

  return (
    <div className="inspector__pane">
      <div className="inspector__section-label">{meta?.label?.toUpperCase()}</div>
      <div className="inspector__meta">
        {meta?.system} · {meta?.type} · {meta?.rowCount?.toLocaleString()} rows
      </div>

      <div className="inspector__subsection">
        <div className="inspector__subsection-title">
          Fields included <span className="inspector__count">({includedSet.size} of {schema.length})</span>
        </div>
        <div className="inspector__fields-list">
          {schema.map(field => {
            const checked = includedSet.has(field.name);
            return (
              <label key={field.name} className={`inspector__field-row ${checked ? 'is-checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSourceField(sourceId, field.name)}
                />
                <span className="inspector__field-name">{field.name}</span>
                <span className={`inspector__field-role inspector__field-role--${field.role}`}>{field.role === 'dimension' ? 'dim' : 'measure'}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="inspector__subsection">
        <ForgeButton type="outlined" on-click={() => removeSource(sourceId)}>
          Remove from model
        </ForgeButton>
      </div>
    </div>
  );
}

function ModelMode() {
  const {
    fieldLibrary, measures, addMeasure, removeMeasure,
    parameters, addParameter, updateParameter, removeParameter,
  } = useReport();

  const grouped = groupFieldsBySource(fieldLibrary);
  const sourceGroups = Object.keys(grouped).filter(k => k !== 'CALCULATED MEASURES');

  return (
    <div className="inspector__pane">
      <div className="inspector__section-label">MODEL CONTRACT</div>
      <div className="inspector__meta">
        {fieldLibrary.length} fields · {measures.length} measures · {parameters.length} parameters
      </div>

      {/* Field library */}
      <div className="inspector__subsection">
        <div className="inspector__subsection-title">Field Library</div>
        {sourceGroups.length === 0 ? (
          <div className="inspector__empty-small">Add sources from the catalog on the left.</div>
        ) : (
          sourceGroups.map(sourceId => (
            <div key={sourceId} className="inspector__field-group">
              <div className="inspector__field-group-title">{sourceId}</div>
              {grouped[sourceId].map(f => (
                <div key={f.id} className="inspector__field-row">
                  <span className="inspector__field-name">{f.qualifiedName}</span>
                  <span className={`inspector__field-role inspector__field-role--${f.role}`}>{f.role === 'dimension' ? 'dim' : 'measure'}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Measures */}
      <div className="inspector__subsection">
        <div className="inspector__subsection-title">
          Calculated Measures
          <ForgeIconButton density="small" on-click={() => addMeasure({ name: 'new_measure', displayName: 'New Measure', expression: 'SUM(field)', type: 'number' })} aria-label="Add measure">
            <ForgeIcon name="add" />
          </ForgeIconButton>
        </div>
        {measures.length === 0 ? (
          <div className="inspector__empty-small">No calculated measures yet.</div>
        ) : (
          measures.map(m => (
            <div key={m.id} className="inspector__measure-row">
              <div className="inspector__measure-main">
                <div className="inspector__measure-name">{m.displayName || m.name}</div>
                <code className="inspector__measure-expr">{m.expression}</code>
              </div>
              <ForgeIconButton density="small" on-click={() => removeMeasure(m.id)} aria-label="Remove">
                <ForgeIcon name="close" />
              </ForgeIconButton>
            </div>
          ))
        )}
      </div>

      {/* Parameters */}
      <div className="inspector__subsection">
        <div className="inspector__subsection-title">
          Parameters
          <ForgeIconButton density="small" on-click={() => addParameter({ name: 'new_param', displayName: 'New Parameter', type: 'string', defaultValue: '' })} aria-label="Add parameter">
            <ForgeIcon name="add" />
          </ForgeIconButton>
        </div>
        {parameters.map(p => (
          <div key={p.id} className="inspector__param-row">
            <div className="inspector__param-main">
              <ForgeTextField density="small">
                <input
                  type="text"
                  value={p.displayName}
                  onChange={(e) => updateParameter(p.id, { displayName: e.target.value })}
                />
              </ForgeTextField>
              <ForgeSelect density="small" value={p.type} on-change={(e) => updateParameter(p.id, { type: e.detail })}>
                <ForgeOption value="string">String</ForgeOption>
                <ForgeOption value="number">Number</ForgeOption>
                <ForgeOption value="date_range">Date Range</ForgeOption>
                <ForgeOption value="multi_select">Multi-select</ForgeOption>
              </ForgeSelect>
            </div>
            <ForgeIconButton density="small" on-click={() => removeParameter(p.id)} aria-label="Remove">
              <ForgeIcon name="close" />
            </ForgeIconButton>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Inspector() {
  const { inspectorMode, setInspectorMode, selectedNodeId } = useReport();

  return (
    <div className="inspector">
      <div className="inspector__tabs">
        <button
          className={`inspector__tab ${inspectorMode === 'selection' ? 'is-active' : ''}`}
          onClick={() => setInspectorMode('selection')}
        >
          SELECTION
        </button>
        <button
          className={`inspector__tab ${inspectorMode === 'model' ? 'is-active' : ''}`}
          onClick={() => setInspectorMode('model')}
        >
          MODEL
        </button>
      </div>
      <div className="inspector__body">
        {inspectorMode === 'selection' ? <SelectionMode /> : <ModelMode />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Inspector.css**

Create `report-canvas/src/components/data-layer/Inspector.css`:

```css
.inspector {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fafbfc;
  border-left: 1px solid #e3e8ee;
  font-size: 12px;
}

.inspector__tabs {
  display: flex;
  border-bottom: 1px solid #e3e8ee;
}

.inspector__tab {
  flex: 1;
  background: transparent;
  border: none;
  padding: 10px 12px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #6c7a8c;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.inspector__tab.is-active {
  color: #3b6ea5;
  border-bottom-color: #3b6ea5;
}

.inspector__body {
  flex: 1;
  overflow-y: auto;
}

.inspector__pane {
  padding: 12px;
}

.inspector__section-label {
  font-size: 10px;
  font-weight: 600;
  color: #c44569;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.inspector__meta {
  font-size: 11px;
  color: #6c7a8c;
  margin-bottom: 14px;
}

.inspector__subsection {
  margin-bottom: 16px;
}

.inspector__subsection-title {
  font-size: 11px;
  font-weight: 600;
  color: #3a4a5c;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.inspector__count {
  font-weight: 400;
  color: #6c7a8c;
  font-size: 10px;
}

.inspector__fields-list,
.inspector__field-group {
  background: #fff;
  border: 1px solid #d4dae3;
  border-radius: 4px;
  padding: 6px;
  margin-bottom: 6px;
}

.inspector__field-group-title {
  font-size: 10px;
  font-weight: 600;
  color: #6c7a8c;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 4px 4px;
  margin-bottom: 4px;
  border-bottom: 1px solid #eef2f7;
}

.inspector__field-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 4px;
  font-size: 11px;
  cursor: pointer;
  border-radius: 3px;
}

.inspector__field-row:hover {
  background: #f4f6f9;
}

.inspector__field-row.is-checked .inspector__field-name {
  color: #1f2937;
  font-weight: 500;
}

.inspector__field-name {
  flex: 1;
  font-family: 'Menlo', 'Monaco', monospace;
  font-size: 11px;
  color: #3a4a5c;
}

.inspector__field-role {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: 600;
}

.inspector__field-role--dimension {
  background: #eaf2fb;
  color: #3b6ea5;
}

.inspector__field-role--measure {
  background: #e9f5ee;
  color: #2d8659;
}

.inspector__measure-row,
.inspector__param-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: #fff;
  border: 1px solid #d4dae3;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 6px;
}

.inspector__measure-main,
.inspector__param-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inspector__measure-name {
  font-weight: 600;
  font-size: 11px;
  color: #1f2937;
}

.inspector__measure-expr {
  font-family: 'Menlo', 'Monaco', monospace;
  font-size: 10px;
  background: #f4eff8;
  padding: 2px 6px;
  border-radius: 3px;
  color: #7a4ca8;
}

.inspector__empty,
.inspector__empty-small {
  padding: 24px 12px;
  text-align: center;
  color: #6c7a8c;
  font-size: 12px;
}

.inspector__empty-small {
  padding: 12px;
  font-size: 11px;
  font-style: italic;
}

.inspector__empty p {
  margin-top: 8px;
}
```

- [ ] **Step 3: Mount Inspector in AppShell when on Data Layer tab**

Open `report-canvas/src/components/AppShell.jsx`. Add the Inspector import alongside the existing imports:

```javascript
import Inspector from './data-layer/Inspector.jsx';
```

Find where `<PropertiesPanel />` is rendered (it's in the right sidebar). Conditionally render `<Inspector />` when `activeTab === 0` (Data Layer) and `<PropertiesPanel />` when `activeTab === 1` (Report Builder).

Replace the existing right-sidebar PropertiesPanel render — wherever you see `<PropertiesPanel />` in the right-rail block — with:

```jsx
{activeTab === 0 ? <Inspector /> : <PropertiesPanel />}
```

- [ ] **Step 4: Auto-switch to SELECTION mode when a node is clicked**

In `report-canvas/src/components/data-layer/DataLayerCanvas.jsx`, find the `onNodeClick` callback (around line 71). Update it to also set `inspectorMode` to `'selection'`:

```javascript
  const { setInspectorMode } = useReport(); // add to destructure at top if not already

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
    setInspectorMode('selection');
  }, [setSelectedNodeId, setInspectorMode]);
```

- [ ] **Step 5: Verify in dev server**

Run: `npm run dev`
Steps:
1. Open Designer → Data Layer tab.
2. Right side initially shows the Inspector in **MODEL** mode, with an empty "Field Library" prompt and two default parameters (Date Range, Department).
3. Click `permit_applications` in the Source Catalog. The source appears on canvas, and the Field Library section now lists 8 fields.
4. Click the source card on the canvas. Inspector switches to **SELECTION** mode with checkboxes for each field. Uncheck `applied_date`. The Field Library count drops by 1.
5. Click an empty area on canvas (or click the MODEL tab). Inspector returns to MODEL mode.
6. Add a parameter. It shows up; rename it; remove it.

- [ ] **Step 6: Commit**

```bash
git add report-canvas/src/components/data-layer/Inspector.jsx \
        report-canvas/src/components/data-layer/Inspector.css \
        report-canvas/src/components/AppShell.jsx \
        report-canvas/src/components/data-layer/DataLayerCanvas.jsx
git commit -m "feat(designer): add Inspector with SELECTION and MODEL modes"
```

---

## Task 6: Build the Data Preview Drawer

**Files:**
- Create: `report-canvas/src/components/data-layer/DataPreviewDrawer.jsx`
- Create: `report-canvas/src/components/data-layer/DataPreviewDrawer.css`
- Modify: `report-canvas/src/components/data-layer/DataLayerCanvas.jsx`

A bottom drawer with three tabs (Selected Source / Joined Output / Field Library Preview). For the prototype, generate mock rows on demand from `dataService.js`.

- [ ] **Step 1: Create DataPreviewDrawer.jsx**

Create `report-canvas/src/components/data-layer/DataPreviewDrawer.jsx`:

```jsx
// Forge components: ForgeIcon, ForgeIconButton
import { useState, useMemo, useEffect } from 'react';
import { ForgeIcon, ForgeIconButton } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { fetchData } from '../../services/dataService.js';
import { findSource } from '../../data/sourceCatalog.js';
import { getSchemaFor } from '../../data/sourceSchemas.js';
import './DataPreviewDrawer.css';

const TABS = [
  { id: 'selected', label: 'Selected Source' },
  { id: 'joined',   label: 'Joined Output' },
  { id: 'library',  label: 'Field Library Preview' },
];

export default function DataPreviewDrawer() {
  const { nodes, selectedNodeId, selectedSources, fieldLibrary } = useReport();
  const [activeTab, setActiveTab] = useState('library');
  const [collapsed, setCollapsed] = useState(false);
  const [rows, setRows] = useState([]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedSourceId = selectedNode?.data?.sourceId;

  // Fetch preview rows when tab/selection changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (activeTab === 'selected' && selectedSourceId) {
        const schema = getSchemaFor(selectedSourceId);
        const fields = schema.map(f => f.name);
        const data = await fetchData(selectedSourceId, 5, fields).catch(() => []);
        if (!cancelled) setRows(data);
      } else if (activeTab === 'joined' || activeTab === 'library') {
        // Mock joined output: take first selected source's data and tack on dept fields if joined
        if (selectedSources.length === 0) { setRows([]); return; }
        const primaryId = selectedSources[0].sourceId;
        const schema = getSchemaFor(primaryId);
        const fields = schema.map(f => f.name);
        const data = await fetchData(primaryId, 5, fields).catch(() => []);
        if (!cancelled) setRows(data);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeTab, selectedSourceId, selectedSources]);

  // Build column headers based on the active tab
  const columns = useMemo(() => {
    if (activeTab === 'selected' && selectedSourceId) {
      return getSchemaFor(selectedSourceId).map(f => ({ key: f.name, label: f.name, role: f.role }));
    }
    if (activeTab === 'library') {
      return fieldLibrary.map(f => ({ key: f.qualifiedName, label: f.qualifiedName, role: f.role }));
    }
    // joined
    if (selectedSources.length === 0) return [];
    const primaryId = selectedSources[0].sourceId;
    return getSchemaFor(primaryId).map(f => ({ key: f.name, label: `${primaryId}.${f.name}`, role: f.role }));
  }, [activeTab, selectedSourceId, selectedSources, fieldLibrary]);

  if (collapsed) {
    return (
      <div className="preview-drawer preview-drawer--collapsed">
        <button className="preview-drawer__toggle" onClick={() => setCollapsed(false)}>
          <ForgeIcon name="expand_less" />
          <span>Data Preview</span>
        </button>
      </div>
    );
  }

  return (
    <div className="preview-drawer">
      <div className="preview-drawer__header">
        <div className="preview-drawer__tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`preview-drawer__tab ${activeTab === t.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="preview-drawer__meta">
          {rows.length > 0 && `Showing ${rows.length} of ${selectedSources[0] ? findSource(selectedSources[0].sourceId)?.rowCount?.toLocaleString() : '0'}`}
          <ForgeIconButton density="small" on-click={() => setCollapsed(true)} aria-label="Collapse">
            <ForgeIcon name="expand_more" />
          </ForgeIconButton>
        </div>
      </div>
      <div className="preview-drawer__table-wrap">
        {columns.length === 0 ? (
          <div className="preview-drawer__empty">No data to preview. Add a source to the model.</div>
        ) : (
          <table className="preview-drawer__table">
            <thead>
              <tr>
                {columns.map(c => (
                  <th key={c.key}>
                    {c.label}
                    {c.role && <span className={`preview-drawer__role-tag preview-drawer__role-tag--${c.role}`}>{c.role === 'dimension' ? 'dim' : 'measure'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map(c => (
                    <td key={c.key}>{formatCell(row[c.key.split('.').pop()])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatCell(v) {
  if (v == null) return '—';
  if (typeof v === 'number') return v.toLocaleString();
  return String(v);
}
```

- [ ] **Step 2: Create DataPreviewDrawer.css**

Create `report-canvas/src/components/data-layer/DataPreviewDrawer.css`:

```css
.preview-drawer {
  border-top: 1px solid #e3e8ee;
  background: #fff;
  max-height: 240px;
  display: flex;
  flex-direction: column;
  font-size: 11px;
}

.preview-drawer--collapsed {
  max-height: 32px;
}

.preview-drawer__toggle {
  width: 100%;
  background: #f7f9fc;
  border: none;
  border-top: 1px solid #e3e8ee;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #3b6ea5;
  cursor: pointer;
  font-weight: 600;
}

.preview-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid #e3e8ee;
  background: #f7f9fc;
}

.preview-drawer__tabs {
  display: flex;
  gap: 4px;
}

.preview-drawer__tab {
  background: transparent;
  border: none;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 500;
  color: #6c7a8c;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.preview-drawer__tab.is-active {
  color: #3b6ea5;
  border-bottom-color: #3b6ea5;
  font-weight: 600;
}

.preview-drawer__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6c7a8c;
  font-size: 11px;
}

.preview-drawer__table-wrap {
  flex: 1;
  overflow: auto;
}

.preview-drawer__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.preview-drawer__table th {
  text-align: left;
  background: #f4f6f9;
  padding: 6px 10px;
  font-weight: 600;
  color: #3a4a5c;
  border-bottom: 1px solid #e3e8ee;
  white-space: nowrap;
}

.preview-drawer__table td {
  padding: 6px 10px;
  border-bottom: 1px solid #eef2f7;
  color: #3a4a5c;
}

.preview-drawer__role-tag {
  display: inline-block;
  margin-left: 6px;
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 600;
  text-transform: uppercase;
}

.preview-drawer__role-tag--dimension {
  background: #eaf2fb;
  color: #3b6ea5;
}

.preview-drawer__role-tag--measure {
  background: #e9f5ee;
  color: #2d8659;
}

.preview-drawer__empty {
  padding: 24px;
  text-align: center;
  color: #6c7a8c;
}
```

- [ ] **Step 3: Mount the drawer in DataLayerCanvas**

Open `report-canvas/src/components/data-layer/DataLayerCanvas.jsx`. Replace the existing `<DataPreviewPanel />` mount (around line 170) with `<DataPreviewDrawer />`. Add the import at the top:

```javascript
import DataPreviewDrawer from './DataPreviewDrawer.jsx';
```

And replace:

```jsx
{!isEmpty && <DataPreviewPanel />}
```

with:

```jsx
<DataPreviewDrawer />
```

Note: it now always renders (not gated on `!isEmpty`) — the empty state lives inside the drawer.

- [ ] **Step 4: Verify in dev server**

Run: `npm run dev`
Steps:
1. Data Layer tab, no sources added. Bottom drawer shows "No data to preview. Add a source to the model."
2. Click `permit_applications` in catalog. Drawer's "Field Library Preview" tab now shows columns and a few sample rows (from mock data service).
3. Click the source card on canvas. Switch drawer to "Selected Source" tab — shows that source's columns and rows.
4. Click "Joined Output" tab — shows the same data (joining isn't fully executed for prototype, but the tab is wired).
5. Click the chevron to collapse the drawer. Click "Data Preview" to expand again.

- [ ] **Step 5: Commit**

```bash
git add report-canvas/src/components/data-layer/DataPreviewDrawer.jsx \
        report-canvas/src/components/data-layer/DataPreviewDrawer.css \
        report-canvas/src/components/data-layer/DataLayerCanvas.jsx
git commit -m "feat(designer): add bottom data preview drawer with three preview modes"
```

---

## Task 7: Restructure DataLayerCanvas into the three-column layout

**Files:**
- Modify: `report-canvas/src/components/data-layer/DataLayerCanvas.jsx`
- Modify: `report-canvas/src/components/AppShell.jsx`

So far the canvas, catalog, and inspector are rendered separately by AppShell's existing layout. We now flatten everything into a unified three-column layout owned by DataLayerCanvas. This makes the data-layer tab's structure explicit and decouples it from the report-builder tab's layout.

- [ ] **Step 1: Wrap the data-layer tab in a unified layout component**

Edit `report-canvas/src/components/data-layer/DataLayerCanvas.jsx`. At the very bottom, replace the default export with a layout-wrapping version. After the existing `DataLayerCanvasInner` component, replace the existing `export default function DataLayerCanvas` block with:

```jsx
import SourceCatalog from './SourceCatalog.jsx';
import Inspector from './Inspector.jsx';

export default function DataLayerCanvas() {
  return (
    <ReactFlowProvider>
      <div className="data-layer-tab">
        <SourceCatalog />
        <div className="data-layer-tab__main">
          <DataLayerCanvasInner />
        </div>
        <Inspector />
      </div>
    </ReactFlowProvider>
  );
}
```

- [ ] **Step 2: Add the layout styles**

Append to `report-canvas/src/components/data-layer/SourceCatalog.css` (this is the closest existing data-layer stylesheet):

```css
.data-layer-tab {
  display: grid;
  grid-template-columns: 240px 1fr 300px;
  height: 100%;
  overflow: hidden;
}

.data-layer-tab__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #f4f6f9;
}

.data-layer-tab__main .data-layer-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.data-layer-tab__main .data-layer-canvas {
  flex: 1;
  min-height: 0;
}
```

- [ ] **Step 3: Remove duplicate mounts from AppShell**

In `report-canvas/src/components/AppShell.jsx`, when `activeTab === 0` (Data Layer):
- The left sidebar should no longer render `<SourceCatalog />` (now owned by DataLayerCanvas)
- The right sidebar should no longer render `<Inspector />` (also now owned by DataLayerCanvas)
- Collapse the left/right sidebar chrome on this tab — or hide them.

Find the block that renders the sidebars and the center canvas. Wrap the sidebars to only render when `activeTab === 1`:

```jsx
{/* Left sidebar — only render on Report Builder tab; Data Layer owns its own layout */}
{leftOpen && activeTab === 1 && (
  <aside className="sidebar sidebar--left">
    <WidgetPalette />
  </aside>
)}
```

And similarly for the right sidebar:

```jsx
{/* Right sidebar — only on Report Builder tab */}
{rightOpen && activeTab === 1 && (
  <aside className="sidebar sidebar--right">
    {rightPanelTab === 'properties' ? <PropertiesPanel /> : <AIChatPanel />}
  </aside>
)}
```

(Adjust the exact JSX to match what's there — but the conditional is the key change.)

- [ ] **Step 4: Verify in dev server**

Run: `npm run dev`
Steps:
1. Data Layer tab: confirm a clean 3-column layout — Source Catalog on left, canvas in middle, Inspector on right, Data Preview drawer at bottom.
2. No duplicate panels (Inspector or SourceCatalog should not appear in two places).
3. Switch to Report Builder tab: existing Widget Palette + canvas + Properties panel layout still works.
4. Switch back to Data Layer tab: state is preserved (selected sources still on canvas).

- [ ] **Step 5: Commit**

```bash
git add report-canvas/src/components/data-layer/DataLayerCanvas.jsx \
        report-canvas/src/components/data-layer/SourceCatalog.css \
        report-canvas/src/components/AppShell.jsx
git commit -m "refactor(designer): restructure Data Layer tab into unified three-column layout"
```

---

## Task 8: Add Fields tab to the Report Builder palette

**Files:**
- Create: `report-canvas/src/components/report-builder/FieldsTab.jsx`
- Create: `report-canvas/src/components/report-builder/FieldsTab.css`
- Modify: `report-canvas/src/components/report-builder/WidgetPalette.jsx`

The Report Builder's left palette currently contains only Widgets. Add a tab switcher with Widgets / Fields, and render the Field Library in the Fields tab.

- [ ] **Step 1: Create FieldsTab.jsx**

Create `report-canvas/src/components/report-builder/FieldsTab.jsx`:

```jsx
// Forge components: ForgeTextField, ForgeIcon
import { useState, useMemo } from 'react';
import { ForgeTextField } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { groupFieldsBySource } from '../../utils/fieldLibrary.js';
import './FieldsTab.css';

const ROLE_ICONS = {
  dimension: { glyph: '▦', color: '#3b6ea5' },
  measure:   { glyph: '∑', color: '#2d8659' },
};

const MEASURE_KIND_ICON = { glyph: 'ƒ', color: '#7a4ca8' };

export default function FieldsTab() {
  const { fieldLibrary } = useReport();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fieldLibrary;
    return fieldLibrary.filter(f =>
      f.qualifiedName.toLowerCase().includes(q) ||
      f.displayName.toLowerCase().includes(q)
    );
  }, [fieldLibrary, query]);

  const grouped = groupFieldsBySource(filtered);
  const sourceGroups = Object.keys(grouped).filter(k => k !== 'CALCULATED MEASURES');
  const measureGroup = grouped['CALCULATED MEASURES'] || [];

  const onDragStart = (event, field) => {
    event.dataTransfer.setData('application/x-tira-field', JSON.stringify(field));
    event.dataTransfer.effectAllowed = 'copy';
  };

  function iconFor(field) {
    if (field.kind === 'measure') return MEASURE_KIND_ICON;
    return ROLE_ICONS[field.role] || ROLE_ICONS.dimension;
  }

  if (fieldLibrary.length === 0) {
    return (
      <div className="fields-tab__empty">
        <p>No fields yet.</p>
        <p>Add sources in the Data Layer tab to populate the Field Library.</p>
      </div>
    );
  }

  return (
    <div className="fields-tab">
      <div className="fields-tab__search">
        <ForgeTextField density="small">
          <input
            type="text"
            placeholder="Search fields..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </ForgeTextField>
      </div>

      {sourceGroups.map(sourceId => (
        <div key={sourceId} className="fields-tab__group">
          <div className="fields-tab__group-title">{sourceId.toUpperCase()}</div>
          {grouped[sourceId].map(field => {
            const icon = iconFor(field);
            return (
              <div
                key={field.id}
                className="fields-tab__field"
                draggable
                onDragStart={(e) => onDragStart(e, field)}
                title={field.displayName}
              >
                <span className="fields-tab__field-icon" style={{ color: icon.color }}>{icon.glyph}</span>
                <span className="fields-tab__field-name">{field.qualifiedName}</span>
              </div>
            );
          })}
        </div>
      ))}

      {measureGroup.length > 0 && (
        <div className="fields-tab__group fields-tab__group--measures">
          <div className="fields-tab__group-title">CALCULATED MEASURES</div>
          {measureGroup.map(field => (
            <div
              key={field.id}
              className="fields-tab__field fields-tab__field--measure"
              draggable
              onDragStart={(e) => onDragStart(e, field)}
            >
              <span className="fields-tab__field-icon" style={{ color: MEASURE_KIND_ICON.color }}>ƒ</span>
              <span className="fields-tab__field-name">{field.qualifiedName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create FieldsTab.css**

Create `report-canvas/src/components/report-builder/FieldsTab.css`:

```css
.fields-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 8px;
}

.fields-tab__empty {
  padding: 20px 16px;
  text-align: center;
  color: #6c7a8c;
  font-size: 12px;
  line-height: 1.5;
}

.fields-tab__search {
  margin-bottom: 8px;
}

.fields-tab__group {
  margin-bottom: 12px;
}

.fields-tab__group-title {
  font-size: 10px;
  font-weight: 700;
  color: #6c7a8c;
  letter-spacing: 0.5px;
  margin: 6px 4px;
}

.fields-tab__group--measures .fields-tab__group-title {
  color: #7a4ca8;
}

.fields-tab__field {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  font-size: 11px;
  cursor: grab;
  border-radius: 3px;
  user-select: none;
}

.fields-tab__field:hover {
  background: #f4f6f9;
}

.fields-tab__field:active {
  cursor: grabbing;
}

.fields-tab__field--measure {
  background: #faf6fc;
}

.fields-tab__field--measure:hover {
  background: #f4eff8;
}

.fields-tab__field-icon {
  width: 16px;
  text-align: center;
  font-weight: 600;
}

.fields-tab__field-name {
  font-family: 'Menlo', 'Monaco', monospace;
  font-size: 11px;
  color: #3a4a5c;
}
```

- [ ] **Step 3: Wrap WidgetPalette with a tab switcher**

Open `report-canvas/src/components/report-builder/WidgetPalette.jsx`. Refactor so the existing widget content is renamed to a `WidgetsTab` sub-section and a switcher is added at the top. Replace the entire file with:

```jsx
// Forge components: ForgeExpansionPanel, ForgeIcon
import { useState } from 'react';
import { ForgeExpansionPanel, ForgeIcon } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import FieldsTab from './FieldsTab.jsx';

const widgetTypes = {
  visualizations: [
    { type: 'chart', subtype: 'bar', icon: 'bar_chart', label: 'Bar Chart', colSpan: 6, rowSpan: 3 },
    { type: 'chart', subtype: 'line', icon: 'show_chart', label: 'Line Chart', colSpan: 6, rowSpan: 3 },
    { type: 'chart', subtype: 'pie', icon: 'pie_chart', label: 'Pie / Donut', colSpan: 4, rowSpan: 3 },
    { type: 'chart', subtype: 'area', icon: 'area_chart', label: 'Area Chart', colSpan: 6, rowSpan: 3 },
    { type: 'chart', subtype: 'scatter', icon: 'scatter_plot', label: 'Scatter Plot', colSpan: 6, rowSpan: 3 },
  ],
  dataDisplay: [
    { type: 'table', icon: 'table_chart', label: 'Data Table', colSpan: 12, rowSpan: 3 },
    { type: 'kpi', icon: 'speed', label: 'KPI / Metric Card', colSpan: 4, rowSpan: 1 },
  ],
  content: [
    { type: 'text', icon: 'article', label: 'Rich Text Block', colSpan: 12, rowSpan: 1 },
    { type: 'image', icon: 'image', label: 'Image', colSpan: 6, rowSpan: 2 },
    { type: 'divider', icon: 'horizontal_rule', label: 'Divider', colSpan: 12, rowSpan: 1 },
    { type: 'section-header', icon: 'title', label: 'Section Header', colSpan: 12, rowSpan: 1 },
  ],
};

const ICON_STYLES = {
  viz:     { bg: '#eff6ff', fg: '#1d4ed8' },
  data:    { bg: '#f5f3ff', fg: '#7c3aed' },
  content: { bg: '#f3f4f6', fg: '#4b5563' },
};

function WidgetsTab() {
  const { widgets, addWidget } = useReport();
  const getNextRow = () => widgets.length === 0 ? 1 : Math.max(...widgets.map(w => w.gridRow + w.rowSpan));

  const handleClick = (config) => {
    addWidget({
      id: `widget-${Date.now()}`,
      type: config.type,
      title: config.label,
      gridColumn: 1,
      gridRow: getNextRow(),
      colSpan: config.colSpan,
      rowSpan: config.rowSpan,
      config: config.subtype ? { subtype: config.subtype } : {},
    });
  };

  const onDragStart = (event, config) => {
    event.dataTransfer.setData('application/widget', JSON.stringify(config));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const renderItem = (w, colorClass, iconStyle) => (
    <div
      key={`${w.type}-${w.subtype || w.label}`}
      className={`palette-node ${colorClass}`}
      draggable
      onDragStart={(e) => onDragStart(e, w)}
      onClick={() => handleClick(w)}
    >
      <div className="palette-icon-container" style={{ background: iconStyle.bg }}>
        <ForgeIcon name={w.icon} style={{ color: iconStyle.fg, fontSize: 18 }} />
      </div>
      <span>{w.label}</span>
      <ForgeIcon name="drag_indicator" className="palette-drag-hint" />
    </div>
  );

  return (
    <div className="palette">
      <ForgeExpansionPanel open>
        <span slot="header">Visualizations</span>
        <div className="palette-items">
          {widgetTypes.visualizations.map(w => renderItem(w, 'viz', ICON_STYLES.viz))}
        </div>
      </ForgeExpansionPanel>
      <ForgeExpansionPanel open>
        <span slot="header">Data Display</span>
        <div className="palette-items">
          {widgetTypes.dataDisplay.map(w => renderItem(w, 'data', ICON_STYLES.data))}
        </div>
      </ForgeExpansionPanel>
      <ForgeExpansionPanel open>
        <span slot="header">Content</span>
        <div className="palette-items">
          {widgetTypes.content.map(w => renderItem(w, 'content', ICON_STYLES.content))}
        </div>
      </ForgeExpansionPanel>
    </div>
  );
}

export default function WidgetPalette() {
  const [tab, setTab] = useState('widgets');

  return (
    <div className="palette-container">
      <div className="palette-tabs">
        <button className={`palette-tab ${tab === 'widgets' ? 'is-active' : ''}`} onClick={() => setTab('widgets')}>
          WIDGETS
        </button>
        <button className={`palette-tab ${tab === 'fields' ? 'is-active' : ''}`} onClick={() => setTab('fields')}>
          FIELDS
        </button>
      </div>
      <div className="palette-body">
        {tab === 'widgets' ? <WidgetsTab /> : <FieldsTab />}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add styles for the palette tab switcher**

Append to `report-canvas/src/components/report-builder/FieldsTab.css`:

```css
.palette-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.palette-tabs {
  display: flex;
  border-bottom: 1px solid #e3e8ee;
  background: #fafbfc;
}

.palette-tab {
  flex: 1;
  background: transparent;
  border: none;
  padding: 10px 12px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #6c7a8c;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.palette-tab.is-active {
  color: #3b6ea5;
  border-bottom-color: #3b6ea5;
}

.palette-body {
  flex: 1;
  overflow-y: auto;
}
```

- [ ] **Step 5: Verify in dev server**

Run: `npm run dev`
Steps:
1. Open Designer → Data Layer tab → add `permit_applications` and `department_budgets` from the catalog.
2. Switch to Report Builder tab.
3. Left palette now has WIDGETS / FIELDS tabs at the top.
4. Click FIELDS: see permit_applications fields grouped, and department_budgets fields grouped, with ▦/∑ icons.
5. Search "value": only matching fields shown.
6. Click WIDGETS: original widget palette returns.

- [ ] **Step 6: Commit**

```bash
git add report-canvas/src/components/report-builder/FieldsTab.jsx \
        report-canvas/src/components/report-builder/FieldsTab.css \
        report-canvas/src/components/report-builder/WidgetPalette.jsx
git commit -m "feat(designer): add Fields tab to report-builder palette with grouped, draggable fields"
```

---

## Task 9: Replace widget data binding with field bindings

**Files:**
- Modify: `report-canvas/src/context/ReportContext.jsx`
- Modify: `report-canvas/src/components/report-builder/WidgetConfigPanel.jsx`

Widgets currently bind to a single `dataSource` string. We're replacing that with structured `bindings` (an object with named slots like `xAxis`, `yAxis`, `groupBy`, `value`, `columns`). Each slot holds a field qualifiedName.

- [ ] **Step 1: Add a setWidgetBinding action to context**

Open `report-canvas/src/context/ReportContext.jsx`. After the existing `updateWidget` (around line 201), add:

```javascript
  const setWidgetBinding = useCallback((widgetId, slot, fieldId) => {
    setWidgets(prev => prev.map(w => {
      if (w.id !== widgetId) return w;
      const bindings = { ...(w.bindings || {}) };
      if (fieldId == null) {
        delete bindings[slot];
      } else {
        bindings[slot] = fieldId;
      }
      return { ...w, bindings };
    }));
  }, []);
```

Expose it in the context value object:

```javascript
      setWidgetBinding,
```

- [ ] **Step 2: Define slot shapes per widget type**

At the top of `report-canvas/src/components/report-builder/WidgetConfigPanel.jsx`, replace the `DATA_WIDGET_TYPES` constant with a slot definition map:

```javascript
const WIDGET_SLOTS = {
  chart: [
    { id: 'xAxis',   label: 'X axis',     accept: 'dimension' },
    { id: 'yAxis',   label: 'Y axis',     accept: 'measure'   },
    { id: 'groupBy', label: 'Group by',   accept: 'dimension', optional: true },
  ],
  table: [
    { id: 'columns', label: 'Columns',    accept: 'any', multiple: true },
  ],
  kpi: [
    { id: 'value',   label: 'Value',      accept: 'measure'   },
    { id: 'label',   label: 'Label',      accept: 'dimension', optional: true },
  ],
};

const DATA_WIDGET_TYPES = Object.keys(WIDGET_SLOTS);
```

- [ ] **Step 3: Replace the Data Source section with Field Bindings**

In the same file, replace the entire "Data Source Section" block (currently between the `{showDataSource && ( ... )}` boundaries) with a Field Bindings section. The new block:

```jsx
      {/* Field Bindings — for data-driven widgets */}
      {showDataSource && (
        <div className="config-section">
          <h3 className="config-section-title">Field Bindings</h3>
          {(WIDGET_SLOTS[widget.type] || []).map(slot => (
            <SlotEditor
              key={slot.id}
              slot={slot}
              widgetId={widget.id}
              currentFieldId={widget.bindings?.[slot.id]}
            />
          ))}
        </div>
      )}
```

Add the `SlotEditor` helper component above the default export in the same file:

```jsx
function SlotEditor({ slot, widgetId, currentFieldId }) {
  const { fieldLibrary, setWidgetBinding } = useReport();
  const current = fieldLibrary.find(f => f.id === currentFieldId);
  const accept = slot.accept;

  const matches = (f) => {
    if (accept === 'any') return true;
    if (accept === 'dimension') return f.role === 'dimension';
    if (accept === 'measure')   return f.role === 'measure';
    return true;
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/x-tira-field');
    if (!raw) return;
    const field = JSON.parse(raw);
    if (!matches(field)) return;
    setWidgetBinding(widgetId, slot.id, field.id);
  };

  const eligible = fieldLibrary.filter(matches);

  return (
    <div className="binding-slot">
      <label className="binding-slot__label">
        {slot.label} {slot.optional && <span className="binding-slot__optional">(optional)</span>}
      </label>
      {current ? (
        <div
          className={`binding-slot__value binding-slot__value--${current.role}`}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <span>{current.qualifiedName}</span>
          <button className="binding-slot__clear" onClick={() => setWidgetBinding(widgetId, slot.id, null)} aria-label="Clear">×</button>
        </div>
      ) : (
        <div
          className="binding-slot__drop"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          Drag a {accept === 'any' ? 'field' : accept} here
        </div>
      )}
      {eligible.length > 0 && (
        <select
          className="binding-slot__select"
          value={currentFieldId || ''}
          onChange={(e) => setWidgetBinding(widgetId, slot.id, e.target.value || null)}
        >
          <option value="">— pick from list —</option>
          {eligible.map(f => (
            <option key={f.id} value={f.id}>{f.qualifiedName}</option>
          ))}
        </select>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add CSS for binding slots**

Find the existing CSS file imported by `WidgetConfigPanel.jsx`. If there isn't one, create `report-canvas/src/components/report-builder/WidgetConfigPanel.css` and add an import at the top of WidgetConfigPanel.jsx: `import './WidgetConfigPanel.css';`. Add these rules:

```css
.binding-slot {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.binding-slot__label {
  font-size: 10px;
  color: #6c7a8c;
  font-weight: 500;
}

.binding-slot__optional {
  color: #9ca3af;
  font-style: italic;
}

.binding-slot__value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #d4dae3;
  border-radius: 3px;
  padding: 6px 8px;
  font-size: 11px;
  font-family: 'Menlo', 'Monaco', monospace;
  color: #1f2937;
}

.binding-slot__value--dimension { border-color: #3b6ea5; }
.binding-slot__value--measure   { border-color: #2d8659; }

.binding-slot__clear {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 4px;
}

.binding-slot__clear:hover { color: #c44569; }

.binding-slot__drop {
  background: #fff;
  border: 1px dashed #d4dae3;
  border-radius: 3px;
  padding: 8px;
  font-size: 11px;
  color: #a8b2c0;
  text-align: center;
}

.binding-slot__drop:hover {
  border-color: #3b6ea5;
  color: #3b6ea5;
}

.binding-slot__select {
  font-size: 11px;
  padding: 4px 6px;
  border: 1px solid #d4dae3;
  border-radius: 3px;
  background: #fff;
}
```

- [ ] **Step 5: Verify in dev server**

Run: `npm run dev`
Steps:
1. Data Layer tab: add `permit_applications`.
2. Report Builder tab: add a Bar Chart widget by clicking it in the palette.
3. Click the chart on the canvas. Right panel now shows "Field Bindings" with `X axis`, `Y axis`, `Group by` slots — all empty.
4. From the Fields tab on the left, drag `permit.type` into the X axis slot. It populates.
5. Drag `permit.value` into Y axis. Trying to drop `permit.type` (a dimension) onto Y axis fails — measure-only slot rejects it (drop is ignored).
6. Use the dropdown under a slot to pick a different field — confirm it works as an alternate path.
7. Click the × to clear a slot.
8. Add a Table widget → its slot shape is just "Columns".
9. Add a KPI widget → its slot shape is "Value" and "Label".

- [ ] **Step 6: Commit**

```bash
git add report-canvas/src/context/ReportContext.jsx \
        report-canvas/src/components/report-builder/WidgetConfigPanel.jsx \
        report-canvas/src/components/report-builder/WidgetConfigPanel.css
git commit -m "feat(designer): replace widget dataSource string with structured field bindings"
```

---

## Task 10: Build the Parameter Strip above the Report Builder canvas

**Files:**
- Create: `report-canvas/src/components/report-builder/ParameterStrip.jsx`
- Create: `report-canvas/src/components/report-builder/ParameterStrip.css`
- Modify: `report-canvas/src/components/report-builder/PrintCanvas.jsx`

A persistent yellow band above the canvas listing parameters and their defaults. Edits flow back to `parameters` state.

- [ ] **Step 1: Create ParameterStrip.jsx**

Create `report-canvas/src/components/report-builder/ParameterStrip.jsx`:

```jsx
// Forge components: ForgeIcon, ForgeIconButton
import { useState } from 'react';
import { ForgeIcon, ForgeIconButton } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import './ParameterStrip.css';

function formatDefault(p) {
  if (Array.isArray(p.defaultValue)) {
    if (p.defaultValue.length === 0 || p.defaultValue.includes('all')) return 'All';
    return p.defaultValue.join(', ');
  }
  if (p.defaultValue === 'last_90d')  return 'Last 90 days';
  if (p.defaultValue === 'last_30d')  return 'Last 30 days';
  if (p.defaultValue === 'ytd')       return 'Year to date';
  return String(p.defaultValue ?? '—');
}

export default function ParameterStrip() {
  const { parameters, updateParameter } = useReport();
  const [editingId, setEditingId] = useState(null);

  if (parameters.length === 0) {
    return (
      <div className="param-strip param-strip--empty">
        <ForgeIcon name="tune" style={{ fontSize: 14 }} />
        <span>No parameters defined. Add them in the Data Layer's Inspector → MODEL → Parameters.</span>
      </div>
    );
  }

  return (
    <div className="param-strip">
      <span className="param-strip__label">
        <ForgeIcon name="tune" style={{ fontSize: 14 }} />
        PARAMETERS
      </span>
      {parameters.map(p => (
        <div key={p.id} className="param-strip__chip">
          <span className="param-strip__chip-name">{p.displayName}:</span>
          {editingId === p.id ? (
            <input
              autoFocus
              className="param-strip__chip-input"
              defaultValue={String(p.defaultValue)}
              onBlur={(e) => { updateParameter(p.id, { defaultValue: e.target.value }); setEditingId(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingId(null); }}
            />
          ) : (
            <span className="param-strip__chip-value" onClick={() => setEditingId(p.id)}>
              {formatDefault(p)}
            </span>
          )}
        </div>
      ))}
      <div className="param-strip__hint">Set defaults · Used by chat AI</div>
    </div>
  );
}
```

- [ ] **Step 2: Create ParameterStrip.css**

Create `report-canvas/src/components/report-builder/ParameterStrip.css`:

```css
.param-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fffbe8;
  border-bottom: 1px solid #f0e3a0;
  font-size: 11px;
}

.param-strip--empty {
  color: #a08400;
  font-style: italic;
}

.param-strip__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  color: #a08400;
  letter-spacing: 0.5px;
  margin-right: 4px;
}

.param-strip__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fff;
  border: 1px solid #d4ca8a;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.param-strip__chip-name {
  color: #6c7a8c;
}

.param-strip__chip-value {
  color: #1f2937;
  cursor: pointer;
  font-weight: 500;
}

.param-strip__chip-value:hover {
  text-decoration: underline;
  text-decoration-style: dotted;
}

.param-strip__chip-input {
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  width: 100px;
}

.param-strip__hint {
  margin-left: auto;
  color: #a08400;
  font-size: 10px;
  font-style: italic;
}
```

- [ ] **Step 3: Mount ParameterStrip above PrintCanvas**

Open `report-canvas/src/components/report-builder/PrintCanvas.jsx`. Add the import at the top:

```javascript
import ParameterStrip from './ParameterStrip.jsx';
```

Find the top-level JSX returned by the component (the wrapping div). Insert `<ParameterStrip />` as the first child, above the canvas toolbar / pages.

If the structure is something like:
```jsx
return (
  <div className="print-canvas-wrapper">
    <CanvasToolbar ... />
    <div className="print-canvas">...</div>
  </div>
);
```

Make it:
```jsx
return (
  <div className="print-canvas-wrapper">
    <ParameterStrip />
    <CanvasToolbar ... />
    <div className="print-canvas">...</div>
  </div>
);
```

- [ ] **Step 4: Verify in dev server**

Run: `npm run dev`
Steps:
1. Report Builder tab: yellow Parameter strip shows above the canvas with `Date Range: Last 90 days` and `Department: All`.
2. Click "Last 90 days" — turns into an input. Type "Last 30 days", press Enter. Value updates.
3. Switch to Data Layer tab → Inspector → MODEL. Confirm the default for the parameter you just edited is updated there too (proves shared state).
4. Add a new parameter via the Inspector. Switch back to Report Builder — new chip appears in the strip.

- [ ] **Step 5: Commit**

```bash
git add report-canvas/src/components/report-builder/ParameterStrip.jsx \
        report-canvas/src/components/report-builder/ParameterStrip.css \
        report-canvas/src/components/report-builder/PrintCanvas.jsx
git commit -m "feat(designer): add parameter strip above report builder canvas"
```

---

## Task 11: Wire field-drop onto widgets on the canvas

**Files:**
- Modify: `report-canvas/src/components/report-builder/WidgetWrapper.jsx`

Currently, dragging a field from the Fields tab only drops onto config-panel slots. Add the ability to drop a field directly onto a widget on the canvas — which will intelligently fill the next empty slot (dimension → first dim slot, measure → first measure slot).

- [ ] **Step 1: Read the current WidgetWrapper to understand its drop surface**

Run: `cat /Users/stephenwebb/Desktop/TIRA/report-canvas/src/components/report-builder/WidgetWrapper.jsx | head -80`

Identify the outer wrapping div of the widget. That's where the drop handlers go.

- [ ] **Step 2: Add field-drop logic**

Open `report-canvas/src/components/report-builder/WidgetWrapper.jsx`. Add the imports at the top:

```javascript
import { useReport } from '../../context/ReportContext.jsx';
```

(skip if already present). Then add a helper to pick the next empty slot:

```javascript
const SLOTS_FOR_TYPE = {
  chart: [
    { id: 'xAxis',   accept: 'dimension' },
    { id: 'yAxis',   accept: 'measure'   },
    { id: 'groupBy', accept: 'dimension' },
  ],
  table: [
    { id: 'columns', accept: 'any', multiple: true },
  ],
  kpi: [
    { id: 'value', accept: 'measure'   },
    { id: 'label', accept: 'dimension' },
  ],
};

function pickSlotForField(widget, field) {
  const slots = SLOTS_FOR_TYPE[widget.type] || [];
  // Find first empty slot that accepts the field's role
  for (const slot of slots) {
    const filled = widget.bindings?.[slot.id];
    if (filled && !slot.multiple) continue;
    if (slot.accept === 'any') return slot.id;
    if (slot.accept === field.role) return slot.id;
  }
  // Otherwise, overwrite first accepting slot
  const fallback = slots.find(s => s.accept === field.role || s.accept === 'any');
  return fallback?.id;
}
```

Inside the component, get context and add drop handlers to the outer wrapping div. Find the outer `<div>` and add:

```jsx
const { setWidgetBinding } = useReport();

const onWidgetDragOver = (e) => {
  // Only treat as drop target if the drag type is a field
  if (Array.from(e.dataTransfer.types).includes('application/x-tira-field')) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }
};

const onWidgetDrop = (e) => {
  const raw = e.dataTransfer.getData('application/x-tira-field');
  if (!raw) return;
  e.preventDefault();
  e.stopPropagation();
  const field = JSON.parse(raw);
  const slotId = pickSlotForField(widget, field);
  if (slotId) setWidgetBinding(widget.id, slotId, field.id);
};
```

Spread onto the outer div:

```jsx
<div
  ref={...}
  className="widget-wrapper ..."
  onDragOver={onWidgetDragOver}
  onDrop={onWidgetDrop}
  ...
>
```

(Adjust to merge with existing handlers — if the wrapper already has `onDragOver` for widget repositioning, branch by checking `e.dataTransfer.types` so field drops don't conflict with widget moves.)

- [ ] **Step 3: Verify in dev server**

Run: `npm run dev`
Steps:
1. Data Layer: add `permit_applications`.
2. Report Builder: add a Bar Chart widget.
3. Drag `permit.type` from the Fields tab directly onto the chart widget on the canvas. The widget's X axis binding fills. Right panel reflects it.
4. Drag `permit.value` onto the same widget. Y axis fills.
5. Drag a third dimension (e.g., `permit.status`). Group by fills.
6. Confirm right panel and on-canvas binding stay in sync.

- [ ] **Step 4: Commit**

```bash
git add report-canvas/src/components/report-builder/WidgetWrapper.jsx
git commit -m "feat(designer): enable direct field-drop onto widgets on the canvas"
```

---

## Task 12: Pre-populate semantic model from chat handoff context

**Files:**
- Modify: `report-canvas/src/context/ReportContext.jsx`

When a user comes from the chat with handoff context, we already build a legacy source node. Make sure the new semantic-model state also gets initialized so the user lands in a productive state on Day 1.

- [ ] **Step 1: Add a helper to derive selectedSources from handoff**

In `report-canvas/src/context/ReportContext.jsx`, add this helper near the top of the file (alongside `buildHandoffNodes`):

```javascript
/**
 * Try to map a handoff context's dataSource to a known catalog source.
 * If we can match, return a selectedSources entry. Otherwise return null.
 */
function buildHandoffSelectedSource(ctx) {
  if (!ctx) return null;
  const fields = (ctx.columns || []).map(c => c.property || c.header);

  // Naïve match: lowercase + underscore the dataSource against catalog ids
  const ds = (ctx.dataSource || '').toLowerCase().replace(/[^a-z0-9_]/g, '_');
  // Try direct id first
  // Use the catalog dynamically so we don't double-define ids here.
  // Caller will fall back to a synthetic id if no match.
  return { sourceId: ds, includedFields: fields, isSynthetic: true };
}
```

(For prototype-grade matching, this is best-effort. If no real catalog match, we still create a record so the user sees something in the field library.)

- [ ] **Step 2: Initialize selectedSources from handoff on mount**

In `ReportProvider`, change the `selectedSources` initializer from `useState([])` to:

```javascript
  const [selectedSources, setSelectedSources] = useState(() => {
    const handoff = buildHandoffSelectedSource(handoffContext);
    return handoff ? [handoff] : [];
  });
```

- [ ] **Step 3: Verify in dev server**

Run: `npm run dev`
Steps:
1. Open the TIRA homepage. Run a query → open the chat flow → click "Open in Report Designer" (or similar handoff path).
2. Designer opens. Switch to Data Layer tab.
3. Confirm: a source is already in `selectedSources` (it appears on canvas or at least in the Inspector's Field Library).
4. Switch to Report Builder. The Fields tab shows fields from the handoff context.

(This is best-effort because the chat's `dataSource` strings don't match our hardcoded catalog ids — for now we accept "synthetic" source ids in the field library. A later task can clean this up by extending the catalog.)

- [ ] **Step 4: Commit**

```bash
git add report-canvas/src/context/ReportContext.jsx
git commit -m "feat(designer): pre-populate semantic model from chat handoff context"
```

---

## Self-Review

After finishing all tasks, verify the build works end-to-end:

1. **Run `npm run dev`** and complete this full flow:
   - Open the Report Designer with no handoff → land on Data Layer tab
   - Add 2 sources from the catalog → see them on the canvas with embedded fields
   - Click a source → Inspector → uncheck a couple fields → Field Library shrinks
   - Switch Inspector to MODEL → add a calculated measure (it appears in the library)
   - Switch to Report Builder → see the Parameter strip at top
   - Open the Fields tab in the palette → confirm new fields + measure are listed
   - Add a Bar Chart widget → drag fields onto it → bindings populate
   - Click the chart → right panel shows Field Bindings with the same fields
   - Drag a measure onto the chart's Y axis → it accepts
   - Try dragging a dimension onto the Y axis → it should reject (or the strict matching should only accept measures)

2. **Visual check via the visual companion** if useful: take a screenshot of the final Data Layer screen and the Report Builder screen.

3. **Git log** should show 12 clean commits.

If any step fails, debug and add a follow-up commit. Then update this self-review to confirm completion.

---

## Notes for the Implementer

- **You are working in a prototype, not a production system.** Prioritize getting the visual + interaction flow working over perfect code organization. Some duplication is fine.
- **The existing `nodes` / `edges` / `generatedData` state stays alongside the new semantic-model state.** Don't try to remove or unify them in this plan — that's a future refactor. The new state is the source of truth for the Field Library and the new Inspector; the old state still drives ReactFlow rendering and the legacy chat-handoff path.
- **If Forge components don't behave as expected** (a common pain point), drop down to plain HTML inputs/buttons styled to match. The CSS in this plan assumes you'll do that when needed.
- **Don't add a test framework.** This project has none. Verification is visual + console-log only.
- **Don't skip the source-schemas file.** The Inspector's selection mode and the Field Library both depend on it being accurate. If you add a new source to the catalog, also add its schema.
