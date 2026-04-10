# Chat-to-Report Workflow Design

**Date:** 2026-04-10
**Branch:** demo/mbi-1
**Persona:** Customer Reporting Staff

## Problem

The current prototype lets users ask questions in chat and get data back in a query card, but the table presented is not an actual report. For Customer Reporting Staff — technical specialists who build and maintain reports for their organizations — the deliverable is a formal, publishable report, not a raw result set. The gap between "I got an answer" and "I have a report I can share" is the core problem.

## Design Principle

Chat is a drafting tool. The report is the deliverable. The workflow should make the path from chat query to published report feel direct and intentional, not like a detour through a separate system.

## Target Persona: Customer Reporting Staff

From the Confluence persona document:

- **Who:** Technical specialists (IT Analysts, Systems Analysts, Report Writers, Applications Managers) responsible for building, configuring, and maintaining reporting infrastructure. They are the bridge between raw data and meaningful reports for end users.
- **Goals:** Effectively create reports based on internal requests, maintain data accuracy, ensure compliance.
- **Core tasks:** Create/customize reports, configure data connections, communicate with requesters, manage internal access, export data, share reports.
- **Key pain points:** Poor data documentation from Tyler, difficulty getting data out of the system, pressure to deliver quickly, no standardized templates, complex SSRS expressions requiring external AI assistance, stored procedure management overhead.
- **How we help:** AI for rapid report creation, clear parameter definitions, versioning, reusable templates, flexible customization.

## Overall Flow

The user journey through the split view right panel has three sequential modes:

```
Query Card ("Explore Results")
        |
        v
  Mode 1: EXPLORE
  Validate data, review SQL, check filters
  [Configure as Report ->]
        |
        v
  Mode 2: CONFIGURE
  Edit query, columns, parameters, template, details
  [<- Back to Explore]  [Publish ->]
        |
        v
  Mode 3: PUBLISH
  Set permissions, optional schedule
  [<- Back to Configure]  [Publish to Library ->]
        |
        v
  Confirmation: Report published
  [View in Library]  [Close]
```

The entire flow lives within the split view right panel. No modals outside the chat dialog. This is critical because the experience must be embeddable across different LOB systems where the chat dialog is the only surface we reliably control.

Chat remains active on the left side throughout all three modes.

## Mode 1: Explore (Modifications to Existing)

The current `buildReportPanel` data viewer stays mostly intact with targeted changes.

### Action bar changes

- **Remove** "Save to Library" from the Actions dropdown (moves to the Publish flow).
- **Keep** Export, Schedule, and Share in the dropdown for quick one-off actions on raw data. A user may want to export a CSV without going through full report creation — that's a valid shortcut for this persona.
- **Add** a "Configure as Report" button to the right side of the action bar. Visually distinct from the dropdown — primary color, stands out as the main forward action.

### Query card entry point

The "Explore Results" button on the query card continues to open the split view in Explore mode. The user validates data first, then decides to promote. No change to the entry point.

### Transition

When "Configure as Report" is clicked, the right panel content cross-fades to Configure mode. Smooth transition that signals "same space, different mode." The current query, data, columns, filters, and suggestion object are all passed forward. Nothing is lost.

## Mode 2: Configure

The configure mode has a header, a tab bar, tab content area, a collapsible data preview, and a footer.

### Header

An editable report name field, pre-filled with the `reportTitle` from the suggestion. Directly editable inline — click to type. Below it, the data source badge and freshness indicator carry over from Explore mode for context.

### Tabs

#### Query tab
- The SQL from the AI response, displayed in an editable code block with syntax highlighting (adapt existing SQL display code).
- A "Run Query" button that re-executes and refreshes the data preview below.
- This is the most important tab for Customer Reporting Staff — they will tweak the AI-generated SQL before promoting it.

#### Columns tab
- A list of all columns from the result set.
- Each row: drag handle for reorder, column name (editable for display rename), visibility toggle (show/hide).
- Changes reflect immediately in the data preview.

#### Parameters tab
- Lists the current filters (pulled from the filter chips in Explore mode).
- Each filter has a toggle: "Fixed" (baked into the query, end users can't change it) vs. "User-adjustable" (becomes a runtime parameter when end users run this report).
- For user-adjustable parameters: a label field and a default value field.
- Directly addresses the persona's task of building reports that others will run with different inputs.

#### Template tab
- Template picker showing available branded templates (the CSS template system already exists via `report-panel[data-template]`).
- Visual preview cards for each template option showing the branded header/footer.
- Selecting a template applies it to the data preview below.

#### Details tab
- Report description (text area — what does this report show and why).
- Category selection (which group in the library — Building, Public Safety, Finance, etc.).
- Tags for discoverability.

### Collapsible data preview

Below the tab content area, a collapsible section showing the live table with current columns, ordering, and template applied. Collapsed by default to give more room to the config tabs. Updates when the user runs a query change or toggles column visibility.

### Footer bar

- Left: "Back to Explore" text button.
- Right: "Publish" primary button (disabled until report name is non-empty).

## Mode 3: Publish

A focused publish view for organizational decisions.

### Header

Report name (read-only, carried from Configure), category badge, and template indicator. A quick summary confirming what is about to be published.

### Permissions section

- **Visibility** — a select with options: "Everyone in my organization," "Specific roles," "Only me (draft)."
- If "Specific roles" is selected, a multi-select list of roles/departments appears below.
- Default is "Only me (draft)" — safe default to prevent accidental broad publication.

### Schedule section (optional, collapsed by default)

- Toggle: "Set up recurring delivery."
- When expanded: frequency (daily, weekly, monthly), day/time, delivery method (email, in-app notification).
- Optional because many reports are run on-demand. Keeping it collapsed avoids overwhelming the form.

### Footer bar

- Left: "Back to Configure" text button.
- Right: "Publish to Library" primary button.

### Post-publish confirmation

After publishing, the panel content replaces with a confirmation state:
- Checkmark icon + "Report published."
- Report name as a link (to the library entry).
- Two actions: "View in Library" and "Close."
- Close returns the split view to Explore mode with the original data, or closes the split view entirely.

## Chat Panel Behavior (Left Side)

### During Explore mode
Chat works exactly as it does now. Refinement questions update data, "Explore Results" on a new query card refreshes the right panel.

### During Configure mode
Chat stays active but shifts to an assistive role. The user can ask questions like "what does the permit_type column mean?" or "write me a query that groups by month instead." AI responses are advisory — they do not auto-update the right panel. The user is in control of the report configuration.

### During Publish mode
Chat stays visible. No special behavior changes.

### After publishing
The chat receives a system message confirming publication — e.g., "Report 'Monthly Building Permits by District' published to the library." This gives the conversation a natural endpoint and creates a record of what was built.

## Technical Notes

### Existing infrastructure to reuse
- `buildReportPanel()` in `chat-flow.js` — the Explore mode foundation.
- `report-panel[data-template]` CSS system — template application.
- `forge-tab-bar` — already registered and used in query cards for tab switching.
- `forge-table` — already used for data display.
- SQL display with syntax highlighting — already implemented in query card.

### State management
A report configuration object is passed through all three modes:
```
{
  name: string,          // from suggestion.reportTitle, editable
  query: string,         // from suggestion.sqlCode, editable
  columns: Array,        // from suggestion.columns, configurable
  parameters: Array,     // from filter state, configurable
  template: string,      // selected template ID
  description: string,   // user-entered
  category: string,      // user-selected
  tags: Array,           // user-entered
  visibility: string,    // permission level
  roles: Array,          // if specific roles selected
  schedule: Object|null, // if recurring delivery configured
  data: Array,           // current result set
  dataSource: string,    // from suggestion
  freshness: string      // from suggestion
}
```

### What this design does NOT include
- Actual query execution against a live database (this is a prototype — query "runs" are simulated).
- Real permissions integration with an auth system.
- Real library persistence (save to localStorage or session for prototype purposes).
- Report Designer handoff — that remains a separate path for complex cases (joins, calculated fields, custom layouts) that exceed what this configuration flow supports.
