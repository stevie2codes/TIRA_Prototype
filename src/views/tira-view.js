/**
 * TIRA Landing Page View
 * Extracted from index.html + main.js — renders the AI-prompt-forward reporting homepage.
 */

import { openChatFlow } from '../chat-flow.js';
import { currentUser } from '../user-context.js';

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

  // Render suggestions
  renderDefaultSuggestions();

  // Wire events
  wireEvents(container);
}

export function destroy() {
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];
}

// ---------------------------------------------------------------------------
// Suggestions rendering
// ---------------------------------------------------------------------------
function renderDefaultSuggestions() {
  const container = document.querySelector('#suggestions-container');
  if (!container) return;

  const suggestions = [
    { text: 'Show me building permits issued by month, broken down by district', value: '0' },
    { text: 'Summarize code violations by type and priority for this year', value: '1' },
    { text: 'Compare department budgets against actual spending for FY2025', value: '2' },
  ];

  container.innerHTML = `
    <div class="suggestions-section">
      <div class="suggestions-header">Suggested reports</div>
      <forge-ai-suggestions variant="block"></forge-ai-suggestions>
    </div>
  `;

  const suggestionsEl = container.querySelector('forge-ai-suggestions');
  suggestionsEl.suggestions = suggestions;
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------
function wireEvents(container) {
  // Suggestions — forge-ai-suggestions select event
  const suggestionsEl = container.querySelector('forge-ai-suggestions');
  if (suggestionsEl) {
    const handler = (e) => {
      openChatFlow(Number(e.detail.value));
    };
    suggestionsEl.addEventListener('forge-ai-suggestions-select', handler);
    cleanupFns.push(() => suggestionsEl.removeEventListener('forge-ai-suggestions-select', handler));
  }

  // Side menu
  const sideMenu = container.querySelector('#side-menu');
  const overlay = container.querySelector('#side-menu-overlay');
  const menuCloseBtn = container.querySelector('#menu-close-btn');

  // Expose openSideMenu for the app bar's menu button
  const openSideMenu = () => {
    sideMenu?.classList.add('open');
    overlay?.classList.add('visible');
  };
  const closeSideMenu = () => {
    sideMenu?.classList.remove('open');
    overlay?.classList.remove('visible');
  };

  // Wire menu toggle from app bar
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
      closeSideMenu();
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
