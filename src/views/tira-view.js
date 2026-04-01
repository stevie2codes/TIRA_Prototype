/**
 * TIRA Landing Page View
 * Extracted from index.html + main.js — renders the AI-prompt-forward reporting homepage.
 */

import { openChatFlow, openLibraryView, openStandardReportInChat } from '../chat-flow.js';
import { showConfigPanel } from '../standard-report-viewer.js';
import { getStandardReportById } from '../standard-reports.js';
import {
  currentUser,
  domains,
  getStandardReportsForDomain,
  getQuestionsForDomain,
  recentActivity,
} from '../user-context.js';
import { standardReports } from '../standard-reports.js';
import { getViewsForReport } from '../saved-views.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let selectedDomainId = null;
let activeTab = 'reports'; // 'reports' | 'ask' | 'recent'
let cleanupFns = [];

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
export function render(container) {
  selectedDomainId = 'epl';
  activeTab = 'reports';
  cleanupFns = [];

  // Greeting
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const greeting = `Good ${timeOfDay}, ${currentUser.firstName}`;

  container.innerHTML = `
    <!-- Side Menu -->
    <nav class="side-menu" id="side-menu">
      <div class="side-menu-header">
        <span class="side-menu-title">TIRA</span>
        <forge-icon-button id="menu-close-btn" aria-label="Close menu">
          <forge-icon name="close"></forge-icon>
        </forge-icon-button>
      </div>
      <div class="side-menu-content">
        <div class="side-menu-section">
          <div class="side-menu-section-label">REPORTS</div>
          <button class="side-menu-item" type="button" data-action="my-reports">
            <forge-icon name="folder"></forge-icon>
            <span>My Reports</span>
          </button>
          <button class="side-menu-item" type="button" data-action="shared-reports">
            <forge-icon name="people"></forge-icon>
            <span>Shared</span>
          </button>
          <button class="side-menu-item" type="button" data-action="scheduled-reports">
            <forge-icon name="schedule"></forge-icon>
            <span>Scheduled</span>
          </button>
        </div>
        <div class="side-menu-section">
          <div class="side-menu-section-label">LIBRARY</div>
          <button class="side-menu-item" type="button" data-action="templates">
            <forge-icon name="description"></forge-icon>
            <span>Templates</span>
          </button>
        </div>
      </div>
      <div class="side-menu-footer">
        <button class="side-menu-item" type="button" data-action="settings">
          <forge-icon name="settings"></forge-icon>
          <span>Settings</span>
        </button>
        <button class="side-menu-item" type="button" data-action="help">
          <forge-icon name="help_outline"></forge-icon>
          <span>Help</span>
        </button>
      </div>
    </nav>
    <div class="side-menu-overlay" id="side-menu-overlay"></div>

    <div class="home-body">
      <div class="home-content">
        <div class="title-section">
          <div class="title-row">
            <span class="title-text" id="home-greeting">${greeting}</span>
          </div>

          <div class="prompt-area">
            <div class="prompt-input-row">
              <input type="text" placeholder="Ask a question about your data..." />
              <forge-icon-button aria-label="Send" id="tira-send-btn">
                <forge-icon name="send"></forge-icon>
              </forge-icon-button>
            </div>
            <div class="prompt-button-row">
              <div class="prompt-actions">
                <forge-icon-button aria-label="Add attachment">
                  <forge-icon name="add"></forge-icon>
                </forge-icon-button>
              </div>
            </div>
            <div class="disclaimer">AI can make mistakes. Always verify responses.</div>
          </div>
        </div>

        <div class="suggestions-row" id="suggestions-container"></div>
      </div>
    </div>
  `;

  // Render tabbed content for user's default domain
  renderTabbedContent(selectedDomainId);

  // Wire events
  wireEvents(container);
}

export function destroy() {
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];
}

// ---------------------------------------------------------------------------
// Tabbed content
// ---------------------------------------------------------------------------
function renderTabbedContent(domainId) {
  const container = document.querySelector('#suggestions-container');
  if (!container) return;

  const domain = domains.find(d => d.id === domainId);
  if (!domain) return;

  container.innerHTML = `
    <div class="domain-tabs">
      <button class="domain-tab ${activeTab === 'reports' ? 'domain-tab--active' : ''}" data-tab="reports">Reports</button>
      <button class="domain-tab ${activeTab === 'ask' ? 'domain-tab--active' : ''}" data-tab="ask">Ask a Question</button>
      <button class="domain-tab ${activeTab === 'recent' ? 'domain-tab--active' : ''}" data-tab="recent">Recent</button>
    </div>
    <div class="domain-tab-content" id="domain-tab-content"></div>
  `;

  // Wire tabs
  container.querySelectorAll('.domain-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      container.querySelectorAll('.domain-tab').forEach(t => t.classList.remove('domain-tab--active'));
      tab.classList.add('domain-tab--active');
      renderTabContent(domainId, activeTab);
    });
  });

  renderTabContent(domainId, activeTab);
}

function renderTabContent(domainId, tab) {
  const contentEl = document.querySelector('#domain-tab-content');
  if (!contentEl) return;

  switch (tab) {
    case 'reports': renderReportsTab(contentEl, domainId); break;
    case 'ask': renderAskTab(contentEl, domainId); break;
    case 'recent': renderRecentTab(contentEl, domainId); break;
  }
}

function renderReportsTab(contentEl, domainId) {
  const reports = getStandardReportsForDomain(standardReports, domainId);

  if (reports.length === 0) {
    contentEl.innerHTML = `<div style="color: #999; font-size: 13px; padding: 20px 0;">No standard reports available for this domain.</div>`;
    return;
  }

  contentEl.innerHTML = reports.map(report => {
    const savedViews = getViewsForReport(report.id);
    const viewsBadge = savedViews.length > 0
      ? `<span style="background: #e8eaf6; color: var(--forge-theme-primary, #3f51b5); font-size: 10px; padding: 2px 6px; border-radius: 10px;">${savedViews.length} saved view${savedViews.length > 1 ? 's' : ''}</span>`
      : '';
    return `
      <div class="report-list-item">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 600; font-size: 14px;">${report.name}</span>
            <span class="report-badge">STANDARD</span>
            ${viewsBadge}
          </div>
          <div style="color: #666; font-size: 12px; margin-top: 2px;">${report.description} &middot; ${report.freshness} &middot; ${report.parameters.length} parameters</div>
        </div>
        <button class="std-report-open-btn" data-report-id="${report.id}">Open</button>
      </div>
    `;
  }).join('');

  // Wire open buttons → config panel
  contentEl.querySelectorAll('.std-report-open-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const report = getStandardReportById(btn.dataset.reportId);
      if (!report) return;
      showConfigPanel(report, {
        onPreview: (params) => {
          openPreviewReport(report, params);
        },
        onOpenInChat: (params) => {
          openStandardReportInChat(report.id, params);
        },
      });
    });
  });
}

function renderAskTab(contentEl, domainId) {
  const questions = getQuestionsForDomain(domainId);

  if (questions.length === 0) {
    contentEl.innerHTML = `<div style="color: #999; font-size: 13px; padding: 20px 0;">No common questions available for this domain.</div>`;
    return;
  }

  contentEl.innerHTML = questions.map(q => {
    const attr = q.suggestionIndex !== undefined
      ? `data-suggestion="${q.suggestionIndex}"`
      : `data-query="${q.query || q.label}"`;
    return `
      <button class="question-list-item" type="button" ${attr}>
        <div class="question-list-item-text">
          <span class="question-list-item-label">${q.label}</span>
          <span class="question-list-item-dataset">${q.datasetLabel}</span>
        </div>
        <div class="question-list-item-arrow"><forge-icon name="play_arrow"></forge-icon></div>
      </button>
    `;
  }).join('');
}

function renderRecentTab(contentEl, domainId) {
  const domainRecents = recentActivity.filter(r => r.domainId === domainId);

  if (domainRecents.length === 0) {
    contentEl.innerHTML = `<div style="color: #999; font-size: 13px; padding: 20px 0;">No recent activity for this domain.</div>`;
    return;
  }

  const domain = domains.find(d => d.id === domainId);

  contentEl.innerHTML = domainRecents.map(r => {
    const attr = r.suggestionIndex !== undefined
      ? `data-suggestion="${r.suggestionIndex}"`
      : `data-query="${r.label}"`;
    const meta = r.type === 'saved_report' ? `Saved report · ${r.timeAgo}` : `Query · ${r.timeAgo}`;
    return `
      <button class="recent-item" type="button" ${attr}>
        <div class="recent-item-icon"><forge-icon name="${domain?.icon || 'schedule'}"></forge-icon></div>
        <div class="recent-item-text">
          <span class="recent-item-label">${r.label}</span>
          <span class="recent-item-meta">${meta}</span>
        </div>
        <div class="recent-item-arrow"><forge-icon name="play_arrow"></forge-icon></div>
      </button>
    `;
  }).join('');
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------
function wireEvents(container) {
  // Suggestions / tab content — event delegation
  const suggestionsContainer = container.querySelector('#suggestions-container');
  if (suggestionsContainer) {
    const handler = (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.hasAttribute('data-suggestion')) {
        openChatFlow(Number(btn.dataset.suggestion));
        return;
      }
      if (btn.hasAttribute('data-query')) {
        openChatFlow(0);
        return;
      }
    };
    suggestionsContainer.addEventListener('click', handler);
    cleanupFns.push(() => suggestionsContainer.removeEventListener('click', handler));
  }

  // Side menu
  const sideMenu = container.querySelector('#side-menu');
  const overlay = container.querySelector('#side-menu-overlay');
  const menuCloseBtn = container.querySelector('#menu-close-btn');

  const openSideMenu = () => {
    sideMenu?.classList.add('open');
    overlay?.classList.add('visible');
  };
  const closeSideMenu = () => {
    sideMenu?.classList.remove('open');
    overlay?.classList.remove('visible');
  };

  const menuToggleBtn = document.querySelector('#menu-toggle-btn');
  if (menuToggleBtn) {
    const menuHandler = () => openSideMenu();
    menuToggleBtn.addEventListener('click', menuHandler);
    cleanupFns.push(() => menuToggleBtn.removeEventListener('click', menuHandler));
  }

  if (menuCloseBtn) {
    menuCloseBtn.addEventListener('click', closeSideMenu);
  }
  if (overlay) {
    overlay.addEventListener('click', closeSideMenu);
  }

  // Side menu navigation
  if (sideMenu) {
    const sideMenuHandler = (e) => {
      const item = e.target.closest('.side-menu-item[data-action]');
      if (!item) return;
      const action = item.dataset.action;
      closeSideMenu();
      switch (action) {
        case 'my-reports':
        case 'shared-reports':
        case 'scheduled-reports':
        case 'templates':
          openLibraryView();
          break;
      }
    };
    sideMenu.addEventListener('click', sideMenuHandler);
    cleanupFns.push(() => sideMenu.removeEventListener('click', sideMenuHandler));
  }

  // Prompt input
  const promptInput = container.querySelector('.prompt-input-row input');
  const sendBtn = container.querySelector('#tira-send-btn');
  if (promptInput) {
    const keyHandler = (e) => {
      if (e.key === 'Enter' && promptInput.value.trim()) {
        openChatFlow(0);
      }
    };
    promptInput.addEventListener('keydown', keyHandler);
    cleanupFns.push(() => promptInput.removeEventListener('keydown', keyHandler));
  }
  if (sendBtn) {
    const clickHandler = () => {
      if (promptInput && promptInput.value.trim()) openChatFlow(0);
    };
    sendBtn.addEventListener('click', clickHandler);
    cleanupFns.push(() => sendBtn.removeEventListener('click', clickHandler));
  }
}

// ---------------------------------------------------------------------------
// Preview Report — full-width viewer (no chat)
// ---------------------------------------------------------------------------
function openPreviewReport(report, initialParams) {
  let dialog = document.querySelector('#report-preview-dialog');
  if (!dialog) {
    dialog = document.createElement('forge-dialog');
    dialog.id = 'report-preview-dialog';
    dialog.className = 'chat-dialog';
    dialog.setAttribute('fullscreen', '');
    dialog.setAttribute('mode', 'modal');
    dialog.setAttribute('persistent', '');
    dialog.setAttribute('animation-type', 'fade');
    document.body.appendChild(dialog);
  }

  // Import and use the viewer
  import('../standard-report-viewer.js').then(({ buildStandardReportPanel, wireStandardReportPanel }) => {
    dialog.innerHTML = `
      <div class="report-preview__container">
        ${buildStandardReportPanel(report)}
      </div>
    `;

    dialog.open = true;

    const viewerEl = dialog.querySelector('.sr-viewer');
    const controls = wireStandardReportPanel(viewerEl, report, {
      onClose: () => { dialog.open = false; },
    });

    // Apply initial params from config panel
    if (initialParams) {
      for (const [paramId, value] of Object.entries(initialParams)) {
        controls.setParam(paramId, value);
      }
    }
  });
}
