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
  defineTabBarComponent,
  defineTabComponent,
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
  tylIconPalette,
  tylIconEngineering,
  tylIconAccountBalanceWallet,
  tylIconApps,
  tylIconDashboard,
  tylIconBookmark,
  tylIconTrendingUp,
  tylIconAssignment,
  tylIconBusiness,
  tylIconShuffle,
  tylIconEdit,
  tylIconPrint,
  tylIconChatPlus,
  tylIconForum,
  tylIconLocalLibrary,
  tylIconMenuOpen,
  tylIconHistory,
  tylIconArrowUpward,
  tylIconStar,
  tylIconStarOutline,
  tylIconViewList,
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
defineTabBarComponent();
defineTabComponent();

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
  tylIconPalette,
  tylIconEngineering,
  tylIconAccountBalanceWallet,
  tylIconApps,
  tylIconDashboard,
  tylIconBookmark,
  tylIconTrendingUp,
  tylIconAssignment,
  tylIconBusiness,
  tylIconShuffle,
  tylIconEdit,
  tylIconPrint,
  tylIconChatPlus,
  tylIconForum,
  tylIconLocalLibrary,
  tylIconMenuOpen,
  tylIconHistory,
  tylIconArrowUpward,
  tylIconStar,
  tylIconStarOutline,
  tylIconViewList,
]);

// Forge AI components (Lit-based, self-register on import)
import '@tylertech/forge-ai/ai-prompt';
import '@tylertech/forge-ai/ai-suggestions';
import '@tylertech/forge-ai/ai-chat-interface';
import '@tylertech/forge-ai/ai-user-message';
import '@tylertech/forge-ai/ai-response-message';
import '@tylertech/forge-ai/ai-thinking-indicator';
import '@tylertech/forge-ai/ai-chatbot';
import '@tylertech/forge-ai/ai-artifact';
import '@tylertech/forge-ai/tools';

// Router
import { registerView, startRouter, navigateTo, getCurrentView } from './router.js';

// Views
import * as tiraView from './views/tira-view.js';
import * as hubView from './views/hub-view.js';
import * as conversationsView from './views/conversations-view.js';
import * as reportLibraryView from './views/report-library-view.js';

// TIRA rail (persistent left sidebar)
import { mountTiraRail, showTiraRail, hideTiraRail } from './tira-rail.js';

// App switcher
import { initAppSwitcher } from './app-switcher.js';

// Chat flow (for ?state= auto-triggers)
import { openChatFlow } from './chat-flow.js';

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Register views
  registerView('tira', tiraView);
  registerView('hub', hubView);
  registerView('conversations', conversationsView);
  registerView('report-library', reportLibraryView);

  // Mount the persistent rail (hidden by default until first view-changed fires)
  const railRoot = document.querySelector('#tira-rail-root');
  if (railRoot) mountTiraRail(railRoot);

  // Init app switcher dropdown
  initAppSwitcher();

  // Listen for view changes to update app bar
  document.addEventListener('view-changed', (e) => {
    const view = e.detail.view;
    updateAppBar(view);
    if (view === 'hub') hideTiraRail();
    else showTiraRail();
  });

  // Start router (defaults to 'tira' for backward compat)
  startRouter('tira');

  // Auto-trigger states for Figma capture via ?state= query param
  const params = new URLSearchParams(window.location.search);
  const autoState = params.get('state');
  if (autoState === 'hub-chat') {
    // Navigate to Hub and auto-open the AI floating chat
    navigateTo('hub');
    setTimeout(() => {
      const floatingChat = document.querySelector('forge-ai-floating-chat');
      if (floatingChat) floatingChat.open = true;
      else document.querySelector('#sparkle-btn')?.click();
    }, 800);
  } else if (autoState === 'hub') {
    navigateTo('hub');
  } else if (autoState === 'chat' || autoState === 'report') {
    openChatFlow(0, { autoOpenReport: autoState === 'report' });
  } else if (autoState === 'library') {
    navigateTo('report-library');
  } else if (autoState === 'designer') {
    openChatFlow(0, { autoOpenReport: false });
  } else if (autoState === 'standard-report') {
    const reportId = params.get('reportId');
    if (reportId) {
      import('./chat-flow.js').then(({ openStandardReportInChat }) => {
        openStandardReportInChat(reportId);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// App bar updates based on active view
// ---------------------------------------------------------------------------
function updateAppBar(viewName) {
  const titleEl = document.querySelector('#app-bar-title');
  const menuBtn = document.querySelector('#menu-toggle-btn');
  const sparkleBtn = document.querySelector('#sparkle-btn');

  if (titleEl) {
    titleEl.textContent = viewName === 'hub' ? 'Hub' : 'TIRA';
  }

  // Menu button: show on TIRA (has side menu), hide on Hub
  if (menuBtn) {
    menuBtn.style.display = viewName === 'hub' ? 'none' : '';
  }

  // Sparkle: show on Hub, hide on TIRA (TIRA has its own prompt)
  if (sparkleBtn) {
    sparkleBtn.style.display = viewName === 'hub' ? '' : 'none';
  }
}
