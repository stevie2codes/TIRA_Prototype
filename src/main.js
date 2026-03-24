// Forge core styles
import '@tylertech/forge/dist/forge-core.css';
import '@tylertech/forge/dist/forge.css';

// Forge component definitions
import {
  defineAppBarComponent,
  defineAppBarMenuButtonComponent,
  defineAppBarSearchComponent,
  defineScaffoldComponent,
  defineCardComponent,
  defineButtonComponent,
  defineIconComponent,
  defineIconButtonComponent,
  defineAvatarComponent,
  defineButtonToggleComponent,
  defineButtonToggleGroupComponent,
  defineDialogComponent,
  defineSplitViewComponent,
  defineSplitViewPanelComponent,
  defineTableComponent,
  defineToolbarComponent,
  defineChipComponent,
} from '@tylertech/forge';

// Tyler Icons
import { IconRegistry } from '@tylertech/forge';
import {
  tylIconHome,
  tylIconSearch,
  tylIconAdd,
  tylIconMenu,
  tylIconHelpOutline,
  tylIconNotifications,
  tylIconSend,
  tylIconDatabaseOutline,
  tylIconArrowDropDown,
  tylIconClose,
  tylIconBarChart,
  tylIconOpenInNew,
  tylIconFileDownload,
  tylIconShare,
  tylIconPieChart,
  tylIconInsertChart,
  tylIconAutoAwesome,
  tylIconMoreVert,
  tylIconMic,
  tylIconFilterList,
  tylIconCode,
  tylIconGridView,
  tylIconInfoOutline,
  tylIconLink,
  tylIconContentCopy,
  tylIconCheck,
  tylIconArrowBack,
  tylIconSave,
  tylIconPlayArrow,
  tylIconPerson,
  tylIconSchedule,
  tylIconFolder,
  tylIconFlag,
  tylIconWarning,
  tylIconUpdate,
  tylIconDescription,
  tylIconAccountBalance,
  tylIconMap,
  tylIconShield,
  tylIconPeople,
  tylIconChecklist,
  tylIconExpandMore,
  tylIconGavel,
  tylIconWater,
  tylIconSettings,
} from '@tylertech/tyler-icons';

// Define components
defineAppBarComponent();
defineAppBarMenuButtonComponent();
defineAppBarSearchComponent();
defineScaffoldComponent();
defineCardComponent();
defineButtonComponent();
defineIconComponent();
defineIconButtonComponent();
defineAvatarComponent();
defineButtonToggleComponent();
defineButtonToggleGroupComponent();
defineDialogComponent();
defineSplitViewComponent();
defineSplitViewPanelComponent();
defineTableComponent();
defineToolbarComponent();
defineChipComponent();

// Register icons
IconRegistry.define([
  tylIconHome,
  tylIconSearch,
  tylIconAdd,
  tylIconMenu,
  tylIconHelpOutline,
  tylIconNotifications,
  tylIconSend,
  tylIconDatabaseOutline,
  tylIconArrowDropDown,
  tylIconClose,
  tylIconBarChart,
  tylIconOpenInNew,
  tylIconFileDownload,
  tylIconShare,
  tylIconPieChart,
  tylIconInsertChart,
  tylIconAutoAwesome,
  tylIconMoreVert,
  tylIconMic,
  tylIconFilterList,
  tylIconCode,
  tylIconGridView,
  tylIconInfoOutline,
  tylIconLink,
  tylIconContentCopy,
  tylIconCheck,
  tylIconArrowBack,
  tylIconSave,
  tylIconPlayArrow,
  tylIconPerson,
  tylIconSchedule,
  tylIconFolder,
  tylIconFlag,
  tylIconWarning,
  tylIconUpdate,
  tylIconDescription,
  tylIconAccountBalance,
  tylIconMap,
  tylIconShield,
  tylIconPeople,
  tylIconChecklist,
  tylIconExpandMore,
  tylIconGavel,
  tylIconWater,
  tylIconSettings,
]);

// Forge AI components (Lit-based, self-register on import)
import '@tylertech/forge-ai/ai-prompt';
import '@tylertech/forge-ai/ai-suggestions';
import '@tylertech/forge-ai/ai-chat-interface';
import '@tylertech/forge-ai/ai-user-message';
import '@tylertech/forge-ai/ai-response-message';
import '@tylertech/forge-ai/ai-thinking-indicator';
import '@tylertech/forge-ai/ai-chatbot';

// Chat flow
import { openChatFlow, openLibraryView } from './chat-flow.js';

// User context — personalization
import {
  currentUser,
  getVisibleSources,
  sourceSuggestions,
  defaultTaskSuggestions,
  defaultCategorySuggestions,
  recentActivity,
} from './user-context.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let selectedSourceId = null; // null = "All sources"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Source icon map for recent items */
const sourceIconMap = {
  'permits-licensing': 'description',
  'code-enforcement': 'gavel',
  'financial': 'account_balance',
  'gis': 'map',
  'justice': 'shield',
  'utilities': 'water',
  'hr-payroll': 'people',
};

/** Renders the redesigned default view: Recent → Suggested → Browse */
function renderDefaultSuggestions() {
  const container = document.querySelector('#suggestions-container');
  if (!container) return;

  // 1. Recent activity — card surface at the top
  const recentItems = recentActivity.map(r => {
    const attr = r.suggestionIndex !== undefined
      ? `data-suggestion="${r.suggestionIndex}"`
      : `data-query="${r.label}"`;
    const icon = sourceIconMap[r.sourceId] || 'schedule';
    const meta = r.type === 'saved_report' ? `Saved report · ${r.timeAgo}` : r.timeAgo;
    return `
      <button class="recent-item" type="button" ${attr}>
        <div class="recent-item-icon">
          <forge-icon name="${icon}"></forge-icon>
        </div>
        <div class="recent-item-text">
          <span class="recent-item-label">${r.label}</span>
          <span class="recent-item-meta">${meta}</span>
        </div>
        <div class="recent-item-arrow">
          <forge-icon name="play_arrow"></forge-icon>
        </div>
      </button>`;
  }).join('');

  // 2. Suggested actions — full-width interactive rows
  const taskActions = defaultTaskSuggestions.map(s =>
    `<button class="suggestion-action" type="button" data-query="${s.label}">
      <div class="suggestion-action-icon">
        <forge-icon name="${s.icon}"></forge-icon>
      </div>
      <span class="suggestion-action-label">${s.label}</span>
      <div class="suggestion-action-arrow">
        <forge-icon name="play_arrow"></forge-icon>
      </div>
    </button>`
  ).join('');

  container.innerHTML = `
    ${recentActivity.length ? `
      <div class="recent-section">
        <div class="recent-section-header">
          <span>Pick up where you left off</span>
        </div>
        <div class="recent-list">${recentItems}</div>
      </div>
    ` : ''}
    <div class="suggestions-section">
      <div class="suggestions-header">Suggested</div>
      <div class="suggestion-actions-list">${taskActions}</div>
    </div>
  `;
}

/** Renders source-specific suggestions */
function renderSourceSuggestions(sourceId) {
  const container = document.querySelector('#suggestions-container');
  if (!container) return;

  const visibleSources = getVisibleSources();
  const src = visibleSources.find(s => s.id === sourceId);
  const sourceLabel = src?.label || sourceId;
  const sourceIcon = src?.icon || 'database_outline';

  // Filter recent activity to this source
  const sourceRecents = recentActivity.filter(r => r.sourceId === sourceId);

  // Recent for this source — card surface
  const recentItems = sourceRecents.map(r => {
    const attr = r.suggestionIndex !== undefined
      ? `data-suggestion="${r.suggestionIndex}"`
      : `data-query="${r.label}"`;
    const meta = r.type === 'saved_report' ? `Saved report · ${r.timeAgo}` : r.timeAgo;
    return `
      <button class="recent-item" type="button" ${attr}>
        <div class="recent-item-icon">
          <forge-icon name="${sourceIcon}"></forge-icon>
        </div>
        <div class="recent-item-text">
          <span class="recent-item-label">${r.label}</span>
          <span class="recent-item-meta">${meta}</span>
        </div>
        <div class="recent-item-arrow">
          <forge-icon name="play_arrow"></forge-icon>
        </div>
      </button>`;
  }).join('');

  // Source queries — as action rows
  const items = sourceSuggestions[sourceId] || [];
  const queryActions = items.map(s => {
    const attr = s.suggestionIndex !== undefined
      ? `data-suggestion="${s.suggestionIndex}"`
      : `data-query="${s.query || s.label}"`;
    return `
      <button class="suggestion-action" type="button" ${attr}>
        <div class="suggestion-action-icon">
          <forge-icon name="${sourceIcon}"></forge-icon>
        </div>
        <span class="suggestion-action-label">${s.label}</span>
        <div class="suggestion-action-arrow">
          <forge-icon name="play_arrow"></forge-icon>
        </div>
      </button>`;
  }).join('');

  container.innerHTML = `
    ${sourceRecents.length ? `
      <div class="recent-section">
        <div class="recent-section-header">
          <span>Recent from ${sourceLabel}</span>
        </div>
        <div class="recent-list">${recentItems}</div>
      </div>
    ` : ''}
    <div class="suggestions-section">
      <div class="suggestions-header">Common queries</div>
      <div class="suggestion-actions-list">${queryActions}</div>
    </div>
  `;
}

/** Wires click handlers on all interactive elements in the suggestions area using event delegation */
function wireChipClicks(container) {
  // Use event delegation: single listener on container instead of many on buttons
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    // Direct suggestion index links (full chat flow)
    if (btn.hasAttribute('data-suggestion')) {
      openChatFlow(Number(btn.dataset.suggestion));
      return;
    }

    // Query-based items (use suggestion 0 for prototype)
    if (btn.hasAttribute('data-query')) {
      openChatFlow(0);
      return;
    }

    // Category / source chips — switch the source dropdown to that category
    if (btn.hasAttribute('data-source-id')) {
      selectSource(btn.dataset.sourceId);
      return;
    }
  });
}

/** Updates the source dropdown label and refreshes suggestions */
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

  // Close dropdown
  const dropdown = document.querySelector('#source-dropdown');
  if (dropdown) dropdown.style.display = 'none';
}

/** Builds and shows the source dropdown menu */
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

  // Toggle visibility
  const isVisible = dropdown.style.display === 'block';
  dropdown.style.display = isVisible ? 'none' : 'block';

  // Wire clicks using event delegation (only if not already wired)
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
// Side Menu
// ---------------------------------------------------------------------------

// Cache menu elements (queried once at init)
let sideMenuElements = null;

function initSideMenuElements() {
  sideMenuElements = {
    menu: document.querySelector('#side-menu'),
    overlay: document.querySelector('#side-menu-overlay'),
  };
}

/** Opens the side menu */
function openSideMenu() {
  if (!sideMenuElements) initSideMenuElements();
  if (sideMenuElements.menu) sideMenuElements.menu.classList.add('open');
  if (sideMenuElements.overlay) sideMenuElements.overlay.classList.add('visible');
}

/** Closes the side menu */
function closeSideMenu() {
  if (!sideMenuElements) initSideMenuElements();
  if (sideMenuElements.menu) sideMenuElements.menu.classList.remove('open');
  if (sideMenuElements.overlay) sideMenuElements.overlay.classList.remove('visible');
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Personalize the greeting
  const greetingEl = document.querySelector('#home-greeting');
  if (greetingEl) {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    greetingEl.textContent = `Good ${timeOfDay}, ${currentUser.firstName}`;
  }

  // Render default suggestions
  renderDefaultSuggestions();

  // Wire suggestions container once using event delegation
  const suggestionsContainer = document.querySelector('#suggestions-container');
  if (suggestionsContainer) {
    wireChipClicks(suggestionsContainer);
  }

  // Wire side menu toggle
  const menuToggleBtn = document.querySelector('#menu-toggle-btn');
  const menuCloseBtn = document.querySelector('#menu-close-btn');
  const menuOverlay = document.querySelector('#side-menu-overlay');

  if (menuToggleBtn) {
    // Listen on the web component itself
    menuToggleBtn.addEventListener('click', (e) => {
      openSideMenu();
    });
  }

  if (menuCloseBtn) {
    menuCloseBtn.addEventListener('click', closeSideMenu);
  }
  if (menuOverlay) {
    menuOverlay.addEventListener('click', closeSideMenu);
  }

  // Wire side menu navigation using event delegation
  const sideMenu = document.querySelector('#side-menu');
  if (sideMenu) {
    sideMenu.addEventListener('click', (e) => {
      const item = e.target.closest('.side-menu-item[data-action]');
      if (!item) return;

      const action = item.dataset.action;
      closeSideMenu();

      // Handle navigation
      switch(action) {
        case 'my-reports':
        case 'shared-reports':
        case 'scheduled-reports':
        case 'templates':
          openLibraryView();
          break;
        case 'data-sources':
          // Show data sources dropdown
          buildSourceDropdown();
          break;
        case 'settings':
          console.log('Settings clicked');
          break;
        case 'help':
          console.log('Help clicked');
          break;
      }
    });
  }


  // Wire source toggle dropdown
  const sourceToggle = document.querySelector('#source-toggle');
  if (sourceToggle) {
    sourceToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      buildSourceDropdown();
    });
  }

  // Close dropdown on outside click (cache dropdown reference)
  let cachedDropdown = null;
  document.addEventListener('click', () => {
    if (!cachedDropdown) cachedDropdown = document.querySelector('#source-dropdown');
    if (cachedDropdown) cachedDropdown.style.display = 'none';
  });

  // Auto-trigger states for Figma capture via ?state= query param
  const params = new URLSearchParams(window.location.search);
  const autoState = params.get('state');
  if (autoState === 'chat' || autoState === 'report') {
    openChatFlow(0, { autoOpenReport: autoState === 'report' });
  } else if (autoState === 'library') {
    openLibraryView();
  } else if (autoState === 'designer') {
    openChatFlow(0, { autoOpenReport: false });
  }

  // Prompt input: Enter key + send button
  const promptInput = document.querySelector('.prompt-input-row input');
  const sendBtn = document.querySelector('.prompt-input-row forge-icon-button');
  if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && promptInput.value.trim()) {
        openChatFlow(0);
      }
    });
  }
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      if (promptInput && promptInput.value.trim()) {
        openChatFlow(0);
      }
    });
  }
});
