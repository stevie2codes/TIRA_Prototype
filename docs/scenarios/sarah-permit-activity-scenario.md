# Scenario: Sarah Pulls Permit Activity for a Staff Meeting

## Persona

**Sarah Chen** — Program Manager, Permitting & Licensing Division

Sarah oversees the permits team and reports to the division director. She's comfortable with spreadsheets and knows her data well, but she doesn't write SQL or build reports from scratch. She relies on canned SSRS reports today and occasionally asks the data team to pull something custom, which takes hours or days.

**Persona tier:** End user (lightweight self-service)

---

## Context

It's Tuesday morning. Sarah has a weekly team standup in 30 minutes. Her director asked for a quick breakdown of building permit activity from last quarter — by type — to discuss workload distribution. In the old workflow, Sarah would email the data team, wait, then copy numbers into a slide deck. Today she opens TIRA.

---

## Scenario Walkthrough

### Step 1: Describe what she needs

Sarah opens TIRA and lands on the homepage. She sees the AI prompt input front and center, along with her recent reports and a few shared reports from her team. She doesn't browse — she types directly:

> "Show me building permits issued last quarter broken down by type"

She hits Enter.

### Step 2: AI generates the query card

After a brief thinking indicator, the AI responds with a natural-language summary and a **query card**. The card shows:

- **Title:** Building Permits Issued by Type — Q4 2025
- **Meta row:** CDD_Main | Live | 50 rows · 5 columns
- **Data preview table:** The first three rows of results — she can immediately see permit types (Building, Electrical, Plumbing, Mechanical) with counts and dates

Sarah scans the preview. The numbers look right. She didn't have to specify the database, the date range format, or the column names — the AI inferred all of that.

### Step 3: Verify the data source

Sarah wants to make sure this is pulling from the live permits system, not a stale extract. She expands the **Data Source** disclosure row on the query card:

- **System:** CDD_Main / Permits & Licensing
- **Total Records:** 2,847
- **Last Updated:** 15 minutes ago

She also glances at the **Assumptions** disclosure — the AI assumed "last quarter" means Q4 2025 and "building permits" includes all sub-types. Both are correct for her purpose.

### Step 4: Refine the results

Above the query card, Sarah sees refinement chips. She clicks **"Break down by month"** to reshape the data for her meeting — she wants to show the team whether permit volume trended up or down across the quarter.

The AI generates a new query card with the monthly breakdown. The previous card collapses into a compact bar she can re-expand if needed.

### Step 5: Explore full results

Satisfied with the preview, Sarah clicks **Explore Results**. The view transitions to a split layout:

- **Left panel:** The chat conversation remains available for further refinement
- **Right panel:** A full data table with all 50 rows, sortable columns, and a filter bar (All Districts, All Months, Permit Type)

She sorts by month descending to confirm December had the highest volume. The data matches what her team reported anecdotally.

### Step 6: Notice the standard report match

Back in the chat panel, the AI has also surfaced a **standard report card**: "Quarterly Permit Activity Summary" — a report her division already uses. Sarah notes it for later but doesn't need it right now. She has exactly the custom slice she wants.

### Step 7: Export to PDF

Sarah needs a clean document to share with her director. She clicks the **Actions** button in the report toolbar and selects **Export** from the dropdown menu. She chooses **PDF** as the format.

The system applies the **Permitting & Licensing** output template automatically — the PDF includes the division header, a clean data table, the AI-generated summary, and a footer noting the data source and generation timestamp. Sarah downloads it and attaches it to her meeting agenda.

---

## End State

Sarah has a print-ready PDF of last quarter's building permit activity, broken down by type and month, exported from the Actions menu. Total time: under 3 minutes. No SQL written, no data team request filed, no waiting.

---

## Prototype Coverage

This scenario exercises the following prototype surfaces:

| Step | Surface | Key Components |
|------|---------|----------------|
| 1 | Landing page | `forge-ai-chatbot-launcher`, `forge-ai-suggestions` |
| 2 | Query card | `forge-card` (Bloomberg Flat), data preview table, meta row |
| 3 | Transparency disclosures | Flat disclosure stack, expansion panels |
| 4 | Refinement | `forge-ai-suggestions` chips, card collapse/expand |
| 5 | Split view / Explore Results | `forge-split-view`, `forge-table`, filter bar |
| 6 | Standard report card | `forge-card` (outlined), `forge-button` |
| 7 | Actions menu / Export | Actions dropdown, output template (Permitting & Licensing), PDF export |
