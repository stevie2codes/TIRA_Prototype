import { suggestions } from './mock-data.js';
import { outputTemplates, getTemplateById } from './output-templates.js';
import './chat-flow.css';

// Standard reports integration
import { standardReports, getStandardReportById } from './standard-reports.js';
import { matchStandardReports, getConfidenceTier } from './report-matcher.js';
import { buildStandardReportCard, getDomainLabel } from './standard-report-card.js';
import { buildStandardReportPanel, wireStandardReportPanel } from './standard-report-viewer.js';
import { getVisibleStandardReports } from './user-context.js';

/** @param {string} md */
function markdownToHtml(md) {
  let html = md
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^- (.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> runs in <ul>
  html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
  return `<p>${html}</p>`;
}

/**
 * Shows a progressive reasoning sequence using forge-ai-reasoning.
 * While running: header shows "Reasoning..." with each step appearing below.
 * On complete: collapses to "Reasoned about [topic] for Xs", expandable to show steps.
 *
 * @param {HTMLElement} container - Chat message container to append to
 * @param {Array<{ label: string, duration: number }>} steps - Processing steps
 * @param {() => void} onComplete - Called after all steps finish
 * @param {string} [topic] - Topic label for the collapsed header
 */
function showToolCallSequence(container, steps, onComplete, topic = 'your request') {
  const reasoning = document.createElement('forge-ai-reasoning');
  reasoning.expanded = true;

  const header = document.createElement('forge-ai-reasoning-header');
  header.slot = 'header';
  header.reasoning = true;
  header.expanded = true;

  const reasoningTitle = document.createElement('span');
  reasoningTitle.slot = 'reasoning-title';
  reasoningTitle.textContent = 'Reasoning...';
  header.appendChild(reasoningTitle);

  const completedTitle = document.createElement('span');
  completedTitle.slot = 'title';
  header.appendChild(completedTitle);

  reasoning.appendChild(header);

  const stepsContainer = document.createElement('div');
  stepsContainer.className = 'tool-call-sequence';
  reasoning.appendChild(stepsContainer);

  container.appendChild(reasoning);
  scrollToBottom(container);

  const totalStart = Date.now();
  let i = 0;

  function runStep() {
    if (i >= steps.length) {
      const totalSec = ((Date.now() - totalStart) / 1000).toFixed(1);
      completedTitle.textContent = `Reasoned about ${topic} for ${totalSec}s`;
      header.reasoning = false;
      header.expanded = false;
      reasoning.expanded = false;
      onComplete();
      return;
    }

    const step = steps[i];
    const stepEl = document.createElement('div');
    stepEl.className = 'tool-call-step tool-call-step--active';
    stepEl.innerHTML = `
      <forge-ai-spinner size="small"></forge-ai-spinner>
      <span class="tool-call-step-label">${step.label}</span>
    `;
    stepsContainer.appendChild(stepEl);
    scrollToBottom(container);

    setTimeout(() => {
      stepEl.classList.remove('tool-call-step--active');
      stepEl.classList.add('tool-call-step--complete');
      const elapsed = step.duration < 1000 ? `${step.duration}ms` : `${(step.duration / 1000).toFixed(1)}s`;
      stepEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="tool-call-check"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        <span class="tool-call-step-label">${step.label}</span>
        <span class="tool-call-step-elapsed">${elapsed}</span>
      `;
      i++;
      setTimeout(runStep, 200);
    }, step.duration);
  }

  runStep();
}

/**
 * Opens the chat flow modal for a given suggestion index.
 * @param {number} index
 */
export function openChatFlow(index, options = {}) {
  const suggestion = suggestions[index];
  if (!suggestion) return;

  // Create or reuse dialog
  let dialog = document.querySelector('#chat-dialog');
  if (!dialog) {
    dialog = document.createElement('forge-dialog');
    dialog.id = 'chat-dialog';
    dialog.className = 'chat-dialog';
    dialog.setAttribute('fullscreen', '');
    dialog.setAttribute('mode', 'modal');
    dialog.setAttribute('persistent', '');
    dialog.setAttribute('animation-type', 'fade');
    document.body.appendChild(dialog);
  }

  // Build dialog content
  dialog.innerHTML = `
    <div class="chat-dialog-content">
      <div class="chat-header">
        <div class="ai-header-icon">
          <div class="ai-icon-wrapper">
            <forge-icon name="auto_awesome"></forge-icon>
          </div>
        </div>
        <span class="chat-header-title">Report Assistant</span>
        <div class="chat-header-actions">
          <forge-icon-button aria-label="More options">
            <forge-icon name="more_vert"></forge-icon>
          </forge-icon-button>
          <forge-icon-button aria-label="Close" id="chat-close-btn">
            <forge-icon name="close"></forge-icon>
          </forge-icon-button>
        </div>
      </div>
      <div class="chat-body">
        <div class="chat-container">
          <div class="chat-messages-spacer"></div>
          <div class="chat-messages" id="chat-messages"></div>
        </div>
      </div>
      <div class="chat-footer">
        <div class="prompt-area">
          <div class="prompt-input-row">
            <input type="text" placeholder="Ask a question..." />
            <forge-icon-button aria-label="Send">
              <forge-icon name="send"></forge-icon>
            </forge-icon-button>
          </div>
          <div class="prompt-actions-row">
            <forge-icon-button aria-label="Add attachment">
              <forge-icon name="add"></forge-icon>
            </forge-icon-button>
            <forge-icon-button aria-label="Voice input">
              <forge-icon name="mic"></forge-icon>
            </forge-icon-button>
          </div>
        </div>
      </div>
    </div>
  `;

  dialog.open = true;

  // Close handler
  dialog.querySelector('#chat-close-btn').addEventListener('click', () => {
    dialog.open = false;
  });

  // Start conversation sequence
  const messagesEl = dialog.querySelector('#chat-messages');
  runConversation(messagesEl, suggestion, dialog, options);
}

/**
 * Runs the timed conversation sequence.
 */
function runConversation(container, suggestion, dialog, options = {}) {
  // Step 1: User message (immediate)
  const userMsg = document.createElement('forge-ai-user-message');
  userMsg.textContent = suggestion.query;
  container.appendChild(userMsg);

  // Step 2: Progressive tool call sequence inside reasoning block
  setTimeout(() => {
    showToolCallSequence(container, [
      { label: 'Analyzing data sources', duration: 800 },
      { label: 'Building query', duration: 600 },
      { label: 'Running against dataset', duration: 900 },
    ], () => {
      // Step 3: Show query card response

      // Check for standard report matches
      const queryText = suggestion?.query || '';
      if (queryText) {
        const visibleReports = getVisibleStandardReports(standardReports);
        const matches = matchStandardReports(queryText, visibleReports);
        if (matches.length > 0) {
          const topMatch = matches[0];
          const tier = getConfidenceTier(topMatch.confidence);
          if (tier === 'high') {
            const responseMsg = document.createElement('forge-ai-response-message');
            responseMsg.innerHTML = buildStandardReportCard(topMatch.report, topMatch.confidence);
            container.appendChild(responseMsg);
            scrollToBottom(container);
            const openBtn = responseMsg.querySelector('[data-action="open-standard-report"]');
            if (openBtn) { openBtn.addEventListener('click', () => { openStandardReport(topMatch.report, dialog); }); }
            return;
          }
          if (tier === 'medium') { container._pendingReportRecommendation = topMatch; }
        }
      }

      const responseMsg = document.createElement('forge-ai-response-message');
      const responseContent = document.createElement('div');
      responseContent.className = 'ai-response-content';
      responseContent.innerHTML = buildQueryCard(suggestion);
      responseMsg.appendChild(responseContent);
      container.appendChild(responseMsg);
      scrollToBottom(container);

      // Wire query card interactions (disclosures, copy, chips)
      wireQueryCard(responseMsg, container, suggestion, dialog);

      // Append standard report recommendation if medium confidence
      if (container._pendingReportRecommendation) {
        const match = container._pendingReportRecommendation;
        delete container._pendingReportRecommendation;
        const recMsg = document.createElement('forge-ai-response-message');
        recMsg.innerHTML = buildStandardReportCard(match.report, match.confidence);
        container.appendChild(recMsg);
        scrollToBottom(container);
        const openBtn = recMsg.querySelector('[data-action="open-standard-report"]');
        if (openBtn) { openBtn.addEventListener('click', () => { openStandardReport(match.report, dialog); }); }
      }

      // Step 4: Open Report click -> split view
      const openReportBtn = responseMsg.querySelector('#open-report-btn');
      // Create badge (hidden initially, shown when report is open)
      const badge = document.createElement('div');
      badge.className = 'report-opened-badge';
      badge.style.display = 'none';
      badge.innerHTML = `
        <forge-icon name="open_in_new"></forge-icon>
        <span>Report open in side panel</span>
      `;
      openReportBtn.insertAdjacentElement('afterend', badge);

      function showReportOpenState() {
        openReportBtn.style.display = 'none';
        badge.style.display = '';
        transitionToSplitView(dialog, container, suggestion);
      }

      openReportBtn.addEventListener('click', showReportOpenState);

      // Listen for canvas close to restore button
      dialog.addEventListener('canvas-closed', () => {
        openReportBtn.style.display = '';
        badge.style.display = 'none';
      });

      // Auto-open report for capture
      if (options.autoOpenReport) {
        setTimeout(() => {
          showReportOpenState();
        }, 500);
      }
    });
  }, 500);
}

/**
 * Unique ID counter for query card elements (expansion panels need unique IDs).
 */
let qcIdCounter = 0;

/**
 * Builds the Query Card HTML — an artifact-based response card
 * using forge-ai-artifact + forge-tab-bar for tabbed content display.
 */
function buildQueryCard(suggestion) {
  const uid = ++qcIdCounter;
  const t = suggestion.transparency;
  const totalRows = suggestion.data ? suggestion.data.length : 0;
  const totalCols = suggestion.columns ? suggestion.columns.length : 0;

  // Build transparency content (consolidated: Data Source + Assumptions + Citations)
  let transparencyHtml = '';
  if (t) {
    const assumptionsList = t.assumptions.map(a => `<li>${a}</li>`).join('');
    const citationsList = t.citations.map(c =>
      `<div class="qc-citation-item">
        <span class="qc-citation-label">${c.label}</span>
        <span class="qc-citation-detail">${c.detail}</span>
      </div>`
    ).join('');

    transparencyHtml = `
      <div class="qc-transparency-section">
        <div class="qc-transparency-group">
          <div class="qc-transparency-group-title">
            <forge-icon name="database_outline"></forge-icon>
            Data Source
          </div>
          <div class="qc-info-row"><span class="qc-info-label">Source</span><span class="qc-info-value">${t.dataSourceDetail}</span></div>
          <div class="qc-info-row"><span class="qc-info-label">System</span><span class="qc-info-value">${t.system}</span></div>
          <div class="qc-info-row"><span class="qc-info-label">Total Records</span><span class="qc-info-value">${t.totalRecords}</span></div>
          <div class="qc-info-row"><span class="qc-info-label">Last Updated</span><span class="qc-info-value">${t.lastUpdated}</span></div>
        </div>
        ${t.assumptions.length ? `
        <div class="qc-transparency-group">
          <div class="qc-transparency-group-title">
            <forge-icon name="info_outline"></forge-icon>
            Assumptions (${t.assumptions.length})
          </div>
          <ul class="qc-assumptions-list">${assumptionsList}</ul>
        </div>` : ''}
        ${t.citations.length ? `
        <div class="qc-transparency-group">
          <div class="qc-transparency-group-title">
            <forge-icon name="link"></forge-icon>
            Data Citations (${t.citations.length})
          </div>
          ${citationsList}
        </div>` : ''}
      </div>
    `;
  }

  // Preview columns/rows for the "more" link
  const previewCols = 4;
  const previewRows = 3;
  const moreCols = totalCols > previewCols ? totalCols - previewCols : 0;
  const moreRows = totalRows > previewRows ? totalRows - previewRows : 0;

  return `
    <div class="qc-summary">
      ${markdownToHtml(suggestion.aiSummary)}
    </div>

    ${buildRefinementChips(suggestion)}

    <forge-ai-artifact class="query-card" id="qc-artifact-${uid}">
      <span slot="start" class="qc-title">${suggestion.reportTitle}</span>
      <div slot="actions" class="qc-header-actions">
        <forge-icon-button density="small" class="copy-summary-btn" type="button" aria-label="Copy summary">
          <forge-icon name="content_copy"></forge-icon>
        </forge-icon-button>
      </div>

      <div class="qc-meta-row">
        <span class="qc-meta-item">
          <forge-icon name="database_outline"></forge-icon>
          ${suggestion.dataSource}
        </span>
        <span class="qc-meta-dot"></span>
        <span class="qc-meta-item qc-freshness">
          <span class="qc-freshness-dot"></span>
          ${suggestion.freshness}
        </span>
        <span class="qc-meta-dot"></span>
        <span class="qc-meta-item">${totalRows} rows · ${totalCols} columns</span>
      </div>

      <forge-tab-bar class="qc-tab-bar" active-tab="0" clustered>
        <forge-tab>Data Preview</forge-tab>
        <forge-tab>SQL Query</forge-tab>
        <forge-tab>Transparency details</forge-tab>
      </forge-tab-bar>

      <div class="qc-tab-panels">
        <!-- Data Preview tab -->
        <div class="qc-tab-panel qc-tab-panel--active" data-tab="0">
          <forge-ai-tool-data-table class="qc-data-table"></forge-ai-tool-data-table>
          ${moreRows > 0 || moreCols > 0 ? `
          <div class="qc-preview-more">
            ${moreRows > 0 ? `${moreRows} more rows` : ''}${moreRows > 0 && moreCols > 0 ? ' · ' : ''}${moreCols > 0 ? `${moreCols} more columns` : ''}
          </div>` : ''}
        </div>

        <!-- SQL Query tab -->
        <div class="qc-tab-panel" data-tab="1">
          <div class="qc-sql-panel">
            <pre class="qc-sql-code"><code>${suggestion.sqlCode}</code></pre>
            <div class="qc-sql-actions">
              <forge-button variant="outlined" dense class="copy-sql-btn" type="button">
                <forge-icon slot="start" name="content_copy"></forge-icon>
                Copy SQL
              </forge-button>
            </div>
          </div>
        </div>

        <!-- Transparency details tab -->
        <div class="qc-tab-panel" data-tab="2">
          ${transparencyHtml}
        </div>
      </div>

      <div class="qc-actions">
        <forge-button variant="raised" class="qc-open-report-btn" id="open-report-btn" type="button">
          <forge-icon slot="start" name="insert_chart"></forge-icon>
          Explore Results In-Depth
        </forge-button>
      </div>
    </forge-ai-artifact>
  `;
}

/**
 * Wires query card interactions. Forge expansion panels handle their own
 * toggle/animation logic — we only need to wire copy buttons and refinement chips.
 */
function wireQueryCard(responseMsg, container, suggestion, dialog) {
  // --- Wire forge-ai-tool-data-table ---
  const dataTable = responseMsg.querySelector('.qc-data-table');
  if (dataTable && suggestion.columns && suggestion.data) {
    const previewCols = suggestion.columns.slice(0, 4);
    const previewRows = suggestion.data.slice(0, 3);
    dataTable.toolCall = {
      id: 'query-card-table',
      name: 'data_table',
      args: {
        headers: previewCols.map(c => c.header),
        rows: previewRows.map(row => previewCols.map(c => row[c.property] ?? '')),
        maxNumberOfRows: 10,
      },
    };
  }

  // --- Wire tab switching ---
  const tabBar = responseMsg.querySelector('.qc-tab-bar');
  const panels = responseMsg.querySelectorAll('.qc-tab-panel');
  if (tabBar && panels.length) {
    tabBar.addEventListener('forge-tab-bar-change', (e) => {
      const idx = e.detail.index;
      panels.forEach(p => p.classList.remove('qc-tab-panel--active'));
      const target = responseMsg.querySelector(`.qc-tab-panel[data-tab="${idx}"]`);
      if (target) target.classList.add('qc-tab-panel--active');
    });
  }

  // --- Wire Copy SQL ---
  const copyBtn = responseMsg.querySelector('.copy-sql-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sql = responseMsg.querySelector('.qc-sql-code code')?.textContent;
      if (sql) {
        navigator.clipboard.writeText(sql).then(() => {
          copyBtn.innerHTML = '<forge-icon slot="start" name="check"></forge-icon> Copied!';
          setTimeout(() => {
            copyBtn.innerHTML = '<forge-icon slot="start" name="content_copy"></forge-icon> Copy SQL';
          }, 2000);
        });
      }
    });
  }

  // --- Wire Copy Summary ---
  const copySummaryBtn = responseMsg.querySelector('.copy-summary-btn');
  if (copySummaryBtn) {
    copySummaryBtn.addEventListener('click', () => {
      const summaryText = responseMsg.querySelector('.qc-summary')?.textContent?.trim();
      if (summaryText) {
        navigator.clipboard.writeText(summaryText).then(() => {
          const icon = copySummaryBtn.querySelector('forge-icon');
          if (icon) {
            icon.name = 'check';
            setTimeout(() => { icon.name = 'content_copy'; }, 2000);
          }
        });
      }
    });
  }

  // --- Wire refinement chips ---
  wireRefinementChips(responseMsg, container, suggestion, dialog);
}


/**
 * Builds refinement suggestion chips (§3.3)
 */
function buildRefinementChips(suggestion) {
  if (!suggestion.refinementChips || !suggestion.refinementChips.length) return '';
  return `<div class="qc-refinement-row"><forge-ai-suggestions variant="inline" class="refinement-suggestions"></forge-ai-suggestions></div>`;
}


/**
 * Wires refinement chip click behavior
 */
function wireRefinementChips(responseMsg, container, suggestion, dialog) {
  const suggestionsEl = responseMsg.querySelector('.refinement-suggestions');
  if (!suggestionsEl || !suggestion.refinementChips?.length) return;

  // Set suggestions data
  suggestionsEl.suggestions = suggestion.refinementChips.map((label, i) => ({
    text: label,
    value: String(i),
  }));

  suggestionsEl.addEventListener('forge-ai-suggestions-select', (e) => {
    const label = e.detail.text;

    // Hide suggestions after selection
    suggestionsEl.style.display = 'none';

    // Simulate a refinement interaction
    simulateRefinement(container, label, suggestion, dialog);
  });
}

/**
 * Collapses an existing query card to its compact "previous result" state.
 */
function collapseQueryCard(card) {
  if (!card || card.classList.contains('qc-collapsed')) return;
  card.classList.add('qc-collapsed');

  const title = card.querySelector('.qc-title')?.textContent || 'Previous result';
  const meta = card.querySelector('.qc-meta-row');
  const metaText = meta ? meta.textContent.trim().replace(/\s+/g, ' ') : '';

  const collapsed = document.createElement('div');
  collapsed.className = 'qc-collapsed-bar';
  collapsed.innerHTML = `
    <span class="qc-collapsed-accent"></span>
    <span class="qc-collapsed-title">${title}</span>
    <span class="qc-collapsed-meta">${metaText}</span>
    <forge-icon name="expand_more" class="qc-collapsed-expand"></forge-icon>
  `;
  card.prepend(collapsed);

  collapsed.addEventListener('click', () => {
    card.classList.remove('qc-collapsed');
    collapsed.remove();
  });
}

/**
 * Determines the refinement tier for a chip label:
 *   'card'    — data-shaping refinement → new query card
 *   'text'    — narrative/conversational → plain text response
 *   'handoff' — too complex for chat → designer handoff
 */
function getRefinementTier(chipLabel) {
  const lower = chipLabel.toLowerCase();
  // These change the data shape → new card
  if (lower.includes('break down') || lower.includes('breakdown') ||
      lower.includes('filter') || lower.includes('only') ||
      lower.includes('group by') || lower.includes('split')) {
    return 'card';
  }
  // These are conversational / narrative
  if (lower.includes('compare') || lower.includes('chart') ||
      lower.includes('trend') || lower.includes('export') ||
      lower.includes('schedule')) {
    return 'text';
  }
  // Complex operations → handoff
  if (lower.includes('cross-reference') || lower.includes('join') ||
      lower.includes('calculated field') || lower.includes('workload') ||
      lower.includes('inspector') || lower.includes('efficiency')) {
    return 'handoff';
  }
  return 'card'; // default to card for data refinements
}

/**
 * Builds a refined suggestion object based on the chip clicked.
 * Returns a new "suggestion-like" object with updated data for the new query card.
 */
function buildRefinedSuggestion(chipLabel, parentSuggestion) {
  const lower = chipLabel.toLowerCase();

  // --- Break down by permit type (or similar breakdown) ---
  if (lower.includes('break down') || lower.includes('breakdown') || lower.includes('split')) {
    return {
      reportTitle: `${parentSuggestion.reportTitle} — By Permit Type`,
      dataSource: parentSuggestion.dataSource,
      freshness: parentSuggestion.freshness,
      sqlCode: `SELECT\n  DATE_FORMAT(p.issue_date, '%b %Y') AS month,\n  p.permit_type AS type,\n  COUNT(*) AS permits\nFROM permits p\nWHERE p.issue_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)\n  AND p.status = 'ISSUED'\nGROUP BY month, p.permit_type\nORDER BY p.issue_date, permits DESC;`,
      aiSummary: `I've broken down the permits by type. **Residential renovations** dominate at 41% of all permits, followed by **commercial new construction** at 23% and **residential new build** at 18%.\n\n- Residential renovations peaked in **June** with 142 permits\n- Commercial construction is trending upward — **+18% year-over-year**\n- Demolition permits remain steady at ~30/month`,
      columns: [
        { property: 'month', header: 'Month', sortable: true },
        { property: 'residential_reno', header: 'Residential Reno', sortable: true },
        { property: 'commercial_new', header: 'Commercial New', sortable: true },
        { property: 'residential_new', header: 'Residential New', sortable: true },
        { property: 'demolition', header: 'Demolition', sortable: true },
        { property: 'total', header: 'Total', sortable: true },
      ],
      data: [
        { month: 'Jan 2025', residential_reno: 82, commercial_new: 44, residential_new: 35, demolition: 31, total: 192 },
        { month: 'Feb 2025', residential_reno: 88, commercial_new: 48, residential_new: 38, demolition: 33, total: 207 },
        { month: 'Mar 2025', residential_reno: 101, commercial_new: 55, residential_new: 44, demolition: 36, total: 236 },
        { month: 'Apr 2025', residential_reno: 112, commercial_new: 60, residential_new: 50, demolition: 38, total: 260 },
        { month: 'May 2025', residential_reno: 124, commercial_new: 68, residential_new: 58, demolition: 41, total: 291 },
        { month: 'Jun 2025', residential_reno: 142, commercial_new: 72, residential_new: 64, demolition: 44, total: 322 },
      ],
      transparency: parentSuggestion.transparency,
      refinementChips: [
        'Show only residential',
        'Compare to last year',
        'Filter by date range',
      ],
    };
  }

  // --- Filter by date range / zone / priority ---
  if (lower.includes('filter') || lower.includes('only')) {
    const isHighPriority = lower.includes('high') || lower.includes('priority');
    if (isHighPriority) {
      return {
        reportTitle: `${parentSuggestion.reportTitle} — High Priority Only`,
        dataSource: parentSuggestion.dataSource,
        freshness: parentSuggestion.freshness,
        sqlCode: parentSuggestion.sqlCode.replace('GROUP BY', "AND v.priority = 'High'\nGROUP BY"),
        aiSummary: `Filtered to **high-priority violations only** — **206 cases** year-to-date. **Building code** violations lead with 56 high-priority cases (27%), followed by **property maintenance** at 42 cases.\n\n- Average resolution time for high-priority: **12.4 days** (vs. 17.8 overall)\n- **92%** of high-priority cases are resolved within 30 days\n- Fire safety has the fastest turnaround at **8 days average**`,
        columns: [
          { property: 'type', header: 'Violation Type', sortable: true },
          { property: 'high', header: 'High Priority', sortable: true },
          { property: 'open', header: 'Open', sortable: true },
          { property: 'resolved', header: 'Resolved', sortable: true },
          { property: 'avgDays', header: 'Avg Days', sortable: true },
        ],
        data: [
          { type: 'Building Code', high: 56, open: 12, resolved: 44, avgDays: 14 },
          { type: 'Property Maintenance', high: 42, open: 8, resolved: 34, avgDays: 18 },
          { type: 'Fire Safety', high: 31, open: 5, resolved: 26, avgDays: 8 },
          { type: 'Zoning Violations', high: 28, open: 6, resolved: 22, avgDays: 22 },
          { type: 'Accessibility', high: 14, open: 3, resolved: 11, avgDays: 19 },
          { type: 'Electrical', high: 12, open: 2, resolved: 10, avgDays: 12 },
        ],
        transparency: parentSuggestion.transparency,
        refinementChips: [
          'Group by month',
          'Show resolution trend',
          'Compare to last year',
        ],
      };
    }
    // Generic date filter
    return {
      reportTitle: `${parentSuggestion.reportTitle} — Last 6 Months`,
      dataSource: parentSuggestion.dataSource,
      freshness: parentSuggestion.freshness,
      sqlCode: parentSuggestion.sqlCode.replace('INTERVAL 12 MONTH', 'INTERVAL 6 MONTH'),
      aiSummary: `Filtered to the **last 6 months** (Oct 2025 – Mar 2026). This period shows **1,371 permits** issued — a slight dip compared to the first half of the year.\n\n- **October** was the strongest month with 218 permits\n- Seasonal slowdown is evident — **December** hit the lowest at 145\n- Downtown still leads across all months`,
      columns: parentSuggestion.columns,
      data: parentSuggestion.data.slice(6),
      transparency: parentSuggestion.transparency,
      refinementChips: [
        'Break down by permit type',
        'Compare to same period last year',
        'Show trend chart',
      ],
    };
  }

  // --- Group by month ---
  if (lower.includes('group by')) {
    return {
      reportTitle: `${parentSuggestion.reportTitle} — Monthly Trend`,
      dataSource: parentSuggestion.dataSource,
      freshness: parentSuggestion.freshness,
      sqlCode: parentSuggestion.sqlCode,
      aiSummary: `Regrouped by month to show the trend. The data reveals a clear **seasonal arc** — activity ramps up through spring, peaks in **June** (322 permits), then steadily declines into winter.\n\n- **Q2** (Apr–Jun) accounts for 34% of all annual permits\n- Month-over-month growth averaged **+8%** from Jan to Jun\n- The Dec-to-Jan transition shows a **32% rebound** historically`,
      columns: parentSuggestion.columns,
      data: parentSuggestion.data,
      transparency: parentSuggestion.transparency,
      refinementChips: [
        'Break down by permit type',
        'Filter by date range',
        'Show year-over-year comparison',
      ],
    };
  }

  // Fallback — generic filtered result
  return {
    reportTitle: `${parentSuggestion.reportTitle} — Refined`,
    dataSource: parentSuggestion.dataSource,
    freshness: parentSuggestion.freshness,
    sqlCode: parentSuggestion.sqlCode,
    aiSummary: `I've updated the results based on your request. The refined dataset contains **${Math.floor(Math.random() * 200 + 80)} records** matching the new criteria.\n\nThe key patterns from the original data still hold, with some interesting shifts in the filtered view.`,
    columns: parentSuggestion.columns,
    data: parentSuggestion.data.slice(0, 6),
    transparency: parentSuggestion.transparency,
    refinementChips: [
      'Filter further',
      'Compare to last year',
      'Break down by category',
    ],
  };
}

/**
 * Returns a text-only response for narrative/conversational refinements.
 */
function getTextRefinementResponse(chipLabel, suggestion) {
  const lower = chipLabel.toLowerCase();
  if (lower.includes('compare')) {
    return `Comparing to the same period last year, the overall trend is positive. **Total permits are up 14%**, driven primarily by a **22% increase in residential** activity. Commercial permits dipped slightly (**-8%**), likely due to two large projects completing in Q1 last year that haven't been replaced yet.\n\nThe strongest growth district is **Riverside** (+31%), while **Industrial** stayed essentially flat (+2%).`;
  }
  if (lower.includes('chart') || lower.includes('trend')) {
    return `The trend line shows a clear seasonal pattern — activity climbs from January through a **June peak**, then gradually declines into December. This is consistent with prior years.\n\nOne notable shift: the **summer plateau is widening**. Last year, the peak was concentrated in June–July. This year, May through August all stayed above 270 permits/month, suggesting more sustained construction activity.`;
  }
  if (lower.includes('export') || lower.includes('excel')) {
    return `I can export this in several formats:\n\n- **CSV** — Raw data, opens in any spreadsheet app\n- **Excel (.xlsx)** — Formatted with headers and column widths\n- **PDF** — Print-ready with summary and data table\n\nWhich format works best?`;
  }
  if (lower.includes('schedule')) {
    return `I can set this up as a recurring report. Common schedules for this data:\n\n- **Daily at 6:00 AM** — Fresh data every morning\n- **Weekly on Monday** — Weekly digest for team meetings\n- **Monthly on the 1st** — Month-over-month comparison\n\nWho should receive it?`;
  }
  return `Good question. Based on the current data, **${Math.floor(Math.random() * 500 + 100)} records** match that criteria. The patterns are consistent with what we saw in the broader view — no major outliers.`;
}

/**
 * Simulates a refinement interaction when user clicks a suggestion chip.
 * Uses the tiered response system:
 *   - 'card' → collapse previous card, show new query card
 *   - 'text' → conversational text response
 *   - 'handoff' → designer handoff nudge
 */
function simulateRefinement(container, chipLabel, suggestion, dialog) {
  const tier = getRefinementTier(chipLabel);

  // Add user message
  const userMsg = document.createElement('forge-ai-user-message');
  userMsg.textContent = chipLabel;
  container.appendChild(userMsg);
  scrollToBottom(container);

  // Collapse previous query card(s)
  if (tier === 'card') {
    container.querySelectorAll('forge-ai-artifact.query-card:not(.qc-collapsed)').forEach(card => {
      collapseQueryCard(card);
    });
  }

  // Tool call sequence for refinements
  const refinementSteps = tier === 'card'
    ? [
        { label: 'Refining query parameters', duration: 600 },
        { label: 'Running updated query', duration: 700 },
      ]
    : [{ label: 'Analyzing request', duration: 800 }];

  setTimeout(() => {
    showToolCallSequence(container, refinementSteps, () => {
      if (tier === 'card') {
        // --- New query card ---
        const refinedSuggestion = buildRefinedSuggestion(chipLabel, suggestion);
        const responseMsg = document.createElement('forge-ai-response-message');
        const responseContent = document.createElement('div');
        responseContent.className = 'ai-response-content';
        responseContent.innerHTML = buildQueryCard(refinedSuggestion);
        responseMsg.appendChild(responseContent);
        container.appendChild(responseMsg);
        scrollToBottom(container);

        // Wire interactions on the new card
        wireQueryCard(responseMsg, container, refinedSuggestion, dialog);

        // Wire Explore Results button on the new card
        const openBtn = responseMsg.querySelector('#open-report-btn');
        if (openBtn && dialog) {
          openBtn.addEventListener('click', () => {
            transitionToSplitView(dialog, container, refinedSuggestion);
          });
        }

      } else if (tier === 'text') {
        // --- Conversational text response ---
        const responseMsg = document.createElement('forge-ai-response-message');
        const responseContent = document.createElement('div');
        responseContent.className = 'ai-response-content';
        responseContent.innerHTML = `
          ${markdownToHtml(getTextRefinementResponse(chipLabel, suggestion))}
          <div class="data-source-badge">
            <forge-icon name="database_outline"></forge-icon>
            ${suggestion.dataSource}
            <span class="data-source-dot"></span>
            ${suggestion.freshness}
          </div>
        `;
        responseMsg.appendChild(responseContent);
        container.appendChild(responseMsg);
        scrollToBottom(container);

      } else {
        // --- Handoff nudge ---
        showHandoffNudge(container, suggestion);
      }
    });
  }, 400);
}

/**
 * Shows the Designer handoff nudge after a refinement (§1.5)
 */
function showHandoffNudge(container, suggestion) {
  if (!suggestion.handoffTrigger) return;
  const ht = suggestion.handoffTrigger;

  // Simulated user message that triggers handoff
  const userMsg = document.createElement('forge-ai-user-message');
  userMsg.textContent = ht.userMessage;
  container.appendChild(userMsg);
  scrollToBottom(container);

  setTimeout(() => {
    showToolCallSequence(container, [
      { label: 'Evaluating capabilities', duration: 700 },
      { label: 'Checking designer availability', duration: 500 },
    ], () => {
      const responseMsg = document.createElement('forge-ai-response-message');
      const responseContent = document.createElement('div');
      responseContent.className = 'ai-response-content';
      responseContent.innerHTML = `
        <p>${ht.systemResponse}</p>
        <div class="handoff-card">
          <div class="handoff-card-header">
            <forge-icon name="auto_awesome"></forge-icon>
            <span>This needs the Report Designer</span>
          </div>
          <div class="handoff-card-body">
            <div class="handoff-context-item">
              <forge-icon name="database_outline"></forge-icon>
              <span>Dataset: ${suggestion.dataSource}</span>
            </div>
            <div class="handoff-context-item">
              <forge-icon name="filter_list"></forge-icon>
              <span>Filters and query will transfer</span>
            </div>
            <div class="handoff-context-item">
              <forge-icon name="code"></forge-icon>
              <span>SQL query ready to edit</span>
            </div>
          </div>
          <div class="handoff-card-actions">
            <button class="handoff-btn" type="button">
              <forge-icon name="open_in_new"></forge-icon>
              ${ht.handoffLabel}
            </button>
            <button class="handoff-btn-secondary" type="button">
              Request from Tyler
            </button>
          </div>
        </div>
      `;
      responseMsg.appendChild(responseContent);
      container.appendChild(responseMsg);
      scrollToBottom(container);

      // Wire handoff button to launch Report Designer in-dialog
      const handoffBtn = responseContent.querySelector('.handoff-btn');
      handoffBtn.addEventListener('click', () => {
        // Write chat context to sessionStorage so report-canvas can pick it up
        const handoffContext = {
          reportTitle: suggestion.reportTitle,
          dataSource: suggestion.dataSource,
          freshness: suggestion.freshness,
          sqlCode: suggestion.sqlCode,
          columns: suggestion.columns,
          data: suggestion.data,
          query: suggestion.query,
          aiSummary: suggestion.aiSummary,
          transparency: suggestion.transparency,
          handoffReason: suggestion.handoffTrigger?.userMessage || '',
        };
        sessionStorage.setItem('tira-handoff-context', JSON.stringify(handoffContext));

        // Mount React report designer inside the dialog
        const dialog = document.querySelector('#chat-dialog');
        if (dialog) mountReportDesigner(dialog);
      });
    });
  }, 400);
}

/**
 * Mounts the React Report Designer inside the dialog.
 * Lazy-loads React and the report-canvas App on first use.
 */
let _reactRoot = null;

async function mountReportDesigner(dialog) {
  const content = dialog.querySelector('.chat-dialog-content');

  // Save current chat content so we can restore on back
  const chatSnapshot = content.innerHTML;
  const chatClassName = content.className;

  // Show loading state
  content.innerHTML = '';
  content.className = 'chat-dialog-content designer-fullscreen';
  content.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;background:#f0f1f4;">
      <div style="display:flex;align-items:center;gap:12px;padding:16px;background:#fff;border-bottom:1px solid #e0e0e0;">
        <button type="button" id="designer-back-btn" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid #dadce0;border-radius:6px;background:#fff;cursor:pointer;font-size:13px;font-weight:500;color:rgba(0,0,0,0.7);">
          <forge-icon name="arrow_back"></forge-icon>
          Back to Chat
        </button>
        <span style="font-size:14px;font-weight:500;color:rgba(0,0,0,0.87);">Loading Report Designer...</span>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;">
        <forge-ai-thinking-indicator></forge-ai-thinking-indicator>
      </div>
    </div>
  `;

  // Wire back button immediately (works even while loading)
  content.querySelector('#designer-back-btn').addEventListener('click', () => {
    // Unmount React
    if (_reactRoot) {
      _reactRoot.unmount();
      _reactRoot = null;
    }
    // Restore chat
    content.className = chatClassName;
    content.innerHTML = chatSnapshot;
  });

  try {
    // Patch customElements.define to skip already-registered elements
    // (TIRA's main.js already registers Forge components; forge-react tries again)
    const originalDefine = customElements.define.bind(customElements);
    customElements.define = function(name, constructor, options) {
      if (customElements.get(name)) return; // skip if already registered
      originalDefine(name, constructor, options);
    };

    // Lazy-load the mount helper (keeps React in a single bundle — avoids duplicate instances)
    const { mountDesigner } = await import('../report-canvas/src/mount.jsx');

    // Restore original define
    customElements.define = originalDefine;

    // Build the designer container with a back-bar + React mount point
    content.innerHTML = '';
    content.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;">
        <div class="designer-nav-bar">
          <button type="button" id="designer-back-btn" class="designer-back-btn">
            <forge-icon name="arrow_back"></forge-icon>
            Back to Chat
          </button>
        </div>
        <div id="report-designer-root" style="flex:1;overflow:hidden;"></div>
      </div>
    `;

    // Wire back button
    content.querySelector('#designer-back-btn').addEventListener('click', () => {
      if (_reactRoot) {
        _reactRoot.unmount();
        _reactRoot = null;
      }
      content.className = chatClassName;
      content.innerHTML = chatSnapshot;
    });

    // Mount React app (returns the root for later unmounting)
    const mountPoint = content.querySelector('#report-designer-root');
    _reactRoot = mountDesigner(mountPoint);

  } catch (err) {
    console.error('Failed to load Report Designer:', err);
    content.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px;">
        <forge-icon name="error_outline" style="--forge-icon-font-size:48px;color:#e57373;"></forge-icon>
        <span style="font-size:16px;color:rgba(0,0,0,0.6);">Failed to load Report Designer</span>
        <button type="button" onclick="location.reload()" style="padding:8px 16px;border:1px solid #dadce0;border-radius:6px;background:#fff;cursor:pointer;">Reload</button>
      </div>
    `;
  }
}

/**
 * Opens the Saved Reports Library view (§1.4)
 */
export function openLibraryView() {
  // Lazy import to avoid circular dependency
  import('./mock-data.js').then(({ savedReports }) => {
    let dialog = document.querySelector('#chat-dialog');
    if (!dialog) {
      dialog = document.createElement('forge-dialog');
      dialog.id = 'chat-dialog';
      dialog.className = 'chat-dialog';
      dialog.setAttribute('fullscreen', '');
      dialog.setAttribute('mode', 'modal');
      dialog.setAttribute('persistent', '');
      dialog.setAttribute('animation-type', 'fade');
      document.body.appendChild(dialog);
    }

    const content = document.createElement('div');
    content.className = 'chat-dialog-content library-layout';

    const categories = [...new Set(savedReports.map(r => r.category))];
    const categoryChips = categories.map(c =>
      `<button class="library-category-chip" type="button">${c}</button>`
    ).join('');

    const reportCards = savedReports.map(r => `
      <div class="library-report-card" data-report-id="${r.id}">
        <div class="library-card-header">
          <span class="library-card-type ${r.type.toLowerCase().replace(/\s+/g, '-')}">${r.type}</span>
          <span class="library-card-category">${r.category}</span>
        </div>
        <div class="library-card-title">${r.title}</div>
        <div class="library-card-description">${r.description}</div>
        <div class="library-card-meta">
          ${r.schedule ? `<span class="library-meta-item"><forge-icon name="schedule"></forge-icon> ${r.schedule}</span>` : ''}
          <span class="library-meta-item"><forge-icon name="person"></forge-icon> ${r.owner}</span>
          <span class="library-meta-item">${r.rows} rows · Last run: ${r.lastRun}</span>
        </div>
        <div class="library-card-actions">
          <button class="library-action-btn primary" type="button">Run Now</button>
          <button class="library-action-btn" type="button">Open in Chat</button>
          <button class="library-action-btn" type="button">Open in Designer</button>
        </div>
      </div>
    `).join('');

    content.innerHTML = `
      <div class="library-header">
        <div class="library-header-left">
          <forge-icon-button aria-label="Close" id="library-close-btn">
            <forge-icon name="close"></forge-icon>
          </forge-icon-button>
          <span class="library-header-title">Saved Reports Library</span>
        </div>
        <div class="library-header-right">
          <div class="library-search">
            <forge-icon name="search"></forge-icon>
            <input type="text" placeholder="Search reports..." class="library-search-input" />
          </div>
        </div>
      </div>
      <div class="library-body">
        <div class="library-filters">
          <span class="library-filter-label">Categories:</span>
          <button class="library-category-chip active" type="button">All</button>
          ${categoryChips}
        </div>
        <div class="library-stats">
          <span>${savedReports.length} reports</span>
          <span class="library-stats-dot"></span>
          <span>${savedReports.filter(r => r.schedule).length} scheduled</span>
          <span class="library-stats-dot"></span>
          <span>${savedReports.filter(r => r.type === 'Standard').length} standard, ${savedReports.filter(r => r.type !== 'Standard').length} custom</span>
        </div>
        <div class="library-grid">
          ${reportCards}
        </div>
      </div>
    `;

    dialog.innerHTML = '';
    dialog.appendChild(content);
    dialog.open = true;

    // Wire close
    content.querySelector('#library-close-btn').addEventListener('click', () => {
      dialog.open = false;
    });

    // Wire category filter chips
    const filterChips = content.querySelectorAll('.library-category-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const category = chip.textContent;
        const cards = content.querySelectorAll('.library-report-card');
        cards.forEach(card => {
          const cardCat = card.querySelector('.library-card-category')?.textContent;
          if (category === 'All' || cardCat === category) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

    // Wire search
    const searchInput = content.querySelector('.library-search-input');
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      const cards = content.querySelectorAll('.library-report-card');
      cards.forEach(card => {
        const title = card.querySelector('.library-card-title')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('.library-card-description')?.textContent.toLowerCase() || '';
        if (title.includes(query) || desc.includes(query)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}


function scrollToBottom(el) {
  const scrollParent = el.closest('.chat-container') || el.closest('.split-chat-panel') || el.closest('.split-chat-messages');
  if (scrollParent) {
    requestAnimationFrame(() => {
      scrollParent.scrollTop = scrollParent.scrollHeight;
    });
  }
}

/**
 * Collapses the split view back to full-width chat.
 */
function collapseToFullChat(dialog, splitChatContainer, splitFooter) {
  const content = dialog.querySelector('.chat-dialog-content');
  const customSplit = content.querySelector('.custom-split-container');
  if (!customSplit) return;

  // Grab existing messages and footer from split panel
  const existingMessages = splitChatContainer.querySelector('#chat-messages');
  const existingFooter = splitFooter;

  // Remove the split container
  customSplit.remove();

  // Rebuild the full chat header
  const chatHeader = document.createElement('div');
  chatHeader.className = 'chat-header';
  chatHeader.innerHTML = `
    <div class="ai-header-icon">
      <div class="ai-icon-wrapper">
        <forge-icon name="auto_awesome"></forge-icon>
      </div>
    </div>
    <span class="chat-header-title">Report Assistant</span>
    <div class="chat-header-actions">
      <forge-icon-button aria-label="More options">
        <forge-icon name="more_vert"></forge-icon>
      </forge-icon-button>
      <forge-icon-button aria-label="Close" class="close-chat-btn">
        <forge-icon name="close"></forge-icon>
      </forge-icon-button>
    </div>
  `;
  content.appendChild(chatHeader);

  // Rebuild chat body with spacer + messages
  const chatBody = document.createElement('div');
  chatBody.className = 'chat-body';

  const chatContainer = document.createElement('div');
  chatContainer.className = 'chat-container';

  const spacer = document.createElement('div');
  spacer.className = 'chat-messages-spacer';
  chatContainer.appendChild(spacer);

  if (existingMessages) {
    chatContainer.appendChild(existingMessages);
  }

  chatBody.appendChild(chatContainer);
  content.appendChild(chatBody);

  // Re-add footer
  if (existingFooter) {
    existingFooter.classList.remove('split-chat-footer');
    content.appendChild(existingFooter);
  }

  // Wire close button
  const closeBtn = chatHeader.querySelector('.close-chat-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      dialog.open = false;
    });
  }

  // Notify that canvas was closed so Open Report button can reactivate
  dialog.dispatchEvent(new CustomEvent('canvas-closed'));

  // Scroll to bottom
  requestAnimationFrame(() => {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });
}

/**
 * Replaces the chat-only view with a split-view: chat left, report right.
 */
function transitionToSplitView(dialog, chatMessages, suggestion) {
  const content = dialog.querySelector('.chat-dialog-content');
  const chatHeader = content.querySelector('.chat-header');
  const chatBody = content.querySelector('.chat-body');
  const chatFooter = content.querySelector('.chat-footer');

  // Get references to messages BEFORE removing anything
  const existingMessages = chatBody.querySelector('#chat-messages');

  // Fade out chat body before removing
  chatBody.classList.add('fade-out');

  // Wait for fade out animation, then build split view
  setTimeout(() => {
    chatHeader.remove();
    chatBody.remove();
    buildSplitView();
  }, 200);

  function buildSplitView() {

  // Build split view
  const splitView = document.createElement('forge-split-view');
  splitView.className = 'report-split';
  splitView.setAttribute('orientation', 'horizontal');

  // Left panel: chat with conversation + input
  const leftPanel = document.createElement('forge-split-view-panel');
  leftPanel.setAttribute('resizable', 'after');
  leftPanel.setAttribute('size', '450');
  leftPanel.setAttribute('min', '320');
  leftPanel.setAttribute('max', '600');
  leftPanel.setAttribute('accessible-label', 'Resize chat panel');
  leftPanel.id = 'chat-panel';

  const splitChatContainer = document.createElement('div');
  splitChatContainer.className = 'split-chat-container';

  // Add chat header to left panel
  const leftHeader = document.createElement('div');
  leftHeader.className = 'chat-header split-chat-header';
  leftHeader.innerHTML = `
    <div class="ai-header-icon">
      <div class="ai-icon-wrapper">
        <forge-icon name="auto_awesome"></forge-icon>
      </div>
    </div>
    <span class="chat-header-title">Report Assistant</span>
    <div class="chat-header-actions">
      <forge-icon-button aria-label="More options">
        <forge-icon name="more_vert"></forge-icon>
      </forge-icon-button>
    </div>
  `;
  splitChatContainer.appendChild(leftHeader);

  // Move existing chat messages into left panel
  const chatMessagesContainer = document.createElement('div');
  chatMessagesContainer.className = 'split-chat-messages';
  if (existingMessages) {
    chatMessagesContainer.appendChild(existingMessages);
  }
  splitChatContainer.appendChild(chatMessagesContainer);

  // Move footer (prompt input) into left panel
  if (chatFooter) {
    chatFooter.classList.add('split-chat-footer');
    splitChatContainer.appendChild(chatFooter);
  }

  leftPanel.appendChild(splitChatContainer);

  // Right panel: report
  const rightPanel = document.createElement('forge-split-view-panel');
  rightPanel.id = 'report-panel';
  const reportPanel = buildReportPanel(suggestion);
  rightPanel.appendChild(reportPanel);

  // Create custom draggable divider
  const divider = document.createElement('div');
  divider.className = 'custom-divider';
  divider.innerHTML = '<div class="divider-handle"></div>';

  // Build custom split container
  const customSplit = document.createElement('div');
  customSplit.className = 'custom-split-container';
  customSplit.appendChild(leftPanel);
  customSplit.appendChild(divider);
  customSplit.appendChild(rightPanel);

  // Add to content
  content.appendChild(customSplit);

  // Wire close canvas button — collapse split view back to full chat
  const closeCanvasBtn = reportPanel.querySelector('.close-canvas-btn');
  if (closeCanvasBtn) {
    closeCanvasBtn.addEventListener('click', () => {
      collapseToFullChat(dialog, splitChatContainer, chatFooter);
    });
  }

  // Make divider draggable
  let isDragging = false;
  let startX = 0;
  let startLeftWidth = 0;

  divider.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startLeftWidth = leftPanel.offsetWidth;
    divider.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const newLeftWidth = startLeftWidth + deltaX;
    const containerWidth = customSplit.offsetWidth;
    const minWidth = 320;
    const maxWidth = 600;

    if (newLeftWidth >= minWidth && newLeftWidth <= maxWidth) {
      leftPanel.style.width = `${newLeftWidth}px`;
      leftPanel.style.flexBasis = `${newLeftWidth}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      divider.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
  }
}

/**
 * Builds the report panel with toolbar, view switching, export/schedule, filter bar, and data table.
 */
function buildReportPanel(suggestion) {
  const panel = document.createElement('div');
  panel.className = 'report-panel';

  // === Title bar with report name, source badge, and actions ===
  const titleBar = document.createElement('div');
  titleBar.className = 'report-title-bar';
  titleBar.innerHTML = `
    <div class="report-title-bar-left">
      <span class="report-toolbar-title">${suggestion.reportTitle}</span>
      <div class="data-source-badge">
        <forge-icon name="database_outline"></forge-icon>
        ${suggestion.dataSource}
        <span class="data-source-dot"></span>
        ${suggestion.freshness}
      </div>
    </div>
    <div class="report-title-bar-right">
      <button class="toolbar-icon-btn" type="button" aria-label="Open in new window" title="Open in new window">
        <forge-icon name="open_in_new"></forge-icon>
      </button>
      <button class="toolbar-icon-btn close-canvas-btn" type="button" aria-label="Close report canvas" title="Close canvas">
        <forge-icon name="close"></forge-icon>
      </button>
    </div>
  `;
  panel.appendChild(titleBar);

  // === Action bar: view toggle, export, schedule, share ===
  const actionBar = document.createElement('div');
  actionBar.className = 'report-action-bar';
  actionBar.innerHTML = `
    <div class="report-action-bar-left">
      <div class="view-toggle-group">
        <button class="view-toggle-btn active" data-view="table" type="button" title="Table view">
          <forge-icon name="grid_view"></forge-icon>
          <span>Table</span>
        </button>
        <button class="view-toggle-btn" data-view="code" type="button" title="SQL view">
          <forge-icon name="code"></forge-icon>
          <span>SQL</span>
        </button>
      </div>
    </div>
    <div class="report-action-bar-right">
      <div class="canvas-action-group">
        <button class="canvas-action-btn" type="button" id="report-actions-btn">
          <span>Actions</span>
          <forge-icon name="arrow_drop_down" class="action-dropdown-arrow"></forge-icon>
        </button>
        <div class="canvas-dropdown" id="report-actions-dropdown">
          <button class="canvas-dropdown-item" type="button" data-action="export">
            <div class="dropdown-item-row">
              <forge-icon name="file_download"></forge-icon>
              <span class="dropdown-item-label">Export</span>
            </div>
            <span class="dropdown-item-desc">Download as PDF, CSV, or Excel</span>
          </button>
          <button class="canvas-dropdown-item" type="button" data-action="schedule">
            <div class="dropdown-item-row">
              <forge-icon name="schedule"></forge-icon>
              <span class="dropdown-item-label">Schedule</span>
            </div>
            <span class="dropdown-item-desc">Set up recurring delivery</span>
          </button>
          <button class="canvas-dropdown-item" type="button" data-action="share">
            <div class="dropdown-item-row">
              <forge-icon name="share"></forge-icon>
              <span class="dropdown-item-label">Share</span>
            </div>
            <span class="dropdown-item-desc">Send to colleagues or teams</span>
          </button>
          <button class="canvas-dropdown-item" type="button" data-action="save">
            <div class="dropdown-item-row">
              <forge-icon name="save"></forge-icon>
              <span class="dropdown-item-label">Save to Library</span>
            </div>
            <span class="dropdown-item-desc">Add to your saved reports</span>
          </button>
        </div>
      </div>
    </div>
  `;
  panel.appendChild(actionBar);

  // === Filter bar ===
  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <div class="filter-bar-label">
      <forge-icon name="filter_list"></forge-icon>
      <span>Filters</span>
    </div>
    <div class="filter-chips">
      <button class="filter-chip-btn" type="button">
        All Districts
        <forge-icon name="arrow_drop_down"></forge-icon>
      </button>
      <button class="filter-chip-btn" type="button">
        All Months
        <forge-icon name="arrow_drop_down"></forge-icon>
      </button>
      <button class="filter-chip-btn" type="button">
        Permit Type
        <forge-icon name="arrow_drop_down"></forge-icon>
      </button>
    </div>
  `;
  panel.appendChild(filterBar);

  // === Table view (default) ===
  const tableView = document.createElement('div');
  tableView.className = 'report-canvas-view';
  tableView.dataset.view = 'table';
  const tableContainer = document.createElement('div');
  tableContainer.className = 'report-table-container';
  const table = document.createElement('forge-table');
  table.setAttribute('dense', '');
  table.setAttribute('fixed-headers', '');
  tableContainer.appendChild(table);
  tableView.appendChild(tableContainer);
  panel.appendChild(tableView);


  // === Code/SQL view ===
  const codeView = document.createElement('div');
  codeView.className = 'report-code-view';
  codeView.dataset.view = 'code';
  codeView.style.display = 'none';
  codeView.innerHTML = `
    <pre><code>${suggestion.sqlCode || 'SELECT * FROM data;'}</code></pre>
  `;
  panel.appendChild(codeView);

  // === Wire everything up after DOM insertion ===
  requestAnimationFrame(() => {
    table.columnConfigurations = suggestion.columns;
    table.data = suggestion.data;

    // View toggle (Table / Chart / SQL)
    const toggleButtons = panel.querySelectorAll('.view-toggle-btn');
    const views = { table: tableView, code: codeView };
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        toggleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Object.values(views).forEach(v => v.style.display = 'none');
        const target = views[btn.dataset.view];
        if (target) target.style.display = 'flex';
      });
    });

    // Report Actions dropdown toggle
    const reportActionsBtn = panel.querySelector('#report-actions-btn');
    const reportActionsDropdown = panel.querySelector('#report-actions-dropdown');
    reportActionsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = reportActionsDropdown.classList.contains('open');
      closeAllDropdowns(panel);
      if (!isOpen) reportActionsDropdown.classList.add('open');
    });

    // Close dropdowns on click outside
    document.addEventListener('click', () => closeAllDropdowns(panel));

    // Report action item clicks — brief feedback per action
    panel.querySelectorAll('.canvas-dropdown-item[data-action]').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        closeAllDropdowns(panel);

        const actionLabel = reportActionsBtn.querySelector('span');
        const feedbackMap = {
          export: 'Exported!',
          schedule: 'Scheduled!',
          share: 'Shared!',
          save: 'Saved!'
        };
        actionLabel.textContent = feedbackMap[action] || 'Done!';
        reportActionsBtn.classList.add('action-success');
        setTimeout(() => {
          actionLabel.textContent = 'Report Actions';
          reportActionsBtn.classList.remove('action-success');
        }, 1500);
      });
    });
  });

  return panel;
}

function closeAllDropdowns(panel) {
  panel.querySelectorAll('.canvas-dropdown').forEach(d => d.classList.remove('open'));
}

/**
 * Applies or removes an output template on the report panel.
 * Adds/updates a branded header, themed footer, and CSS custom properties.
 */
function applyTemplate(panel, template, suggestion) {
  // Remove existing template elements
  panel.querySelector('.report-template-header')?.remove();
  panel.querySelector('.report-template-footer')?.remove();
  panel.removeAttribute('data-template');

  // Reset CSS custom properties
  const props = ['--tpl-primary', '--tpl-secondary', '--tpl-accent', '--tpl-surface',
    '--tpl-text', '--tpl-muted', '--tpl-border', '--tpl-table-border', '--tpl-table-stripe',
    '--tpl-content-border', '--tpl-content-bg', '--tpl-content-radius', '--tpl-header-accent'];
  props.forEach(p => panel.style.removeProperty(p));

  if (!template) return;

  // Set data attribute for CSS hooks
  panel.setAttribute('data-template', template.id);

  // Apply CSS custom properties
  const t = template.theme;
  panel.style.setProperty('--tpl-primary', t.primary);
  panel.style.setProperty('--tpl-secondary', t.secondary);
  panel.style.setProperty('--tpl-accent', t.accent);
  panel.style.setProperty('--tpl-surface', t.surface);
  panel.style.setProperty('--tpl-text', t.text);
  panel.style.setProperty('--tpl-muted', t.muted);
  panel.style.setProperty('--tpl-border', t.border);
  panel.style.setProperty('--tpl-table-border', t.tableBorder);
  panel.style.setProperty('--tpl-table-stripe', t.tableStripe);
  panel.style.setProperty('--tpl-content-border', template.contentStyle.border);
  panel.style.setProperty('--tpl-content-bg', template.contentStyle.background);
  panel.style.setProperty('--tpl-content-radius', template.contentStyle.radius);
  panel.style.setProperty('--tpl-header-accent', template.contentStyle.headerAccent);

  // Build branded header
  const header = document.createElement('div');
  header.className = 'report-template-header';
  header.innerHTML = `
    <div class="tpl-header-inner" style="background: ${template.header.background}; color: ${template.header.text};">
      <div class="tpl-header-logo">
        <forge-icon name="${template.logo}"></forge-icon>
      </div>
      <div class="tpl-header-text">
        <div class="tpl-header-department">${template.header.department || suggestion.reportTitle}</div>
        <div class="tpl-header-subtitle">${template.header.subtitle} — ${suggestion.reportTitle}</div>
      </div>
      <div class="tpl-header-meta">
        <span>${suggestion.dataSource}</span>
        <span>${suggestion.freshness}</span>
      </div>
    </div>
  `;

  // Build footer
  const footer = document.createElement('div');
  footer.className = 'report-template-footer';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  footer.innerHTML = `
    <div class="tpl-footer-inner" style="border-top-color: ${t.border};">
      <span class="tpl-footer-text">${template.footer.text}</span>
      <span class="tpl-footer-meta">
        ${template.footer.showDate ? `Generated ${dateStr} at ${timeStr}` : ''}
        ${template.footer.showPageNumbers ? ' — Page 1 of 1' : ''}
      </span>
    </div>
  `;

  // Insert header after filter bar, footer at the end
  const filterBar = panel.querySelector('.filter-bar');
  if (filterBar) {
    filterBar.insertAdjacentElement('afterend', header);
  }
  panel.appendChild(footer);
}

// ---------------------------------------------------------------------------
// Standard Reports — Split-view experience
// ---------------------------------------------------------------------------

function openStandardReport(report, dialog) {
  const content = dialog.querySelector('.chat-dialog-content');
  if (!content) return;
  const existingElements = content.querySelectorAll('.chat-header, .chat-body, .chat-footer');
  existingElements.forEach(el => { el.style.transition = 'opacity 0.3s'; el.style.opacity = '0'; });

  setTimeout(() => {
    existingElements.forEach(el => el.remove());
    const existingSplit = content.querySelector('.custom-split-container');
    if (existingSplit) existingSplit.remove();

    const splitContainer = document.createElement('div');
    splitContainer.className = 'custom-split-container';
    splitContainer.style.cssText = 'display:flex;height:100%;width:100%;';

    const leftPanel = document.createElement('div');
    leftPanel.style.cssText = 'width:38%;border-right:2px solid #e0e0e0;display:flex;flex-direction:column;background:#fafafa;';
    leftPanel.innerHTML = buildStandardReportChatPanel(report);

    const divider = document.createElement('div');
    divider.className = 'custom-divider';
    divider.innerHTML = '<div class="divider-handle"></div>';

    const rightPanel = document.createElement('div');
    rightPanel.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:hidden;';
    rightPanel.innerHTML = buildStandardReportPanel(report);

    splitContainer.appendChild(leftPanel);
    splitContainer.appendChild(divider);
    splitContainer.appendChild(rightPanel);
    content.appendChild(splitContainer);

    const viewerEl = rightPanel.querySelector('.sr-viewer');
    const viewerControls = wireStandardReportPanel(viewerEl, report, {
      onFilterChange: (paramId, value) => {
        const param = report.parameters.find(p => p.id === paramId);
        addSRChatMessage(leftPanel, 'ai', `${param ? param.label : paramId} changed to <strong>${value}</strong>. The report has been updated.`);
      },
      onViewChange: (view) => { addSRChatMessage(leftPanel, 'ai', `Switched to <strong>${view ? view.name : 'Default View'}</strong>.`); },
      onViewSaved: (view) => { addSRChatMessage(leftPanel, 'ai', `View "<strong>${view.name}</strong>" saved. You can select it anytime from the view dropdown.`); },
      onClose: () => { dialog.open = false; },
      onOpenDesigner: () => {
        const tableSection = report.sections.find(s => s.type === 'table');
        const handoffContext = {
          reportTitle: report.name,
          dataSource: getDomainLabel(report.domain),
          freshness: report.freshness,
          columns: tableSection?.columns || [],
          data: tableSection ? report.data[tableSection.dataKey] || [] : [],
          handoffReason: `Opened from Standard Report: ${report.name}`,
        };
        sessionStorage.setItem('tira-handoff-context', JSON.stringify(handoffContext));
        mountReportDesigner(dialog);
      }
    });

    wireSRChatInput(leftPanel, report, viewerControls);
    wireSRSuggestionChips(leftPanel, report, viewerControls);

    // Divider drag
    let isDragging = false, startX = 0, startLeftWidth = 0;
    divider.addEventListener('mousedown', (e) => { isDragging = true; startX = e.clientX; startLeftWidth = leftPanel.offsetWidth; divider.classList.add('dragging'); document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; e.preventDefault(); });
    document.addEventListener('mousemove', (e) => { if (!isDragging) return; const nw = startLeftWidth + (e.clientX - startX); if (nw >= 320 && nw <= 600) { leftPanel.style.width = `${nw}px`; leftPanel.style.flexBasis = `${nw}px`; } });
    document.addEventListener('mouseup', () => { if (isDragging) { isDragging = false; divider.classList.remove('dragging'); document.body.style.cursor = ''; document.body.style.userSelect = ''; } });
  }, 300);
}

function buildStandardReportChatPanel(report) {
  const suggestionsHtml = report.suggestions.map(s => `<span class="sr-chat-chip" data-suggestion="${s}">${s}</span>`).join('');
  return `
    <div style="padding:16px;flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:12px;">
      <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">AI Assistant</div>
      <div class="sr-chat-messages">
        <div style="background:#fff;border-radius:8px;padding:12px;border:1px solid #e0e0e0;">
          <div style="font-size:13px;font-weight:600;margin-bottom:6px;">${report.name}</div>
          <div style="font-size:12px;color:#555;line-height:1.5;">This report shows ${report.description.toLowerCase()} Currently showing default filters. ${report.freshness}.</div>
        </div>
      </div>
      <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Suggestions</div>
      <div class="sr-chat-suggestions" style="display:flex;flex-wrap:wrap;gap:6px;">${suggestionsHtml}</div>
    </div>
    <div style="padding:12px 16px;border-top:1px solid #e0e0e0;display:flex;gap:8px;">
      <input class="sr-chat-input" style="flex:1;border:1px solid #ddd;border-radius:8px;padding:10px 12px;font-size:13px;" placeholder="Ask about this report..." />
      <button class="sr-chat-send" style="background:var(--forge-theme-primary,#3f51b5);color:#fff;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;font-size:13px;">Send</button>
    </div>
    <style>
      .sr-chat-chip{background:#e8eaf6;color:var(--forge-theme-primary,#3f51b5);font-size:11px;padding:6px 10px;border-radius:16px;cursor:pointer;transition:background 0.15s;}
      .sr-chat-chip:hover{background:#c5cae9;}
      .sr-chat-msg{background:#fff;border-radius:8px;padding:10px 12px;border:1px solid #e0e0e0;font-size:12px;line-height:1.5;}
      .sr-chat-msg--user{background:#e8eaf6;border-color:#c5cae9;text-align:right;}
    </style>`;
}

function addSRChatMessage(leftPanel, type, html) {
  const c = leftPanel.querySelector('.sr-chat-messages');
  if (!c) return;
  const msg = document.createElement('div');
  msg.className = `sr-chat-msg ${type === 'user' ? 'sr-chat-msg--user' : ''}`;
  msg.innerHTML = html;
  c.appendChild(msg);
  c.scrollTop = c.scrollHeight;
}

function wireSRChatInput(leftPanel, report, viewerControls) {
  const input = leftPanel.querySelector('.sr-chat-input');
  const sendBtn = leftPanel.querySelector('.sr-chat-send');
  if (!input || !sendBtn) return;
  function handleSend() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addSRChatMessage(leftPanel, 'user', text);
    setTimeout(() => { addSRChatMessage(leftPanel, 'ai', processConversationalFilter(text, report, viewerControls)); }, 600);
  }
  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSend(); });
}

function wireSRSuggestionChips(leftPanel, report, viewerControls) {
  leftPanel.querySelectorAll('.sr-chat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.dataset.suggestion;
      addSRChatMessage(leftPanel, 'user', text);
      chip.style.display = 'none';
      setTimeout(() => { addSRChatMessage(leftPanel, 'ai', processConversationalFilter(text, report, viewerControls)); }, 600);
    });
  });
}

function processConversationalFilter(text, report, viewerControls) {
  const lower = text.toLowerCase();
  for (const param of report.parameters) {
    for (const option of param.options) {
      if (option === param.options[0]) continue;
      if (lower.includes(option.toLowerCase())) {
        viewerControls.setParam(param.id, option);
        return `Filtered <strong>${param.label}</strong> to <strong>${option}</strong>. The report has been updated.`;
      }
    }
  }
  if (lower.includes('my district') || lower.includes('my neighborhood')) {
    const p = report.parameters.find(p => p.id === 'district' || p.id === 'neighborhood');
    if (p) { viewerControls.setParam(p.id, p.options[1]); return `Filtered to <strong>${p.options[1]}</strong> (your assigned area). The report has been updated.`; }
  }
  if (lower.includes('residential')) {
    const p = report.parameters.find(p => p.id === 'permitType' || p.id === 'violationType');
    if (p) { const m = p.options.find(o => o.toLowerCase().includes('residential')); if (m) { viewerControls.setParam(p.id, m); return `Filtered to <strong>${m}</strong>. The report has been updated.`; } }
  }
  const filterList = report.parameters.map(p => {
    const opts = p.options.filter(o => o !== p.options[0]).slice(0, 3).join(', ');
    return `<strong>${p.label}</strong> (${opts}${p.options.length > 4 ? ', ...' : ''})`;
  }).join(' · ');
  return `I'm not sure how to apply that. You can filter this report by: ${filterList}. Try saying something like "<em>show me ${report.parameters[0]?.options[1] || 'a specific value'}</em>" or use the filter controls on the right.`;
}

export function openStandardReportInChat(reportId) {
  const report = getStandardReportById(reportId);
  if (!report) return;
  let dialog = document.querySelector('#chat-dialog');
  if (!dialog) {
    dialog = document.createElement('forge-dialog');
    dialog.id = 'chat-dialog';
    dialog.className = 'chat-dialog';
    dialog.setAttribute('fullscreen', '');
    dialog.setAttribute('mode', 'modal');
    dialog.setAttribute('persistent', '');
    dialog.setAttribute('animation-type', 'fade');
    document.body.appendChild(dialog);
  }
  dialog.innerHTML = `
    <div class="chat-dialog-content">
      <div class="chat-header">
        <div class="ai-header-icon"><div class="ai-icon-wrapper"><forge-icon name="auto_awesome"></forge-icon></div></div>
        <span class="chat-header-title">${report.name}</span>
        <span style="background:var(--forge-theme-primary,#3f51b5);color:#fff;font-size:9px;padding:2px 6px;border-radius:3px;text-transform:uppercase;margin-left:8px;">Standard</span>
        <div class="chat-header-actions">
          <forge-icon-button aria-label="Close" id="chat-close-btn"><forge-icon name="close"></forge-icon></forge-icon-button>
        </div>
      </div>
      <div class="chat-body">
        <div class="chat-container">
          <div class="chat-messages-spacer"></div>
          <div class="chat-messages" id="chat-messages">
            <forge-ai-response-message><div style="font-size:14px;color:#555;">Opened standard report: <strong>${report.name}</strong></div></forge-ai-response-message>
          </div>
        </div>
      </div>
    </div>`;
  dialog.open = true;
  dialog.querySelector('#chat-close-btn').addEventListener('click', () => { dialog.open = false; });
  setTimeout(() => { openStandardReport(report, dialog); }, 400);
}
