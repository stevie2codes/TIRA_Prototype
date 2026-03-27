# TIRA Reporting — Flow Annotations

Annotation reference for the full end-to-end prototype flow.
Each screen state is numbered with callout annotations ready for Figma.

---

## Screen 1: Homepage — Default State ("All Sources")

The landing experience for a returning user. The system knows who they are and personalizes content accordingly.

### 1.1 — Personalized Greeting

> "Good morning, Stephen"

The greeting uses the authenticated user's first name and adapts to time of day (morning / afternoon / evening). This replaces the generic "Find the report you need" heading from the logged-out state. The Tyler logo sits alongside the greeting as a brand anchor.

**Why it matters:** Establishes that the system knows the user and has context about their role. Sets the tone that this is *their* workspace, not a generic search tool.

### 1.2 — Chat Input (Primary Entry Point)

The main input field: "Ask a question about your data..."

This is the AI-first entry point. Users describe what they need in natural language rather than navigating a menu tree or building a report from scratch.

**Interaction:** Pressing Enter or clicking the Send icon opens a full-screen conversational dialog where the AI processes the request and returns structured results.

### 1.3 — Source Toggle Dropdown

Button in the input toolbar showing the currently selected data source context. Defaults to "All sources."

**Interaction:** Clicking opens a dropdown (downward) listing available data sources filtered to the user's role and department permissions. Selecting a source scopes both the input context and the suggestion content below.

**Key detail:** The dropdown header shows "Your data sources" with the user's role badge (e.g., "Senior Planner"). Sources the user's department doesn't have access to are not shown. This is permission-driven, not preference-driven.

### 1.4 — Data Source Dropdown (Open State)

Dropdown content when the source toggle is clicked:

- **Header row:** "Your data sources" label + role badge ("Senior Planner")
- **"All sources" option:** Always first, allows cross-source queries
- **Divider**
- **Filtered source list:** Each source shows an icon, name, and count of available queries. Only sources matching the user's department appear.

For the prototype persona (Stephen Webb, Senior Planner, Community Development), visible sources are: Permits & Licensing, Code Enforcement, Financial Management, GIS & Mapping.

**Why it matters:** Users in public sector agencies have strict data permissions. Showing only what they can access builds trust and prevents dead-end queries. The role badge reinforces *why* they see what they see.

### 1.5 — "Pick up where you left off" — Recent Activity Card

A subtle card surface sitting directly below the input. Contains the user's 3 most recent interactions.

Each recent item shows:
- **Source icon** in a small badge (indicates which data domain)
- **Report/query name** (primary label, bold)
- **Metadata line** (e.g., "Saved report · 2h ago" or "This morning")
- **Arrow on hover** — reveals a play icon indicating "click to resume"

**Prototype data:**
1. "Building Permits by Month — Downtown Only" — Saved report · 2h ago (Permits & Licensing icon)
2. "Code Violations Summary" — This morning (Code Enforcement icon)
3. "Budget vs. Actuals — FY2025" — Saved report · Yesterday (Financial icon)

**Why this is positioned first:** Returning users want to resume, not re-discover. Analytics in similar tools show ~60% of sessions start by reopening a recent item. Putting this at the top respects that pattern.

### 1.6 — "Suggested" — Task-Based Action Rows

Three full-width interactive rows below the recent activity card. Each represents a high-value starting question:

1. **"What needs my attention today?"** — Flag icon, indigo accent
2. **"Show me what's overdue"** — Warning icon
3. **"What changed since yesterday?"** — Update icon

Each row has a leading icon badge (indigo background), the question text, and a directional arrow on the right.

**Why these aren't chips:** These are primary calls-to-action, not passive filters. The larger surface area and full-width layout communicates "click me to start working" rather than "here's a tag you might filter by." The icon badges add visual scanning speed.

**Interaction:** Clicking any row opens the chat dialog and submits that question as the initial prompt.

### 1.7 — Browse Row — Category Chips + Library

A compact horizontal row of small pills at the bottom:
- **Category chips:** Permits, Violations, Budget, Inspections — each with a leading icon
- **Vertical divider**
- **"Saved Reports" chip** — folder icon, links to the full Report Library

**Interaction:** Clicking a category chip switches the source dropdown to that data source and refreshes the suggestions above with source-specific content. Clicking "Saved Reports" opens the Library dialog.

**Why this is compact:** Categories are a navigational shortcut, not a primary action. Users who want to browse by domain can, but it shouldn't compete visually with recent activity or suggested actions.

### 1.8 — Disclaimer

"AI can make mistakes. Always verify responses."

Standard AI disclaimer positioned below the input area. Muted text, small font. Present on every screen that involves AI-generated content.

---

## Screen 2: Homepage — Source-Selected State

When the user selects a specific data source from the dropdown (e.g., "Permits & Licensing"), the content below the input updates.

### 2.1 — Source Toggle (Updated)

The toggle button now shows the selected source's icon and name (e.g., "Permits & Licensing" with the description icon) instead of "All sources."

### 2.2 — "Recent from [Source]" Card

If the user has recent activity matching the selected source, a filtered recent card appears at the top. Same visual treatment as the default recent card, but scoped.

Example for Permits & Licensing: Shows only "Building Permits by Month — Downtown Only" (the one matching item from recent activity).

### 2.3 — "Common queries" — Source-Specific Action Rows

Replaces the task-based suggestions. Shows queries specific to the selected data source, styled as the same full-width action rows.

Example for Permits & Licensing:
1. Building permits by month
2. Permit processing times
3. Pending permit applications
4. Permits by contractor
5. Daily inspection queue

Each row uses the source's icon in the leading badge. Clicking any row opens the chat dialog with that query.

**Why "Common queries":** These are pre-built starting points that represent the most-used reports for this data source. Think of them as the top 5 things people actually ask for from this dataset. They reduce the blank-page problem for users who know *which* data they need but not exactly how to phrase the question.

### 2.4 — Browse Row Removed

When a specific source is selected, the category browse row disappears — the user has already made their navigation choice.

---

## Screen 3: Chat Dialog — Conversational Workspace

Full-screen modal dialog that opens when the user submits a query (from the input, a suggestion row, or a recent item).

### 3.1 — Chat Header

Top bar with:
- **AI icon** — circular border with auto_awesome sparkle icon
- **"Report Assistant"** title
- **More options** icon button (kebab menu)
- **Close** icon button (X) — returns to homepage

### 3.2 — User Message

The user's query appears as a right-aligned chat bubble using the `<forge-ai-user-message>` component.

Example: "Show me building permits issued by month, broken down by district"

### 3.3 — Thinking Indicator

After a 500ms delay, a `<forge-ai-thinking-indicator>` appears showing the AI is processing. Displayed for ~2 seconds before the response appears.

**Why the delay is staged:** The 500ms pause before showing the indicator prevents flicker on fast responses. The 2-second processing time is the prototype simulation — in production this would reflect actual query execution time.

### 3.4 — Query Card (AI Response)

The centerpiece of the chat experience. Replaces what would traditionally be a flat text response with a structured, progressive-disclosure card.

#### 3.4a — Card Header

- **AI sparkle icon** (left)
- **Report title** — bold, e.g., "Building Permits by Month"
- **Metadata row:** Data source name with database icon · Freshness indicator with green dot (e.g., "Updated 2 hours ago") · Row/column count (e.g., "12 rows · 7 columns")

**Why metadata is inline:** Users in government reporting need to know *immediately* where data came from and how fresh it is. This isn't nice-to-have — it's a trust requirement. Stale or wrong-source data has real compliance consequences.

#### 3.4b — AI Summary

A markdown-formatted narrative summary of the query results. Highlights key findings with bold text and provides context. Example excerpt: "I found **2,847 building permits** issued across 5 districts over the past 12 months."

**Purpose:** Not everyone wants to read a table. The summary gives executives and non-technical users the headline answer. Technical users scan it, then dive into the data below.

#### 3.4c — Mini Data Preview

A compact table showing the first 3 rows × 4 columns of the result set. Below the table: a note like "9 more rows · 3 more columns · Explore full results."

**Why only 3×4:** This is a preview, not the full report. It lets users visually confirm "yes, this is the right data" before committing to explore further. The truncation is intentional — it creates a pull toward the "Explore Results" action.

#### 3.4d — Disclosure Sections (Progressive Disclosure)

Four collapsible sections that reveal deeper context about the query. All start collapsed.

1. **Data Source** — Shows system name (e.g., "ERP Pro"), total records in source table, and last update timestamp
2. **SQL Query** — The generated SQL with syntax highlighting. Includes a "Copy SQL" button
3. **Assumptions** — Bulleted list of decisions the AI made (e.g., "'By month' interpreted as issue date, not application date"). Includes count badge (e.g., "3 made")
4. **Data Citations** — Lists the specific tables and joins used (e.g., "permits table → ERP Pro > Permits & Licensing > permits")

**Why progressive disclosure:** Most users don't need to see the SQL or assumptions. But for the users who do — data analysts, report builders, compliance reviewers — this information is critical. Collapsing it by default keeps the card scannable while making verification one click away.

**Interaction:** Clicking a disclosure header expands the section with a smooth animation. The chevron rotates 180°. The content scrolls into view. Multiple sections can be open simultaneously.

#### 3.4e — Refinement Chips

A row of suggestion chips below the disclosures. These represent follow-up actions the user might take to refine the query result.

Example chips: "Filter by date range" · "Break down by permit type" · "Compare to last year" · "Add residential vs. commercial split"

**Interaction:** Clicking a chip triggers the three-tier refinement system (see Screen 4).

#### 3.4f — Action Buttons

Two buttons at the bottom of the card:
- **"Explore Results"** (primary, indigo) — Opens the side panel report view
- **"Copy Summary"** (secondary, outlined) — Copies the AI summary text to clipboard

### 3.5 — Chat Footer

Persistent input area at the bottom of the dialog:
- Text input: "Ask a question..."
- Send button
- Attachment button (+)
- Voice input button (mic)

**Purpose:** The user can always type a follow-up question or a completely new query without leaving the conversation.

---

## Screen 4: Refinement — Three-Tier Response System

When a user clicks a refinement chip, the system classifies the request into one of three tiers and responds accordingly.

### 4.1 — Tier 1: "Card" — Data-Shaping Refinement

**Triggers:** Chips containing "break down," "filter," "group by," "split," "only"

**Behavior:**
1. Previous query card(s) collapse to a compact one-line bar (title + metadata only)
2. User message appears in the chat (the chip text)
3. Thinking indicator shows for 1.5 seconds
4. A **new query card** appears with updated data, summary, SQL, and its own refinement chips

**Collapsed card state:** The previous card reduces to a single bar showing the AI sparkle icon, the report title, and a condensed metadata string. Clicking the collapsed bar re-expands it to full view.

**Example flow:** User clicks "Break down by permit type" → Previous "Building Permits by Month" card collapses → New card appears: "Building Permits by Month — By Permit Type" with columns for Residential Reno, Commercial New, etc.

**Why cards collapse:** The conversation can involve 3-4 refinement steps. If all cards stayed full-size, the user would have to scroll past walls of content to see the latest result. Collapsing keeps the most recent result prominent while preserving access to previous iterations.

### 4.2 — Tier 2: "Text" — Narrative Response

**Triggers:** Chips containing "compare," "chart," "trend," "export," "schedule"

**Behavior:**
1. Previous card does NOT collapse (the data context remains visible)
2. User message appears
3. A text-only response appears with markdown formatting and a small data source badge

**Example:** User clicks "Compare to last year" → AI responds with a narrative comparison: "Total permits are up 14%, driven primarily by a 22% increase in residential activity..."

**Why no new card:** Comparisons, trends, and export options are conversational — they add context to the existing data rather than replacing it. A new card would imply the data changed, which it didn't.

### 4.3 — Tier 3: "Handoff" — Designer Escalation

**Triggers:** Chips containing "cross-reference," "join," "calculated field," "inspector," "efficiency"

**Behavior:**
1. User message appears
2. AI responds with an explanation of why this exceeds chat capabilities
3. A **handoff card** appears with:
   - Header: "This needs the Report Designer"
   - Context transfer items: Dataset name, "Filters and query will transfer," "SQL query ready to edit"
   - Two actions: **"Open in Report Designer"** (primary) and **"Request from Tyler"** (secondary)

**Why handoff exists:** Some operations (multi-table joins, calculated fields, complex formatting) require the full Report Designer. Rather than failing silently or producing a bad result, the system is transparent about its limits and offers a clean escalation path. All context transfers to the designer — the user doesn't start over.

---

## Screen 5: Split View — Report Panel

When the user clicks "Explore Results" on a query card, the dialog transitions to a split-view layout.

### 5.1 — Layout Transition

The full-width chat view animates into a two-panel split:
- **Left panel (450px, resizable 320–600px):** Chat conversation with all messages preserved
- **Divider:** Draggable vertical handle
- **Right panel (flex remaining):** Report canvas

**Interaction:** The divider can be dragged to resize the panels. The chat panel has min/max constraints to prevent it from becoming too narrow or too wide.

### 5.2 — Left Panel: Chat (Condensed)

The chat conversation continues in the left panel with:
- Same header (AI icon + "Report Assistant")
- All previous messages preserved (scrollable)
- Input footer at the bottom — user can keep chatting while viewing the report

**"Report open in side panel" badge:** The "Explore Results" button on the query card is replaced with a status badge indicating the report is now visible in the side panel.

### 5.3 — Report Panel: Title Bar

Top section of the right panel:
- **Report title** (bold, e.g., "Building Permits by Month")
- **Data source badge** with freshness (e.g., "Permits & Licensing DB · Updated 2 hours ago")
- **Open in new window** icon button
- **Close** icon button — collapses back to full-width chat

### 5.4 — Report Panel: Action Bar

Toolbar below the title bar with two groups:

**Left — View Toggle Group:**
Three toggle buttons for switching the data visualization:
- **Table** (default, active) — grid icon
- **Chart** — bar chart icon
- **SQL** — code icon

**Right — Report Actions:**
A dropdown button labeled "Report Actions" with:
- **Export** — Download as PDF, CSV, or Excel
- **Schedule** — Set up recurring delivery
- **Share** — Send to colleagues or teams
- **Save to Library** — Add to saved reports
- **Divider**
- **Open in Report Designer** — Advanced layout, joins, and formatting (launches the full React-based Report Designer)

### 5.5 — Report Panel: Filter Bar

Below the action bar. Shows:
- "Filters" label with filter_list icon
- Filter chips: "All Districts," "All Months," "Permit Type" — each with a dropdown arrow

**Purpose:** Quick inline filtering without going back to the chat. These reflect the dimensions available in the current dataset.

### 5.6 — Report Panel: Table View (Default)

A Forge `<forge-table>` component with:
- Dense mode and fixed headers
- All columns from the query result (sortable)
- All data rows

**Note:** This is the *full* dataset, not the 3×4 mini preview from the query card. The user now has the complete picture.

### 5.7 — Report Panel: Chart View

Toggled by clicking "Chart" in the view toggle. Shows a horizontal bar chart built from the data:
- Chart title matches the report title
- Each row becomes a labeled bar
- Bar width proportional to the maximum value

**Prototype note:** This is a simplified bar chart for demonstration. Production would offer chart type selection (bar, line, pie, scatter) with more configuration options.

### 5.8 — Report Panel: SQL View

Toggled by clicking "SQL" in the view toggle. Shows the generated SQL in a `<pre><code>` block with syntax formatting.

**Purpose:** Developers and power users can inspect, copy, or reference the exact query that produced the results. Paired with the Assumptions disclosure on the query card, this provides full transparency into what the AI did.

---

## Screen 6: Report Designer (Handoff)

Launched from either the handoff card's "Open in Report Designer" button or the Report Actions dropdown's "Open in Report Designer" item.

### 6.1 — Context Transfer

Before mounting the designer, the system writes the full chat context to `sessionStorage`:
- Report title, data source, freshness
- SQL query
- Column definitions and data
- Original user query and AI summary
- Transparency metadata
- Handoff reason (if applicable)

**Why sessionStorage:** The Report Designer is a separate React application. sessionStorage provides a clean, same-tab data transfer mechanism without requiring a shared state management layer.

### 6.2 — Loading State

A transitional screen shows while the React app loads:
- "Back to Chat" button (functional immediately — user can bail out before loading completes)
- "Loading Report Designer..." label
- Thinking indicator spinner

### 6.3 — Designer Interface

The Report Designer (React Flow + dnd-kit based) mounts inside the dialog, replacing the chat view entirely:
- **Navigation bar** with "Back to Chat" button
- **Full designer canvas** — drag-and-drop report layout, node-based data flow, formatting tools

**"Back to Chat" behavior:** Unmounts the React app and restores the chat conversation exactly as it was. No data is lost.

### 6.4 — Error State

If the React app fails to load:
- Error icon
- "Failed to load Report Designer" message
- "Reload" button

---

## Screen 7: Saved Reports Library

Opened from the "Saved Reports" chip on the homepage browse row or "Open in Chat" on library cards.

### 7.1 — Library Header

- **Close button** (X)
- **"Saved Reports Library"** title
- **Search input** with search icon

### 7.2 — Category Filters

Horizontal chip row with:
- "All" (active by default)
- Category chips derived from the reports (e.g., "Permits & Licensing," "Code Enforcement," "Financial," "Community Dev")

### 7.3 — Library Stats

Summary line: "[count] reports · [count] scheduled · [count] standard, [count] custom"

### 7.4 — Report Cards Grid

Each saved report displays as a card with:
- **Type badge** (e.g., "Standard" or "Custom") + **Category label**
- **Report title**
- **Description** (1-2 sentences)
- **Metadata row:** Schedule (if any), owner, row count, last run date
- **Action buttons:** "Run Now" (primary), "Open in Chat," "Open in Designer"

**"Run Now"** executes the report immediately with the latest data. **"Open in Chat"** loads the report context into the conversational workspace for AI-assisted exploration. **"Open in Designer"** opens it in the full Report Designer.

---

## Cross-Cutting Patterns

### A — Data Source Badge

Appears on query cards, text responses, and the report panel title bar. Always shows: database icon + source name + green dot + freshness timestamp.

**Consistency rule:** Every piece of AI-generated content that references data must show its source. This is a non-negotiable trust requirement for public sector reporting.

### B — Thinking Indicator

The `<forge-ai-thinking-indicator>` with `show-text` attribute. Used between user input and AI response in every interaction. Staged timing: 500ms delay before showing, 1.5–2 seconds visible.

### C — Copy-to-Clipboard Pattern

Used for SQL and summaries. On click: icon changes to checkmark, label changes to "Copied!", reverts after 2 seconds.

### D — Progressive Disclosure

Used in query card disclosures and the report panel actions dropdown. Default state is collapsed. Chevron rotation on expand. Smooth scroll to reveal content.

### E — Role-Based Filtering

The system filters content based on the authenticated user's department. This affects: which data sources appear in the dropdown, which suggestions are shown, and which recent activity is relevant. The filtering happens at the service layer (`user-context.js`) before any UI rendering.

### F — sessionStorage Handoff

The bridge between the vanilla JS chat experience and the React Report Designer. Writes a structured JSON payload to sessionStorage before mounting. The designer reads and clears it on mount.

---

## Persona Summary

**Name:** Stephen Webb
**Role:** Senior Planner
**Department:** Community Development
**Visible data sources:** Permits & Licensing, Code Enforcement, Financial Management, GIS & Mapping
**Typical workflows:** Permit volume reports, violation summaries, budget tracking, inspection queues
