# Data Layer → Design Layer Flow

**Date:** 2026-05-27
**Status:** Design approved, ready for implementation planning
**Scope:** TIRA Report Designer — how technical builders configure data and how that data hydrates the Report Builder

## Context

The Report Designer is the surface where **technical builders** create standard, reusable reports. The Data Layer they configure here doesn't just power a single report — it publishes a **semantic model** that two downstream consumers rely on:

1. **The Report Builder** (same designer, second tab) — drag fields onto widgets to compose the visual report
2. **The end-user chat experience** (TIRA homepage, ad-hoc reporting) — the AI queries this semantic model to answer natural-language requests

This dual consumption is why the data layer needs to produce more than "named tables." It needs a coherent, query-able model with fields, joins, measures, and parameters.

## Personas

- **Primary: Technical builder** — works in the Report Designer. Comfortable with joins, parameters, stored procedures. Coming from SSRS / EPL form-based reporting backgrounds.
- **Secondary: End user** — does *not* enter the Report Designer. Lives in the chat experience. Consumes the semantic models the builder published.
- **Tertiary: Report consumer** — receives polished outputs. Doesn't touch either surface.

## The Semantic Model — 5 Building Blocks

The Data Layer tab produces a Semantic Model with five layers:

### 1. Sources
Raw data inputs from the underlying systems (EPL tables, ERP stored procs, Courts views).

- **Drawn from a known catalog** (not generic "add a connector" tiles). The catalog reflects the universe of data the org actually has.
- Each source on the canvas shows: name, system (EPL/ERP/Courts), row count, freshness, and the fields the builder has chosen to include.

### 2. Fields
Typed columns from each source, with metadata.

- Each field carries: display name, data type, format, description, sample values, and a **dimension vs. measure** tag.
- Builders pick which fields to include (subset of the source's full column list).

### 3. Relationships
Joins between sources, defined once and reused throughout the model.

- Rendered as edges between source cards on the canvas.
- Each edge carries: join type (left/inner/right), key fields on each side, cardinality (1:1, 1:N, N:1).
- The model resolves joins automatically when a widget pulls fields from multiple sources.

### 4. Calculated Measures
Derived aggregations expressed against fields (`SUM`, `AVG`, `COUNT`, ratios).

- Examples: `total_permit_value = SUM(permit.value)`, `permits_per_capita = COUNT(permit.id) / dept.population`.
- Appear in the Field Library as first-class fields alongside raw source fields.
- Marked with a distinct icon (`ƒ`) in the palette.

### 5. Parameters
Runtime filters with defaults — `date_range`, `department`, `permit_type`.

- Set by the builder with defaults.
- Used as the runtime knobs end users adjust in the chat experience.
- Also wired into per-widget filters in the Report Builder.

**The Output (the contract):** a published Semantic Model exposing fields, measures, and parameters. The Report Builder consumes this as a Field Library. The chat-side AI consumes this as a query target.

## Data Layer Screen Design

Three columns plus a bottom drawer.

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│ [Report Name]   DATA LAYER · REPORT BUILDER       [3,421 rows] │
├──────────┬──────────────────────────────────┬─────────────────┤
│          │                                   │                 │
│ Source   │        Canvas                     │  Inspector      │
│ Catalog  │  (graph of sources + relations)   │  (SELECTION /   │
│          │                                   │   MODEL tabs)   │
│          │                                   │                 │
├──────────┴──────────────────────────────────┴─────────────────┤
│ Data Preview Drawer                                            │
│ [Selected Source] [Joined Output] [Field Library Preview]      │
└────────────────────────────────────────────────────────────────┘
```

### Left: Source Catalog

- Search-filterable list of known sources, grouped by system (EPL, ERP, Courts).
- Each catalog entry shows name, source type (table/stored proc/view), and whether it's already on the canvas.
- Click or drag to add to the canvas.
- This replaces the current generic `SourcePalette` tiles.

### Center: Canvas

- Visual graph of sources (nodes) and relationships (edges).
- Each source card shows: name, system, row count, the 3-5 selected fields (with "+N more" affordance).
- Edges show the join expression (`permit.department_id = dept.id`) and join type.
- Built on the existing ReactFlow foundation; nodes evolve from generic "source/transform/output" to typed source cards with embedded field display.

### Right: Inspector Panel

Two modes selectable via segmented control at top:

**SELECTION mode** — context-sensitive:
- Source selected: configure field inclusion (checkbox list with dim/measure tagging), parameters used by this source, source-level metadata.
- Edge (relationship) selected: configure join type, key fields, cardinality.
- Nothing selected: shows the MODEL view by default.

**MODEL mode** — the published contract:
- **Fields Library** — all included fields, grouped by source.
- **Calculated Measures** — add/edit derived expressions.
- **Parameters** — add/edit runtime parameters with defaults.

### Bottom: Data Preview Drawer

Tabular preview with three viewing modes:

- **Selected Source** — raw rows from the currently selected source.
- **Joined Output** — rows after all configured joins are applied. Builders test that joins produce expected results.
- **Field Library Preview** — what the Report Builder will see (the published model output).

Collapsible. Always shows row counts and sample data.

## Report Builder Side — Consuming the Model

The Report Builder evolves to consume the semantic model.

### Three additions

**1. "Fields" tab in the left palette**

The left palette gets a tab switcher: **WIDGETS / FIELDS / LAYERS**.

Fields tab content:
- Grouped by source.
- Each field shown with icon:
  - `▦` blue — dimension
  - `∑` green — raw measure
  - `ƒ` purple — calculated measure
- Search/filter at top.
- Draggable to canvas widgets.

**2. Widget binding — drag or dropdown**

Two parallel binding mechanisms, both reaching the same end state:

- **Drag a field onto a widget** — it intelligently fills the next empty slot (dimension → axis/group, measure → value).
- **Right-rail config panel** — explicit dropdowns for each slot (X-axis, Y-axis, Group by, Filter). Picks from the full Field Library.

Drag is Tableau-familiar (modern, exploratory). Dropdowns are SSRS-familiar (precise, structured). Both supported.

**3. Parameter strip at top of canvas**

A persistent strip above the canvas showing all parameters and their current default values.

- Builder edits defaults here.
- These defaults are also the runtime values end users adjust via the chat AI.
- Visually distinct (warm yellow band) so builders know they're authoring a parameterized report.

### No "Publish" step

The semantic model is shared state across both tabs (lives in `ReportContext`). Switching to the Report Builder always reflects the current Data Layer state. No build/publish/sync gesture required.

## Entry States

The Data Layer must support three entry scenarios gracefully:

1. **Handoff from chat** — AI populated the model based on the user's prior conversation. The user lands on the Data Layer tab with sources and basic joins pre-configured. They review and refine.
2. **Blank canvas, known need** — user adds sources manually from the catalog.
3. **Copy/adapt existing report** — user opens an existing report and modifies its data layer (swap source, change params, add measure).

In all three, the screen layout is identical. Only the starting state of the canvas differs.

## What This Design Intentionally Does Not Include (YAGNI)

- **No full enterprise dimensional modeling.** No hierarchies, no time intelligence (YTD/MTD as first-class features), no custom aggregation functions beyond simple expressions. Sources → Fields → Joins → Measures → Parameters is sufficient depth for the technical-builder persona.
- **No semantic layer versioning.** Models are not versioned independently from the report. (A future concern — for now, the model lives with its report.)
- **No cross-report model sharing.** Each report has its own semantic model. Sharing across reports is a future feature.
- **No real query execution engine.** This is still a prototype. The model is configured; data is sourced from the existing mock services (`dataService.js`). Joins are visualized but not executed against real data.

## Architectural Implications for Implementation

(Notes for the implementation plan — not part of the design spec proper.)

- **`ReportContext`** gains new state: `sources`, `relationships`, `measures`, `parameters` — these supplement or replace today's `nodes` / `edges` / `generatedData` / `datasets`.
- **The "Fields Library"** is a derived selector on context state: `useMemo(() => buildFieldLibrary(sources, measures), [...])`.
- **The Source Catalog** needs a source registry — at prototype stage, hardcoded from `user-context.js` domain data. Eventually a real catalog API.
- **Drag-and-drop** uses existing `@dnd-kit/core` infrastructure.
- **The Inspector's MODEL tab** is the most net-new UI component — a tabbed panel for fields, measures, and parameters.

## Open Questions for Future Sessions

- **How does the AI use the semantic model when answering chat queries?** Specifically: does the AI generate ad-hoc field combinations, or only invoke pre-built measures?
- **Where do permissions/visibility live?** A source might be visible to some departments but not others. Today this is encoded in `user-context.js` — does it become a per-source attribute on the model?
- **How are models discovered by other reports?** If a builder wants to reuse the "Permit Activity" model for a new report, how does that surface?

These are intentionally deferred from this design — they don't affect the screen-level flow we just locked in.
