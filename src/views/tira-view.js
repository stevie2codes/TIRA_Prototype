/**
 * TIRA Landing Page View
 * Uses forge-ai-chatbot-launcher for the AI-prompt-forward reporting homepage.
 */

import { openChatFlow, openStandardReportInChat } from '../chat-flow.js';
import { currentUser, getVisibleStandardReports } from '../user-context.js';
import { standardReports } from '../standard-reports.js';
import { getViewsForReport } from '../saved-views.js';
import { getDomainLabel } from '../standard-report-card.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let cleanupFns = [];

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
export function render(container) {
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
          <button class="side-menu-item" type="button" data-action="home">
            <forge-icon name="home"></forge-icon>
            <span>Home</span>
          </button>
          <button class="side-menu-item" type="button" data-action="standard-reports">
            <forge-icon name="assignment"></forge-icon>
            <span>Standard Reports</span>
          </button>
          <button class="side-menu-item" type="button" data-action="my-reports">
            <forge-icon name="folder"></forge-icon>
            <span>My Reports</span>
          </button>
          <button class="side-menu-item" type="button" data-action="scheduled-reports">
            <forge-icon name="schedule"></forge-icon>
            <span>Scheduled</span>
          </button>
        </div>
      </div>
      <div class="side-menu-footer">
        <button class="side-menu-item" type="button" data-action="settings">
          <forge-icon name="settings"></forge-icon>
          <span>Settings</span>
        </button>
      </div>
    </nav>
    <div class="side-menu-overlay" id="side-menu-overlay"></div>

    <div class="home-body">
      <div class="home-content">
        <forge-ai-chatbot-launcher
          id="tira-launcher"
          title-text="${greeting}"
          description-text="I’m your reporting assistant. What can I help you with today?"
          disclaimer-text="AI can make mistakes. Always verify responses."
          file-upload="off"
          placeholder="Ask a question about your data..."
        ></forge-ai-chatbot-launcher>
      </div>
    </div>
  `;

  // Set suggestions on the launcher
  const launcher = container.querySelector('#tira-launcher');
  if (launcher) {
    launcher.suggestions = [
      { text: 'Show me building permits issued by month, broken down by district', value: '0' },
      { text: 'Summarize code violations by type and priority for this year', value: '1' },
      { text: 'Compare department budgets against actual spending for FY2025', value: '2' },
    ];
  }

  // Wire events
  wireEvents(container);
}

export function destroy() {
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------
function wireEvents(container) {
  const launcher = container.querySelector('#tira-launcher');

  if (launcher) {
    // Prevent the launcher from leaving welcome mode — our chat lives in a separate dialog
    const conversationStartHandler = (e) => {
      e.preventDefault();
    };
    launcher.addEventListener('forge-ai-chatbot-launcher-conversation-start', conversationStartHandler);
    cleanupFns.push(() => launcher.removeEventListener('forge-ai-chatbot-launcher-conversation-start', conversationStartHandler));

    // Handle suggestion selection
    const suggestHandler = (e) => {
      openChatFlow(Number(e.detail.value));
    };
    launcher.addEventListener('forge-ai-suggestions-select', suggestHandler);
    cleanupFns.push(() => launcher.removeEventListener('forge-ai-suggestions-select', suggestHandler));

    // Handle prompt send
    const sendHandler = (e) => {
      openChatFlow(0);
    };
    launcher.addEventListener('forge-ai-prompt-send', sendHandler);
    cleanupFns.push(() => launcher.removeEventListener('forge-ai-prompt-send', sendHandler));
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

  if (sideMenu) {
    const sideMenuHandler = (e) => {
      const item = e.target.closest('.side-menu-item[data-action]');
      if (!item) return;
      const action = item.dataset.action;
      closeSideMenu();
      if (action === 'standard-reports') {
        renderStandardReportsLibrary(container);
      }
    };
    sideMenu.addEventListener('click', sideMenuHandler);
    cleanupFns.push(() => sideMenu.removeEventListener('click', sideMenuHandler));
  }
}

// ---------------------------------------------------------------------------
// Standard Reports Library
// ---------------------------------------------------------------------------
function renderStandardReportsLibrary(container) {
  const homeBody = container.querySelector('.home-body');
  if (!homeBody) return;

  const visibleReports = getVisibleStandardReports(standardReports);
  const grouped = {};
  for (const report of visibleReports) {
    const domain = getDomainLabel(report.domain);
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push(report);
  }

  homeBody.innerHTML = `
    <div class="home-content" style="padding: 24px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <button id="sr-back-btn" style="background:none;border:1px solid #ddd;border-radius:6px;padding:6px 12px;cursor:pointer;display:flex;align-items:center;gap:4px;font-size:13px;">
          <forge-icon name="arrow_back"></forge-icon> Back
        </button>
        <div>
          <h2 class="forge-typography--heading5" style="margin:0;">Standard Reports</h2>
          <p style="color:#666;font-size:13px;margin:4px 0 0;">Pre-built reports maintained by Tyler. Open in chat to explore and customize.</p>
        </div>
      </div>
      ${Object.entries(grouped).map(([domain, reports]) => `
        <div style="margin-bottom:24px;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#888;font-weight:600;margin-bottom:8px;">${domain}</div>
          <div style="display:flex;flex-direction:column;gap:2px;">
            ${reports.map(report => {
              const savedViews = getViewsForReport(report.id);
              const viewsBadge = savedViews.length > 0
                ? `<span style="background:#e8eaf6;color:var(--forge-theme-primary,#3f51b5);font-size:10px;padding:2px 6px;border-radius:10px;">${savedViews.length} saved view${savedViews.length > 1 ? 's' : ''}</span>`
                : '';
              return `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#fff;border-radius:8px;border:1px solid #eee;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#c5cae9'" onmouseout="this.style.borderColor='#eee'">
                  <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="font-weight:600;font-size:14px;">${report.name}</span>
                      ${viewsBadge}
                    </div>
                    <div style="color:#666;font-size:12px;margin-top:2px;">${report.description} &middot; ${report.freshness} &middot; ${report.parameters.length} parameters</div>
                  </div>
                  <button class="std-report-open-btn" data-report-id="${report.id}" style="background:var(--forge-theme-primary,#3f51b5);color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer;font-weight:500;margin-left:16px;">Open in Chat</button>
                </div>`;
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>`;

  // Wire back button
  homeBody.querySelector('#sr-back-btn')?.addEventListener('click', () => { render(container); });

  // Wire "Open in Chat" buttons
  homeBody.querySelectorAll('.std-report-open-btn').forEach(btn => {
    btn.addEventListener('click', () => { openStandardReportInChat(btn.dataset.reportId); });
  });
}
