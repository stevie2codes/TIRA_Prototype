/**
 * Hub Chat Panel — custom chat UI that renders inside forge-ai-floating-chat.
 * Shows the same query card design as the main TIRA chat flow.
 * "Explore Results" expands the modal and shows the split view.
 */

import { suggestions } from './mock-data.js';
import './hub-chat-panel.css';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function markdownToHtml(md) {
  let html = md
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
  return `<p>${html}</p>`;
}

function findSuggestion(text) {
  const lower = text.toLowerCase();
  if (lower.includes('budget') || lower.includes('actual')) return suggestions[2];
  if (lower.includes('expenditure') || lower.includes('fund')) return suggestions[2];
  if (lower.includes('revenue')) return suggestions[2];
  if (lower.includes('permit')) return suggestions[0];
  if (lower.includes('violation') || lower.includes('code')) return suggestions[1];
  if (lower.includes('arrest')) return suggestions[3];
  if (lower.includes('case') || lower.includes('disposition')) return suggestions[4];
  return suggestions[0];
}

// ---------------------------------------------------------------------------
// Suggestions config
// ---------------------------------------------------------------------------
const chatSuggestions = [
  { text: 'Budget vs. actuals', icon: 'account_balance' },
  { text: 'Expenditures by fund', icon: 'description' },
  { text: 'Revenue tracking', icon: 'trending_up' },
];

// ---------------------------------------------------------------------------
// Panel builder
// ---------------------------------------------------------------------------

/**
 * Creates the hub chat panel DOM and returns { element, destroy }.
 * @param {Object} opts
 * @param {() => void} opts.onExpand — called when "Explore Results" is clicked
 * @param {() => void} opts.onClose — called when close/minimize is clicked
 */
export function createHubChatPanel({ onExpand, onClose }) {
  const panel = document.createElement('div');
  panel.className = 'hub-chat-panel';

  // State
  let currentSuggestion = null;

  // ── Header ──
  const header = document.createElement('div');
  header.className = 'hcp-header';
  header.innerHTML = `
    <div class="hcp-header-left">
      <forge-icon name="auto_awesome" style="--forge-icon-font-size: 20px; color: #3f51b5;"></forge-icon>
      <span class="hcp-header-title">Report assistant</span>
    </div>
    <div class="hcp-header-actions">
      <button class="hcp-header-btn" type="button" title="Minimize" data-action="minimize">
        <forge-icon name="close" style="--forge-icon-font-size: 18px;"></forge-icon>
      </button>
    </div>
  `;
  panel.appendChild(header);

  // Header button handlers
  header.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'minimize' && onClose) onClose();
  });

  // ── Body (scrollable) ──
  const body = document.createElement('div');
  body.className = 'hcp-body';
  panel.appendChild(body);

  // ── Footer (prompt) ──
  const footer = document.createElement('div');
  footer.className = 'hcp-footer';
  footer.innerHTML = `
    <div class="hcp-prompt">
      <input type="text" placeholder="Ask a question..." class="hcp-prompt-input" />
      <forge-icon-button aria-label="Send" class="hcp-send-btn">
        <forge-icon name="send"></forge-icon>
      </forge-icon-button>
    </div>
    <div class="hcp-disclaimer">AI can make mistakes. Always verify responses.</div>
  `;
  panel.appendChild(footer);

  const input = footer.querySelector('.hcp-prompt-input');
  const sendBtn = footer.querySelector('.hcp-send-btn');

  // ── Render empty state ──
  function renderEmptyState() {
    body.innerHTML = `
      <div class="hcp-empty-state">
        <div class="hcp-empty-icon">
          <forge-icon name="auto_awesome" style="--forge-icon-font-size: 40px; color: #3f51b5;"></forge-icon>
        </div>
        <h3 class="hcp-empty-title">Welcome to reporting Assistant!</h3>
        <p class="hcp-empty-subtitle">Ask a question about your data or ask for a report!</p>
        <div class="hcp-suggestions">
          ${chatSuggestions.map(s => `
            <button class="hcp-suggestion-btn" type="button" data-query="${s.text}">
              <forge-icon name="${s.icon}" style="--forge-icon-font-size: 18px;"></forge-icon>
              <span>${s.text}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // Wire suggestion clicks
    body.querySelectorAll('.hcp-suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => handleSend(btn.dataset.query));
    });
  }

  // ── Handle send ──
  function handleSend(text) {
    if (!text || !text.trim()) return;
    input.value = '';

    currentSuggestion = findSuggestion(text);

    // Show user message + thinking
    body.innerHTML = `
      <div class="hcp-messages">
        <div class="hcp-user-msg">
          <div class="hcp-user-bubble">${text}</div>
        </div>
        <div class="hcp-thinking">
          <forge-ai-thinking-indicator show-text></forge-ai-thinking-indicator>
        </div>
      </div>
    `;

    // After delay, show the response with query card
    setTimeout(() => {
      renderConversation(text, currentSuggestion);
    }, 1500);
  }

  // ── Render conversation with query card ──
  function renderConversation(userText, suggestion) {
    const t = suggestion.transparency;
    const totalRows = suggestion.data ? suggestion.data.length : 0;
    const totalCols = suggestion.columns ? suggestion.columns.length : 0;

    // Mini data preview
    let miniTableHtml = '';
    if (suggestion.columns && suggestion.data && suggestion.data.length > 0) {
      const previewRows = suggestion.data.slice(0, 3);
      const previewCols = suggestion.columns.slice(0, 4);
      const headerCells = previewCols.map(c => `<th>${c.header}</th>`).join('');
      const bodyRows = previewRows.map(row => {
        const cells = previewCols.map(c => `<td>${row[c.property] ?? ''}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      miniTableHtml = `
        <div class="qc-section-header">Results Preview</div>
        <div class="qc-data-preview">
          <table class="qc-mini-table">
            <thead><tr>${headerCells}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
          <div class="qc-preview-more">${suggestion.data.length - 3} more rows · Explore full results</div>
        </div>
      `;
    }

    // Assumptions
    const assumptionsList = t ? t.assumptions.map(a => `<li>${a}</li>`).join('') : '';

    body.innerHTML = `
      <div class="hcp-messages">
        <div class="hcp-user-msg">
          <div class="hcp-user-bubble">${userText}</div>
        </div>
        <div class="hcp-ai-response">
          <div class="qc-summary">${markdownToHtml(suggestion.aiSummary)}</div>
          <div class="query-card">
            <div class="qc-header">
              <div class="qc-header-left">
                <div class="qc-icon"><forge-icon name="auto_awesome"></forge-icon></div>
                <div class="qc-header-text">
                  <span class="qc-title">${suggestion.reportTitle}</span>
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
                </div>
              </div>
            </div>

            ${miniTableHtml}

            <div class="qc-section-header">Data Transparency</div>
            <div class="qc-disclosures">
              <div class="qc-disclosure" data-section="source">
                <button class="qc-disclosure-toggle" type="button">
                  <forge-icon name="database_outline"></forge-icon>
                  <span>Data Source</span>
                  <span class="qc-disclosure-detail">${t ? t.dataSourceDetail : suggestion.dataSource}</span>
                  <forge-icon name="expand_more" class="qc-disclosure-arrow"></forge-icon>
                </button>
                <div class="qc-disclosure-body" style="display:none;">
                  ${t ? `
                    <div class="qc-disclosure-content">
                      <div class="qc-info-row"><span class="qc-info-label">System</span><span class="qc-info-value">${t.system}</span></div>
                      <div class="qc-info-row"><span class="qc-info-label">Total Records</span><span class="qc-info-value">${t.totalRecords}</span></div>
                      <div class="qc-info-row"><span class="qc-info-label">Last Updated</span><span class="qc-info-value">${t.lastUpdated}</span></div>
                    </div>
                  ` : ''}
                </div>
              </div>
              <div class="qc-disclosure" data-section="assumptions">
                <button class="qc-disclosure-toggle" type="button">
                  <forge-icon name="info_outline"></forge-icon>
                  <span>Assumptions</span>
                  <span class="qc-disclosure-detail">${t ? t.assumptions.length + ' made' : ''}</span>
                  <forge-icon name="expand_more" class="qc-disclosure-arrow"></forge-icon>
                </button>
                <div class="qc-disclosure-body" style="display:none;">
                  <div class="qc-disclosure-content">
                    <ul class="transparency-assumptions">${assumptionsList}</ul>
                  </div>
                </div>
              </div>
            </div>

            <div class="qc-actions">
              <div class="qc-actions-row">
                <button class="qc-open-report-btn" type="button" id="hcp-explore-btn">
                  <forge-icon name="insert_chart"></forge-icon>
                  Explore Results
                </button>
                <button class="qc-secondary-btn" type="button">
                  <forge-icon name="content_copy"></forge-icon>
                  Copy Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Wire disclosure toggles
    body.querySelectorAll('.qc-disclosure').forEach(disc => {
      const toggle = disc.querySelector('.qc-disclosure-toggle');
      const discBody = disc.querySelector('.qc-disclosure-body');
      const arrow = disc.querySelector('.qc-disclosure-arrow');
      if (!toggle || !discBody) return;
      toggle.addEventListener('click', () => {
        const isOpen = discBody.style.display !== 'none';
        discBody.style.display = isOpen ? 'none' : 'block';
        disc.classList.toggle('open', !isOpen);
        if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
      });
    });

    // Wire "Explore Results"
    const exploreBtn = body.querySelector('#hcp-explore-btn');
    if (exploreBtn && onExpand) {
      exploreBtn.addEventListener('click', () => {
        onExpand(currentSuggestion);
      });
    }

    // Scroll to bottom
    requestAnimationFrame(() => {
      body.scrollTop = body.scrollHeight;
    });
  }

  // Wire prompt input
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend(input.value);
  });
  sendBtn.addEventListener('click', () => handleSend(input.value));

  // Initial render
  renderEmptyState();

  return {
    element: panel,
    destroy: () => { panel.remove(); },
    getCurrentSuggestion: () => currentSuggestion,
  };
}

// ---------------------------------------------------------------------------
// Split view builder (for expanded modal)
// ---------------------------------------------------------------------------

/**
 * Builds the split view layout: chat on left, report table on right.
 * Returns a DOM element.
 */
export function buildExpandedSplitView(chatPanel, suggestion, { onCollapse }) {
  const split = document.createElement('div');
  split.className = 'hcp-split-view';

  // Left: chat panel (reuse the existing one)
  const leftPane = document.createElement('div');
  leftPane.className = 'hcp-split-left';
  leftPane.appendChild(chatPanel);

  // Right: report panel
  const rightPane = document.createElement('div');
  rightPane.className = 'hcp-split-right';

  // Report title bar
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
      <button class="toolbar-icon-btn" type="button" title="Collapse" data-action="collapse">
        <forge-icon name="close"></forge-icon>
      </button>
    </div>
  `;
  rightPane.appendChild(titleBar);

  // View toggle bar
  const actionBar = document.createElement('div');
  actionBar.className = 'report-action-bar';
  actionBar.innerHTML = `
    <div class="report-action-bar-left">
      <div class="view-toggle-group">
        <button class="view-toggle-btn active" data-view="table" type="button">
          <forge-icon name="grid_view"></forge-icon>
          <span>Table</span>
        </button>
        <button class="view-toggle-btn" data-view="chart" type="button">
          <forge-icon name="bar_chart"></forge-icon>
          <span>Chart</span>
        </button>
        <button class="view-toggle-btn" data-view="code" type="button">
          <forge-icon name="code"></forge-icon>
          <span>SQL</span>
        </button>
      </div>
    </div>
  `;
  rightPane.appendChild(actionBar);

  // Data table
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'hcp-report-table-wrapper';
  if (suggestion.columns && suggestion.data) {
    const headers = suggestion.columns.map(c => `<th>${c.header}</th>`).join('');
    const rows = suggestion.data.map(row => {
      const cells = suggestion.columns.map(c => `<td>${row[c.property] ?? ''}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    tableWrapper.innerHTML = `
      <table class="hub-table" style="font-size: 12px;">
        <thead><tr>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }
  rightPane.appendChild(tableWrapper);

  // SQL view (hidden)
  const codeView = document.createElement('div');
  codeView.className = 'hcp-code-view';
  codeView.style.display = 'none';
  codeView.innerHTML = `<pre style="padding:16px;margin:0;font-size:12px;overflow:auto;flex:1;"><code>${suggestion.sqlCode || ''}</code></pre>`;
  rightPane.appendChild(codeView);

  split.appendChild(leftPane);
  split.appendChild(rightPane);

  // Wire collapse button
  titleBar.querySelector('[data-action="collapse"]')?.addEventListener('click', () => {
    if (onCollapse) onCollapse();
  });

  // Wire view toggles
  const toggleBtns = actionBar.querySelectorAll('.view-toggle-btn');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      tableWrapper.style.display = view === 'table' ? '' : 'none';
      codeView.style.display = view === 'code' ? 'flex' : 'none';
    });
  });

  return split;
}
