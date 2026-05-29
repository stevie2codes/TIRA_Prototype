/**
 * Report Library View — browse saved reports.
 *
 * Two view modes (segmented toggle): "All reports" (flat list) and "Folders"
 * (folder cards → drill into a folder's reports with a breadcrumb). All / Recent
 * / Scheduled tabs + search filter the current list. Rendered in-body in
 * #view-container; reached from the rail's "Report Library" item.
 *
 * Per current scope: report rows and the ⋮ kebab are visual only (no-op).
 */

import './report-library.css';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const folders = [
  { id: 'financial', name: 'Financial Reports', count: 24, color: '#3f51b5', bg: '#e8eaf6' },
  { id: 'hr',        name: 'HR & Personnel',    count: 18, color: '#2e7d32', bg: '#e8f5e9' },
  { id: 'infra',     name: 'Infrastructure',    count: 12, color: '#ef6c00', bg: '#fff3e0' },
  { id: 'public',    name: 'Public Services',   count: 31, color: '#7b1fa2', bg: '#f3e5f5' },
];

// Palette offered when creating a folder — each is an { icon color, light bg } pair.
const FOLDER_COLORS = [
  { color: '#3f51b5', bg: '#e8eaf6' },
  { color: '#2e7d32', bg: '#e8f5e9' },
  { color: '#ef6c00', bg: '#fff3e0' },
  { color: '#7b1fa2', bg: '#f3e5f5' },
  { color: '#c2185b', bg: '#fce4ec' },
  { color: '#1565c0', bg: '#e3f2fd' },
  { color: '#00838f', bg: '#e0f7fa' },
  { color: '#f9a825', bg: '#fff8e1' },
];

const reports = [
  { id: 'r1',  name: 'Annual Budget Report FY2025',        timeAgo: '2 days ago',  folderId: 'financial', recent: true,  scheduled: false },
  { id: 'r2',  name: 'Quarterly Sales Analysis Q2 2025',   timeAgo: '1 week ago',  folderId: 'financial', recent: false, scheduled: false },
  { id: 'r3',  name: 'General Ledger Summary Q2 2025',     timeAgo: '2 days ago',  folderId: 'financial', recent: true,  scheduled: false },
  { id: 'r4',  name: 'Accounts Payable Aging Report',      timeAgo: '2 days ago',  folderId: 'financial', recent: true,  scheduled: true  },
  { id: 'r5',  name: 'Revenue Recognition Report Q1 2025', timeAgo: '2 days ago',  folderId: 'financial', recent: false, scheduled: false },
  { id: 'r6',  name: 'Cash Flow Forecast Q3 2025',         timeAgo: '2 days ago',  folderId: 'financial', recent: true,  scheduled: true  },
  { id: 'r7',  name: 'Tax Compliance Report FY2025',       timeAgo: '2 days ago',  folderId: 'financial', recent: false, scheduled: false },
  { id: 'r8',  name: 'Payroll Summary Report May 2025',    timeAgo: '2 days ago',  folderId: 'hr',        recent: true,  scheduled: true  },
  { id: 'r9',  name: 'Fixed Assets Register FY2025',       timeAgo: '2 days ago',  folderId: 'infra',     recent: false, scheduled: false },
  { id: 'r10', name: 'Inventory Valuation Report FY2025',  timeAgo: '2 days ago',  folderId: 'infra',     recent: true,  scheduled: true  },
  { id: 'r11', name: 'Purchase Order Status Report',       timeAgo: '2 days ago',  folderId: 'public',    recent: false, scheduled: false },
  { id: 'r12', name: 'Vendor Performance Report 2025',     timeAgo: '2 days ago',  folderId: 'public',    recent: true,  scheduled: false },
  { id: 'r13', name: 'Cost Center Analysis FY2025',        timeAgo: '2 days ago',  folderId: 'public',    recent: false, scheduled: false },
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let cleanupFns = [];
let viewMode = 'all';            // 'all' | 'folders'
let selectedFolderId = null;     // null in Folders view until a folder is picked
let activeTab = 'all';           // 'all' | 'recent' | 'scheduled'
let searchTerm = '';
let modalColorIndex = 0;         // selected color in the create-folder modal
let root = null;

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
export function render(container) {
  cleanupFns = [];
  viewMode = 'all';
  selectedFolderId = null;
  activeTab = 'all';
  searchTerm = '';
  root = container;

  container.innerHTML = `
    <div class="rl-page">
      <div class="rl-inner">
        <h1 class="rl-title forge-typography--heading5">Report Library<span class="rl-crumb" id="rl-crumb" hidden> <span class="rl-crumb-sep">›</span> <span class="rl-crumb-name"></span></span></h1>

        <div class="rl-viewtoggle" role="group" aria-label="Library view">
          <button class="rl-viewtoggle-btn" type="button" data-view="folders">
            <forge-icon name="folder"></forge-icon><span>Folders</span>
          </button>
          <button class="rl-viewtoggle-btn rl-viewtoggle-btn--active" type="button" data-view="all">
            <forge-icon name="view_list"></forge-icon><span>All reports</span>
          </button>
        </div>

        <div class="rl-folders" id="rl-folders" hidden></div>

        <div class="rl-toolbar">
          <div class="rl-tabs" role="tablist">
            <button class="rl-tab rl-tab--active" type="button" data-tab="all">All</button>
            <button class="rl-tab" type="button" data-tab="recent">Recent</button>
            <button class="rl-tab" type="button" data-tab="scheduled">Scheduled</button>
          </div>
          <div class="rl-search">
            <forge-icon name="search"></forge-icon>
            <input type="text" class="rl-search-input" placeholder="Search reports..." aria-label="Search reports" />
          </div>
        </div>

        <div class="rl-list" id="rl-list"></div>
      </div>

      <div class="rl-modal-overlay" id="rl-folder-modal" hidden>
        <div class="rl-modal" role="dialog" aria-modal="true" aria-label="Create folder">
          <div class="rl-modal-title">Create folder</div>
          <label class="rl-modal-label" for="rl-folder-name">Folder name</label>
          <input class="rl-modal-input" id="rl-folder-name" type="text" placeholder="e.g. Quarterly Reports" />
          <span class="rl-modal-label">Icon color</span>
          <div class="rl-color-row" id="rl-color-row"></div>
          <div class="rl-modal-actions">
            <button class="rl-modal-btn rl-modal-btn--ghost" type="button" data-modal="cancel">Cancel</button>
            <button class="rl-modal-btn rl-modal-btn--primary" type="button" data-modal="create">Create folder</button>
          </div>
        </div>
      </div>
    </div>
  `;

  renderList();
  updateVisibility();
  wireEvents(container);
}

export function destroy() {
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];
  root = null;
}

// ---------------------------------------------------------------------------
// Sub-renders
// ---------------------------------------------------------------------------
function renderFolders() {
  const el = root.querySelector('#rl-folders');
  if (!el) return;
  el.innerHTML = `
    <button class="rl-folder rl-folder--create" type="button" data-create-folder>
      <span class="rl-folder-icon rl-folder-icon--create"><forge-icon name="add"></forge-icon></span>
      <span class="rl-folder-text">
        <span class="rl-folder-name">New folder</span>
        <span class="rl-folder-count">Create a folder</span>
      </span>
    </button>` + folders.map(f => `
    <button class="rl-folder ${f.id === selectedFolderId ? 'rl-folder--selected' : ''}" type="button" data-folder="${f.id}">
      <span class="rl-folder-icon" style="background:${f.bg};color:${f.color};">
        <forge-icon name="folder"></forge-icon>
      </span>
      <span class="rl-folder-text">
        <span class="rl-folder-name">${escapeHtml(f.name)}</span>
        <span class="rl-folder-count">${f.count} reports</span>
      </span>
    </button>
  `).join('');
}

function renderList() {
  const list = root.querySelector('#rl-list');
  if (!list) return;

  let scope = viewMode === 'folders'
    ? reports.filter(r => r.folderId === selectedFolderId)
    : reports.slice();

  if (activeTab === 'recent') scope = scope.filter(r => r.recent);
  else if (activeTab === 'scheduled') scope = scope.filter(r => r.scheduled);

  const term = searchTerm.trim().toLowerCase();
  if (term) scope = scope.filter(r => r.name.toLowerCase().includes(term));

  list.innerHTML = scope.length
    ? scope.map(r => `
      <div class="rl-row" data-id="${r.id}">
        <div class="rl-row-main">
          <span class="rl-row-name">${escapeHtml(r.name)}</span>
          <span class="rl-row-time">${escapeHtml(r.timeAgo)}</span>
        </div>
        <forge-icon-button class="rl-row-menu" aria-label="Report options">
          <forge-icon name="more_vert"></forge-icon>
        </forge-icon-button>
      </div>
    `).join('')
    : `<div class="rl-empty">No reports found.</div>`;
}

function updateCrumb() {
  const crumb = root.querySelector('#rl-crumb');
  if (!crumb) return;
  if (viewMode === 'folders') {
    const f = folders.find(x => x.id === selectedFolderId);
    crumb.querySelector('.rl-crumb-name').textContent = f ? f.name : '';
    crumb.hidden = false;
  } else {
    crumb.hidden = true;
  }
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------
function setViewMode(mode) {
  viewMode = mode;
  if (mode === 'folders') selectedFolderId = null; // Folders view starts unselected
  root.querySelectorAll('.rl-viewtoggle-btn').forEach(b =>
    b.classList.toggle('rl-viewtoggle-btn--active', b.dataset.view === mode));

  if (mode === 'folders') renderFolders();
  updateCrumb();
  renderList();
  updateVisibility();
}

function selectFolder(id) {
  selectedFolderId = id;
  renderFolders();
  updateCrumb();
  renderList();
  updateVisibility();
}

/**
 * Folders show only in the Folders view. The tabs/search/list show in the
 * All-reports view, or in the Folders view once a folder is selected.
 */
function updateVisibility() {
  const showFolders = viewMode === 'folders';
  const showContent = viewMode === 'all' || (viewMode === 'folders' && !!selectedFolderId);
  const foldersEl = root.querySelector('#rl-folders');
  const toolbar = root.querySelector('.rl-toolbar');
  const list = root.querySelector('#rl-list');
  if (foldersEl) foldersEl.hidden = !showFolders;
  if (toolbar) toolbar.hidden = !showContent;
  if (list) list.hidden = !showContent;
}

// ---------------------------------------------------------------------------
// Create-folder modal
// ---------------------------------------------------------------------------
function renderSwatches() {
  const row = root.querySelector('#rl-color-row');
  if (!row) return;
  row.innerHTML = FOLDER_COLORS.map((c, i) => `
    <button class="rl-swatch ${i === modalColorIndex ? 'rl-swatch--selected' : ''}" type="button"
      data-color-index="${i}" style="background:${c.bg};color:${c.color};" aria-label="Color ${i + 1}">
      <forge-icon name="folder"></forge-icon>
    </button>
  `).join('');
}

function openFolderModal() {
  modalColorIndex = 0;
  const overlay = root.querySelector('#rl-folder-modal');
  const nameInput = overlay.querySelector('#rl-folder-name');
  nameInput.value = '';
  renderSwatches();
  overlay.hidden = false;
  requestAnimationFrame(() => nameInput.focus());
}

function closeFolderModal() {
  const overlay = root.querySelector('#rl-folder-modal');
  if (overlay) overlay.hidden = true;
}

function createFolder() {
  const overlay = root.querySelector('#rl-folder-modal');
  const nameInput = overlay.querySelector('#rl-folder-name');
  const name = nameInput.value.trim();
  if (!name) { nameInput.focus(); return; }
  const c = FOLDER_COLORS[modalColorIndex] || FOLDER_COLORS[0];
  const id = `folder-${Date.now()}`;
  folders.push({ id, name, count: 0, color: c.color, bg: c.bg });
  closeFolderModal();
  selectFolder(id); // re-renders the folder cards (incl. the new one) and opens it
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
function wireEvents(container) {
  // View toggle (Folders / All reports)
  container.querySelectorAll('.rl-viewtoggle-btn').forEach(btn => {
    const h = () => setViewMode(btn.dataset.view);
    btn.addEventListener('click', h);
    cleanupFns.push(() => btn.removeEventListener('click', h));
  });

  // Folder card selection + "New folder" (delegated — cards re-render)
  const foldersEl = container.querySelector('#rl-folders');
  const onFolderClick = (e) => {
    if (e.target.closest('[data-create-folder]')) { openFolderModal(); return; }
    const card = e.target.closest('.rl-folder[data-folder]');
    if (card) selectFolder(card.dataset.folder);
  };
  foldersEl.addEventListener('click', onFolderClick);
  cleanupFns.push(() => foldersEl.removeEventListener('click', onFolderClick));

  // Create-folder modal
  const overlay = container.querySelector('#rl-folder-modal');
  const onOverlayClick = (e) => {
    if (e.target === overlay) { closeFolderModal(); return; } // backdrop
    const swatch = e.target.closest('.rl-swatch');
    if (swatch) { modalColorIndex = Number(swatch.dataset.colorIndex); renderSwatches(); return; }
    const btn = e.target.closest('[data-modal]');
    if (btn) {
      if (btn.dataset.modal === 'create') createFolder();
      else closeFolderModal();
    }
  };
  overlay.addEventListener('click', onOverlayClick);
  cleanupFns.push(() => overlay.removeEventListener('click', onOverlayClick));

  const onModalKey = (e) => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') closeFolderModal();
    else if (e.key === 'Enter' && document.activeElement === overlay.querySelector('#rl-folder-name')) createFolder();
  };
  document.addEventListener('keydown', onModalKey);
  cleanupFns.push(() => document.removeEventListener('keydown', onModalKey));

  // Tabs
  container.querySelectorAll('.rl-tab').forEach(tab => {
    const h = () => {
      activeTab = tab.dataset.tab;
      container.querySelectorAll('.rl-tab').forEach(t =>
        t.classList.toggle('rl-tab--active', t === tab));
      renderList();
    };
    tab.addEventListener('click', h);
    cleanupFns.push(() => tab.removeEventListener('click', h));
  });

  // Search
  const searchInput = container.querySelector('.rl-search-input');
  const onInput = (e) => { searchTerm = e.target.value; renderList(); };
  searchInput.addEventListener('input', onInput);
  cleanupFns.push(() => searchInput.removeEventListener('input', onInput));
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}
