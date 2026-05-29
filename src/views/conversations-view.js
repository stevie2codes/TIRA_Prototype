/**
 * Conversations View — chat history list.
 *
 * Reached from the rail's "Chats" item. Provides search, an All/Starred
 * filter, a "Start New Chat" entry point, and per-row actions. Clicking a
 * conversation opens the chat surface inside the body (via openChatFlow).
 */

import './conversations.css';
import { navigateTo } from '../router.js';
import { openChatFlow } from '../chat-flow.js';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const conversations = [
  { id: 'c1', title: 'Annual budget report for fiscal year 2025', timeAgo: '2 days ago', starred: true },
  { id: 'c2', title: 'Quarterly sales analysis for Q2 2025', timeAgo: '1 week ago', starred: false },
  { id: 'c3', title: 'Employee performance reviews Q1 2025', timeAgo: '3 weeks ago', starred: false },
  { id: 'c4', title: 'Market research findings for new product launch', timeAgo: '1 month ago', starred: true },
  { id: 'c5', title: 'Customer satisfaction survey results Q1 2025', timeAgo: '2 weeks ago', starred: false },
  { id: 'c6', title: 'Updates on project milestones for 2025', timeAgo: '5 days ago', starred: false },
  { id: 'c7', title: 'New marketing strategies for the upcoming quarter', timeAgo: '4 weeks ago', starred: true },
  { id: 'c8', title: 'Risk assessment report for ongoing projects', timeAgo: '2 days ago', starred: false },
  { id: 'c9', title: 'Feedback on recent team-building exercises', timeAgo: '1 week ago', starred: false },
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let cleanupFns = [];
let searchTerm = '';
let activeFilter = 'all'; // 'all' | 'starred'

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
export function render(container) {
  cleanupFns = [];
  searchTerm = '';
  activeFilter = 'all';

  container.innerHTML = `
    <div class="conv-page">
      <div class="conv-inner">
        <h1 class="conv-title forge-typography--heading5">Chats</h1>

        <div class="conv-toolbar">
          <div class="conv-search">
            <forge-icon name="search"></forge-icon>
            <input type="text" class="conv-search-input" placeholder="Search chats..." aria-label="Search chats" />
          </div>

          <div class="conv-filter" role="group" aria-label="Filter conversations">
            <button class="conv-filter-btn conv-filter-btn--active" type="button" data-filter="all">
              <forge-icon name="view_list"></forge-icon>
              <span>All</span>
            </button>
            <button class="conv-filter-btn" type="button" data-filter="starred">
              <forge-icon name="star"></forge-icon>
              <span>Starred</span>
            </button>
          </div>

          <button class="conv-new-btn" type="button">Start New Chat</button>
        </div>

        <div class="conv-list" id="conv-list"></div>
      </div>
    </div>
  `;

  renderList(container);
  wireEvents(container);
}

export function destroy() {
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------
function getFiltered() {
  const term = searchTerm.trim().toLowerCase();
  return conversations.filter(c => {
    if (activeFilter === 'starred' && !c.starred) return false;
    if (term && !c.title.toLowerCase().includes(term)) return false;
    return true;
  });
}

function renderList(container) {
  const list = container.querySelector('#conv-list');
  if (!list) return;

  const items = getFiltered();
  if (items.length === 0) {
    list.innerHTML = `<div class="conv-empty">No conversations found.</div>`;
    return;
  }

  list.innerHTML = items.map(c => `
    <div class="conv-row" data-id="${c.id}" role="button" tabindex="0">
      <div class="conv-row-main">
        <span class="conv-row-title">${escapeHtml(c.title)}</span>
        <span class="conv-row-time">${escapeHtml(c.timeAgo)}</span>
      </div>
      <forge-icon-button class="conv-row-menu" aria-label="Conversation options">
        <forge-icon name="more_vert"></forge-icon>
      </forge-icon-button>
    </div>
  `).join('');
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
function wireEvents(container) {
  // Search
  const searchInput = container.querySelector('.conv-search-input');
  if (searchInput) {
    const onInput = (e) => { searchTerm = e.target.value; renderList(container); };
    searchInput.addEventListener('input', onInput);
    cleanupFns.push(() => searchInput.removeEventListener('input', onInput));
  }

  // All / Starred filter
  const filterBtns = container.querySelectorAll('.conv-filter-btn');
  filterBtns.forEach(btn => {
    const onClick = () => {
      activeFilter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.toggle('conv-filter-btn--active', b === btn));
      renderList(container);
    };
    btn.addEventListener('click', onClick);
    cleanupFns.push(() => btn.removeEventListener('click', onClick));
  });

  // Start New Chat → landing prompt
  const newBtn = container.querySelector('.conv-new-btn');
  if (newBtn) {
    const onNew = () => navigateTo('tira');
    newBtn.addEventListener('click', onNew);
    cleanupFns.push(() => newBtn.removeEventListener('click', onNew));
  }

  // Row click → open the conversation (kebab is a no-op placeholder)
  const list = container.querySelector('#conv-list');
  if (list) {
    const onListClick = (e) => {
      if (e.target.closest('.conv-row-menu')) { e.stopPropagation(); return; }
      const row = e.target.closest('.conv-row');
      if (row) openChatFlow(0);
    };
    list.addEventListener('click', onListClick);
    cleanupFns.push(() => list.removeEventListener('click', onListClick));

    const onKey = (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.conv-row')) {
        e.preventDefault();
        openChatFlow(0);
      }
    };
    list.addEventListener('keydown', onKey);
    cleanupFns.push(() => list.removeEventListener('keydown', onKey));
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}
