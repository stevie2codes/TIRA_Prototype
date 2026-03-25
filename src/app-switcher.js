/**
 * App Switcher — Google/Atlassian-style product switcher dropdown.
 */

import { navigateTo, getCurrentView } from './router.js';
import './app-switcher.css';

const apps = [
  { id: 'hub', label: 'Hub', description: 'Home dashboard', icon: 'home' },
  { id: 'tira', label: 'TIRA', description: 'Reporting & Analytics', icon: 'insert_chart' },
];

let dropdownEl = null;

export function initAppSwitcher() {
  const btn = document.querySelector('#app-switcher-btn');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown(btn);
  });

  // Close on outside click
  document.addEventListener('click', () => {
    if (dropdownEl) dropdownEl.classList.remove('open');
  });

  // Update active state when view changes
  document.addEventListener('view-changed', () => {
    if (dropdownEl) updateActiveState();
  });
}

function toggleDropdown(anchor) {
  if (!dropdownEl) {
    dropdownEl = document.createElement('div');
    dropdownEl.className = 'app-switcher-dropdown';
    dropdownEl.addEventListener('click', (e) => e.stopPropagation());
    anchor.appendChild(dropdownEl);
  }

  renderDropdown();

  const isOpen = dropdownEl.classList.contains('open');
  dropdownEl.classList.toggle('open', !isOpen);
}

function renderDropdown() {
  const current = getCurrentView();

  dropdownEl.innerHTML = `
    <div class="app-switcher-header">Tyler Products</div>
    <div class="app-switcher-grid">
      ${apps.map(app => `
        <button class="app-switcher-item ${current === app.id ? 'active' : ''}" type="button" data-app="${app.id}">
          <div class="app-switcher-icon">
            <forge-icon name="${app.icon}"></forge-icon>
          </div>
          <span class="app-switcher-label">${app.label}</span>
        </button>
      `).join('')}
    </div>
  `;

  // Wire clicks
  dropdownEl.querySelectorAll('.app-switcher-item').forEach(item => {
    item.addEventListener('click', () => {
      const appId = item.dataset.app;
      dropdownEl.classList.remove('open');
      navigateTo(appId);
    });
  });
}

function updateActiveState() {
  if (!dropdownEl) return;
  const current = getCurrentView();
  dropdownEl.querySelectorAll('.app-switcher-item').forEach(item => {
    item.classList.toggle('active', item.dataset.app === current);
  });
}
