/**
 * TIRA Rail — persistent left sidebar mounted at the app shell level.
 *
 * Public API:
 *   mountTiraRail(rootEl)  — builds DOM, wires toggle, restores state
 *   showTiraRail()         — shows the rail (used on TIRA-side views)
 *   hideTiraRail()         — hides the rail (used on Hub view)
 */

import './tira-rail.css';
import { navigateTo } from './router.js';
import { openReportDesigner, openGuidedReportSetup } from './chat-flow.js';

const STORAGE_KEY = 'tira-rail-expanded';

// Maps the active view to the rail item that should be highlighted.
const VIEW_TO_ACTION = { conversations: 'chats', tira: 'new-chat', 'report-library': 'report-library' };

let railEl = null;

const items = [
  { id: 'new-chat',       icon: 'chat_plus',     label: 'New Chat' },
  { id: 'chats',          icon: 'forum',         label: 'Chats' },
  { id: 'report-library', icon: 'local_library', label: 'Report Library' },
];

const footerItems = [
  { id: 'help', icon: 'help_outline', label: 'Help' },
];

function readExpanded() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return true; // default: expanded
}

function writeExpanded(expanded) {
  localStorage.setItem(STORAGE_KEY, expanded ? 'true' : 'false');
}

function renderItem({ id, icon, label }) {
  return `
    <button class="tira-rail__item" type="button" data-action="${id}" title="${label}" aria-label="${label}">
      <span class="tira-rail__item-icon"><forge-icon name="${icon}"></forge-icon></span>
      <span class="tira-rail__item-label">${label}</span>
    </button>
  `;
}

export function mountTiraRail(rootEl) {
  if (!rootEl) return;

  const expanded = readExpanded();

  rootEl.innerHTML = `
    <nav class="tira-rail ${expanded ? '' : 'tira-rail--collapsed'}" aria-label="Tyler Reporting navigation">
      <div class="tira-rail__header">
        <span class="tira-rail__title">Tyler Reporting</span>
        <button
          class="tira-rail__toggle"
          type="button"
          aria-label="${expanded ? 'Collapse menu' : 'Expand menu'}"
          aria-expanded="${expanded ? 'true' : 'false'}"
        >
          <forge-icon name="menu_open"></forge-icon>
        </button>
      </div>
      <div class="tira-rail__body">
        <div class="tira-rail__create-wrap">
          <button class="tira-rail__create" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Create a report" title="Create a report">
            <span class="tira-rail__item-icon"><forge-icon name="add"></forge-icon></span>
            <span class="tira-rail__item-label">Create</span>
          </button>
          <div class="tira-rail__popover" role="menu" aria-label="Create a report" hidden>
            <div class="tira-rail__popover-title">Create a report</div>
            <button class="tira-rail__popover-item" type="button" role="menuitem" data-create="scratch">
              <forge-icon name="description"></forge-icon>
              <span class="tira-rail__popover-text">
                <span class="tira-rail__popover-label">From scratch</span>
                <span class="tira-rail__popover-desc">Open a blank report in the designer</span>
              </span>
            </button>
            <button class="tira-rail__popover-item" type="button" role="menuitem" data-create="ai">
              <forge-icon name="auto_awesome"></forge-icon>
              <span class="tira-rail__popover-text">
                <span class="tira-rail__popover-label">With AI</span>
                <span class="tira-rail__popover-desc">Answer a couple questions &amp; AI sets it up</span>
              </span>
            </button>
          </div>
        </div>
        ${items.map(renderItem).join('')}
      </div>
      <div class="tira-rail__footer">
        ${footerItems.map(renderItem).join('')}
      </div>
    </nav>
  `;

  railEl = rootEl.querySelector('.tira-rail');
  const toggleBtn = rootEl.querySelector('.tira-rail__toggle');

  toggleBtn.addEventListener('click', () => {
    const nowCollapsed = railEl.classList.toggle('tira-rail--collapsed');
    const nowExpanded = !nowCollapsed;
    writeExpanded(nowExpanded);
    toggleBtn.setAttribute('aria-expanded', nowExpanded ? 'true' : 'false');
    toggleBtn.setAttribute('aria-label', nowExpanded ? 'Collapse menu' : 'Expand menu');
  });

  // Navigation
  rootEl.addEventListener('click', (e) => {
    const item = e.target.closest('.tira-rail__item[data-action]');
    if (!item) return;
    switch (item.dataset.action) {
      case 'new-chat':       navigateTo('tira'); break;
      case 'chats':          navigateTo('conversations'); break;
      case 'report-library': navigateTo('report-library'); break;
      default: break; // help — no destination yet
    }
  });

  // Create button + popover wiring
  const createBtn = rootEl.querySelector('.tira-rail__create');
  const popover = rootEl.querySelector('.tira-rail__popover');

  const positionPopover = () => {
    const rect = createBtn.getBoundingClientRect();
    popover.style.top = `${rect.top}px`;
    popover.style.left = `${rect.right + 4}px`;
  };

  const closePopover = () => {
    popover.hidden = true;
    createBtn.setAttribute('aria-expanded', 'false');
  };
  const togglePopover = () => {
    const willOpen = popover.hidden;
    if (willOpen) positionPopover();
    popover.hidden = !willOpen;
    createBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  };

  createBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePopover(); });

  popover.addEventListener('click', (e) => {
    const item = e.target.closest('.tira-rail__popover-item');
    if (!item) return;
    closePopover();
    if (item.dataset.create === 'scratch') openReportDesigner();
    else openGuidedReportSetup();
  });

  document.addEventListener('click', (e) => {
    if (!popover.hidden && !e.target.closest('.tira-rail__create-wrap')) closePopover();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopover(); });
  window.addEventListener('resize', () => { if (!popover.hidden) positionPopover(); });

  // Keep the active item in sync with the current view
  document.addEventListener('view-changed', (e) => {
    syncActiveItem(VIEW_TO_ACTION[e.detail?.view] || null);
  });
}

function syncActiveItem(action) {
  if (!railEl) return;
  railEl.querySelectorAll('.tira-rail__item').forEach(el => {
    el.classList.toggle('tira-rail__item--active', el.dataset.action === action);
  });
}

export function showTiraRail() {
  if (railEl) railEl.classList.remove('tira-rail--hidden');
}

export function hideTiraRail() {
  if (railEl) railEl.classList.add('tira-rail--hidden');
}
