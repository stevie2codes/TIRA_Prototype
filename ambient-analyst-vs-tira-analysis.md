# Ambient Analyst Vision vs. TIRA Prototype — Gap & Similarity Analysis

*April 1, 2026*

---

## What's Being Compared

**Stakeholder Vision ("The Ambient Analyst"):** A product vision document from the Tyler AI Foundry describing a next-generation architecture for reporting and analytics where AI "watches, reasons, and collaborates" — not just answers questions.

**TIRA Prototype:** An interactive prototype built with Tyler Forge web components that demonstrates an AI-forward reporting surface with conversational entry, standard report matching, split-view exploration, transparency panels, and a React-based report designer.

---

## Strong Alignment (What TIRA Already Reflects)

### 1. "Describe and Review" Over "Search and Build"
Both share the same foundational thesis: reporting should start with a question, not a tool. TIRA's centered AI prompt as the hero element on the homepage directly embodies the Ambient Analyst's call for an **artifact-first** paradigm where users describe what they need in natural language and review AI-generated outputs.

### 2. Conversational Workspace as Primary Surface
The Ambient Analyst envisions a chatbot that produces deliverables through conversation. TIRA implements this with its chat flow engine — a fullscreen conversational modal that streams AI responses, renders query cards with mini data previews, and transitions into a split-view for deeper exploration. The stakeholder's concept of "analysis as a conversation, not a tool" is the core interaction model TIRA already demonstrates.

### 3. Data Transparency and Lineage
The Ambient Analyst's architecture emphasizes that every output should be traceable. TIRA has built this into every AI response with four collapsible disclosure panels: Data Source (system name, record count, freshness), SQL Query (with copy-to-clipboard), Assumptions (interpretation choices the AI made), and Data Citations (source tables and join logic). This is one of TIRA's strongest alignment points with the vision.

### 4. Domain-Specific Context
Both emphasize domain specificity as a competitive advantage. The Ambient Analyst calls out Tyler's domain expertise as a moat; TIRA implements domain-based architecture with EPL, ERP, and Courts & Justice datasets, department-based filtering, and domain-scoped question suggestions. The stakeholder's concept of client-specific overlays (branding, terminology, schema context) maps to TIRA's output templates system, which provides domain-branded wrappers for Justice & Public Safety, Permitting & Licensing, Finance & Budget, and Code Enforcement.

### 5. Progressive Depth / Progressive Disclosure
The Ambient Analyst describes a system where the user can go as deep as they want. TIRA mirrors this with its three-tier response approach: a concise AI summary → a mini data preview → an expandable split-view with full report, filters, view toggles, and eventually a full report designer canvas. The user controls how deep they go.

### 6. AI Routing to Existing Reports
The Ambient Analyst acknowledges the 65,000 existing reports as a reality. TIRA's report matcher implements confidence-based routing (high/medium/low) that steers users toward standard reports when appropriate, rather than always generating ad-hoc responses. This is a pragmatic bridge between the AI-forward vision and the existing report ecosystem.

### 7. Multiple Entry Points
The stakeholder describes scenarios starting from a dashboard and from an existing application (EERP). TIRA implements two entry points: the TIRA View (AI-first, hero prompt) and the Hub View (data-table-first with floating chat as augmentation). Both recognize that users arrive at analytical questions from different starting contexts.

---

## Meaningful Gaps (Where the Vision Goes Beyond TIRA)

### 1. The "Ambient" in Ambient Analyst — Implicit Intent & Observation
**Vision:** The system watches user behavior — clicks, filters, drills, sorts, time-on-view — captures these as semantic events in an **interaction log**, and feeds them into the LLM's context window. The AI surfaces insights proactively ("INSIGHT DETECTED") without the user having to ask. Both explicit intent (typed queries) and implicit intent (observed behavior) feed the same context model.

**TIRA:** The AI is purely reactive. It responds when the user types a query or clicks a refinement chip. There is no observation layer, no interaction logging, no proactive insight surfacing. The chat-flow engine waits for input; it doesn't watch exploration patterns and intervene.

**This is arguably the single largest conceptual gap.** The stakeholder's "thread of reasoning" — a rolling, accumulating context model that makes the AI aware of the full analytical journey — is the architectural centerpiece of the vision, and TIRA doesn't yet model it at all.

### 2. The Artifact Taxonomy — Distinct, Typed Output Formats
**Vision:** Three distinct artifact types today, one on the horizon:
- **Dashboards** — JSON documents with interactive, cross-filtered cards (Vega-Lite / ECharts)
- **Reports (RDL)** — Paginated, branded, exportable documents rendered through a modern RDL engine
- **Narratives** — Analytical prose with embedded charts that lives in the chat thread
- **Applications** (horizon) — Full CRUD tools, workflow screens, generated as Forge + JSX components

The system *infers* which artifact type to produce based on context. The user never selects a type explicitly.

**TIRA:** Outputs are more homogeneous. The query card format (summary + mini table + transparency panels) is the primary response shape regardless of the user's intent. The report viewer supports table/chart/SQL views, and the output templates add domain branding, but there's no formal artifact taxonomy. TIRA doesn't distinguish between "I need an interactive dashboard," "I need a print-ready report," and "explain what's happening" as fundamentally different output modes that produce structurally different artifacts.

### 3. RDL Rendering and the 65,000-Report Compatibility Standard
**Vision:** The modern rendering engine must handle existing RDL report definitions with perfect fidelity — precise formatting, grouped sections, calculated totals, audit-ready presentation, and even regulated forms (W-2s) where field positioning is mandated to the millimeter. This is framed as both a compatibility requirement and the quality standard for all new output.

**TIRA:** There is no RDL rendering capability. Reports are rendered through a custom viewer (KPI rows, charts, tables, grouped tables) built with Forge components and Recharts. This is fine for a prototype, but the vision document is emphatic that the rendering layer sets the quality ceiling for the entire system, and that a modern RDL renderer is non-negotiable infrastructure.

### 4. The Skills Framework — Composable, Client-Adaptable Agent Skills
**Vision:** A structured skills repository (agentskills.io) where each skill (dashboard, rdl-report, narrative, interaction-log) contains a target schema, a SKILL.md instruction file, reference examples, and client-specific overlays. Skills load at runtime and compose — a single user request might invoke the dashboard skill, then the narrative skill, producing multiple coordinated artifacts.

**TIRA:** There is no skills framework. The mock adapter simulates AI responses with static suggestion data. The report matcher uses keyword matching for routing, but there's no concept of composable agent skills that can be authored, versioned, and adapted per client. TIRA's "intelligence" is hard-coded rather than declarative and extensible.

### 5. Artifact Transitions — Fluid Movement Between Modes
**Vision:** A user can start with a dashboard, ask "why did revenue decline?", and the system produces a narrative — then ask "send this to the director" and it produces a branded RDL report. The analytical context flows between artifact types seamlessly. The vision illustrates scenarios that cross from dashboard → narrative → report and from application → chat → dashboard.

**TIRA:** The flow is more linear: prompt → chat → split-view → designer. You can go deeper, but you can't fluidly pivot between output types within a single analytical thread. There's no mechanism for the AI to say "based on what you're exploring, here's a narrative" and then pivot to "here's that as a formatted report for the director."

### 6. Context as Architecture ("C.R.E.A.M.")
**Vision:** "Context Rules Everything Around Me" — every AI decision (what to query, what to render, what to explain, when to intervene) is driven by a structured context model that accumulates across the session. The context extends beyond the reporting surface into other Tyler applications.

**TIRA:** Context is session-scoped and shallow. The user-context module provides department/role filtering, and the chat preserves message history within a conversation, but there's no structured, accumulating context model. The sessionStorage handoff between chat and designer is the closest analog, but it's a one-time transfer, not a living context that grows richer over time.

### 7. Data Layer Architecture — Catalog, Standards, Store-Agnostic Access
**Vision:** A data layer built on standard interfaces (SQL, OData) with a rich, LLM-accessible data catalog that describes tables, relationships, business meaning, and freshness. Data-store agnostic — SQL Server, S3, Postgres, etc.

**TIRA:** All data is mocked. The mock-data module provides static suggestion objects with pre-written SQL and data rows. There's no data catalog, no query execution, no concept of connecting to real data stores. This is expected for a prototype, but the vision document's data layer architecture is a substantial engineering workstream that TIRA doesn't address.

### 8. The Narrative as a First-Class Output
**Vision:** When the system writes *about* data rather than displaying it, the output lives in the conversation as prose with embedded charts and data references. The narrative skill generates analytical writing with embedded evidence — not a separate artifact to navigate to, but the chatbot's native voice.

**TIRA:** AI responses include markdown-formatted summaries, but these are brief introductions to data displays, not standalone analytical narratives. TIRA's chat responses don't embed interactive charts or rich evidence within the conversational thread itself. The narrative as a distinct, rich output mode is missing.

### 9. Cross-Filtering and Dashboard Interactivity
**Vision:** Dashboard cards are interactive and cross-filtered — clicking a bar in one card filters all other cards. The dashboard is a JSON document specification, and the rendering shell handles layout and interaction.

**TIRA:** The report viewer shows individual sections (KPI rows, charts, tables) but they don't cross-filter or interact with each other. The parameter/filter bar operates at the report level, not at the card-to-card interaction level. The React designer has a grid-based canvas, but it's more of a layout tool than an interactive dashboard runtime.

---

## Smaller but Notable Gaps

| Area | Ambient Analyst Vision | TIRA Current State |
|------|----------------------|-------------------|
| **Open standards emphasis** | RDL, SQL, Vega-Lite, ECharts, AG Grid, Markdown — chosen because LLMs generate better output for well-known formats | Custom rendering, Recharts, Forge components — pragmatic but not standards-aligned |
| **Application generation** | Horizon goal: LLM generates Forge + JSX components as full CRUD apps | Not addressed |
| **Client adaptability** | Per-client overlays (branding, terminology, schema) that layer on top of core skills | Output templates provide branding, but no client-specific terminology or schema mapping |
| **Interaction log as data** | Every click/filter/drill captured as semantic events — this is called "the secret weapon" | No interaction logging |
| **Version history** | Implied in the artifact document model | Defined in CLAUDE.md as a goal but not yet implemented |
| **Multi-session memory** | Thread of reasoning persists across sessions | sessionStorage only — cleared between sessions |

---

## Where TIRA Is Ahead of the Vision Document

### 1. Tangible, Interactive Implementation
The vision document is a pitch — it describes what should exist. TIRA is a working prototype you can click through. The conversational flow, the split-view interaction, the transparency panels, the report viewer, the designer handoff — these are all implemented and demonstrable. That's a meaningful advantage when communicating with stakeholders, engineers, and designers.

### 2. The Report Designer
TIRA includes a React-based report designer with a grid canvas, widget palette, property inspector, and even a data-layer node editor (XY Flow). The Ambient Analyst vision doesn't describe an equivalent manual design surface — it focuses on AI-generated artifacts. TIRA's designer acknowledges that users will need direct manipulation for fine-tuning, which is a practical concession the vision document largely omits.

### 3. Saved Views and Parameter Persistence
TIRA's saved-views system lets users name and recall specific parameter overrides on reports (e.g., "Felonies Only — Main Facility"). This is a concrete, useful feature for the "ad-hoc to asset" workflow that the vision document advocates for in principle but doesn't detail mechanically.

### 4. Confidence-Based Routing Logic
TIRA's report matcher implements a specific algorithm: high confidence (≥70%) shows the standard report directly, medium (40–69%) shows ad-hoc results plus a recommendation, low (<40%) shows only ad-hoc results. The vision document describes AI routing conceptually but doesn't specify the mechanics. TIRA has a working model for this decision.

---

## Summary: How to Think About the Relationship

The Ambient Analyst vision and TIRA are not in conflict — they're operating at different altitudes. The vision describes a **target architecture** with deep conceptual infrastructure (thread of reasoning, interaction log, skills framework, artifact taxonomy, RDL rendering, data catalog). TIRA is a **prototype that validates the interaction model** — it proves that the conversational entry, transparency panels, progressive disclosure, and split-view exploration actually work as a user experience.

The largest gap is conceptual, not implementational: **the vision's "ambient" intelligence (observation, proactive insight, accumulating context) versus TIRA's reactive chat model.** Everything else — artifact types, RDL rendering, skills framework, data layer — is engineering work that TIRA was never meant to solve as a prototype.

The strategic question is: **does TIRA's interaction model remain the right shell when the Ambient Analyst's brain gets built?** Based on this analysis, the answer is largely yes — the conversational workspace, the transparency disclosures, the progressive depth model, and the split-view exploration all map cleanly onto the vision's architecture. What needs to be added is the observation layer, the artifact taxonomy, and the context model that makes the "ambient" part real.
