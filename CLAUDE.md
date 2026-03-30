# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TIRA is a prototyping workspace for an AI-forward reporting surface. Designs are brought in and built as interactive prototypes. The project is in early stages — expect frequent iteration and new design inputs.

## Product Context

The product replaces a search-and-build reporting workflow with a describe-and-review workflow. AI is the primary entry point, but manual workflows remain available for deeper control.

**Core flow:** Modern homepage (AI input, recents, shared reports, scheduled reports, favorites, templates, folders) → Conversational workspace (dataset-aware outputs, chat refinement, transparent underlying data) → Structured outputs (reports, dashboards, print-ready documents) → Share, version, and schedule.

**Current focus:** Making the surface trustworthy and usable in production workflows — contextual awareness, dataset lineage, query logic transparency, reusable templates, saved report states, and output verification through AI assistance, manual editing, and version-aware context.

**Key constraints:**
- Fragmented legacy tooling (SSRS-style logic, stored procedures, EPL form-based reporting)
- Weak data dictionaries and parameter definitions across customer implementations
- Strict requirements for permissions, freshness, consistency, and backward compatibility
- Must coexist with existing tools where the new surface doesn't yet cover every need

## User Mental Model

- Users start from existing reports, not blank slates — copy, adapt, and reuse is a core workflow
- Ad-hoc reports frequently become repeat-use assets (saving, naming, sharing, rediscovery matter)
- Transparency into data sources, queries, parameters, and freshness is required for trust
- Versioning is essential: named variants, saved views, rollback history, master-to-derived relationships
- Three persona tiers: technical builders (deep control), end users (lightweight self-service), report consumers (polished, low-friction output)
- Output flexibility: print-ready docs, interactive dashboards, Excel exports, scheduled delivery
- Reliability matters more than novelty — broken dependencies, stale data, and unclear mappings erode trust fast

## Commands

- `npm run dev` — Start Vite dev server with hot reload (opens browser automatically)
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build locally

## Tech Stack

- **Vite** — Dev server and bundler
- **@tylertech/forge** — Tyler Forge web component library (design system)
- **@tylertech/forge-ai** — Forge AI chat interface web components (Lit-based, self-register on import)
- **@tylertech/tyler-icons** — Icon library for use with `<forge-icon>`
- Vanilla HTML/JS — no framework, Forge web components used directly in markup

## Forge Usage Patterns

- Import component definition functions in [src/main.js](src/main.js) and call them (e.g. `defineButtonComponent()`) before they're used in HTML
- Icons must be registered via `IconRegistry.define([...])` before use — import from `@tylertech/tyler-icons` (single flat export, no subpaths)
- Typography: use `forge-typography--*` classes (e.g. `forge-typography--heading4`, `forge-typography--body1`)
- Font loaded via CDN: `https://cdn.forge.tylertech.com/v1/css/tyler-font.css`
- Forge CSS imported in JS: `@tylertech/forge/dist/forge-core.css` and `@tylertech/forge/dist/forge.css`
- Forge AI components are Lit-based and self-register on import — just `import '@tylertech/forge-ai'` or import individual components like `import '@tylertech/forge-ai/ai-chatbot'`
- Key AI components: `<forge-ai-chatbot>`, `<forge-ai-chat-interface>`, `<forge-ai-prompt>`, `<forge-ai-sidebar-chat>`, `<forge-ai-floating-chat>`, `<forge-ai-embedded-chat>`, `<forge-ai-suggestions>`, `<forge-ai-thinking-indicator>`

## Prototyping Guidelines

- This repo is for building interactive prototypes from design inputs (Figma, screenshots, verbal descriptions)
- Use the `/prototype-builder` skill when building from designs — it handles Forge component mapping, scaffolding, validation, and gap-filling
- Prioritize fidelity to design intent over pixel-perfection
- Keep prototypes self-contained and navigable

## Code Style Conventions

- **CSS naming**: BEM style (`.component__element--modifier`) for component styles
- **Component files**: Paired .js/.css files for UI components (e.g., `standard-report-card.js` + `standard-report-card.css`)
- **Wire functions**: Attach event listeners and return control objects with methods (e.g., `{ setParam(), getParams() }`)
- **Cross-panel coordination**: Use callbacks for communication between panels (`onFilterChange`, `onViewChange`, `onClose`, etc.)
- **Module exports**: Prefer named exports for utilities, default exports for single-purpose modules

## Integration Patterns

- **Split-view UI**: Left panel (chat/controls) + draggable divider + right panel (content). See `custom-split-container` in chat-flow.js
- **Main app ↔ React designer handoff**: Use `sessionStorage.setItem('tira-handoff-context', JSON.stringify(context))` to transfer data
- **Data simulation**: Hash-based deterministic variance for prototype data that changes with parameters (see `simulateFilteredData` in standard-report-viewer.js)
- **React canvas isolation**: report-canvas/ is a separate React 19 app, mounted via dialog/iframe — keep concerns separated


