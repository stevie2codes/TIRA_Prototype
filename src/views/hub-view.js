/**
 * Hub Homepage View
 * - Left icon rail sidebar with nav icons
 * - Main content: Accounts page with data table
 * - AI chat via forge-ai-floating-chat with custom chat panel inside
 *   Small window → same size for chat → expanded split view on "Explore Results"
 */

import '@tylertech/forge-ai/ai-floating-chat';

import { createHubChatPanel, buildExpandedSplitView } from '../hub-chat-panel.js';
import './hub-view.css';

let cleanupFns = [];
let floatingChatEl = null;
let chatPanelInstance = null;

// Icon rail nav items
const railItemsTop = [
  { icon: 'menu', label: 'Menu', active: true },
  { icon: 'trending_up', label: 'Trends' },
  { icon: 'person', label: 'Contacts' },
  { icon: 'insert_chart', label: 'Charts' },
  { icon: 'shuffle', label: 'Transfers' },
  { icon: 'business', label: 'Organizations' },
  { icon: 'people', label: 'People' },
  { icon: 'edit', label: 'Edit' },
  { icon: 'open_in_new', label: 'External' },
  { icon: 'engineering', label: 'Admin' },
  { icon: 'account_balance', label: 'Accounts' },
];

const railItemsBottom = [
  { icon: 'schedule', label: 'History' },
  { icon: 'settings', label: 'Settings' },
];

// Mock account data
const accounts = [
  { account: '0000-07-0-0000-0011-000-00-', description: 'HB SALARIES2', accountType: 'Expenditure', balanceType: '', status: 'Active', entityCode: '1' },
  { account: '0000-0-00-00-0-0123-0-000-', description: 'kjh - [AUTO GEN]', accountType: 'AP Retainage', balanceType: 'Asset', status: 'Active', entityCode: '1' },
  { account: '0000-0-00-00-0-10012-0-000-', description: 'DUE FROM FUND 0001', accountType: 'Balance Sheet', balanceType: 'Fund Balance', status: 'Active', entityCode: '1' },
  { account: '0000-0-00-00-0-20000-0-000-', description: 'ACCOUNTS PAYABLE - [AUTO GEN]', accountType: 'Accounts Payable', balanceType: 'Liability', status: 'Active', entityCode: '1' },
  { account: '0000-0-00-00-0-244000-0-000-', description: 'Fund Balance Reserved for Encumbrances - [AUTO GEN]', accountType: 'Fund balance - res for encumb', balanceType: 'Asset', status: 'Active', entityCode: '1' },
  { account: '0000-0-00-00-0-258000-0-000-', description: 'Fund Balance Unreserved - [AUTO GEN]', accountType: 'Fund balance, unreserved, etc', balanceType: 'Asset', status: 'Active', entityCode: '1' },
  { account: '0000-0-00-00-0-258100-0-000-', description: 'Revenue Control - [AUTO GEN]', accountType: 'Revenue Control', balanceType: 'Asset', status: 'Active', entityCode: '1' },
  { account: '0000-0-00-00-0-258300-0-000-', description: 'Encumbrances - [AUTO GEN]', accountType: 'Encumbrances', balanceType: 'Liability', status: 'Active', entityCode: '1' },
  { account: '0000-0-00-00-0-258400-0-000-', description: 'Budgetary Fund Balance Reserved for Encumbrances - [AUTO GEN]', accountType: 'Budgetary Fund Balance - Res', balanceType: 'Fund Balance', status: 'Active', entityCode: '1' },
  { account: '0000-0-00-00-0-258600-0-000-', description: 'Budgetary Fund Balance Unreserved - [AUTO GEN]', accountType: 'Budget Fund Balance- Unreserved', balanceType: 'Fund Balance', status: 'Active', entityCode: '1' },
  { account: '0000-0-00-00-0-258700-0-000-', description: 'Appropriations - [AUTO GEN]', accountType: 'Appropriations', balanceType: 'Liability', status: 'Active', entityCode: '1' },
  { account: '0000-0-00-00-0-258800-0-000-', description: 'Estimated Revenues - [AUTO GEN]', accountType: 'Estimated Revenues', balanceType: 'Asset', status: 'Active', entityCode: '1' },
  { account: '0000-0-00-00-0-29200-0-000-', description: 'EXPENDITURES - [AUTO GEN]', accountType: 'Expenditure Control', balanceType: 'Fund Balance', status: 'Active', entityCode: '1' },
  { account: '0000-0-00-00-0-INV-0-000-', description: 'for inventory acct - [AUTO GEN]', accountType: 'ACI Liability', balanceType: 'Liability', status: 'Active', entityCode: '1' },
];

export function render(container) {
  cleanupFns = [];

  const topIcons = railItemsTop.map(n => `
    <button class="hub-rail-item ${n.active ? 'active' : ''}" type="button" title="${n.label}">
      <forge-icon name="${n.icon}"></forge-icon>
    </button>
  `).join('');

  const bottomIcons = railItemsBottom.map(n => `
    <button class="hub-rail-item" type="button" title="${n.label}">
      <forge-icon name="${n.icon}"></forge-icon>
    </button>
  `).join('');

  const tableRows = accounts.map(a => `
    <tr>
      <td class="hub-table-check"><input type="checkbox" /></td>
      <td class="hub-table-account">${a.account}</td>
      <td class="hub-table-desc">${a.description}</td>
      <td>${a.accountType}</td>
      <td>${a.balanceType}</td>
      <td>${a.status}</td>
      <td>${a.entityCode}</td>
      <td class="hub-table-actions">
        <forge-icon name="play_arrow" style="--forge-icon-font-size: 18px; color: rgba(0,0,0,0.3);"></forge-icon>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="hub-layout">
      <div class="hub-rail">
        <div class="hub-rail-top">${topIcons}</div>
        <div class="hub-rail-bottom">${bottomIcons}</div>
      </div>
      <div class="hub-main">
        <div class="hub-page-header">
          <h1 class="hub-page-title">Accounts</h1>
          <div class="hub-page-actions">
            <button class="hub-btn-outlined" type="button">
              <forge-icon name="file_download"></forge-icon>
              Export Accounts
            </button>
            <button class="hub-btn-outlined" type="button">
              <forge-icon name="file_download" style="transform: rotate(180deg);"></forge-icon>
              Import Accounts
            </button>
            <button class="hub-btn-primary" type="button">
              <forge-icon name="add"></forge-icon>
              Add account
            </button>
          </div>
        </div>
        <div class="hub-filter-bar">
          <a href="#" class="hub-filter-link">
            <forge-icon name="settings"></forge-icon>
            Account groups
          </a>
          <a href="#" class="hub-filter-link">
            <forge-icon name="filter_list"></forge-icon>
            Filter
          </a>
        </div>
        <div class="hub-table-wrapper">
          <table class="hub-table">
            <thead>
              <tr>
                <th class="hub-table-check"><input type="checkbox" /></th>
                <th>Account</th>
                <th>Description</th>
                <th>Account type</th>
                <th>Balance type</th>
                <th>Status</th>
                <th>Entity code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
        <div class="hub-pagination">
          <span class="hub-pagination-label">Rows per page:</span>
          <select class="hub-pagination-select">
            <option>25</option><option>50</option><option>100</option>
          </select>
          <span class="hub-pagination-info">1-25 of 20556</span>
          <button class="hub-pagination-btn" type="button" disabled>
            <forge-icon name="play_arrow" style="transform: rotate(180deg);"></forge-icon>
          </button>
          <button class="hub-pagination-btn" type="button">
            <forge-icon name="play_arrow"></forge-icon>
          </button>
        </div>
      </div>
    </div>
  `;

  createFloatingChat();
  wireEvents(container);
}

export function destroy() {
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];
  destroyFloatingChat();
}

// ---------------------------------------------------------------------------
// Floating Chat with custom panel
// ---------------------------------------------------------------------------

function createFloatingChat() {
  floatingChatEl = document.createElement('forge-ai-floating-chat');

  // Create our custom chat panel (not forge-ai-chatbot)
  chatPanelInstance = createHubChatPanel({
    onExpand: (suggestion) => expandWithSplitView(suggestion),
    onClose: () => { floatingChatEl.open = false; },
  });

  floatingChatEl.appendChild(chatPanelInstance.element);
  document.body.appendChild(floatingChatEl);
}

function destroyFloatingChat() {
  if (chatPanelInstance) {
    chatPanelInstance.destroy();
    chatPanelInstance = null;
  }
  if (floatingChatEl) {
    floatingChatEl.remove();
    floatingChatEl = null;
  }
}

/**
 * Expands the floating chat and replaces content with split view
 * (chat on left, report on right).
 */
function expandWithSplitView(suggestion) {
  if (!floatingChatEl || !chatPanelInstance) return;

  // Expand the floating chat modal
  floatingChatEl.expanded = true;

  // Detach the chat panel from the floating chat slot
  const chatEl = chatPanelInstance.element;
  chatEl.remove();

  // Build the split view: chat left + report right
  const splitView = buildExpandedSplitView(chatEl, suggestion, {
    onCollapse: () => collapseSplitView(splitView, chatEl),
  });

  // Clear floating chat slot and add split view
  floatingChatEl.innerHTML = '';
  floatingChatEl.appendChild(splitView);
}

/**
 * Collapses back from split view to the small chat-only modal.
 */
function collapseSplitView(splitView, chatEl) {
  if (!floatingChatEl) return;

  // Remove split view, restore chat panel
  chatEl.remove();
  splitView.remove();

  floatingChatEl.innerHTML = '';
  floatingChatEl.appendChild(chatEl);
  floatingChatEl.expanded = false;
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

function wireEvents(container) {
  const sparkleBtn = document.querySelector('#sparkle-btn');
  if (sparkleBtn) {
    const handler = () => {
      if (floatingChatEl) floatingChatEl.open = !floatingChatEl.open;
    };
    sparkleBtn.addEventListener('click', handler);
    cleanupFns.push(() => sparkleBtn.removeEventListener('click', handler));
  }
}
