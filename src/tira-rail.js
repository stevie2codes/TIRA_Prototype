/**
 * TIRA Rail — persistent left sidebar mounted at the app shell level.
 *
 * Public API:
 *   mountTiraRail(rootEl)  — builds DOM, wires toggle, restores state
 *   showTiraRail()         — shows the rail (used on TIRA-side views)
 *   hideTiraRail()         — hides the rail (used on Hub view)
 */

import './tira-rail.css';

const STORAGE_KEY = 'tira-rail-expanded';

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

  // Placeholder click handler — no destinations wired yet.
  rootEl.addEventListener('click', (e) => {
    const item = e.target.closest('.tira-rail__item[data-action]');
    if (!item) return;
    // Intentional no-op for prototype. Hover/active styling still fires.
  });
}

export function showTiraRail() {
  if (railEl) railEl.classList.remove('tira-rail--hidden');
}

export function hideTiraRail() {
  if (railEl) railEl.classList.add('tira-rail--hidden');
}
