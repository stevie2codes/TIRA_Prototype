/**
 * TIRA Landing Page View
 * Extracted from index.html + main.js — renders the AI-prompt-forward reporting homepage.
 */

import { openChatFlow, openLibraryView } from '../chat-flow.js';
import {
  currentUser,
  getVisibleSources,
  sourceSuggestions,
  defaultTaskSuggestions,
  recentActivity,
} from '../user-context.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let selectedSourceId = null;
let cleanupFns = [];

// Source icon map for recent items
const sourceIconMap = {
  'permits-licensing': 'description',
  'code-enforcement': 'gavel',
  'financial': 'account_balance',
  'gis': 'map',
  'justice': 'shield',
  'utilities': 'water',
  'hr-payroll': 'people',
};

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
export function render(container) {
  selectedSourceId = null;
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
          <button class="side-menu-item" type="button" data-action="data-sources">
            <forge-icon name="database_outline"></forge-icon>
            <span>Data Sources</span>
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
            <img class="tyler-logo" src="/images/tyler-logo-icon.png" alt="Tyler Logo" />
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
                <button class="source-toggle" type="button" id="source-toggle">
                  <forge-icon name="database_outline"></forge-icon>
                  All sources
                  <forge-icon name="arrow_drop_down"></forge-icon>
                </button>
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

  const recentItems = recentActivity.map(r => {
    const attr = r.suggestionIndex !== undefined
      ? `data-suggestion="${r.suggestionIndex}"`
      : `data-query="${r.label}"`;
    const icon = sourceIconMap[r.sourceId] || 'schedule';
    const meta = r.type === 'saved_report' ? `Saved report · ${r.timeAgo}` : r.timeAgo;
    return `
      <button class="recent-item" type="button" ${attr}>
        <div class="recent-item-icon"><forge-icon name="${icon}"></forge-icon></div>
        <div class="recent-item-text">
          <span class="recent-item-label">${r.label}</span>
          <span class="recent-item-meta">${meta}</span>
        </div>
        <div class="recent-item-arrow"><forge-icon name="play_arrow"></forge-icon></div>
      </button>`;
  }).join('');

  const taskActions = defaultTaskSuggestions.map(s =>
    `<button class="suggestion-action" type="button" data-query="${s.label}">
      <div class="suggestion-action-icon"><forge-icon name="${s.icon}"></forge-icon></div>
      <span class="suggestion-action-label">${s.label}</span>
      <div class="suggestion-action-arrow"><forge-icon name="play_arrow"></forge-icon></div>
    </button>`
  ).join('');

  container.innerHTML = `
    ${recentActivity.length ? `
      <div class="recent-section">
        <div class="recent-section-header"><span>Pick up where you left off</span></div>
        <div class="recent-list">${recentItems}</div>
      </div>
    ` : ''}
    <div class="suggestions-section">
      <div class="suggestions-header">Suggested</div>
      <div class="suggestion-actions-list">${taskActions}</div>
    </div>
  `;
}

function renderSourceSuggestions(sourceId) {
  const container = document.querySelector('#suggestions-container');
  if (!container) return;

  const visibleSources = getVisibleSources();
  const src = visibleSources.find(s => s.id === sourceId);
  const sourceLabel = src?.label || sourceId;
  const sourceIcon = src?.icon || 'database_outline';
  const sourceRecents = recentActivity.filter(r => r.sourceId === sourceId);

  const recentItems = sourceRecents.map(r => {
    const attr = r.suggestionIndex !== undefined
      ? `data-suggestion="${r.suggestionIndex}"`
      : `data-query="${r.label}"`;
    const meta = r.type === 'saved_report' ? `Saved report · ${r.timeAgo}` : r.timeAgo;
    return `
      <button class="recent-item" type="button" ${attr}>
        <div class="recent-item-icon"><forge-icon name="${sourceIcon}"></forge-icon></div>
        <div class="recent-item-text">
          <span class="recent-item-label">${r.label}</span>
          <span class="recent-item-meta">${meta}</span>
        </div>
        <div class="recent-item-arrow"><forge-icon name="play_arrow"></forge-icon></div>
      </button>`;
  }).join('');

  const items = sourceSuggestions[sourceId] || [];
  const queryActions = items.map(s => {
    const attr = s.suggestionIndex !== undefined
      ? `data-suggestion="${s.suggestionIndex}"`
      : `data-query="${s.query || s.label}"`;
    return `
      <button class="suggestion-action" type="button" ${attr}>
        <div class="suggestion-action-icon"><forge-icon name="${sourceIcon}"></forge-icon></div>
        <span class="suggestion-action-label">${s.label}</span>
        <div class="suggestion-action-arrow"><forge-icon name="play_arrow"></forge-icon></div>
      </button>`;
  }).join('');

  container.innerHTML = `
    ${sourceRecents.length ? `
      <div class="recent-section">
        <div class="recent-section-header"><span>Recent from ${sourceLabel}</span></div>
        <div class="recent-list">${recentItems}</div>
      </div>
    ` : ''}
    <div class="suggestions-section">
      <div class="suggestions-header">Common queries</div>
      <div class="suggestion-actions-list">${queryActions}</div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Source dropdown
// ---------------------------------------------------------------------------
function selectSource(sourceId) {
  selectedSourceId = sourceId;
  const toggle = document.querySelector('#source-toggle');
  if (!toggle) return;

  if (!sourceId) {
    toggle.innerHTML = `
      <forge-icon name="database_outline"></forge-icon>
      All sources
      <forge-icon name="arrow_drop_down"></forge-icon>
    `;
    renderDefaultSuggestions();
  } else {
    const visibleSources = getVisibleSources();
    const src = visibleSources.find(s => s.id === sourceId);
    toggle.innerHTML = `
      <forge-icon name="${src?.icon || 'database_outline'}"></forge-icon>
      ${src?.label || sourceId}
      <forge-icon name="arrow_drop_down"></forge-icon>
    `;
    renderSourceSuggestions(sourceId);
  }

  const dropdown = document.querySelector('#source-dropdown');
  if (dropdown) dropdown.style.display = 'none';
}

function buildSourceDropdown() {
  let dropdown = document.querySelector('#source-dropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = 'source-dropdown';
    dropdown.className = 'source-dropdown';
    const toggleBtn = document.querySelector('#source-toggle');
    toggleBtn.parentElement.style.position = 'relative';
    toggleBtn.parentElement.appendChild(dropdown);
  }

  const visibleSources = getVisibleSources();

  const allSourceItem = `
    <button class="source-dropdown-item ${!selectedSourceId ? 'active' : ''}" type="button" data-source-id="">
      <forge-icon name="database_outline"></forge-icon>
      <div class="source-item-text">
        <span class="source-item-label">All sources</span>
        <span class="source-item-desc">Search across all available data</span>
      </div>
    </button>
  `;

  const sourceItems = visibleSources.map(src => `
    <button class="source-dropdown-item ${selectedSourceId === src.id ? 'active' : ''}" type="button" data-source-id="${src.id}">
      <forge-icon name="${src.icon}"></forge-icon>
      <div class="source-item-text">
        <span class="source-item-label">${src.label}</span>
        <span class="source-item-desc">${(sourceSuggestions[src.id] || []).length} queries available</span>
      </div>
    </button>
  `).join('');

  dropdown.innerHTML = `
    <div class="source-dropdown-header">
      <span>Your data sources</span>
      <span class="source-dropdown-role">${currentUser.role}</span>
    </div>
    ${allSourceItem}
    <div class="source-dropdown-divider"></div>
    ${sourceItems}
  `;

  const isVisible = dropdown.style.display === 'block';
  dropdown.style.display = isVisible ? 'none' : 'block';

  if (!dropdown.dataset.wired) {
    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.source-dropdown-item');
      if (item) {
        e.stopPropagation();
        const id = item.dataset.sourceId;
        selectSource(id || null);
      }
    });
    dropdown.dataset.wired = 'true';
  }
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------
function wireEvents(container) {
  // Suggestions — event delegation
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
      if (btn.hasAttribute('data-source-id')) {
        selectSource(btn.dataset.sourceId);
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
      const action = item.dataset.action;
      closeSideMenu();
      switch (action) {
        case 'my-reports':
        case 'shared-reports':
        case 'scheduled-reports':
        case 'templates':
          openLibraryView();
          break;
        case 'data-sources':
          buildSourceDropdown();
          break;
      }
    };
    sideMenu.addEventListener('click', sideMenuHandler);
    cleanupFns.push(() => sideMenu.removeEventListener('click', sideMenuHandler));
  }

  // Source toggle
  const sourceToggle = container.querySelector('#source-toggle');
  if (sourceToggle) {
    const toggleHandler = (e) => {
      e.stopPropagation();
      buildSourceDropdown();
    };
    sourceToggle.addEventListener('click', toggleHandler);
    cleanupFns.push(() => sourceToggle.removeEventListener('click', toggleHandler));
  }

  // Close dropdown on outside click
  const outsideClickHandler = () => {
    const dropdown = document.querySelector('#source-dropdown');
    if (dropdown) dropdown.style.display = 'none';
  };
  document.addEventListener('click', outsideClickHandler);
  cleanupFns.push(() => document.removeEventListener('click', outsideClickHandler));

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
