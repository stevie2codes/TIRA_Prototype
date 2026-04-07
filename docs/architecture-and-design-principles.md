# TIRA: Architecture & Design Principles

**Document type:** Technical product audit
**Date:** March 31, 2026
**Audience:** Product leadership, design, engineering

---

## 1. Vision Summary

TIRA replaces the traditional **search-and-build** reporting workflow with a **describe-and-review** model. Instead of navigating menus, configuring parameters, and assembling reports manually, users describe what they need in natural language and review AI-generated outputs. Manual control surfaces remain available for power users, but AI is the primary entry point.

The core thesis: **reporting should start with a question, not a tool.**

---

## 2. Product Architecture

### 2.1 The Experience Funnel

TIRA's UX follows a progressive disclosure funnel — each stage narrows focus while deepening control:

```
Homepage (Orientation)
  → Conversational Workspace (Exploration)
    → Split-View (Analysis)
      → Report Designer (Construction)
        → Output & Distribution (Delivery)
```

| Stage | Purpose | User Effort | AI Role |
|-------|---------|-------------|---------|
| **Homepage** | Orient, recall, discover | Minimal — scan and click | Surface recents, suggest queries |
| **Conversational Workspace** | Ask questions, get answers | Natural language input | Generate data responses, match reports |
| **Split-View** | Inspect, refine, compare | Filter, toggle views, chat | Refine results via conversation |
| **Report Designer** | Build custom layouts | Drag-and-drop, configure | Pre-populate from chat context |
| **Output & Distribution** | Share, schedule, export | Select recipients and cadence | (Not yet prototyped) |

**Design principle:** Each stage should be *independently useful*. A user who never leaves the homepage still gets value from recents and suggestions. A user who stops at the chat still gets a data answer. The funnel rewards depth without requiring it.

### 2.2 Two Application Surfaces

TIRA prototypes two distinct entry points that share a common AI interaction layer:

**TIRA (Query-Driven Reporting)**
- Centered AI prompt as hero element
- Tabbed content: Standard Reports | Ask a Question | Recent
- Greeting-first, task-second layout
- Side menu for report library access

**Hub (Operational Dashboard)**
- Icon rail navigation with dense data table
- Floating chat as secondary interaction mode
- Data-first, AI-second layout
- Traditional CRUD surface with AI augmentation

**Design principle:** AI should meet users where they already work. TIRA is for users who *start* with a question. Hub is for users who *arrive at* a question while working with data. Both converge on the same conversational workspace.

---

## 3. Interaction Design Principles

### 3.1 AI as Transparent Partner, Not Black Box

Every AI response in TIRA includes a **Data Transparency** section with four disclosure panels:

| Disclosure | What it shows | Why it matters |
|------------|---------------|----------------|
| **Data Source** | System name, record count, last updated timestamp | Users need to know *where* data comes from to trust it |
| **SQL Query** | Generated query with copy-to-clipboard | Technical users need to verify logic; all users need auditability |
| **Assumptions** | Interpretation choices the AI made | Surfaces ambiguity so users can correct misinterpretations |
| **Data Citations** | Source tables and join logic | Establishes lineage for compliance and debugging |

**Design principle:** Trust is built through transparency, not accuracy alone. A correct answer the user can't verify is less useful than a visible answer they can inspect. Every AI output should be *auditable* — the user should be able to trace any number back to its source.

### 3.2 Progressive Refinement Over Configuration

Rather than presenting upfront configuration screens, TIRA uses a **conversational refinement** model:

1. **Initial response** — Best-effort answer with default assumptions
2. **Refinement chips** — One-click data shaping (filter, group, sort, compare)
3. **Chat follow-ups** — Natural language adjustments
4. **Split-view tools** — Direct manipulation (filters, view toggles, templates)
5. **Designer handoff** — Full layout control when conversation isn't enough

The refinement system categorizes user intent into three tiers:

| Tier | Trigger | Response |
|------|---------|----------|
| **Card** | Data-shaping request (filter, group, time range) | Collapse previous card, show new data response |
| **Text** | Clarification or explanation request | Conversational reply, no data change |
| **Handoff** | Complex layout/structural request | Nudge toward Report Designer |

**Design principle:** Start with the answer, not the form. Let the user shape the output iteratively rather than requiring them to specify everything upfront. Each refinement should feel like a conversation turn, not a configuration step.

### 3.3 Standard Reports as AI Accelerators

TIRA treats existing standard reports not as static artifacts but as **high-confidence shortcuts**. When a user's query closely matches a known report, the system:

1. Matches the query against report metadata using keyword-based semantic matching
2. Classifies confidence as high, medium, or low
3. **High confidence** — Shows the standard report card directly (skip the ad-hoc response)
4. **Medium confidence** — Shows the ad-hoc response *plus* a recommendation to the matching report
5. **Low confidence** — Ad-hoc response only

**Design principle:** Don't make users choose between AI and existing reports. The AI should know what already exists and route users to it when appropriate. Standard reports are a trust anchor — they're familiar, tested, and sanctioned.

### 3.4 Report-as-Living-Object

Reports in TIRA are not static exports — they're persistent, versionable, shareable objects:

- **Saved Views** — Named parameter overrides on a base report (e.g., "Felonies Only — Main Facility")
- **Master-to-derived relationships** — A saved view points back to its parent report
- **Session persistence** — Views survive navigation and can be recalled from the homepage
- **Template system** — Branded output wrappers (header/footer, color scheme) applied non-destructively

**Design principle:** Any ad-hoc query that proves useful should be promotable to a saved, named, shareable asset with zero friction. The boundary between "something I just asked" and "a report I run every week" should be a single click.

---

## 4. Technical Architecture

### 4.1 Application Shell

```
index.html
├── forge-scaffold (app shell)
│   ├── forge-app-bar (header)
│   │   ├── App Switcher (TIRA ↔ Hub)
│   │   ├── Menu Toggle (TIRA only)
│   │   ├── Search
│   │   ├── AI Sparkle Button (Hub only)
│   │   └── User Actions (help, notifications, avatar)
│   └── #view-container (body)
│       ├── tira-view (homepage)
│       └── hub-view (dashboard)
└── src/main.js (initialization)
```

**Routing:** Hash-based (`#/view-name`), minimal — two views registered, swapped by destroying and re-rendering. No client-side state preserved across navigation (intentional for prototype scope).

**Component registration:** Forge web components are defined imperatively in `main.js` before first render. Forge AI components self-register on import.

### 4.2 Module Dependency Map

```
main.js (entry point)
├── router.js (hash routing)
├── app-switcher.js (view switching)
├── user-context.js (user profile, domains, permissions)
├── tira-view.js (homepage)
│   ├── chat-flow.js (core interaction engine, ~2,171 lines)
│   │   ├── mock-data.js (query suggestions)
│   │   ├── standard-reports.js (report definitions)
│   │   ├── report-matcher.js (query → report matching)
│   │   ├── standard-report-card.js (recommendation UI)
│   │   ├── output-templates.js (branded output wrappers)
│   │   └── report-canvas/mount.jsx (React designer bridge)
│   ├── standard-report-viewer.js (report rendering)
│   └── saved-views.js (parameter persistence)
└── hub-view.js (dashboard)
    └── hub-chat-panel.js (floating chat)
```

**Key observation:** `chat-flow.js` at ~2,171 lines is the gravitational center of the application. It owns the conversational workspace, split-view, query cards, refinement system, and designer handoff. In a production architecture, this would decompose into several focused modules.

### 4.3 The Split-View Pattern

The split-view is TIRA's most architecturally significant pattern — it's where conversation meets data:

```
┌─────────────────────────────────────────────────┐
│ custom-split-container                          │
├──────────────┬──┬───────────────────────────────┤
│ Chat Panel   │  │ Report Panel                  │
│ (320-600px)  │  │ (flex: 1)                     │
│              │  │                               │
│ Messages     │D │ Title bar + data source       │
│ from chat    │R │ View toggle (Table/Chart/SQL)  │
│ session      │A │ Template picker               │
│              │G │ Filter bar                    │
│ Prompt       │  │ Content area                  │
│ input        │  │                               │
├──────────────┴──┴───────────────────────────────┤
```

**Transition:** The chat-to-split-view transition is animated — messages physically move from the full-width chat into the left panel while the report panel slides in from the right. This preserves conversational context while adding data manipulation tools.

**Cross-panel coordination:** Callback-based (`onFilterChange`, `onViewChange`, `onClose`). No shared state store — each panel owns its state and communicates via function calls.

### 4.4 Data Flow

```
User Input (typed or clicked)
    ↓
openChatFlow() — opens fullscreen dialog
    ↓
runConversation() — timed sequence:
    ├── 0ms:    User message rendered
    ├── 500ms:  Thinking indicator
    ├── 2500ms: matchStandardReports() → confidence tier
    │   ├── high:   Standard Report Card
    │   ├── medium: Query Card + recommendation
    │   └── low:    Query Card only
    ↓
User clicks "Explore Results"
    ↓
transitionToSplitView() — builds dual-panel layout
    ├── Left:  Chat messages + prompt (preserved)
    └── Right: buildReportPanel() → toolbar + filters + data views
    ↓
User clicks refinement chip
    ↓
getRefinementTier() → card | text | handoff
    ├── card:    Collapse old card, show new data
    ├── text:    Conversational reply
    └── handoff: Designer nudge → mountDesigner()
                    ↓
              React app (report-canvas/)
              reads sessionStorage handoff
              provides full layout editor
```

**State persistence:** `sessionStorage` only (prototype-appropriate). Two keys:
- `tira-saved-views` — Saved report parameter overrides
- `tira-handoff-context` — Chat-to-designer context transfer

### 4.5 React Integration (Report Designer)

The Report Designer is a separate React 19 application (`report-canvas/`) that mounts inside the main app's dialog via lazy loading:

```
Main App (Vanilla JS)
    ↓ sessionStorage handoff
    ↓ lazy import('/report-canvas/src/mount.jsx')
    ↓ mountDesigner(element) → createRoot().render(<App />)
    ↓
React App
├── ReportContext (reads handoff, manages state)
├── AppShell (layout)
│   ├── DashboardCanvas (grid-based widget placement)
│   ├── PrintCanvas (print preview)
│   ├── DataLayerCanvas (XY Flow node editor)
│   └── WidgetPalette (drag-and-drop library)
├── WidgetConfigPanel (property inspector)
└── AIChatPanel (conversational design assistance)
```

**Isolation principle:** The React app is fully self-contained. Communication is one-way (main → React via sessionStorage). The back button unmounts React and restores the vanilla JS split-view.

---

## 5. Design System Usage

### 5.1 Forge Component Inventory

| Category | Components Used |
|----------|----------------|
| **Shell** | `forge-scaffold`, `forge-app-bar`, `forge-app-bar-menu-button`, `forge-app-bar-search` |
| **Actions** | `forge-button`, `forge-icon-button`, `forge-chip` |
| **Display** | `forge-icon`, `forge-avatar`, `forge-table` |
| **Layout** | `forge-split-view`, `forge-split-view-panel`, `forge-toolbar` |
| **Overlay** | `forge-dialog` |
| **AI** | `forge-ai-prompt`, `forge-ai-suggestions`, `forge-ai-chat-interface`, `forge-ai-user-message`, `forge-ai-response-message`, `forge-ai-thinking-indicator`, `forge-ai-floating-chat` |

### 5.2 Custom Components (Beyond Forge)

| Component | Purpose |
|-----------|---------|
| **Query Card** | Primary AI response format — summary, mini table, transparency disclosures, refinement chips |
| **Standard Report Card** | Recommendation card for matched standard reports |
| **Standard Report Viewer** | Modular report renderer — KPI rows, charts, tables, grouped tables, summary rows |
| **Custom Split-View** | Draggable chat + report panel (extends Forge split-view panels) |
| **Hub Chat Panel** | Floating chat content panel for Hub view |
| **App Switcher** | Grid dropdown for TIRA ↔ Hub switching |
| **Side Menu** | Slide-out navigation drawer (TIRA view) |

### 5.3 Visual Language

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#3f51b5` (Indigo) | App bar, active states, CTAs, accent |
| Surface | `#ffffff` | Cards, panels, inputs |
| Background | `#fafafa`, `#f0f1fa`, `#f7f8ff` | Sections, hover states, chip fills |
| Text Primary | `rgba(0, 0, 0, 0.87)` | Headings, labels |
| Text Secondary | `rgba(0, 0, 0, 0.6)` | Descriptions, placeholders |
| Text Tertiary | `rgba(0, 0, 0, 0.4)` | Metadata, timestamps |
| Border | `#e0e0e0`, `#e8e8e8` | Cards, inputs, dividers |
| Card Radius | `8px` | Cards, buttons |
| Modal Radius | `12px` | Modals, dropdowns |
| Card Shadow | `0 2px 8px rgba(0,0,0,0.08)` | Resting elevation |
| Modal Shadow | `0 8px 32px rgba(0,0,0,0.14)` | Overlays |

---

## 6. Information Architecture

### 6.1 User Context & Permissions Model

```
User (Sarah Webb, Senior Planner, Community Development)
    ↓
Department → Domain Mapping
    ├── Community Development → EPL (Permits, Code Enforcement, Licensing, Inspections)
    ↓
Filtered Content
    ├── Visible domains (scoped to department)
    ├── Visible standard reports (scoped to department)
    ├── Suggested questions (scoped to datasets)
    └── Recent activity (scoped to user)
```

**Design principle:** The AI should never show a user something they can't access. Permissions filtering happens *before* display, not as an error state after interaction.

### 6.2 Content Taxonomy

```
Domains (product lines)
├── EPL — Enterprise Permitting & Licensing
│   ├── Datasets: Permits, Code Enforcement, Licensing, Inspections
│   └── Reports: Permit Issuance Register, Inspection Activity Log, Code Violations Summary
├── ERP — Enterprise Resource Planning
│   ├── Datasets: Finance, HR & Payroll, Utilities, Purchasing
│   └── Reports: Budget vs. Actuals
└── Courts & Justice
    ├── Datasets: Cases, Arrests, Warrants, Dockets
    └── Reports: Daily Booking Log
```

---

## 7. Design Principles Summary

These are the governing principles behind TIRA's UX decisions, derived from the prototype's behavior:

### 1. Question First, Tool Second
The primary input is always a natural language question, not a menu selection or form. Every screen either *asks* the user what they need or *shows* what they asked for.

### 2. Transparency Builds Trust
Every AI-generated output exposes its data source, query logic, assumptions, and citations. Users can always answer: "Where did this number come from?"

### 3. Progressive Depth
Start with the simplest useful answer. Let users drill deeper through conversation, filters, view toggles, and eventually the full designer — but never require it.

### 4. Reports Are Conversations
A report isn't a static document — it's the current state of an ongoing dialogue between a user and their data. Saved views, refinements, and chat history are all part of the report's identity.

### 5. AI Knows What Exists
When a standard report already answers the user's question, AI should surface it rather than generating a redundant ad-hoc response. Existing assets are trust anchors.

### 6. Meet Users Where They Work
AI appears differently depending on context — hero prompt on the homepage, floating chat in the dashboard, embedded panel in split-view. The interaction model adapts; the capability doesn't change.

### 7. Ad-Hoc to Asset in One Click
Any query result should be saveable, nameable, and shareable without friction. The gap between "I just asked this" and "this is a report I share weekly" should be as small as possible.

### 8. Coexistence Over Replacement
TIRA must work alongside legacy tools (SSRS, stored procedures, EPL forms). It augments rather than replaces — users should be able to reference, import, and bridge to existing workflows.

---

## 8. Current State & Gaps

### What's Working
- The conversational entry point is compelling — the homepage centers AI naturally
- Data transparency disclosures (SQL, sources, assumptions) are well-structured
- Standard report matching creates a useful bridge between AI and known assets
- Split-view preserves conversational context during data exploration
- Hub view demonstrates AI augmenting a traditional operational surface

### Areas for Future Development
- **Output and distribution** — Sharing, scheduling, and export workflows are not yet prototyped
- **Versioning** — Saved views exist but version history, rollback, and master-to-derived tracking are not yet implemented
- **Multi-turn memory** — Chat refinements work within a session but don't persist across sessions
- **Template system** — Output templates (branded headers/footers) are defined but lightly integrated
- **Collaboration** — No shared editing, commenting, or assignment workflows yet
- **Mobile / responsive** — Layout assumes desktop viewport
- **Accessibility** — Forge provides baseline a11y, but custom components (query cards, split-view drag, floating panels) need audit
- **Real data integration** — All data is simulated with deterministic mock variance; production would need query execution, caching, and freshness management

---

## 9. Module Reference

| Module | Lines | Role |
|--------|-------|------|
| `index.html` | 887 | App shell, Forge scaffold, global styles |
| `src/main.js` | 261 | Initialization, component registration, routing |
| `src/router.js` | 60 | Hash-based view routing |
| `src/views/tira-view.js` | 398 | Homepage — greeting, prompt, tabs, suggestions |
| `src/views/hub-view.js` | 245 | Hub dashboard — icon rail, data table, floating chat |
| `src/chat-flow.js` | 2,171 | Core engine — chat, query cards, split-view, designer bridge |
| `src/hub-chat-panel.js` | 200+ | Hub floating chat content |
| `src/standard-report-viewer.js` | 150+ | Report renderer (KPI, chart, table sections) |
| `src/standard-report-card.js` | ~150 | Standard report recommendation card |
| `src/standard-reports.js` | 500+ | Report definitions and metadata |
| `src/mock-data.js` | 100+ | Query suggestion mock data |
| `src/user-context.js` | 219 | User profile, domains, permissions, questions |
| `src/saved-views.js` | 80 | Parameter override persistence |
| `src/report-matcher.js` | ~50 | Query-to-report matching |
| `src/output-templates.js` | ~50 | Branded report templates |
| `src/app-switcher.js` | 83 | TIRA ↔ Hub switching |
| `report-canvas/` | 2,000+ | React 19 report designer (separate app) |
