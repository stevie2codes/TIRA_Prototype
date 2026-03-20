import { suggestions } from './mock-data.js';
import './chat-flow.css';

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

  // Step 2: Thinking indicator (after 500ms)
  setTimeout(() => {
    const thinking = document.createElement('forge-ai-thinking-indicator');
    thinking.setAttribute('show-text', '');
    container.appendChild(thinking);
    scrollToBottom(container);

    // Step 3: Replace thinking with response (after 2500ms)
    setTimeout(() => {
      container.removeChild(thinking);

      const responseMsg = document.createElement('forge-ai-response-message');
      const responseContent = document.createElement('div');
      responseContent.className = 'ai-response-content';
      responseContent.innerHTML = `
        ${markdownToHtml(suggestion.aiSummary)}
        <div class="data-source-badge">
          <forge-icon name="database_outline"></forge-icon>
          ${suggestion.dataSource}
          <span class="data-source-dot"></span>
          ${suggestion.freshness}
        </div>
        ${buildTransparencyPanel(suggestion)}
        ${buildRefinementChips(suggestion)}
        <br>
        <button class="open-report-btn" id="open-report-btn">
          <forge-icon name="insert_chart"></forge-icon>
          Open Report
        </button>
      `;
      responseMsg.appendChild(responseContent);
      container.appendChild(responseMsg);
      scrollToBottom(container);

      // Wire transparency toggle
      wireTransparencyToggle(responseMsg);

      // Wire refinement chip clicks
      wireRefinementChips(responseMsg, container, suggestion);

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
    }, 2000);
  }, 500);
}

/**
 * Builds the transparency panel HTML (§4.1)
 */
function buildTransparencyPanel(suggestion) {
  const t = suggestion.transparency;
  if (!t) return '';

  const assumptionsList = t.assumptions.map(a => `<li>${a}</li>`).join('');
  const citationsList = t.citations.map(c =>
    `<div class="citation-item">
      <span class="citation-label">${c.label}</span>
      <span class="citation-detail">${c.detail}</span>
    </div>`
  ).join('');

  return `
    <div class="transparency-toggle" role="button" tabindex="0">
      <forge-icon name="info_outline"></forge-icon>
      <span>How this was generated</span>
      <forge-icon name="arrow_drop_down" class="transparency-arrow"></forge-icon>
    </div>
    <div class="transparency-panel" style="display: none;">
      <div class="transparency-section">
        <div class="transparency-section-header">
          <forge-icon name="database_outline"></forge-icon>
          DATA SOURCE
        </div>
        <div class="transparency-section-body">
          <div class="transparency-row">
            <span class="transparency-label">${t.dataSourceDetail}</span>
          </div>
          <div class="transparency-row">
            <span class="transparency-meta">${t.system} · ${t.totalRecords} records</span>
          </div>
          <div class="transparency-row">
            <span class="transparency-meta">Last updated: ${t.lastUpdated}</span>
          </div>
        </div>
      </div>
      <div class="transparency-section">
        <div class="transparency-section-header">
          <forge-icon name="code"></forge-icon>
          SQL QUERY
        </div>
        <div class="transparency-section-body">
          <pre class="transparency-sql"><code>${suggestion.sqlCode}</code></pre>
          <div class="transparency-sql-actions">
            <button class="transparency-action-btn copy-sql-btn" type="button">
              <forge-icon name="content_copy"></forge-icon>
              Copy SQL
            </button>
            <button class="transparency-action-btn edit-designer-btn" type="button">
              <forge-icon name="open_in_new"></forge-icon>
              Edit in Report Designer
            </button>
          </div>
        </div>
      </div>
      <div class="transparency-section">
        <div class="transparency-section-header">
          <forge-icon name="info_outline"></forge-icon>
          ASSUMPTIONS
        </div>
        <div class="transparency-section-body">
          <ul class="transparency-assumptions">${assumptionsList}</ul>
        </div>
      </div>
      <div class="transparency-section">
        <div class="transparency-section-header">
          <forge-icon name="link"></forge-icon>
          DATA CITATIONS
        </div>
        <div class="transparency-section-body">
          ${citationsList}
        </div>
      </div>
    </div>
  `;
}

/**
 * Builds refinement suggestion chips (§3.3)
 */
function buildRefinementChips(suggestion) {
  if (!suggestion.refinementChips || !suggestion.refinementChips.length) return '';
  const chips = suggestion.refinementChips.map((label, i) =>
    `<button class="refinement-chip" data-chip-index="${i}" type="button">${label}</button>`
  ).join('');
  return `<div class="refinement-chips-row">${chips}</div>`;
}

/**
 * Wires transparency panel toggle
 */
function wireTransparencyToggle(responseMsg) {
  const toggle = responseMsg.querySelector('.transparency-toggle');
  const panel = responseMsg.querySelector('.transparency-panel');
  if (!toggle || !panel) return;

  toggle.addEventListener('click', () => {
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';
    toggle.classList.toggle('open', !isOpen);
    const arrow = toggle.querySelector('.transparency-arrow');
    if (arrow) {
      arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
    }
    // After expanding, scroll so the panel is visible
    if (!isOpen) {
      requestAnimationFrame(() => {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  });

  // Copy SQL button
  const copyBtn = panel.querySelector('.copy-sql-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sql = panel.querySelector('.transparency-sql code')?.textContent;
      if (sql) {
        navigator.clipboard.writeText(sql).then(() => {
          copyBtn.innerHTML = '<forge-icon name="check"></forge-icon> Copied!';
          setTimeout(() => {
            copyBtn.innerHTML = '<forge-icon name="content_copy"></forge-icon> Copy SQL';
          }, 2000);
        });
      }
    });
  }
}

/**
 * Wires refinement chip click behavior
 */
function wireRefinementChips(responseMsg, container, suggestion) {
  const chips = responseMsg.querySelectorAll('.refinement-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const label = chip.textContent;
      // Disable all chips after one is clicked
      chips.forEach(c => {
        c.disabled = true;
        c.classList.add('chip-used');
      });
      chip.classList.add('chip-active');

      // Simulate a refinement interaction
      simulateRefinement(container, label, suggestion);
    });
  });
}

/**
 * Simulates a refinement interaction when user clicks a suggestion chip
 */
function simulateRefinement(container, chipLabel, suggestion) {
  // Add user message
  const userMsg = document.createElement('forge-ai-user-message');
  userMsg.textContent = chipLabel;
  container.appendChild(userMsg);
  scrollToBottom(container);

  // Thinking
  setTimeout(() => {
    const thinking = document.createElement('forge-ai-thinking-indicator');
    thinking.setAttribute('show-text', '');
    container.appendChild(thinking);
    scrollToBottom(container);

    setTimeout(() => {
      container.removeChild(thinking);

      const responseMsg = document.createElement('forge-ai-response-message');
      const responseContent = document.createElement('div');
      responseContent.className = 'ai-response-content';

      // Generate a contextual response based on the chip
      const refinementResponse = getRefinementResponse(chipLabel, suggestion);
      responseContent.innerHTML = `
        ${markdownToHtml(refinementResponse)}
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

      // After refinement, show the handoff nudge
      setTimeout(() => {
        showHandoffNudge(container, suggestion);
      }, 1500);
    }, 1500);
  }, 400);
}

/**
 * Returns a contextual refinement response
 */
function getRefinementResponse(chipLabel, suggestion) {
  const lower = chipLabel.toLowerCase();
  if (lower.includes('chart') || lower.includes('trend')) {
    return `Here's the trend visualization. The data shows a clear seasonal pattern with peak activity in summer months and a decline toward year-end.\n\nI can also show this as a line chart or area chart if you prefer a different view.`;
  }
  if (lower.includes('filter') || lower.includes('only')) {
    return `I've applied the filter. The results now show a focused subset — **${Math.floor(Math.random() * 200 + 50)} records** matching your criteria.\n\nWant to narrow this down further, or export what we have?`;
  }
  if (lower.includes('export') || lower.includes('excel')) {
    return `I can export this in several formats:\n\n- **CSV** — Raw data, opens in any spreadsheet app\n- **Excel (.xlsx)** — Formatted with headers and column widths\n- **PDF** — Print-ready with summary and data table\n\nWhich format do you prefer?`;
  }
  if (lower.includes('schedule')) {
    return `I can set this up as a recurring report. Common schedules for this data:\n\n- **Daily at 6:00 AM** — Fresh data every morning\n- **Weekly on Monday** — Weekly summary for team meetings\n- **Monthly on the 1st** — Month-over-month comparison\n\nWho should receive it, and in what format?`;
  }
  if (lower.includes('compare') || lower.includes('breakdown') || lower.includes('break down')) {
    return `Good call. Adding the comparison shows some interesting shifts — **residential permits are up 22%** while **commercial permits dipped 8%** in the same period.\n\nWant me to dig into a specific category?`;
  }
  return `Done — I've updated the results. **${Math.floor(Math.random() * 500 + 100)} records** match the new criteria.\n\nAnything else you'd like to adjust?`;
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
    const thinking = document.createElement('forge-ai-thinking-indicator');
    thinking.setAttribute('show-text', '');
    container.appendChild(thinking);
    scrollToBottom(container);

    setTimeout(() => {
      container.removeChild(thinking);

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
    }, 1500);
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
        <button class="view-toggle-btn" data-view="chart" type="button" title="Chart view">
          <forge-icon name="bar_chart"></forge-icon>
          <span>Chart</span>
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
          <forge-icon name="more_vert"></forge-icon>
          <span>Report Actions</span>
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

  // === Chart view (placeholder) ===
  const chartView = document.createElement('div');
  chartView.className = 'report-canvas-view report-chart-view';
  chartView.dataset.view = 'chart';
  chartView.style.display = 'none';
  // Build simple bar chart from data
  const chartBars = suggestion.data.map(row => {
    const total = row.total || row.high || row.budget || 0;
    const maxVal = Math.max(...suggestion.data.map(r => r.total || r.high || r.budget || 0));
    const pct = maxVal > 0 ? (total / maxVal) * 100 : 0;
    const label = row.month || row.type || row.department || '';
    return `
      <div class="chart-bar-row">
        <span class="chart-bar-label">${label}</span>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width: ${pct}%"></div>
        </div>
        <span class="chart-bar-value">${total.toLocaleString()}</span>
      </div>
    `;
  }).join('');
  chartView.innerHTML = `
    <div class="chart-container">
      <div class="chart-title">${suggestion.reportTitle}</div>
      <div class="chart-bars">${chartBars}</div>
    </div>
  `;
  panel.appendChild(chartView);

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
    const views = { table: tableView, chart: chartView, code: codeView };
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
